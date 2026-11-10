from pathlib import Path
import re

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.lib.utils import simpleSplit
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Flowable,
    PageBreak,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "PRD.md"
OUTPUT = ROOT / "docs" / "PRD.pdf"


def register_fonts():
    regular = Path(r"C:\Windows\Fonts\arial.ttf")
    bold = Path(r"C:\Windows\Fonts\arialbd.ttf")
    if regular.exists() and bold.exists():
        pdfmetrics.registerFont(TTFont("PRD", str(regular)))
        pdfmetrics.registerFont(TTFont("PRD-Bold", str(bold)))
        return "PRD", "PRD-Bold"
    return "Helvetica", "Helvetica-Bold"


def inline_markup(value):
    value = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", value)
    value = value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    value = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", value)
    value = re.sub(r"`([^`]+)`", r'<font name="Courier">\1</font>', value)
    return value


def make_styles(regular, bold):
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle("PRDTitle", parent=styles["Title"], fontName=bold,
                              fontSize=24, leading=29, textColor=colors.HexColor("#102A43"),
                              alignment=TA_CENTER, spaceAfter=12))
    styles.add(ParagraphStyle("PRDH1", parent=styles["Heading1"], fontName=bold,
                              fontSize=16, leading=20, textColor=colors.HexColor("#102A43"),
                              spaceBefore=13, spaceAfter=7))
    styles.add(ParagraphStyle("PRDH2", parent=styles["Heading2"], fontName=bold,
                              fontSize=12, leading=16, textColor=colors.HexColor("#1F6FEB"),
                              spaceBefore=10, spaceAfter=5))
    styles.add(ParagraphStyle("PRDH3", parent=styles["Heading3"], fontName=bold,
                              fontSize=10.5, leading=14, textColor=colors.HexColor("#11A683"),
                              spaceBefore=7, spaceAfter=3))
    styles.add(ParagraphStyle("PRDBody", parent=styles["BodyText"], fontName=regular,
                              fontSize=8.7, leading=12, spaceAfter=5))
    styles.add(ParagraphStyle("PRDBullet", parent=styles["BodyText"], fontName=regular,
                              fontSize=8.7, leading=12, leftIndent=13, firstLineIndent=-8,
                              spaceAfter=3))
    styles.add(ParagraphStyle("PRDQuote", parent=styles["BodyText"], fontName=regular,
                              fontSize=9, leading=13, leftIndent=14, rightIndent=14,
                              textColor=colors.HexColor("#334E68"), backColor=colors.HexColor("#F4F8FC"),
                              borderPadding=7, spaceBefore=4, spaceAfter=7))
    styles.add(ParagraphStyle("PRDTable", parent=styles["BodyText"], fontName=regular,
                              fontSize=7.1, leading=9, spaceAfter=0))
    styles.add(ParagraphStyle("PRDTableHead", parent=styles["BodyText"], fontName=bold,
                              fontSize=7.1, leading=9, textColor=colors.white, spaceAfter=0))
    return styles


def table_from_lines(lines, styles):
    rows = []
    for line in lines:
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if all(re.fullmatch(r":?-{3,}:?", cell) for cell in cells):
            continue
        style = styles["PRDTableHead"] if not rows else styles["PRDTable"]
        rows.append([Paragraph(inline_markup(cell), style) for cell in cells])
    if not rows:
        return None
    widths = [None] * max(len(row) for row in rows)
    table = Table(rows, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1F6FEB")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#BCCCDC")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return table


def parse_markdown(text, styles, regular):
    story = []
    lines = text.splitlines()
    index = 0
    while index < len(lines):
        line = lines[index]
        if not line.strip():
            index += 1
            continue
        if line.startswith("```"):
            index += 1
            code = []
            while index < len(lines) and not lines[index].startswith("```"):
                code.append(lines[index])
                index += 1
            story.append(Preformatted("\n".join(code), ParagraphStyle(
                "code", fontName="Courier", fontSize=7.2, leading=9,
                backColor=colors.HexColor("#F4F8FC"), borderPadding=6)))
            story.append(Spacer(1, 4))
            index += 1
            continue
        if line.startswith("|"):
            table_lines = []
            while index < len(lines) and lines[index].startswith("|"):
                table_lines.append(lines[index])
                index += 1
            table = table_from_lines(table_lines, styles)
            if table:
                story.extend([table, Spacer(1, 7)])
            continue
        heading = re.match(r"^(#{1,3})\s+(.+)$", line)
        if heading:
            level = len(heading.group(1))
            style = styles[("PRDTitle", "PRDH1", "PRDH2")[level - 1]]
            story.append(Paragraph(inline_markup(heading.group(2)), style))
            index += 1
            continue
        if line.startswith(">"):
            quote = line[1:].strip()
            story.append(Paragraph(inline_markup(quote), styles["PRDQuote"]))
            index += 1
            continue
        bullet = re.match(r"^\s*([-*]|\d+\.)\s+(.+)$", line)
        if bullet:
            marker = "•" if bullet.group(1) in ("-", "*") else bullet.group(1)
            story.append(Paragraph(f"{marker} {inline_markup(bullet.group(2))}", styles["PRDBullet"]))
            index += 1
            continue
        paragraph = [line]
        index += 1
        while index < len(lines) and lines[index].strip() and not re.match(
            r"^(#{1,3})\s+|^```|^\s*[-*]\s+|\s*\d+\.\s+|^>|\|", lines[index]
        ):
            paragraph.append(lines[index])
            index += 1
        story.append(Paragraph(inline_markup(" ".join(paragraph)), styles["PRDBody"]))
    return story


def footer(canvas, document):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#D9E2EC"))
    canvas.line(18 * mm, 13 * mm, 192 * mm, 13 * mm)
    canvas.setFont("PRD", 7)
    canvas.setFillColor(colors.HexColor("#627D98"))
    canvas.drawString(18 * mm, 8 * mm, "Campus Events & Clubs — Implementation-aligned PRD")
    canvas.drawRightString(192 * mm, 8 * mm, f"Page {document.page}")
    canvas.restoreState()


def main():
    regular, bold = register_fonts()
    styles = make_styles(regular, bold)
    story = parse_markdown(SOURCE.read_text(encoding="utf-8"), styles, regular)
    document = SimpleDocTemplate(
        str(OUTPUT), pagesize=A4, rightMargin=18 * mm, leftMargin=18 * mm,
        topMargin=16 * mm, bottomMargin=18 * mm, title="Campus Events & Clubs PRD",
        author="Team 12",
    )
    document.build(story, onFirstPage=footer, onLaterPages=footer)
    print(OUTPUT)


if __name__ == "__main__":
    main()

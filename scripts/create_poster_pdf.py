from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A1
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs" / "Campus_Events_Clubs_Poster.pdf"
LOGO = ROOT / "Campus_Events_Clubs_Logo_Assets" / "png" / "logo-horizontal-on-dark.png"

WIDTH, HEIGHT = A1
NAVY = colors.HexColor("#102A43")
BLUE = colors.HexColor("#1F6FEB")
TEAL = colors.HexColor("#11A683")
GOLD = colors.HexColor("#F2B84B")
PALE = colors.HexColor("#F4F8FC")
INK = colors.HexColor("#172B4D")
MUTED = colors.HexColor("#627D98")
WHITE = colors.white


def rounded_card(pdf, x, y, width, height, fill=WHITE, stroke=None, radius=12):
    pdf.setFillColor(fill)
    pdf.setStrokeColor(stroke or fill)
    pdf.roundRect(x, y, width, height, radius, fill=1, stroke=1 if stroke else 0)


def text(pdf, value, x, y, size, color=INK, bold=False, align="left"):
    pdf.setFillColor(color)
    pdf.setFont("Helvetica-Bold" if bold else "Helvetica", size)
    if align == "center":
        pdf.drawCentredString(x, y, value)
    elif align == "right":
        pdf.drawRightString(x, y, value)
    else:
        pdf.drawString(x, y, value)


def wrapped(pdf, value, x, y, width, size, leading, color=INK, bold=False):
    words = value.split()
    lines = []
    current = ""
    font = "Helvetica-Bold" if bold else "Helvetica"
    for word in words:
        candidate = f"{current} {word}".strip()
        if pdf.stringWidth(candidate, font, size) <= width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    for index, line in enumerate(lines):
        text(pdf, line, x, y - index * leading, size, color, bold)
    return y - len(lines) * leading


def bullet(pdf, value, x, y, width, accent=BLUE, size=17, leading=24):
    pdf.setFillColor(accent)
    pdf.circle(x + 6, y + 6, 5, fill=1, stroke=0)
    return wrapped(pdf, value, x + 24, y, width - 24, size, leading)


def card_title(pdf, title, x, y, color=BLUE):
    pdf.setFillColor(color)
    pdf.roundRect(x, y - 10, 58, 10, 5, fill=1, stroke=0)
    text(pdf, title.upper(), x + 29, y - 2, 10, WHITE, True, "center")


def draw_header(pdf):
    pdf.setFillColor(NAVY)
    pdf.rect(0, HEIGHT - 113 * mm, WIDTH, 113 * mm, fill=1, stroke=0)
    pdf.setFillColor(BLUE)
    pdf.circle(WIDTH - 32 * mm, HEIGHT - 28 * mm, 55 * mm, fill=1, stroke=0)
    pdf.setFillColor(TEAL)
    pdf.circle(WIDTH - 84 * mm, HEIGHT - 100 * mm, 32 * mm, fill=1, stroke=0)
    if LOGO.exists():
        logo = ImageReader(str(LOGO))
        pdf.drawImage(logo, 24 * mm, HEIGHT - 38 * mm, width=92 * mm,
                      height=19 * mm, preserveAspectRatio=True, mask="auto")
    text(pdf, "DISCOVER. ORGANIZE. CONNECT.", 25 * mm, HEIGHT - 61 * mm,
         16, GOLD, True)
    text(pdf, "One simple campus platform for activities, people, and participation.",
         25 * mm, HEIGHT - 79 * mm, 23, WHITE)
    text(pdf, "TEAM 12  |  DIGITAL CAMPUS -> CAMPUS SERVICES", 25 * mm,
         HEIGHT - 99 * mm, 13, colors.HexColor("#D9E7F5"), True)


def draw_workflow(pdf, x, y, width):
    steps = [
        ("01", "DISCOVER", BLUE),
        ("02", "REGISTER", TEAL),
        ("03", "GET TICKET", GOLD),
        ("04", "ATTEND", BLUE),
    ]
    gap = 9 * mm
    box_width = (width - gap * 3) / 4
    text(pdf, "THE CORE JOURNEY", x, y + 28 * mm, 13, MUTED, True)
    for index, (number, label, color) in enumerate(steps):
        box_x = x + index * (box_width + gap)
        rounded_card(pdf, box_x, y, box_width, 22 * mm, WHITE)
        pdf.setFillColor(color)
        pdf.circle(box_x + 14 * mm, y + 11 * mm, 8 * mm, fill=1, stroke=0)
        text(pdf, number, box_x + 14 * mm, y + 9 * mm, 11, WHITE, True, "center")
        text(pdf, label, box_x + 28 * mm, y + 13 * mm, 12, NAVY, True)
        if index < len(steps) - 1:
            text(pdf, ">", box_x + box_width + gap / 2, y + 8 * mm, 20, TEAL, True, "center")


def draw_sections(pdf):
    margin = 25 * mm
    content_top = HEIGHT - 132 * mm
    column_gap = 10 * mm
    column_width = (WIDTH - margin * 2 - column_gap) / 2
    left = margin
    right = margin + column_width + column_gap

    rounded_card(pdf, left, content_top - 91 * mm, column_width, 83 * mm, WHITE)
    card_title(pdf, "For Students", left + 12 * mm, content_top - 12 * mm, BLUE)
    y = content_top - 29 * mm
    for value in [
        "Find campus activities in one place.",
        "Register and manage your own status.",
        "Use a private QR ticket at arrival.",
    ]:
        y = bullet(pdf, value, left + 12 * mm, y, column_width - 24 * mm, BLUE) - 7

    rounded_card(pdf, right, content_top - 91 * mm, column_width, 83 * mm, WHITE)
    card_title(pdf, "For Organizers", right + 12 * mm, content_top - 12 * mm, TEAL)
    y = content_top - 29 * mm
    for value in [
        "Create, publish, and manage activities.",
        "View rosters and confirm attendance.",
        "Plan events and request facilities support.",
    ]:
        y = bullet(pdf, value, right + 12 * mm, y, column_width - 24 * mm, TEAL) - 7

    lower_y = content_top - 104 * mm
    rounded_card(pdf, left, lower_y - 76 * mm, column_width, 68 * mm, PALE)
    card_title(pdf, "Smart Services", left + 12 * mm, lower_y - 12 * mm, GOLD)
    y = lower_y - 29 * mm
    for value in [
        "AI planning with human review.",
        "Learning resources from the Library.",
        "Read-only internship browsing.",
    ]:
        y = bullet(pdf, value, left + 12 * mm, y, column_width - 24 * mm, GOLD, 15, 21) - 5

    rounded_card(pdf, right, lower_y - 76 * mm, column_width, 68 * mm, NAVY)
    card_title(pdf, "Trusted Access", right + 12 * mm, lower_y - 12 * mm, BLUE)
    y = lower_y - 29 * mm
    for value in [
        "Google sign-in with server verification.",
        "Student, Organizer, and Admin roles.",
        "Your permissions are decided by the server.",
    ]:
        y = bullet(pdf, value, right + 12 * mm, y, column_width - 24 * mm, BLUE, 15, 21)
        y -= 5


def draw_footer(pdf):
    margin = 25 * mm
    workflow_y = 33 * mm
    draw_workflow(pdf, margin, workflow_y, WIDTH - margin * 2)
    text(pdf, "React + Vite  |  Node.js + Express  |  Firebase  |  Cloud Firestore",
         WIDTH / 2, 19 * mm, 12, MUTED, True, "center")
    text(pdf, "Campus Events & Clubs", margin, 10 * mm, 10, MUTED, True)
    text(pdf, "events-management-4d8ce.web.app", WIDTH - margin, 10 * mm, 10,
         MUTED, False, "right")


def main():
    pdf = canvas.Canvas(str(OUTPUT), pagesize=A1)
    pdf.setTitle("Campus Events & Clubs Poster")
    pdf.setAuthor("Team 12")
    pdf.setFillColor(PALE)
    pdf.rect(0, 0, WIDTH, HEIGHT, fill=1, stroke=0)
    draw_header(pdf)
    draw_sections(pdf)
    draw_footer(pdf)
    pdf.showPage()
    pdf.save()
    print(OUTPUT)


if __name__ == "__main__":
    main()

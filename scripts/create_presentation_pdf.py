from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape
from reportlab.lib.units import inch
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.lib.colors import HexColor
from pathlib import Path
import math


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "Campus_Events_Clubs_Presentation.pdf"

W, H = 13.333 * inch, 7.5 * inch
NAVY = HexColor("#102A43")
BLUE = HexColor("#1F6FEB")
TEAL = HexColor("#11A683")
GOLD = HexColor("#F2B84B")
INK = HexColor("#172B4D")
MUTED = HexColor("#627D98")
PALE = HexColor("#F4F8FC")
WHITE = colors.white


def rounded_card(c, x, y, w, h, fill=WHITE, stroke=None, radius=14):
    c.setFillColor(fill)
    c.setStrokeColor(stroke or fill)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=1 if stroke else 0)


def text(c, value, x, y, size=16, color=INK, font="Helvetica", align="left"):
    c.setFont(font, size)
    c.setFillColor(color)
    if align == "center":
        c.drawCentredString(x, y, value)
    elif align == "right":
        c.drawRightString(x, y, value)
    else:
        c.drawString(x, y, value)


def wrapped(c, value, x, y, width, size=14, leading=19, color=INK, font="Helvetica"):
    words = value.split()
    line = ""
    lines = []
    for word in words:
        candidate = f"{line} {word}".strip()
        if stringWidth(candidate, font, size) <= width:
            line = candidate
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    for index, line in enumerate(lines):
        text(c, line, x, y - index * leading, size, color, font)
    return y - len(lines) * leading


def bullet_list(c, items, x, y, width, size=13, leading=22, accent=BLUE):
    for item in items:
        c.setFillColor(accent)
        c.circle(x + 5, y + 4, 3.5, fill=1, stroke=0)
        end_y = wrapped(c, item, x + 20, y, width - 20, size, leading, INK)
        y = end_y - 5
    return y


def header(c, number, title, kicker=None):
    c.setFillColor(PALE)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(BLUE)
    c.rect(0, H - 11, W, 11, fill=1, stroke=0)
    c.setFillColor(TEAL)
    c.circle(W - 44, H - 41, 22, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.circle(W - 76, H - 28, 8, fill=1, stroke=0)
    text(c, f"0{number}", 44, H - 57, 12, BLUE, "Helvetica-Bold")
    text(c, title, 44, H - 94, 29, NAVY, "Helvetica-Bold")
    if kicker:
        text(c, kicker.upper(), 46, H - 117, 9, MUTED, "Helvetica-Bold")
    text(c, "CAMPUS EVENTS & CLUBS  |  TEAM 12", 44, 24, 8, MUTED, "Helvetica-Bold")
    text(c, str(number), W - 44, 24, 8, MUTED, "Helvetica-Bold", "right")


def icon_circle(c, x, y, label, fill=BLUE, size=26):
    c.setFillColor(fill)
    c.circle(x, y, size, fill=1, stroke=0)
    text(c, label, x, y - 5, 14, WHITE, "Helvetica-Bold", "center")


def slide_one(c):
    c.setFillColor(NAVY)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(BLUE)
    c.circle(W - 125, H - 60, 170, fill=1, stroke=0)
    c.setFillColor(TEAL)
    c.circle(W - 265, 55, 85, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.circle(72, H - 62, 18, fill=1, stroke=0)
    text(c, "CAMPUS PLATFORM", 72, H - 78, 11, GOLD, "Helvetica-Bold")
    text(c, "Campus Events", 72, H - 155, 44, WHITE, "Helvetica-Bold")
    text(c, "& Clubs", 72, H - 205, 44, WHITE, "Helvetica-Bold")
    wrapped(c, "Discover. Organize. Connect.", 74, H - 255, 430, 20, 25, HexColor("#D9E7F5"), "Helvetica")
    c.setStrokeColor(HexColor("#58708A"))
    c.setLineWidth(1)
    c.line(74, H - 294, 540, H - 294)
    text(c, "Team 12", 74, H - 327, 16, GOLD, "Helvetica-Bold")
    names = [
        "Hein Htut Aung  ·  6731503054",
        "Nang Shwe Sin  ·  6731503072",
        "Kyaw Hmue San  ·  6731503062",
        "Aung Kyaw Soe  ·  6731503045",
        "Thant Htoo San  ·  6731503087",
    ]
    for i, name in enumerate(names):
        text(c, name, 76, H - 362 - i * 22, 12, HexColor("#D9E7F5"))
    icon_circle(c, W - 230, H / 2 + 35, "CE", TEAL, 75)
    text(c, "A smarter campus experience", W - 230, H / 2 - 75, 15, WHITE, "Helvetica-Bold", "center")
    text(c, "Events  •  Clubs  •  Community", W - 230, H / 2 - 101, 11, HexColor("#D9E7F5"), "Helvetica", "center")


def slide_two(c):
    header(c, 2, "People & roles", "Who uses the platform?")
    cards = [
        ("S", "STUDENT", BLUE, ["Discover events", "Register & get QR ticket", "Check in and learn"]),
        ("O", "ORGANIZER", TEAL, ["Create & publish activities", "Manage roster", "Request facilities support"]),
        ("A", "ADMIN", GOLD, ["Review Organizer requests", "Approve or reject access", "Read-only oversight"]),
    ]
    card_width = 205
    x_positions = [36, 253, 470]
    for x, (mark, title, color, items) in zip(x_positions, cards):
        rounded_card(c, x, 146, card_width, 285, WHITE)
        icon_circle(c, x + 35, 385, mark, color, 22)
        text(c, title, x + 67, 378, 13, NAVY, "Helvetica-Bold")
        bullet_list(c, items, x + 18, 328, card_width - 30, 10.5, 20, color)
    shared_x = 687
    rounded_card(c, shared_x, 146, card_width, 285, NAVY)
    text(c, "Shared principle", shared_x + 18, 380, 13, GOLD, "Helvetica-Bold")
    wrapped(c, "The server decides access.", shared_x + 18, 342, card_width - 36, 15, 21, WHITE, "Helvetica-Bold")
    wrapped(c, "Users cannot choose their own role.", shared_x + 18, 288, card_width - 36, 13, 18, HexColor("#D9E7F5"))
    text(c, "Stakeholders", shared_x + 18, 232, 11, HexColor("#9FC4E4"), "Helvetica-Bold")
    wrapped(c, "Students • Clubs\nAdministration • Library\nFacilities • Internships", shared_x + 18, 205, card_width - 36, 10.5, 17, WHITE)


def slide_three(c):
    header(c, 3, "Local AI inside the project", "AI assists — people decide")
    rounded_card(c, 44, 130, 360, 270, NAVY)
    text(c, "MODEL", 75, 360, 11, GOLD, "Helvetica-Bold")
    text(c, "google/gemini-2.5-flash", 75, 326, 19, WHITE, "Helvetica-Bold")
    wrapped(c, "Server-side AI/ML API connection.", 75, 285, 260, 13, 18, HexColor("#D9E7F5"))
    text(c, "Fallback", 75, 225, 12, GOLD, "Helvetica-Bold")
    wrapped(c, "A deterministic template keeps planning usable when AI is unavailable.", 75, 201, 260, 13, 18, WHITE)
    rounded_card(c, 438, 130, 754, 270, WHITE)
    text(c, "What the AI helps with", 474, 360, 17, NAVY, "Helvetica-Bold")
    ai_items = [
        ("01", "Event Planning", "Title, description, timed agenda and checklist"),
        ("02", "Organizer Review", "Evidence-based assessment of access requests"),
        ("03", "Library Relevance", "Checks whether an activity has a learning purpose"),
    ]
    for i, (num, title, desc) in enumerate(ai_items):
        y = 308 - i * 58
        icon_circle(c, 500, y, num, [BLUE, TEAL, GOLD][i], 20)
        text(c, title, 540, y + 6, 14, NAVY, "Helvetica-Bold")
        text(c, desc, 540, y - 17, 12, MUTED)
    text(c, "Human review is required before applying or publishing.", 474, 158, 11, BLUE, "Helvetica-Bold")


def slide_four(c):
    header(c, 4, "Connected APIs & services", "Our ecosystem")

    def service_card(x, y, title, bullets, color):
        rounded_card(c, x, y, 204, 148, WHITE)
        c.setFillColor(color)
        c.roundRect(x, y + 136, 204, 12, 6, fill=1, stroke=0)
        text(c, title, x + 17, y + 112, 13, NAVY, "Helvetica-Bold")
        bullet_list(c, bullets, x + 17, y + 82, 170, 9.5, 14, color)

    services = [
        ("Firebase Auth", ["Google sign-in", "Server identity checks"], BLUE),
        ("Cloud Firestore", ["Stores users and activities", "Registrations and tickets"], TEAL),
        ("AI/ML API", ["Gemini 2.5 Flash", "Planning and AI reviews"], GOLD),
        ("Team 10 Facilities", ["Creates work orders", "Receives status updates"], TEAL),
        ("Team 17 Internships", ["Read-only listings", "Search and external links"], BLUE),
        ("Campus Library", ["Book catalog search", "Learning resources"], GOLD),
        ("Notification Hub", ["Campus event updates", "Notification integration"], HexColor("#8B5CF6")),
    ]
    top_x = [36, 252, 468, 684]
    for x, service in zip(top_x, services[:4]):
        service_card(x, 268, *service)
    bottom_x = [144, 360, 576]
    for x, service in zip(bottom_x, services[4:]):
        service_card(x, 92, *service)
    text(c, "Campus Events & Clubs connects campus services through the backend.", W / 2, 51, 10, MUTED, "Helvetica-Bold", "center")


def slide_five(c):
    header(c, 5, "Technology stack", "How the platform is built")
    rounded_card(c, 44, 120, 872, 300, NAVY)
    text(c, "Core technologies", 82, 370, 19, GOLD, "Helvetica-Bold")
    stack = [
        ("Frontend", "React • TypeScript • Vite"),
        ("Backend", "Node.js • Express"),
        ("Data & identity", "Firebase Authentication • Cloud Firestore"),
        ("Testing", "Firebase Emulator • Playwright"),
    ]
    positions = [(82, 300), (500, 300), (82, 205), (500, 205)]
    for index, ((label, value), (x, y)) in enumerate(zip(stack, positions)):
        icon_circle(c, x + 20, y + 8, "•", [BLUE, TEAL, GOLD, HexColor("#8B5CF6")][index], 14)
        text(c, label, x + 48, y + 12, 11, HexColor("#9FC4E4"), "Helvetica-Bold")
        text(c, value, x + 48, y - 10, 13, WHITE, "Helvetica-Bold")
    text(c, "React-based frontend  •  Persistent Express API  •  Firebase-backed data", W / 2, 78, 13, MUTED, "Helvetica-Bold", "center")


def build():
    c = canvas.Canvas(str(OUTPUT), pagesize=(W, H))
    c.setTitle("Campus Events & Clubs - Team 12 Presentation")
    for slide in (slide_one, slide_two, slide_three, slide_four, slide_five):
        slide(c)
        c.showPage()
    c.save()
    print(OUTPUT)


if __name__ == "__main__":
    build()

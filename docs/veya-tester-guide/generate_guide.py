from pathlib import Path

from PIL import Image as PILImage, ImageDraw, ImageFile, ImageFilter
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph


ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "docs" / "veya-tester-guide"
ASSET_DIR = OUT_DIR / "assets"
PDF_PATH = OUT_DIR / "Veya_Tester_Guide.pdf"

SCREENSHOTS = {
    "settings": Path("/Users/marco/Downloads/1000082586.jpg"),
    "contacts": Path("/Users/marco/Downloads/1000082587.jpg"),
    "availability": Path("/Users/marco/Downloads/1000082588.jpg"),
}

ImageFile.LOAD_TRUNCATED_IMAGES = True

PAGE_W, PAGE_H = A4
MARGIN = 42

INK = colors.HexColor("#33224f")
MUTED = colors.HexColor("#756a86")
PURPLE = colors.HexColor("#6947e8")
PURPLE_DARK = colors.HexColor("#4d2fb5")
LILAC = colors.HexColor("#eee8ff")
LILAC_2 = colors.HexColor("#f7f3ff")
CORAL = colors.HexColor("#f4a09b")
PINK = colors.HexColor("#f8d7df")
GREEN = colors.HexColor("#2a8a68")
AMBER = colors.HexColor("#b46b21")
WHITE = colors.white
LINE = colors.HexColor("#ded6eb")


def prepare_assets():
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    for name, source in SCREENSHOTS.items():
        destination = ASSET_DIR / f"{name}.jpg"
        if not source.exists() and destination.exists():
            continue
        if not source.exists():
            raise FileNotFoundError(f"Missing screenshot: {source}")
        image = PILImage.open(source).convert("RGB")

        if name == "settings":
            # Remove the profile phone-number area while keeping the preferences panel.
            image = image.crop((0, 300, image.width, image.height))

        if name == "contacts":
            # Redact the entered phone number; the UI structure remains visible.
            blurred = image.filter(ImageFilter.GaussianBlur(radius=18))
            mask = PILImage.new("L", image.size, 0)
            draw = ImageDraw.Draw(mask)
            draw.rounded_rectangle(
                (410, 900, 990, 1065), radius=24, fill=255
            )
            image = PILImage.composite(blurred, image, mask)

        image.thumbnail((1080, 2400), PILImage.Resampling.LANCZOS)
        image.save(destination, quality=88, optimize=True)


def register_fonts():
    regular = Path("/System/Library/Fonts/Supplemental/Arial.ttf")
    bold = Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf")
    if regular.exists() and bold.exists():
        pdfmetrics.registerFont(TTFont("VeyaSans", str(regular)))
        pdfmetrics.registerFont(TTFont("VeyaSans-Bold", str(bold)))
        return "VeyaSans", "VeyaSans-Bold"
    return "Helvetica", "Helvetica-Bold"


FONT, FONT_BOLD = register_fonts()


def style(size=10, leading=None, color=INK, bold=False, align=TA_LEFT):
    return ParagraphStyle(
        name=f"s-{size}-{bold}-{align}",
        fontName=FONT_BOLD if bold else FONT,
        fontSize=size,
        leading=leading or size * 1.35,
        textColor=color,
        alignment=align,
        spaceAfter=0,
        spaceBefore=0,
    )


def para(c, text, x, y_top, width, size=10, leading=None, color=INK, bold=False, align=TA_LEFT):
    p = Paragraph(text, style(size, leading, color, bold, align))
    _, height = p.wrap(width, PAGE_H)
    p.drawOn(c, x, y_top - height)
    return height


def label(c, text, x, y, color=PURPLE):
    c.setFont(FONT_BOLD, 8)
    c.setFillColor(color)
    c.drawString(x, y, text.upper())


def pill(c, text, x, y, w, fill=LILAC, fg=PURPLE_DARK):
    c.setFillColor(fill)
    c.roundRect(x, y, w, 22, 11, stroke=0, fill=1)
    c.setFont(FONT_BOLD, 8)
    c.setFillColor(fg)
    c.drawCentredString(x + w / 2, y + 7, text)


def card(c, x, y, w, h, fill=WHITE, stroke=LINE, radius=16):
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.setLineWidth(0.8)
    c.roundRect(x, y, w, h, radius, stroke=1, fill=1)


def section_title(c, kicker, title, subtitle=None):
    c.setFillColor(WHITE)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    label(c, kicker, MARGIN, PAGE_H - 58)
    para(c, title, MARGIN, PAGE_H - 72, PAGE_W - 2 * MARGIN, 24, 28, INK, True)
    if subtitle:
        para(c, subtitle, MARGIN, PAGE_H - 108, PAGE_W - 2 * MARGIN, 10, 14, MUTED)


def footer(c, page_num, section):
    c.setStrokeColor(LINE)
    c.setLineWidth(0.5)
    c.line(MARGIN, 29, PAGE_W - MARGIN, 29)
    c.setFont(FONT, 7.5)
    c.setFillColor(MUTED)
    c.drawString(MARGIN, 17, f"VEYA PRODUCT GUIDE  /  {section.upper()}")
    c.drawRightString(PAGE_W - MARGIN, 17, f"{page_num:02d}")


def draw_phone(c, path, x, y, w, h, crop_top=0.0, crop_bottom=0.0):
    image = PILImage.open(path)
    iw, ih = image.size
    top = int(ih * crop_top)
    bottom = int(ih * (1 - crop_bottom))
    image = image.crop((0, top, iw, bottom))
    iw, ih = image.size
    scale = min((w - 10) / iw, (h - 10) / ih)
    rw, rh = iw * scale, ih * scale
    ix, iy = x + (w - rw) / 2, y + (h - rh) / 2
    c.setFillColor(colors.HexColor("#261c34"))
    c.roundRect(x, y, w, h, 24, stroke=0, fill=1)
    c.saveState()
    p = c.beginPath()
    p.roundRect(x + 5, y + 5, w - 10, h - 10, 20)
    c.clipPath(p, stroke=0, fill=0)
    c.drawImage(ImageReader(image), ix, iy, rw, rh, preserveAspectRatio=True, mask="auto")
    c.restoreState()


def bullet(c, text, x, y_top, width, color=INK, size=9.5, accent=PURPLE):
    c.setFillColor(accent)
    c.circle(x + 4, y_top - 7, 2.6, stroke=0, fill=1)
    height = para(c, text, x + 14, y_top, width - 14, size, size * 1.38, color)
    return max(height, 14)


def numbered_step(c, number, title, body, x, y_top, width):
    c.setFillColor(PURPLE)
    c.circle(x + 12, y_top - 12, 12, stroke=0, fill=1)
    c.setFillColor(WHITE)
    c.setFont(FONT_BOLD, 10)
    c.drawCentredString(x + 12, y_top - 15.5, str(number))
    para(c, title, x + 34, y_top, width - 34, 10, 13, INK, True)
    body_h = para(c, body, x + 34, y_top - 17, width - 34, 8.8, 12, MUTED)
    return max(36, body_h + 22)


def page_cover(c):
    c.setFillColor(LILAC_2)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    c.setFillColor(CORAL)
    c.circle(PAGE_W - 30, PAGE_H - 20, 165, stroke=0, fill=1)
    c.setFillColor(PINK)
    c.circle(40, 50, 150, stroke=0, fill=1)
    pill(c, "PRODUCT GUIDE", MARGIN, PAGE_H - 76, 92, WHITE, PURPLE_DARK)
    para(c, "Veya", MARGIN, PAGE_H - 112, 290, 46, 48, INK, True)
    para(c, "Make space for the people who matter.", MARGIN, PAGE_H - 174, 300, 19, 24, PURPLE_DARK, True)
    para(
        c,
        "A practical guide to the product, its purpose, the core journey, and the key mobile experience checks.",
        MARGIN,
        PAGE_H - 240,
        305,
        11,
        16,
        MUTED,
    )
    draw_phone(c, ASSET_DIR / "availability.jpg", 365, 180, 184, 522, crop_top=0.02, crop_bottom=0.02)
    card(c, MARGIN, 118, 300, 90, fill=WHITE, stroke=colors.Color(1, 1, 1, alpha=0))
    label(c, "In one sentence", MARGIN + 18, 184)
    para(
        c,
        "Veya privately helps trusted contacts reconnect when their availability and preferred way of connecting naturally align.",
        MARGIN + 18,
        168,
        264,
        11,
        15,
        INK,
        True,
    )
    para(c, "Product guide  /  8 October 2026", MARGIN, 63, 300, 8.5, 11, MUTED)


def page_purpose(c):
    section_title(c, "01 / PURPOSE", "What Veya is, and what it is not", "The product removes timing and initiation friction without turning relationships into a public feed.")
    card(c, MARGIN, 575, PAGE_W - 2 * MARGIN, 125, fill=PURPLE_DARK, stroke=PURPLE_DARK)
    label(c, "Mission", MARGIN + 22, 675, color=colors.HexColor("#d8cdff"))
    para(c, "Help people maintain meaningful relationships by making it effortless, private, and timely to reconnect when both people have space.", MARGIN + 22, 657, PAGE_W - 2 * MARGIN - 44, 14, 19, WHITE, True)
    card(c, MARGIN, 432, PAGE_W - 2 * MARGIN, 120, fill=LILAC, stroke=LILAC)
    label(c, "Vision", MARGIN + 22, 526)
    para(c, "Become the trusted availability layer for personal relationships: understand when someone is open to connection, identify the right person in their existing circle, obtain mutual consent, and hand the conversation to a channel people already use.", MARGIN + 22, 506, PAGE_W - 2 * MARGIN - 44, 11, 16, INK, True)

    para(c, "Three frictions Veya addresses", MARGIN, 396, 230, 14, 18, INK, True)
    y = 368
    for title, body in [
        ("Timing", "Knowing when free time overlaps."),
        ("Initiation", "Knowing whether reaching out is welcome."),
        ("Planning", "Avoiding long scheduling exchanges for a simple call or chat."),
    ]:
        card(c, MARGIN, y - 54, 236, 48, fill=WHITE)
        para(c, title, MARGIN + 14, y - 14, 70, 10, 13, PURPLE_DARK, True)
        para(c, body, MARGIN + 78, y - 12, 144, 8.5, 11, MUTED)
        y -= 60

    para(c, "Product boundaries", 315, 396, 180, 14, 18, INK, True)
    y = 368
    for text in [
        "Invite-only and centred on people the user already knows.",
        "Not a dating app, friend-discovery network, public availability broadcast, or full calendar.",
        "Availability windows are shared; raw calendar content is not.",
        "A suggestion is not a connection: both people must consent.",
        "Veya hands accepted matches to WhatsApp instead of becoming another inbox.",
    ]:
        y -= bullet(c, text, 315, y, 236) + 6
    footer(c, 2, "Purpose")


def page_loop(c):
    section_title(c, "02 / THE CORE LOOP", "How Veya creates a reconnection", "The app stays deliberately narrow: express intent, find an overlap, ask, agree, then talk.")
    steps = [
        ("Build a trusted circle", "Invite a registered Veya user by phone number or accept an invitation."),
        ("Share availability", "Add a weekly routine, a temporary change, or use Free now for immediate intent."),
        ("Receive a suggestion", "Veya computes relevant overlap and respects chat/call matching preferences."),
        ("Propose and consent", "One person proposes; the other accepts or declines. Nothing connects automatically."),
        ("Continue in WhatsApp", "After acceptance, open WhatsApp to start the conversation."),
    ]
    y = 690
    for index, (title, body) in enumerate(steps, 1):
        fill = LILAC_2 if index % 2 else WHITE
        card(c, 62, y - 92, PAGE_W - 124, 82, fill=fill)
        c.setFillColor(PURPLE)
        c.circle(92, y - 51, 20, stroke=0, fill=1)
        c.setFillColor(WHITE)
        c.setFont(FONT_BOLD, 13)
        c.drawCentredString(92, y - 55, str(index))
        label(c, f"Stage {index}", 126, y - 32)
        para(c, title, 126, y - 44, 350, 12, 15, INK, True)
        para(c, body, 126, y - 63, 350, 8.8, 12, MUTED)
        if index < len(steps):
            c.setStrokeColor(PURPLE)
            c.setLineWidth(1.5)
            c.line(PAGE_W / 2, y - 100, PAGE_W / 2, y - 112)
        y -= 112
    footer(c, 3, "Core loop")


def page_get_started(c):
    section_title(c, "03 / GETTING STARTED", "Create a useful circle", "Use two accounts on separate devices whenever possible; the main journey depends on reciprocal actions.")
    draw_phone(c, ASSET_DIR / "contacts.jpg", 352, 112, 190, 584, crop_top=0.01, crop_bottom=0.01)
    x, width, y = MARGIN, 280, 690
    for n, title, body in [
        (1, "Sign in or register", "Complete the assigned onboarding flow. A verified/usable phone number may be required before proposing or accepting a match."),
        (2, "Open Contacts", "Use the bottom tab bar. Tap Invite a contact, then choose one contact or enter a number manually."),
        (3, "Send the invitation", "Confirm the country code and number, add an optional nickname, and send. The invitee must already have a Veya account in this phase."),
        (4, "Accept on the second account", "Check Pending invitations. Accept to create the trusted contact relationship."),
        (5, "Manage the circle", "Exercise nickname, favourite, remove, block, unblock, and error/retry states as assigned."),
    ]:
        used = numbered_step(c, n, title, body, x, y, width)
        y -= used + 18
    card(c, MARGIN, 94, 280, 88, fill=LILAC_2)
    label(c, "Privacy check", MARGIN + 16, 158)
    para(c, "The native picker should return only the selected person. Veya should not import, scan, cache, or upload the full address book.", MARGIN + 16, 142, 248, 9.3, 13, INK, True)
    para(c, "The example phone number in the supplied screenshot has been blurred in this guide.", 352, 96, 190, 7.5, 10, MUTED, align=TA_CENTER)
    footer(c, 4, "Contacts")


def page_availability(c):
    section_title(c, "04 / AVAILABILITY", "Share a rhythm, then adjust for real life", "Availability is selective intent, not a copy of the user’s calendar.")
    draw_phone(c, ASSET_DIR / "availability.jpg", MARGIN, 115, 208, 592, crop_top=0.01, crop_bottom=0.01)
    x, width = 280, 270
    card(c, x, 570, width, 130, fill=LILAC_2)
    label(c, "Weekly routine", x + 18, 676)
    para(c, "Use + to add a regular day, start/end time, and preferred channel: Chat or Call. This becomes the default rhythm and appears in the effective weekly preview.", x + 18, 658, width - 36, 10, 14, INK)
    card(c, x, 418, width, 132, fill=WHITE)
    label(c, "Temporary change", x + 18, 524)
    para(c, "Use Adjust a moment to close off time or make space for something spontaneous. Overrides sit on top of the weekly routine and should update the preview.", x + 18, 506, width - 36, 10, 14, INK)
    card(c, x, 270, width, 128, fill=colors.HexColor("#fff4f2"), stroke=colors.HexColor("#f1cbc6"))
    label(c, "Free now", x + 18, 372, color=colors.HexColor("#b6534d"))
    para(c, "From Home, tap Free now to signal immediate openness to reconnect. Confirm the card changes state and that the assigned build handles refresh/relaunch as expected.", x + 18, 354, width - 36, 10, 14, INK)
    para(c, "What to verify", x, 238, width, 13, 17, INK, True)
    y = 214
    for text in [
        "Invalid or overlapping times show useful feedback.",
        "Edits and deletions update the effective week.",
        "Chat/call channel and timezone are reflected correctly.",
        "Failed saves keep the user’s entered values visible.",
    ]:
        y -= bullet(c, text, x, y, width, size=8.8) + 4
    footer(c, 5, "Availability")


def page_matches(c):
    section_title(c, "05 / MATCHES", "From an overlap to a real conversation", "Matches are based on compatible availability and mutual agreement. An empty state can be correct when no eligible overlap exists.")
    left, right, colw = MARGIN, 308, 245
    card(c, left, 548, colw, 152, fill=LILAC_2)
    label(c, "Suggested matches", left + 18, 674)
    para(c, "Review the person, channel, and any available overlap/strength details. Tap Propose. Duplicate, expired, blocked, low-score, missing-overlap, and missing-phone outcomes should be explained cleanly.", left + 18, 654, colw - 36, 9.6, 13.5, INK)
    card(c, right, 548, colw, 152, fill=WHITE)
    label(c, "Match requests", right + 18, 674)
    para(c, "On the candidate account, open Matches and accept or decline. A stale request should refresh rather than leave an invalid action on screen.", right + 18, 654, colw - 36, 9.6, 13.5, INK)
    card(c, left, 378, colw, 150, fill=WHITE)
    label(c, "Accepted matches", left + 18, 502)
    para(c, "After acceptance, both required consents exist and the match appears in Accepted matches. Open its detail and confirm the displayed name and channel are correct.", left + 18, 482, colw - 36, 9.6, 13.5, INK)
    card(c, right, 378, colw, 150, fill=colors.HexColor("#eef9f5"), stroke=colors.HexColor("#c4e5d9"))
    label(c, "WhatsApp handoff", right + 18, 502, color=GREEN)
    para(c, "Tap Open WhatsApp after both people agree to reconnect. The action should open the expected conversation without exposing contact details elsewhere in the app.", right + 18, 482, colw - 36, 9.6, 13.5, INK)

    para(c, "Fast two-device walkthrough", MARGIN, 340, 240, 14, 18, INK, True)
    sequence = [
        "A and B accept each other as contacts.",
        "Both enable the same channel and create overlapping availability.",
        "A sees B as a suggestion and sends a proposal.",
        "B receives/opens the request and accepts.",
        "Both see the accepted match; handoff opens the expected WhatsApp destination.",
    ]
    y = 316
    for idx, text in enumerate(sequence, 1):
        y -= numbered_step(c, idx, text, "", MARGIN, y, PAGE_W - 2 * MARGIN) + 2
    card(c, MARGIN, 72, PAGE_W - 2 * MARGIN, 45, fill=colors.HexColor("#fff6e9"), stroke=colors.HexColor("#f2d5a8"))
    para(c, "If no suggestion appears, first check accepted contact state, actual time overlap, matching channel preferences, timezone, and whether the data refreshed.", MARGIN + 16, 101, PAGE_W - 2 * MARGIN - 32, 8.6, 12, AMBER, True)
    footer(c, 6, "Matches")


def page_preferences(c):
    section_title(c, "06 / SETTINGS", "Preferences and notification delivery", "Veya records account preferences, while the operating system controls whether this device can receive alerts.")
    draw_phone(c, ASSET_DIR / "settings.jpg", 36, 112, 208, 594, crop_top=0.0, crop_bottom=0.0)
    x, width = 278, 274
    card(c, x, 572, width, 128, fill=LILAC_2)
    label(c, "Matching", x + 18, 676)
    para(c, "Chat matching and Call matching determine which types of reconnection are eligible. Turn on the channel used in your scenario, then tap Save preferences.", x + 18, 656, width - 36, 10, 14, INK)
    card(c, x, 428, width, 126, fill=WHITE)
    label(c, "Quiet hours", x + 18, 530)
    para(c, "Set a start and end time to reduce unwanted interruptions. Check boundary times and timezone changes; quiet hours should not silently corrupt the underlying match state.", x + 18, 510, width - 36, 10, 14, INK)
    card(c, x, 264, width, 146, fill=colors.HexColor("#eef9f5"), stroke=colors.HexColor("#c4e5d9"))
    label(c, "Notifications", x + 18, 386, color=GREEN)
    para(c, "Push notifications expresses the account-level preference. Suggestion notifications controls suggestion alerts. Neither switch proves that this phone’s operating system has granted notification permission.", x + 18, 366, width - 36, 10, 14, INK, True)
    card(c, x, 126, width, 118, fill=colors.HexColor("#fff4f2"), stroke=colors.HexColor("#f1cbc6"))
    label(c, "Important distinction", x + 18, 220, color=colors.HexColor("#b6534d"))
    para(c, "Account preference and device permission are separate states. A user can enable push inside Veya while Android or iOS still blocks this particular device.", x + 18, 200, width - 36, 10, 14, INK, True)
    footer(c, 7, "Settings")


def page_notifications(c):
    section_title(c, "07 / PUSH NOTIFICATIONS", "Verify OS-level permission on each device", "Menu wording varies slightly by device and OS release; these are the current official paths and reliable alternatives.")

    colw = 245
    card(c, MARGIN, 402, colw, 292, fill=LILAC_2)
    label(c, "Android", MARGIN + 20, 668)
    para(c, "Settings > Notifications > App notifications > Veya", MARGIN + 20, 647, colw - 40, 11, 15, INK, True)
    y = 610
    android_items = [
        "Turn Veya notifications on. If categories are shown, enable the categories needed for the event.",
        "Alternative path on many devices: Settings > Apps > Veya > Notifications.",
        "For visible and audible alerts, ensure the category is not set to Silent and banners/pop-ups are permitted where available.",
        "Temporarily disable Do Not Disturb/Modes. Battery optimisation can delay delivery even when permission is enabled.",
    ]
    for item in android_items:
        y -= bullet(c, item, MARGIN + 20, y, colw - 40, size=8.8) + 8
    pill(c, "PASS: Veya is ON", MARGIN + 20, 424, 118, fill=colors.HexColor("#dff4ea"), fg=GREEN)

    rx = 308
    card(c, rx, 402, colw, 292, fill=WHITE)
    label(c, "iPhone / iOS", rx + 20, 668)
    para(c, "Settings > Apps > Veya > Notifications", rx + 20, 647, colw - 40, 11, 15, INK, True)
    y = 610
    ios_items = [
        "Turn on Allow Notifications.",
        "Choose at least one alert location: Lock Screen, Notification Centre, or Banners. Sounds and Badges are optional unless required.",
        "Alternative path: Settings > Notifications > Veya.",
        "Temporarily disable Focus and use immediate delivery instead of Scheduled Summary when checking arrival time.",
    ]
    for item in ios_items:
        y -= bullet(c, item, rx + 20, y, colw - 40, size=8.8) + 8
    pill(c, "PASS: ALLOW IS ON", rx + 20, 424, 128, fill=colors.HexColor("#dff4ea"), fg=GREEN)

    para(c, "If Veya is missing from the OS list", MARGIN, 365, 320, 14, 18, INK, True)
    card(c, MARGIN, 247, PAGE_W - 2 * MARGIN, 100, fill=colors.HexColor("#fff6e9"), stroke=colors.HexColor("#f2d5a8"))
    para(c, "Open Veya > Settings. Keep Push notifications enabled. On iOS, use Enable notifications on this device if shown, then accept the system prompt. If permission was previously denied, iOS normally will not show the prompt again. Use the Settings path above. Return to Veya after changing permission so the app can refresh device state and register the token.", MARGIN + 18, 323, PAGE_W - 2 * MARGIN - 36, 9.5, 13.5, INK)

    para(c, "Delivery verification", MARGIN, 218, 180, 14, 18, INK, True)
    y = 194
    for n, title, body in [
        (1, "Background Veya", "Do not force-stop it. Lock the phone or open another app."),
        (2, "Trigger a real event", "Use the second account or the agreed tool to create a suggestion/proposal/acceptance notification."),
        (3, "Observe and tap", "Record arrival time, title/body, badge/sound if relevant, and the screen opened after tapping."),
        (4, "Confirm the destination", "The notification should open the correct screen and show the current information."),
    ]:
        used = numbered_step(c, n, title, body, MARGIN, y, PAGE_W - 2 * MARGIN)
        y -= used + 3
    footer(c, 8, "Notifications")


def page_checklist(c):
    section_title(c, "08 / HANDOFF", "A concise end-to-end checklist", "Capture enough context for another person or developer to reproduce the result.")
    groups = [
        ("Environment", ["Build/version and installation source", "Device model and OS version", "Account IDs or safe aliases (never passwords)", "Network type and timezone"]),
        ("Core journey", ["Register/sign in and complete phone setup", "Invite, accept, edit, favourite, block/unblock", "Create weekly availability and a temporary override", "Exercise Free now", "Propose, accept/decline, open accepted match", "Verify WhatsApp handoff"]),
        ("Notifications", ["Push enabled in Veya", "OS permission enabled on each device", "Foreground, background, and notification-tap behaviour", "Focus/DND and quiet-hours conditions recorded"]),
        ("Quality", ["Loading, empty, error, and retry states", "Input survives failed saves", "No unexpected private phone/calendar data shown", "Navigation remains usable after errors"]),
    ]
    positions = [(MARGIN, 460), (308, 460), (MARGIN, 258), (308, 258)]
    for (title, items), (x, y) in zip(groups, positions):
        h = 235 if y == 460 else 180
        card(c, x, y, 245, h, fill=LILAC_2 if x == MARGIN else WHITE)
        label(c, title, x + 18, y + h - 27)
        yy = y + h - 49
        for item in items:
            c.setStrokeColor(PURPLE)
            c.setLineWidth(1)
            c.rect(x + 18, yy - 8, 9, 9, stroke=1, fill=0)
            used = para(c, item, x + 36, yy + 2, 185, 8.8, 12, INK)
            yy -= max(25, used + 8)

    card(c, MARGIN, 104, PAGE_W - 2 * MARGIN, 130, fill=PURPLE_DARK, stroke=PURPLE_DARK)
    label(c, "For every defect", MARGIN + 22, 208, color=colors.HexColor("#d8cdff"))
    para(c, "Record: expected result / actual result / exact steps / account role / timestamp and timezone / screenshots or screen recording / reproducibility / network state / whether retry or relaunch changed the result.", MARGIN + 22, 188, PAGE_W - 2 * MARGIN - 44, 11, 16, WHITE, True)
    para(c, "Avoid copying real phone numbers, notification tokens, passwords, or private contact details into issue trackers.", MARGIN + 22, 134, PAGE_W - 2 * MARGIN - 44, 9, 13, colors.HexColor("#e9e1ff"))
    footer(c, 9, "Checklist")


def page_sources(c):
    section_title(c, "REFERENCE", "Source notes", "Product wording comes from the repository; operating-system paths come from official platform support.")
    para(c, "Internal product sources", MARGIN, 685, 250, 14, 18, INK, True)
    y = 658
    for text in [
        "README.md: concept, scope, mobile configuration and product boundaries.",
        "docs/steering/product.md: intent, UX principles, notification and privacy rules.",
        "docs/investor-product-brief.md: mission, vision, positioning and feature summary.",
        "docs/specs/*/requirements.md: contacts, availability, matches, settings and push behaviour.",
    ]:
        y -= bullet(c, text, MARGIN, y, PAGE_W - 2 * MARGIN, size=9.2) + 7

    para(c, "Official OS guidance", MARGIN, 510, 250, 14, 18, INK, True)
    para(c, '<link href="https://support.google.com/android/answer/9079661?hl=en">Google Android Help: Control notifications on Android</link>', MARGIN, 480, PAGE_W - 2 * MARGIN, 10, 14, PURPLE_DARK, True)
    para(c, '<link href="https://support.apple.com/en-ie/120681">Apple Support: Turn notifications on or off for a specific app on iPhone</link>', MARGIN, 446, PAGE_W - 2 * MARGIN, 10, 14, PURPLE_DARK, True)
    para(c, '<link href="https://support.apple.com/guide/iphone/change-notification-settings-iph7c3d96bab/ios">Apple iPhone User Guide: Change notification settings</link>', MARGIN, 412, PAGE_W - 2 * MARGIN, 10, 14, PURPLE_DARK, True)

    card(c, MARGIN, 246, PAGE_W - 2 * MARGIN, 110, fill=LILAC_2)
    label(c, "Scope note", MARGIN + 18, 330)
    para(c, "This guide describes the beta product represented by the repository and supplied screenshots on 8 October 2026. Exact copy, controls, and availability can differ by assigned build, platform, account state, or service configuration. Release notes define build-specific expectations.", MARGIN + 18, 309, PAGE_W - 2 * MARGIN - 36, 10, 14, INK)
    card(c, MARGIN, 113, PAGE_W - 2 * MARGIN, 94, fill=colors.HexColor("#eef9f5"), stroke=colors.HexColor("#c4e5d9"))
    para(c, "Veya’s intended outcome is simple: fewer missed moments with people who already matter.", MARGIN + 22, 177, PAGE_W - 2 * MARGIN - 44, 15, 20, GREEN, True, TA_CENTER)
    footer(c, 10, "Sources")


def build_pdf():
    prepare_assets()
    c = canvas.Canvas(str(PDF_PATH), pagesize=A4)
    c.setTitle("Veya Product Guide")
    c.setAuthor("Veya")
    c.setSubject("Product overview and mobile guide")
    pages = [
        page_cover,
        page_purpose,
        page_loop,
        page_get_started,
        page_availability,
        page_matches,
        page_preferences,
        page_notifications,
        page_checklist,
    ]
    for page in pages:
        page(c)
        c.showPage()
    c.save()
    print(PDF_PATH)


if __name__ == "__main__":
    build_pdf()

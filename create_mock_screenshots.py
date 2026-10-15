import os
from PIL import Image, ImageDraw, ImageFont

def create_chat_screenshot(
    output_path,
    chat_type="whatsapp", # whatsapp or sms
    sender_title="+91 98765 43210",
    sender_subtitle="online",
    is_verified=False,
    is_forwarded=True,
    bubble_type="scam", # scam (incoming) or genuine (incoming official)
    message_lines=[],
    timestamp="10:42 AM"
):
    if output_path.startswith("assets/") and os.path.exists("frontend/assets"):
        output_path = "frontend/" + output_path

    width, height = 768, 1376
    img = Image.new("RGB", (width, height), color="#0b141a" if chat_type == "whatsapp" else "#0f172a")
    draw = ImageDraw.Draw(img)

    # Fonts
    font_dir = "C:/Windows/Fonts"
    try:
        f_status = ImageFont.truetype(os.path.join(font_dir, "segoeui.ttf"), 22)
        f_title = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 28)
        f_sub = ImageFont.truetype(os.path.join(font_dir, "segoeui.ttf"), 20)
        f_forwarded = ImageFont.truetype(os.path.join(font_dir, "segoeuii.ttf"), 20)
        f_body = ImageFont.truetype(os.path.join(font_dir, "segoeui.ttf"), 25)
        f_body_bold = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 26)
        f_time = ImageFont.truetype(os.path.join(font_dir, "segoeui.ttf"), 18)
    except Exception:
        f_status = f_title = f_sub = f_forwarded = f_body = f_body_bold = f_time = ImageFont.load_default()

    # 1. Top Status Bar
    draw.rectangle([(0, 0), (width, 48)], fill="#0b141a" if chat_type == "whatsapp" else "#0f172a")
    draw.text((36, 12), "10:42", fill="#ffffff", font=f_status)
    draw.text((width - 150, 12), "5G  VOLTE  88%", fill="#e2e8f0", font=f_status)

    # 2. Top App Bar
    header_color = "#1f2c34" if chat_type == "whatsapp" else "#1e293b"
    draw.rectangle([(0, 48), (width, 140)], fill=header_color)

    # Back arrow & Avatar
    draw.text((24, 75), "<", fill="#e9edef", font=f_title)
    
    # Avatar circle
    avatar_color = "#25d366" if is_verified else ("#ef4444" if bubble_type == "scam" else "#0ea5e9")
    draw.ellipse([(65, 62), (125, 122)], fill=avatar_color)
    draw.text((85, 75), "✓" if is_verified else ("!" if bubble_type == "scam" else "i"), fill="#ffffff", font=f_title)

    # Title & subtitle
    draw.text((145, 66), sender_title, fill="#e9edef", font=f_title)
    if is_verified:
        # Verified badge circle
        draw.ellipse([(145 + len(sender_title)*15 + 10, 72), (145 + len(sender_title)*15 + 32, 94)], fill="#22c55e")
        draw.text((145 + len(sender_title)*15 + 14, 70), "✓", fill="#ffffff", font=ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 16))

    draw.text((145, 102), sender_subtitle, fill="#8696a0", font=f_sub)

    # Icons right
    draw.text((width - 120, 75), "📞   ⋮", fill="#8696a0", font=f_title)

    # Subtle wallpaper pattern
    for y in range(160, height - 120, 80):
        for x in range(20, width, 100):
            draw.point((x, y), fill="#13222d")

    # 3. Message Bubble
    bubble_top = 220
    bubble_left = 36
    bubble_right = width - 48
    
    # Pre-calculate bubble height
    line_height = 36
    bubble_height = 80 + len(message_lines) * line_height + 40
    bubble_bottom = bubble_top + bubble_height

    bubble_bg = "#202c33" if chat_type == "whatsapp" else "#1e293b"
    # Draw rounded rectangle for bubble
    draw.rounded_rectangle([(bubble_left, bubble_top), (bubble_right, bubble_bottom)], radius=18, fill=bubble_bg)

    curr_y = bubble_top + 16

    # Forwarded tag if applicable
    if is_forwarded:
        draw.text((bubble_left + 24, curr_y), "➔ Forwarded many times", fill="#8696a0", font=f_forwarded)
        curr_y += 34

    # Message text
    for line, is_bold, color in message_lines:
        font_to_use = f_body_bold if is_bold else f_body
        text_color = color if color else "#e9edef"
        draw.text((bubble_left + 24, curr_y), line, fill=text_color, font=font_to_use)
        curr_y += line_height

    # Timestamp
    draw.text((bubble_right - 130, bubble_bottom - 32), timestamp, fill="#8696a0", font=f_time)

    # 4. Bottom WhatsApp / SMS Input Bar
    footer_color = "#1f2c34" if chat_type == "whatsapp" else "#1e293b"
    draw.rectangle([(0, height - 100), (width, height)], fill=footer_color)
    draw.rounded_rectangle([(70, height - 85), (width - 90, height - 25)], radius=30, fill="#2a3942")
    draw.text((100, height - 70), "Message", fill="#8696a0", font=f_body)
    draw.text((25, height - 72), "😊", fill="#8696a0", font=f_title)
    draw.text((width - 70, height - 75), "🎤", fill="#25d366", font=f_title)

    img.save(output_path, "JPEG", quality=92)
    print(f"Generated: {output_path}")

os.makedirs("assets", exist_ok=True)

# 1. SCAM 1: PM Free Laptop Scheme 2024
create_chat_screenshot(
    "assets/sample_scam_screenshot.jpg",
    chat_type="whatsapp",
    sender_title="+91 98450 12891",
    sender_subtitle="last seen today at 10:38 AM",
    is_verified=False,
    is_forwarded=True,
    bubble_type="scam",
    message_lines=[
        ("🔥 PRADHAN MANTRI FREE LAPTOP SCHEME 2024 🔥", True, "#f87171"),
        ("", False, None),
        ("Under Digital India initiative, Government of India is", False, "#e2e8f0"),
        ("distributing Free HP/Dell Laptops + ₹50,000 cash grant", False, "#e2e8f0"),
        ("to all 10th & 12th passed students across India.", False, "#e2e8f0"),
        ("", False, None),
        ("⚠️ Pay only ₹299 registration fee immediately to", True, "#fca5a5"),
        ("verify student identity. Last date tonight 11:59 PM!", True, "#fca5a5"),
        ("", False, None),
        ("Apply Link: http://pm-laptop-yojana.online/apply", True, "#38bdf8"),
        ("", False, None),
        ("👉 Forward this message to 5 WhatsApp groups to", True, "#fbbf24"),
        ("generate your registration coupon code!", True, "#fbbf24")
    ],
    timestamp="10:41 AM"
)

# 2. SCAM 2: Ayushman Bharat Golden Card ₹450 Fee Scam
create_chat_screenshot(
    "assets/sample_scam_ayushman.jpg",
    chat_type="whatsapp",
    sender_title="+91 87654 32109",
    sender_subtitle="last seen recently",
    is_verified=False,
    is_forwarded=True,
    bubble_type="scam",
    message_lines=[
        ("🏥 AYUSHMAN BHARAT GOLDEN CARD 2024 🏥", True, "#f87171"),
        ("", False, None),
        ("Get ₹5,00,000 Free Treatment Card delivered directly", False, "#e2e8f0"),
        ("to your home within 48 hours without any queue.", False, "#e2e8f0"),
        ("", False, None),
        ("⚡ Special VIP Golden Card registration fee: ₹450 only.", True, "#fca5a5"),
        ("Pay via Google Pay / PhonePe / Paytm.", True, "#fca5a5"),
        ("", False, None),
        ("Send your Aadhaar OTP on this link to download:", True, "#fca5a5"),
        ("http://ayushman-card-free.xyz/apply-now", True, "#38bdf8"),
        ("", False, None),
        ("Limited cards remaining for this month quota!", False, "#fbbf24")
    ],
    timestamp="09:15 AM"
)

# 3. SCAM 3: Electricity Disconnection Threat Cyber Trap
create_chat_screenshot(
    "assets/sample_scam_electricity.jpg",
    chat_type="sms",
    sender_title="BW-PWRALRT (Electricity Alert)",
    sender_subtitle="SMS Message",
    is_verified=False,
    is_forwarded=False,
    bubble_type="scam",
    message_lines=[
        ("⚡ URGENT: ELECTRICITY DISCONNECTION NOTICE ⚡", True, "#f87171"),
        ("", False, None),
        ("Dear Consumer, your electricity power will be", False, "#e2e8f0"),
        ("DISCONNECTED tonight at 9:30 PM from the power", True, "#fca5a5"),
        ("office because your previous month bill was not updated.", False, "#e2e8f0"),
        ("", False, None),
        ("Please immediately contact our power officer at", False, "#e2e8f0"),
        ("mobile number: 9876543210", True, "#38bdf8"),
        ("and pay ₹15 update charge on WhatsApp.", True, "#fca5a5"),
        ("", False, None),
        ("Ignore this if bill already paid via officer.", False, "#94a3b8")
    ],
    timestamp="08:45 PM"
)

# 4. GENUINE 1: PM-KISAN 17th Installment Official Notice
create_chat_screenshot(
    "assets/sample_genuine_screenshot.jpg",
    chat_type="sms",
    sender_title="VK-PMKISN (Govt of India)",
    sender_subtitle="Verified Official Sender",
    is_verified=True,
    is_forwarded=False,
    bubble_type="genuine",
    message_lines=[
        ("🌾 Pradhan Mantri Kisan Samman Nidhi (PM-KISAN) 🌾", True, "#4ade80"),
        ("", False, None),
        ("Hon'ble PM has released the 17th installment of ₹2,000", False, "#e2e8f0"),
        ("directly to farmer bank accounts through Direct Benefit", False, "#e2e8f0"),
        ("Transfer (DBT).", False, "#e2e8f0"),
        ("", False, None),
        ("⚠️ Notice: Government of India NEVER asks for any", True, "#86efac"),
        ("registration fee, OTP, or APK download.", True, "#86efac"),
        ("", False, None),
        ("Check your DBT status only on official portal:", False, "#e2e8f0"),
        ("https://pmkisan.gov.in", True, "#38bdf8"),
        ("", False, None),
        ("Official Kisan Helpline: 155261 / 1800115526", False, "#e2e8f0")
    ],
    timestamp="11:30 AM"
)

# 5. GENUINE 2: Ayushman Bharat (ABHA) National Health Notice
create_chat_screenshot(
    "assets/sample_genuine_ayushman.jpg",
    chat_type="whatsapp",
    sender_title="National Health Authority (NHA)",
    sender_subtitle="Official Government Business Account",
    is_verified=True,
    is_forwarded=False,
    bubble_type="genuine",
    message_lines=[
        ("🏥 National Health Authority (NHA) Official Notice 🏥", True, "#4ade80"),
        ("", False, None),
        ("Ayushman Bharat ABHA Health Account creation is", False, "#e2e8f0"),
        ("100% FREE for all Indian citizens.", True, "#86efac"),
        ("", False, None),
        ("Do NOT pay any fee or share your OTP with any agent.", True, "#fca5a5"),
        ("Hospitalization cover up to ₹5,00,000 per family per year", False, "#e2e8f0"),
        ("is provided at all empanelled public and private hospitals.", False, "#e2e8f0"),
        ("", False, None),
        ("Official portal for card download & beneficiary status:", False, "#e2e8f0"),
        ("https://beneficiary.nha.gov.in", True, "#38bdf8"),
        ("", False, None),
        ("Toll-Free National Health Helpline: 14555", False, "#e2e8f0")
    ],
    timestamp="02:15 PM"
)

# 6. SCAM 4: PM Mudra Loan ₹1,250 Stamp Fee Scam
create_chat_screenshot(
    "assets/sample_scam_mudra.jpg",
    chat_type="whatsapp",
    sender_title="+91 97112 84920 (Mudra Officer)",
    sender_subtitle="last seen today at 11:10 AM",
    is_verified=False,
    is_forwarded=True,
    bubble_type="scam",
    message_lines=[
        ("💼 PRADHAN MANTRI MUDRA YOJANA LOAN 💼", True, "#f87171"),
        ("", False, None),
        ("Congratulations! Your ₹10,00,000 Tarun Mudra Loan has", False, "#e2e8f0"),
        ("been APPROVED at 0% interest without any collateral.", False, "#e2e8f0"),
        ("", False, None),
        ("⚠️ Pay refundable stamp duty & file charge of ₹1,250", True, "#fca5a5"),
        ("within 2 hours to disburse loan into your bank account.", True, "#fca5a5"),
        ("", False, None),
        ("Payment Link: http://mudra-loan-instant-approval.top/pay", True, "#38bdf8"),
        ("", False, None),
        ("Send UPI payment screenshot to confirm disbursement.", False, "#fbbf24")
    ],
    timestamp="11:15 AM"
)

# 7. SCAM 5: Free Smartphone & Tablet Distribution Scam
create_chat_screenshot(
    "assets/sample_scam_smartphone.jpg",
    chat_type="whatsapp",
    sender_title="+91 70123 99881",
    sender_subtitle="online",
    is_verified=False,
    is_forwarded=True,
    bubble_type="scam",
    message_lines=[
        ("📱 FREE SMARTPHONE YOJANA 2024 📱", True, "#f87171"),
        ("", False, None),
        ("Digital India Initiative: 5G Smartphone with 1 Year", False, "#e2e8f0"),
        ("Free Recharge for all college & 10th/12th students.", False, "#e2e8f0"),
        ("", False, None),
        ("⚡ Only 150 phones left for today. Pay ₹199 courier", True, "#fca5a5"),
        ("delivery charge now: http://free-5g-smartphone.xyz", True, "#38bdf8"),
        ("", False, None),
        ("👉 Forward this message to 10 friends to unlock device.", True, "#fbbf24")
    ],
    timestamp="01:20 PM"
)

# 8. GENUINE 3: Official Sukanya Samriddhi Yojana (SSY) Notice
create_chat_screenshot(
    "assets/sample_genuine_sukanya.jpg",
    chat_type="sms",
    sender_title="IP-INDPST (India Post Official)",
    sender_subtitle="Government of India Service",
    is_verified=True,
    is_forwarded=False,
    bubble_type="genuine",
    message_lines=[
        ("👧 Sukanya Samriddhi Yojana (SSY) Advisory 👧", True, "#4ade80"),
        ("", False, None),
        ("Secure your daughter's future with 8.2% annual interest.", False, "#e2e8f0"),
        ("Tax-free maturity benefits under Section 80C.", False, "#e2e8f0"),
        ("", False, None),
        ("⚠️ Advisory: SSY accounts can ONLY be opened at official", True, "#86efac"),
        ("Post Offices and authorized public sector bank branches.", True, "#86efac"),
        ("", False, None),
        ("Do not pay money or share credentials on unofficial links.", True, "#fca5a5"),
        ("Official Portal: https://myscheme.gov.in/schemes/ssy", True, "#38bdf8"),
        ("", False, None),
        ("National Post Office Helpline: 1800-266-6868", False, "#e2e8f0")
    ],
    timestamp="03:40 PM"
)

# 9. GENUINE 4: Pradhan Mantri Awas Yojana (PMAY) Advisory
create_chat_screenshot(
    "assets/sample_genuine_pmay.jpg",
    chat_type="whatsapp",
    sender_title="Ministry of Housing & Urban Affairs",
    sender_subtitle="Official Government Business Account",
    is_verified=True,
    is_forwarded=False,
    bubble_type="genuine",
    message_lines=[
        ("🏠 Pradhan Mantri Awas Yojana (PMAY-Urban) 🏠", True, "#4ade80"),
        ("", False, None),
        ("Housing for All: Interest subsidy up to ₹2.67 Lakh is", False, "#e2e8f0"),
        ("credited directly into beneficiary bank accounts via DBT.", False, "#e2e8f0"),
        ("", False, None),
        ("⚠️ Caution: MoHUA does NOT employ any middlemen or agents.", True, "#86efac"),
        ("No fee is charged for allotment letter or application.", True, "#86efac"),
        ("", False, None),
        ("Check verified beneficiary list on official portal:", False, "#e2e8f0"),
        ("https://pmaymis.gov.in", True, "#38bdf8"),
        ("", False, None),
        ("Toll-Free Helpline: 011-23060484 / 1800-11-6163", False, "#e2e8f0")
    ],
    timestamp="04:50 PM"
)

print("All 9 mock screenshots generated successfully!")


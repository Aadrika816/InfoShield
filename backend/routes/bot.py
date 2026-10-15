"""
WhatsApp Bot Simulator Route
Backend endpoint for automated civic chat verification.
"""
from flask import Blueprint, request, jsonify
from services.analyzer_service import AnalyzerService
from models.scan import Scan

bot_bp = Blueprint("bot", __name__, url_prefix="/api/bot")


@bot_bp.route("/chat", methods=["POST"])
def bot_chat():
    """
    Simulate automated WhatsApp verification response.
    Payload: { "message": "PM Kisan bonus claim..." }
    """
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()

    if not message:
        return jsonify({
            "success": False,
            "error": "Message is required."
        }), 400

    # Run verification analysis
    analysis = AnalyzerService.analyze(message)

    # Log to scans table
    Scan.log(
        raw_input=message,
        verdict=analysis["verdict"],
        verdict_title=analysis["verdictTitle"],
        risk_score=analysis["riskScore"],
        category_detected=analysis["categoryDetected"],
        primary_trigger=analysis["primaryTrigger"],
        red_flags=analysis["redFlags"],
        matched_scheme_id=analysis["matchedScheme"]["id"] if analysis["matchedScheme"] else None,
        input_type="whatsapp_bot",
        ip_address=request.remote_addr
    )

    is_fake = analysis["verdict"] == "POTENTIALLY_FAKE"
    is_genuine = analysis["verdict"] == "LIKELY_GENUINE"
    
    status_icon = "🚨" if is_fake else ("✅" if is_genuine else "⚠️")
    status_label = "FAKE SCHEME / SCAM ALERT" if is_fake else ("VERIFIED OFFICIAL SCHEME" if is_genuine else "UNVERIFIED NOTICE")

    # Formatted WhatsApp reply message
    bot_reply = f"""{status_icon} *{status_label}*
━━━━━━━━━━━━━━━━━━━━
🛡️ *Verdict:* {analysis['verdictTitle']}
📊 *Calculated Fraud Risk:* {analysis['riskScore']}%

📌 *Key Finding:*
{analysis['primaryTrigger']}

🏛️ *Official Portal:*
{analysis['advisory']['officialPortalUrl']}

📞 Cyber Crime Helpline: 1930 | cybercrime.gov.in
━━━━━━━━━━━━━━━━━━━━
Verified by InfoShield AI Citizen Defense 🇮🇳"""

    return jsonify({
        "success": True,
        "reply": bot_reply,
        "analysis": analysis
    }), 200

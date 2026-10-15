"""
Verification Routes
Endpoints for AI scan verification, domain auditing, and scan history.
"""
from flask import Blueprint, request, jsonify, g
from services.analyzer_service import AnalyzerService
from services.auth_service import optional_token
from services.validator import validate_verify_input
from models.scan import Scan

verifier_bp = Blueprint("verifier", __name__, url_prefix="/api/verify")


@verifier_bp.route("", methods=["POST"])
@optional_token
def verify_content():
    """
    Verify text claim, WhatsApp forward, or extracted screenshot text.
    Payload: { "text": "...", "url": "...", "input_type": "message" }
    """
    data = request.get_json(silent=True) or {}
    is_valid, errors = validate_verify_input(data)
    if not is_valid:
        return jsonify({
            "success": False,
            "error": "Validation failed",
            "messages": errors
        }), 400

    text = data.get("text", "")
    url = data.get("url", "")
    input_type = data.get("input_type", "message")
    if input_type not in ("message", "ocr", "url", "whatsapp_bot"):
        input_type = "message"

    # Run verification analysis
    analysis = AnalyzerService.analyze(text, url)

    # Log scan in database
    user_id = g.current_user["id"] if getattr(g, "current_user", None) else None
    ip_addr = request.remote_addr

    scan_id = Scan.log(
        raw_input=analysis["rawInput"],
        verdict=analysis["verdict"],
        verdict_title=analysis["verdictTitle"],
        risk_score=analysis["riskScore"],
        category_detected=analysis["categoryDetected"],
        primary_trigger=analysis["primaryTrigger"],
        red_flags=analysis["redFlags"],
        matched_scheme_id=analysis["matchedScheme"]["id"] if analysis["matchedScheme"] else None,
        user_id=user_id,
        input_type=input_type,
        ip_address=ip_addr
    )

    analysis["scanId"] = scan_id

    return jsonify({
        "success": True,
        "data": analysis
    }), 200


@verifier_bp.route("/url", methods=["POST"])
def audit_url_endpoint():
    """
    Audit website domain credibility and check for phishing/spoofing indicators.
    Payload: { "url": "http://example.online/apply" }
    """
    data = request.get_json(silent=True) or {}
    url = data.get("url", "").strip()
    if not url:
        return jsonify({
            "success": False,
            "error": "URL parameter is required."
        }), 400

    audit_result = AnalyzerService.audit_url(url)
    return jsonify({
        "success": True,
        "data": audit_result
    }), 200


@verifier_bp.route("/history", methods=["GET"])
@optional_token
def get_scan_history():
    """
    Get recent verification scan logs.
    If authenticated, returns the user's scan history; otherwise returns recent public scans.
    """
    limit = min(int(request.args.get("limit", 20)), 100)
    user_id = g.current_user["id"] if getattr(g, "current_user", None) else None
    scans = Scan.get_recent(limit=limit, user_id=user_id)

    return jsonify({
        "success": True,
        "count": len(scans),
        "data": scans
    }), 200

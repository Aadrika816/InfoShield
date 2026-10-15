"""
PIB Fact Check Debunks Routes
Endpoints for browsing and managing viral scams debunked by PIB Fact Check.
"""
from flask import Blueprint, request, jsonify
from models.pib_alert import PIBAlert
from services.auth_service import token_required, roles_required

pib_bp = Blueprint("pib", __name__, url_prefix="/api/pib-alerts")


@pib_bp.route("", methods=["GET"])
def get_pib_alerts():
    """
    Retrieve PIB fact-checked viral scam alerts.
    """
    limit = min(int(request.args.get("limit", 50)), 100)
    alerts = PIBAlert.get_all(limit=limit)
    return jsonify({
        "success": True,
        "count": len(alerts),
        "data": alerts
    }), 200


@pib_bp.route("", methods=["POST"])
@token_required
@roles_required("analyst", "admin")
def add_pib_alert():
    """
    Add a newly debunked fake scheme case (Analyst/Admin only).
    """
    data = request.get_json(silent=True) or {}
    required = ["id", "title", "scam_type", "pib_verdict", "pib_summary", "ref_url", "debunk_proof"]
    missing = [f for f in required if not data.get(f)]

    if missing:
        return jsonify({
            "success": False,
            "error": f"Missing required fields: {', '.join(missing)}"
        }), 400

    PIBAlert.create(
        id=data["id"].strip(),
        title=data["title"].strip(),
        scam_type=data["scam_type"].strip(),
        pib_verdict=data["pib_verdict"].strip(),
        pib_summary=data["pib_summary"].strip(),
        ref_url=data["ref_url"].strip(),
        debunk_proof=data["debunk_proof"].strip(),
        keywords=data.get("keywords", [])
    )

    return jsonify({
        "success": True,
        "message": "PIB fact-check alert registered successfully.",
        "alertId": data["id"]
    }), 201

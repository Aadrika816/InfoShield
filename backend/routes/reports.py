"""
Scam Incident Reports Routes
Endpoints for submitting and viewing citizen fraud incident reports.
"""
from flask import Blueprint, request, jsonify, g
from models.report import ScamReport
from services.auth_service import optional_token, token_required, roles_required
from services.validator import validate_scam_report

reports_bp = Blueprint("reports", __name__, url_prefix="/api/reports")


@reports_bp.route("", methods=["POST"])
@optional_token
def submit_report():
    """
    Submit a citizen scam or fake scheme complaint.
    Payload:
    {
        "reporter_name": "...",
        "reporter_contact": "...",
        "category": "...",
        "scam_title": "...",
        "evidence_text": "...",
        "claimed_amount": "...",
        "demanded_fee": "...",
        "suspicious_url": "...",
        "suspicious_phone": "..."
    }
    """
    data = request.get_json(silent=True) or {}
    is_valid, errors = validate_scam_report(data)
    if not is_valid:
        return jsonify({
            "success": False,
            "error": "Validation failed",
            "messages": errors
        }), 400

    user_id = g.current_user["id"] if getattr(g, "current_user", None) else None

    result = ScamReport.create(
        reporter_name=data["reporter_name"].strip(),
        reporter_contact=data["reporter_contact"].strip(),
        category=data["category"].strip(),
        scam_title=data["scam_title"].strip(),
        evidence_text=data["evidence_text"].strip(),
        claimed_amount=data.get("claimed_amount"),
        demanded_fee=data.get("demanded_fee"),
        suspicious_url=data.get("suspicious_url"),
        suspicious_phone=data.get("suspicious_phone"),
        user_id=user_id
    )

    return jsonify({
        "success": True,
        "message": "Incident report logged successfully. Keep your Cyber Tracking Ack Number.",
        "data": result
    }), 201


@reports_bp.route("", methods=["GET"])
@optional_token
def get_reports():
    """
    List reported scams and citizen alerts.
    """
    limit = min(int(request.args.get("limit", 20)), 100)
    status = request.args.get("status")
    user_only = request.args.get("my_reports", "false").lower() == "true"
    user_id = g.current_user["id"] if (user_only and getattr(g, "current_user", None)) else None

    reports = ScamReport.get_all(limit=limit, status=status, user_id=user_id)
    return jsonify({
        "success": True,
        "count": len(reports),
        "data": reports
    }), 200


@reports_bp.route("/<int:report_id>", methods=["GET"])
def get_report_by_id(report_id):
    """
    Retrieve single scam report by its ID.
    """
    report = ScamReport.find_by_id(report_id)
    if not report:
        return jsonify({
            "success": False,
            "error": f"Scam report #{report_id} not found."
        }), 404

    return jsonify({
        "success": True,
        "data": report
    }), 200


@reports_bp.route("/<int:report_id>/status", methods=["PATCH"])
@token_required
@roles_required("analyst", "admin")
def update_report_status(report_id):
    """
    Update report review status (analyst/admin only).
    Payload: { "status": "VERIFIED_SCAM" | "FORWARDED_TO_1930" | "REJECTED" }
    """
    data = request.get_json(silent=True) or {}
    new_status = data.get("status")
    allowed = ("PENDING", "VERIFIED_SCAM", "FORWARDED_TO_1930", "REJECTED")

    if new_status not in allowed:
        return jsonify({
            "success": False,
            "error": f"Invalid status. Must be one of: {', '.join(allowed)}"
        }), 400

    report = ScamReport.find_by_id(report_id)
    if not report:
        return jsonify({"success": False, "error": "Report not found."}), 404

    ScamReport.update_status(report_id, new_status)
    return jsonify({
        "success": True,
        "message": f"Report #{report_id} status updated to {new_status}."
    }), 200

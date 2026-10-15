"""
Statistics and Feedback Routes
Dashboard metrics and citizen feedback collection.
"""
from flask import Blueprint, request, jsonify, current_app, g
from models.scan import Scan
from database import query_db, execute_db
from services.validator import sanitize_string, EMAIL_REGEX

stats_bp = Blueprint("stats", __name__, url_prefix="/api")


@stats_bp.route("/stats", methods=["GET"])
def get_stats():
    """
    Get aggregated system analytics for display on frontend counters and dashboards.
    """
    scan_metrics = Scan.get_metrics()
    
    # Reports count
    reports_total = query_db("SELECT COUNT(*) as count FROM scam_reports", one=True)
    forwarded_1930 = query_db("SELECT COUNT(*) as count FROM scam_reports WHERE status = 'FORWARDED_TO_1930'", one=True)
    
    # Schemes count
    schemes_count = query_db("SELECT COUNT(*) as count FROM official_schemes", one=True)
    pib_count = query_db("SELECT COUNT(*) as count FROM pib_fact_checks", one=True)

    db_type = getattr(g, "db_type", current_app.config.get("DB_ENGINE", "mysql"))

    return jsonify({
        "success": True,
        "data": {
            "totalScans": scan_metrics["totalScans"],
            "fakeScamsCaught": scan_metrics["fakeScamsCaught"],
            "genuineVerified": scan_metrics["genuineVerified"],
            "needsVerification": scan_metrics["needsVerification"],
            "totalReportsFiled": reports_total["count"] if reports_total else 0,
            "forwardedToCyberHelpline": forwarded_1930["count"] if forwarded_1930 else 0,
            "officialSchemesCataloged": schemes_count["count"] if schemes_count else 0,
            "pibScamsCataloged": pib_count["count"] if pib_count else 0,
            "databaseEngine": db_type.upper()
        }
    }), 200


@stats_bp.route("/feedback", methods=["POST"])
def submit_feedback():
    """
    Submit citizen platform feedback or ratings.
    Payload: { "name": "...", "email": "...", "message": "...", "rating": 5 }
    """
    data = request.get_json(silent=True) or {}
    name = sanitize_string(data.get("name", ""), 100)
    email = sanitize_string(data.get("email", ""), 150).lower()
    message = sanitize_string(data.get("message", ""), 2000)
    rating = int(data.get("rating", 5))

    if not name or len(name) < 2:
        return jsonify({"success": False, "error": "Name is required."}), 400

    if not email or not EMAIL_REGEX.match(email):
        return jsonify({"success": False, "error": "Valid email is required."}), 400

    if not message or len(message) < 5:
        return jsonify({"success": False, "error": "Message must be at least 5 characters."}), 400

    query = "INSERT INTO feedback (name, email, message, rating) VALUES (%s, %s, %s, %s)"
    feedback_id = execute_db(query, (name, email, message, rating))

    return jsonify({
        "success": True,
        "message": "Thank you for your feedback! Your contribution helps protect fellow citizens.",
        "feedbackId": feedback_id
    }), 201

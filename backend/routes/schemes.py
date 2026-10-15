"""
Official Government Schemes Directory Routes
Endpoints for browsing, filtering, and managing authentic government schemes.
"""
from flask import Blueprint, request, jsonify
from models.scheme import Scheme
from services.auth_service import token_required, roles_required

schemes_bp = Blueprint("schemes", __name__, url_prefix="/api/schemes")


@schemes_bp.route("", methods=["GET"])
def get_schemes():
    """
    Search and filter verified government schemes.
    Query params: ?search=kisan&category=Agriculture
    """
    search = request.args.get("search", "").strip()
    category = request.args.get("category", "all").strip()

    schemes = Scheme.get_all(search=search if search else None, category=category)
    return jsonify({
        "success": True,
        "count": len(schemes),
        "data": schemes
    }), 200


@schemes_bp.route("/<string:scheme_id>", methods=["GET"])
def get_scheme_by_id(scheme_id):
    """
    Get single official scheme by its unique identifier.
    """
    scheme = Scheme.find_by_id(scheme_id)
    if not scheme:
        return jsonify({
            "success": False,
            "error": f"Official scheme with ID '{scheme_id}' not found."
        }), 404

    return jsonify({
        "success": True,
        "data": scheme
    }), 200


@schemes_bp.route("", methods=["POST"])
@token_required
@roles_required("analyst", "admin")
def add_scheme():
    """
    Register a newly verified official scheme (Analyst/Admin only).
    """
    data = request.get_json(silent=True) or {}
    required = ["id", "name", "short_name", "category", "ministry", "official_domain", "official_url", "benefit_summary", "target_audience", "verified_notice"]
    missing = [f for f in required if not data.get(f)]

    if missing:
        return jsonify({
            "success": False,
            "error": f"Missing required fields: {', '.join(missing)}"
        }), 400

    existing = Scheme.find_by_id(data["id"])
    if existing:
        return jsonify({"success": False, "error": f"Scheme ID '{data['id']}' already exists."}), 409

    Scheme.create(
        id=data["id"].strip(),
        name=data["name"].strip(),
        short_name=data["short_name"].strip(),
        category=data["category"].strip(),
        ministry=data["ministry"].strip(),
        official_domain=data["official_domain"].strip(),
        official_url=data["official_url"].strip(),
        benefit_summary=data["benefit_summary"].strip(),
        target_audience=data["target_audience"].strip(),
        verified_notice=data["verified_notice"].strip(),
        max_benefit_numeric=float(data.get("max_benefit_numeric", 0.0)),
        official_fee=data.get("official_fee", "₹0 (Completely Free)"),
        keywords=data.get("keywords", [])
    )

    return jsonify({
        "success": True,
        "message": "Official scheme added successfully.",
        "schemeId": data["id"]
    }), 201

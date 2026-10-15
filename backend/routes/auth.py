"""
Authentication Routes
Endpoints for user registration, authentication, and session identity.
"""
from flask import Blueprint, request, jsonify, g
from models.user import User
from services.auth_service import (
    verify_password, generate_token, token_required
)
from services.validator import validate_registration, validate_login

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    """
    Register a new citizen or analyst account.
    Expects: { "name": "...", "email": "...", "password": "..." }
    """
    data = request.get_json(silent=True) or {}
    is_valid, errors = validate_registration(data)
    if not is_valid:
        return jsonify({
            "success": False,
            "error": "Validation failed",
            "messages": errors
        }), 400

    email = data["email"].strip().lower()
    existing_user = User.find_by_email(email)
    if existing_user:
        return jsonify({
            "success": False,
            "error": "An account with this email address already exists."
        }), 409

    role = data.get("role", "citizen")
    if role not in ("citizen", "analyst"):
        role = "citizen"

    user_id = User.create(
        name=data["name"].strip(),
        email=email,
        password=data["password"],
        role=role
    )

    token = generate_token(user_id, email, role)
    return jsonify({
        "success": True,
        "message": "User registered successfully.",
        "token": token,
        "user": {
            "id": user_id,
            "name": data["name"].strip(),
            "email": email,
            "role": role
        }
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Authenticate user and issue a JWT bearer token.
    Expects: { "email": "...", "password": "..." }
    """
    data = request.get_json(silent=True) or {}
    is_valid, errors = validate_login(data)
    if not is_valid:
        return jsonify({
            "success": False,
            "error": "Validation failed",
            "messages": errors
        }), 400

    email = data["email"].strip().lower()
    user = User.find_by_email(email)
    if not user or not verify_password(data["password"], user["password_hash"]):
        return jsonify({
            "success": False,
            "error": "Invalid email address or password."
        }), 401

    User.update_last_login(user["id"])
    token = generate_token(user["id"], user["email"], user.get("role", "citizen"))

    return jsonify({
        "success": True,
        "message": "Authentication successful.",
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user.get("role", "citizen")
        }
    }), 200


@auth_bp.route("/me", methods=["GET"])
@token_required
def get_current_user():
    """
    Retrieve current authenticated user's profile details.
    """
    return jsonify({
        "success": True,
        "user": {
            "id": g.current_user["id"],
            "name": g.current_user["name"],
            "email": g.current_user["email"],
            "role": g.current_user["role"],
            "created_at": str(g.current_user.get("created_at", ""))
        }
    }), 200

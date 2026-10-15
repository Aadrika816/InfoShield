"""
InfoShield Authentication & Security Service
Implements PBKDF2/scrypt password hashing and JWT (JSON Web Token) authentication.
"""
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify, current_app, g
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
from database import query_db


def hash_password(password: str) -> str:
    """Hash password using Werkzeug's secure salt-and-hash implementation."""
    return generate_password_hash(password, method="scrypt")


def verify_password(password: str, password_hash: str) -> bool:
    """Check a plaintext password against a stored secure hash."""
    return check_password_hash(password_hash, password)


def generate_token(user_id: int, email: str, role: str = "citizen") -> str:
    """
    Generate a signed JWT token valid for the configured duration.
    """
    secret = current_app.config.get("JWT_SECRET_KEY", "infoshield-jwt-secret")
    hours = current_app.config.get("JWT_EXPIRATION_HOURS", 24)
    now = datetime.now(timezone.utc)
    
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "iat": now,
        "exp": now + timedelta(hours=hours)
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def decode_token(token: str):
    """
    Decode and verify a signed JWT token.
    Returns payload dict or None if invalid or expired.
    """
    secret = current_app.config.get("JWT_SECRET_KEY", "infoshield-jwt-secret")
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def token_required(f):
    """
    Decorator requiring a valid Bearer JWT token in Authorization header.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({
                "success": False,
                "error": "Authentication token missing or invalid. Use 'Authorization: Bearer <token>'."
            }), 401

        token = auth_header.split(" ")[1]
        payload = decode_token(token)
        if not payload or "sub" not in payload:
            return jsonify({
                "success": False,
                "error": "Token has expired or is invalid. Please log in again."
            }), 401

        # Fetch current user from DB (ensuring user_id is integer)
        try:
            user_id = int(payload["sub"])
        except (ValueError, TypeError):
            user_id = payload["sub"]

        user = query_db("SELECT id, name, email, role, created_at FROM users WHERE id = %s", (user_id,), one=True)
        if not user:
            return jsonify({
                "success": False,
                "error": "User account associated with this token no longer exists."
            }), 401

        g.current_user = user
        return f(*args, **kwargs)

    return decorated


def optional_token(f):
    """
    Decorator that attaches current_user if token is present, but allows guest access.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        g.current_user = None
        auth_header = request.headers.get("Authorization", "")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            payload = decode_token(token)
            if payload and "sub" in payload:
                try:
                    user_id = int(payload["sub"])
                except (ValueError, TypeError):
                    user_id = payload["sub"]
                user = query_db("SELECT id, name, email, role, created_at FROM users WHERE id = %s", (user_id,), one=True)
                if user:
                    g.current_user = user
        return f(*args, **kwargs)

    return decorated


def roles_required(*allowed_roles):
    """
    Decorator ensuring current_user has one of the allowed roles.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not getattr(g, "current_user", None):
                return jsonify({"success": False, "error": "Authentication required."}), 401
            
            user_role = g.current_user.get("role", "citizen")
            if user_role not in allowed_roles:
                return jsonify({
                    "success": False,
                    "error": f"Access denied. Requires one of the following roles: {', '.join(allowed_roles)}"
                }), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

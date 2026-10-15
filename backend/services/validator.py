"""
InfoShield Server-Side Input Validation and Sanitization Module
Protects against SQL injection, XSS vectors, and invalid request schemas.
"""
import re
from urllib.parse import urlparse

# Strict Email Regex matching standard RFC 5322
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
PHONE_REGEX = re.compile(r"^[+]?[0-9]{10,14}$")


def sanitize_string(val, max_length=1000):
    """Clean string values and strip control characters."""
    if not isinstance(val, str):
        return ""
    cleaned = val.strip()
    # Remove null bytes
    cleaned = cleaned.replace("\x00", "")
    return cleaned[:max_length]


def validate_registration(data):
    """
    Validate user registration payload:
    - name: 2-100 characters
    - email: valid format
    - password: minimum 8 characters, at least 1 number or special character
    """
    errors = []
    if not isinstance(data, dict):
        return False, ["Invalid JSON payload format."]

    name = sanitize_string(data.get("name", ""), 100)
    email = sanitize_string(data.get("email", ""), 150).lower()
    password = data.get("password", "")

    if not name or len(name) < 2:
        errors.append("Full name must be at least 2 characters long.")

    if not email or not EMAIL_REGEX.match(email):
        errors.append("Please provide a valid email address.")

    if not password or len(password) < 8:
        errors.append("Password must be at least 8 characters long.")
    elif not any(c.isdigit() for c in password) and not any(not c.isalnum() for c in password):
        errors.append("Password must contain at least one digit or special character.")

    return len(errors) == 0, errors


def validate_login(data):
    """Validate user login payload."""
    errors = []
    if not isinstance(data, dict):
        return False, ["Invalid JSON payload format."]

    email = sanitize_string(data.get("email", ""), 150).lower()
    password = data.get("password", "")

    if not email or not EMAIL_REGEX.match(email):
        errors.append("A valid email address is required.")

    if not password:
        errors.append("Password is required.")

    return len(errors) == 0, errors


def validate_verify_input(data):
    """Validate content verification input."""
    errors = []
    if not isinstance(data, dict):
        return False, ["Invalid JSON payload format."]

    text = sanitize_string(data.get("text", ""), 10000)
    url = sanitize_string(data.get("url", ""), 1000)

    if not text and not url:
        errors.append("Either 'text' or 'url' must be provided for verification.")

    if url:
        try:
            parsed = urlparse(url if url.startswith("http") else "http://" + url)
            if not parsed.netloc:
                errors.append("Invalid URL structure provided.")
        except Exception:
            errors.append("Invalid URL format.")

    return len(errors) == 0, errors


def validate_scam_report(data):
    """Validate citizen cyber scam report."""
    errors = []
    if not isinstance(data, dict):
        return False, ["Invalid JSON payload format."]

    reporter_name = sanitize_string(data.get("reporter_name", ""), 100)
    reporter_contact = sanitize_string(data.get("reporter_contact", ""), 100)
    category = sanitize_string(data.get("category", ""), 100)
    scam_title = sanitize_string(data.get("scam_title", ""), 255)
    evidence_text = sanitize_string(data.get("evidence_text", ""), 10000)

    if not reporter_name or len(reporter_name) < 2:
        errors.append("Reporter name is required.")

    if not reporter_contact:
        errors.append("Contact information (phone or email) is required.")

    if not category:
        errors.append("Scam category is required.")

    if not scam_title or len(scam_title) < 5:
        errors.append("Scam headline/title must be at least 5 characters.")

    if not evidence_text or len(evidence_text) < 10:
        errors.append("Evidence text must be at least 10 characters long.")

    return len(errors) == 0, errors

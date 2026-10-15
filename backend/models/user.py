"""
User Model
Manages citizen and administrator accounts in MySQL.
"""
from database import query_db, execute_db
from services.auth_service import hash_password


class User:
    """User data access class."""

    @classmethod
    def create(cls, name: str, email: str, password: str, role: str = "citizen") -> int:
        """Create a new user account with hashed password."""
        pw_hash = hash_password(password)
        query = """
            INSERT INTO users (name, email, password_hash, role)
            VALUES (%s, %s, %s, %s)
        """
        user_id = execute_db(query, (name, email.lower(), pw_hash, role))
        return user_id

    @classmethod
    def find_by_email(cls, email: str):
        """Retrieve user record by email address."""
        query = "SELECT * FROM users WHERE email = %s"
        return query_db(query, (email.lower(),), one=True)

    @classmethod
    def find_by_id(cls, user_id: int):
        """Retrieve user record by ID (excluding password hash)."""
        query = "SELECT id, name, email, role, created_at, last_login FROM users WHERE id = %s"
        return query_db(query, (user_id,), one=True)

    @classmethod
    def update_last_login(cls, user_id: int):
        """Update user's last login timestamp."""
        query = "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = %s"
        execute_db(query, (user_id,))

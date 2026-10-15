"""
Scam Report Model
Manages citizen fraud reports submitted to the platform and cybercrime helpline.
"""
import secrets
from database import query_db, execute_db


class ScamReport:
    """ScamReport data access class."""

    @classmethod
    def generate_ack_number(cls) -> str:
        """Generate a unique tracking acknowledgment number for the report."""
        token = secrets.token_hex(4).upper()
        return f"CYBER-INFOSHIELD-{token}"

    @classmethod
    def create(cls, reporter_name: str, reporter_contact: str, category: str,
               scam_title: str, evidence_text: str, claimed_amount: str = None,
               demanded_fee: str = None, suspicious_url: str = None,
               suspicious_phone: str = None, user_id: int = None) -> dict:
        """Insert a citizen scam report and return report record with ack number."""
        ack_number = cls.generate_ack_number()
        query = """
            INSERT INTO scam_reports (
                user_id, reporter_name, reporter_contact, category, scam_title,
                claimed_amount, demanded_fee, suspicious_url, suspicious_phone,
                evidence_text, cyber_ack_number, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'PENDING')
        """
        report_id = execute_db(query, (
            user_id, reporter_name, reporter_contact, category, scam_title,
            claimed_amount, demanded_fee, suspicious_url, suspicious_phone,
            evidence_text, ack_number
        ))

        return {
            "id": report_id,
            "cyber_ack_number": ack_number,
            "status": "PENDING"
        }

    @classmethod
    def get_all(cls, limit: int = 50, status: str = None, user_id: int = None):
        """Retrieve scam reports with optional filters."""
        params = []
        conditions = []

        if user_id:
            conditions.append("user_id = %s")
            params.append(user_id)

        if status:
            conditions.append("status = %s")
            params.append(status)

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        query = f"""
            SELECT id, user_id, reporter_name, reporter_contact, category,
                   scam_title, claimed_amount, demanded_fee, suspicious_url,
                   suspicious_phone, evidence_text, status, cyber_ack_number,
                   created_at
            FROM scam_reports
            {where_clause}
            ORDER BY created_at DESC LIMIT %s
        """
        params.append(limit)
        return query_db(query, tuple(params))

    @classmethod
    def find_by_id(cls, report_id: int):
        """Retrieve single scam report by ID."""
        query = "SELECT * FROM scam_reports WHERE id = %s"
        return query_db(query, (report_id,), one=True)

    @classmethod
    def update_status(cls, report_id: int, new_status: str):
        """Update review status of a report."""
        query = "UPDATE scam_reports SET status = %s WHERE id = %s"
        execute_db(query, (new_status, report_id))

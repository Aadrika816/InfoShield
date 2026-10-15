"""
Scan Model
Logs and retrieves AI scheme verification scans.
"""
import json
from database import query_db, execute_db


class Scan:
    """Scan data access class."""

    @classmethod
    def log(cls, raw_input: str, verdict: str, verdict_title: str, risk_score: int,
            category_detected: str = None, primary_trigger: str = None,
            red_flags: list = None, matched_scheme_id: str = None,
            user_id: int = None, input_type: str = "message", ip_address: str = None) -> int:
        """Log a new verification scan to the database."""
        flags_json = json.dumps(red_flags or [])
        query = """
            INSERT INTO scans (
                user_id, input_type, raw_input, verdict, verdict_title,
                risk_score, category_detected, primary_trigger,
                red_flags_json, matched_scheme_id, ip_address
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        scan_id = execute_db(query, (
            user_id, input_type, raw_input, verdict, verdict_title,
            risk_score, category_detected, primary_trigger,
            flags_json, matched_scheme_id, ip_address
        ))
        return scan_id

    @classmethod
    def get_recent(cls, limit: int = 50, user_id: int = None):
        """Retrieve recent scan history."""
        if user_id:
            query = """
                SELECT id, input_type, raw_input, verdict, verdict_title,
                       risk_score, category_detected, primary_trigger,
                       matched_scheme_id, created_at
                FROM scans
                WHERE user_id = %s
                ORDER BY created_at DESC LIMIT %s
            """
            return query_db(query, (user_id, limit))
        else:
            query = """
                SELECT id, input_type, raw_input, verdict, verdict_title,
                       risk_score, category_detected, primary_trigger,
                       matched_scheme_id, created_at
                FROM scans
                ORDER BY created_at DESC LIMIT %s
            """
            return query_db(query, (limit,))

    @classmethod
    def get_metrics(cls):
        """Aggregate statistical metrics for dashboard."""
        total = query_db("SELECT COUNT(*) as count FROM scans", one=True)
        fakes = query_db("SELECT COUNT(*) as count FROM scans WHERE verdict = 'POTENTIALLY_FAKE'", one=True)
        genuine = query_db("SELECT COUNT(*) as count FROM scans WHERE verdict = 'LIKELY_GENUINE'", one=True)
        caution = query_db("SELECT COUNT(*) as count FROM scans WHERE verdict = 'NEEDS_VERIFICATION'", one=True)

        return {
            "totalScans": total["count"] if total else 0,
            "fakeScamsCaught": fakes["count"] if fakes else 0,
            "genuineVerified": genuine["count"] if genuine else 0,
            "needsVerification": caution["count"] if caution else 0
        }

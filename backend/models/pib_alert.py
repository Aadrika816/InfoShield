"""
PIB Alert Model
Manages viral fake scheme alerts debunked by Press Information Bureau.
"""
import json
from database import query_db, execute_db


class PIBAlert:
    """PIB Fact-Check Alert data access class."""

    @classmethod
    def get_all(cls, limit: int = 50):
        """Retrieve all PIB fact-checked scams."""
        query = "SELECT * FROM pib_fact_checks ORDER BY created_at DESC LIMIT %s"
        rows = query_db(query, (limit,))
        for row in rows:
            if isinstance(row.get("keywords_json"), str):
                try:
                    row["keywords"] = json.loads(row["keywords_json"])
                except Exception:
                    row["keywords"] = []
            else:
                row["keywords"] = row.get("keywords_json", [])
        return rows

    @classmethod
    def create(cls, id: str, title: str, scam_type: str, pib_verdict: str,
               pib_summary: str, ref_url: str, debunk_proof: str, keywords: list = None):
        """Insert a newly debunked fake scheme case."""
        keywords_json = json.dumps(keywords or [])
        query = """
            INSERT INTO pib_fact_checks (
                id, title, scam_type, pib_verdict, pib_summary,
                ref_url, debunk_proof, keywords_json
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        execute_db(query, (
            id, title, scam_type, pib_verdict, pib_summary,
            ref_url, debunk_proof, keywords_json
        ))
        return id

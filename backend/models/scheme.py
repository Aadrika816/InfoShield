"""
Official Scheme Model
Manages verified Indian Government welfare schemes in the database.
"""
import json
from database import query_db, execute_db


class Scheme:
    """Scheme data access class."""

    @classmethod
    def get_all(cls, search: str = None, category: str = None):
        """Retrieve schemes with optional search text and category filtering."""
        query = "SELECT * FROM official_schemes"
        params = []
        conditions = []

        if category and category.lower() != "all":
            conditions.append("LOWER(category) LIKE %s")
            params.append(f"%{category.lower()}%")

        if search:
            conditions.append("(LOWER(name) LIKE %s OR LOWER(short_name) LIKE %s OR LOWER(benefit_summary) LIKE %s)")
            wildcard = f"%{search.lower()}%"
            params.extend([wildcard, wildcard, wildcard])

        if conditions:
            query += f" WHERE {' AND '.join(conditions)}"

        query += " ORDER BY name ASC"
        rows = query_db(query, tuple(params))
        
        # Parse JSON keywords
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
    def find_by_id(cls, scheme_id: str):
        """Retrieve a specific scheme by ID."""
        query = "SELECT * FROM official_schemes WHERE id = %s"
        row = query_db(query, (scheme_id,), one=True)
        if row and isinstance(row.get("keywords_json"), str):
            try:
                row["keywords"] = json.loads(row["keywords_json"])
            except Exception:
                row["keywords"] = []
        return row

    @classmethod
    def create(cls, id: str, name: str, short_name: str, category: str,
               ministry: str, official_domain: str, official_url: str,
               benefit_summary: str, target_audience: str, verified_notice: str,
               max_benefit_numeric: float = 0.0, official_fee: str = "₹0 (Completely Free)",
               keywords: list = None):
        """Insert a newly verified official scheme."""
        keywords_json = json.dumps(keywords or [])
        query = """
            INSERT INTO official_schemes (
                id, name, short_name, category, ministry, official_domain,
                official_url, fee_required, official_fee, max_benefit_numeric,
                benefit_summary, target_audience, keywords_json, verified_notice
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, 0, %s, %s, %s, %s, %s, %s)
        """
        execute_db(query, (
            id, name, short_name, category, ministry, official_domain,
            official_url, official_fee, max_benefit_numeric,
            benefit_summary, target_audience, keywords_json, verified_notice
        ))
        return id

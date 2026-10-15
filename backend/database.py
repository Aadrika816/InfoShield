"""
InfoShield Database Management Module
Supports MySQL 8.0+ via PyMySQL with connection pooling and an automatic 
SQLite fallback for local offline testing and instant demonstration.
"""
import json
import logging
import sqlite3
from pathlib import Path
from flask import g, current_app
import pymysql
from pymysql.cursors import DictCursor

logger = logging.getLogger("infoshield.db")


def get_db():
    """
    Get or create a database connection for the current Flask request context.
    """
    if "db" not in g:
        config = current_app.config
        engine = config.get("DB_ENGINE", "mysql").lower()

        if engine == "mysql":
            try:
                g.db = pymysql.connect(
                    host=config.get("MYSQL_HOST", "localhost"),
                    port=config.get("MYSQL_PORT", 3306),
                    user=config.get("MYSQL_USER", "root"),
                    password=config.get("MYSQL_PASSWORD", ""),
                    database=config.get("MYSQL_DB", "infoshield_db"),
                    charset="utf8mb4",
                    cursorclass=DictCursor,
                    autocommit=False,
                    connect_timeout=3
                )
                g.db_type = "mysql"
            except Exception as e:
                logger.warning(
                    f"MySQL connection to {config.get('MYSQL_HOST')}:{config.get('MYSQL_PORT')} "
                    f"failed ({e}). Activating automatic SQLite fallback for local development."
                )
                g.db = _get_sqlite_connection(config)
                g.db_type = "sqlite"
        else:
            g.db = _get_sqlite_connection(config)
            g.db_type = "sqlite"

    return g.db


def _get_sqlite_connection(config):
    """Internal helper to initialize an SQLite connection."""
    sqlite_path = config.get("SQLITE_PATH", "infoshield_dev.db")
    conn = sqlite3.connect(sqlite_path)
    conn.row_factory = sqlite3.Row
    return conn


def close_db(e=None):
    """Close the database connection at the end of the request."""
    db = g.pop("db", None)
    if db is not None:
        try:
            db.close()
        except Exception:
            pass


def query_db(query, args=(), one=False):
    """
    Execute a SELECT query and return results as Python dicts.
    """
    db = get_db()
    db_type = getattr(g, "db_type", "mysql")

    if db_type == "mysql":
        with db.cursor() as cursor:
            # MySQL uses %s formatting
            mysql_query = query.replace("?", "%s")
            cursor.execute(mysql_query, args)
            rows = cursor.fetchall()
            return (rows[0] if rows else None) if one else rows
    else:
        # SQLite uses ? formatting
        sqlite_query = query.replace("%s", "?")
        cur = db.cursor()
        cur.execute(sqlite_query, args)
        rows = [dict(row) for row in cur.fetchall()]
        cur.close()
        return (rows[0] if rows else None) if one else rows


def execute_db(query, args=(), commit=True):
    """
    Execute an INSERT, UPDATE, or DELETE query and return the last inserted ID.
    """
    db = get_db()
    db_type = getattr(g, "db_type", "mysql")

    if db_type == "mysql":
        with db.cursor() as cursor:
            mysql_query = query.replace("?", "%s")
            cursor.execute(mysql_query, args)
            last_id = cursor.lastrowid
        if commit:
            db.commit()
        return last_id
    else:
        sqlite_query = query.replace("%s", "?")
        cur = db.cursor()
        cur.execute(sqlite_query, args)
        last_id = cur.lastrowid
        cur.close()
        if commit:
            db.commit()
        return last_id


def init_db(app):
    """
    Initialize database tables and seed data if not present.
    """
    with app.app_context():
        config = app.config
        engine = config.get("DB_ENGINE", "mysql").lower()

        if engine == "mysql":
            try:
                # Attempt to create database if not existing
                root_conn = pymysql.connect(
                    host=config.get("MYSQL_HOST", "localhost"),
                    port=config.get("MYSQL_PORT", 3306),
                    user=config.get("MYSQL_USER", "root"),
                    password=config.get("MYSQL_PASSWORD", ""),
                    charset="utf8mb4",
                    connect_timeout=3
                )
                with root_conn.cursor() as cur:
                    cur.execute(f"CREATE DATABASE IF NOT EXISTS `{config.get('MYSQL_DB', 'infoshield_db')}` CHARACTER SET utf8mb4;")
                root_conn.commit()
                root_conn.close()

                # Execute schema.sql on target database
                schema_path = Path(__file__).parent / "schema.sql"
                if schema_path.exists():
                    with open(schema_path, "r", encoding="utf-8") as f:
                        sql_commands = f.read()

                    db = get_db()
                    with db.cursor() as cur:
                        for stmt in sql_commands.split(";"):
                            clean_stmt = stmt.strip()
                            if clean_stmt and not clean_stmt.startswith("--") and not clean_stmt.lower().startswith("use "):
                                try:
                                    cur.execute(clean_stmt)
                                except Exception as err:
                                    logger.debug(f"Statement execution notice: {err}")
                    db.commit()
                    logger.info("MySQL database initialized successfully from schema.sql.")
                    return
            except Exception as e:
                logger.warning(f"MySQL initialization failed ({e}). Initializing SQLite fallback...")

        # Initialize SQLite fallback schema
        _init_sqlite_schema(app)


def _init_sqlite_schema(app):
    """Initialize tables in SQLite fallback database."""
    sqlite_path = app.config.get("SQLITE_PATH", "infoshield_dev.db")
    conn = sqlite3.connect(sqlite_path)
    cur = conn.cursor()

    cur.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'citizen',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS scans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            input_type TEXT NOT NULL DEFAULT 'message',
            raw_input TEXT NOT NULL,
            verdict TEXT NOT NULL,
            verdict_title TEXT NOT NULL,
            risk_score INTEGER NOT NULL,
            category_detected TEXT,
            primary_trigger TEXT,
            red_flags_json TEXT,
            matched_scheme_id TEXT,
            ip_address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS scam_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            reporter_name TEXT NOT NULL,
            reporter_contact TEXT NOT NULL,
            category TEXT NOT NULL,
            scam_title TEXT NOT NULL,
            claimed_amount TEXT,
            demanded_fee TEXT,
            suspicious_url TEXT,
            suspicious_phone TEXT,
            evidence_text TEXT NOT NULL,
            status TEXT DEFAULT 'PENDING',
            cyber_ack_number TEXT UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS official_schemes (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            short_name TEXT NOT NULL,
            category TEXT NOT NULL,
            ministry TEXT NOT NULL,
            official_domain TEXT NOT NULL,
            official_url TEXT NOT NULL,
            fee_required INTEGER DEFAULT 0,
            official_fee TEXT DEFAULT '₹0 (Completely Free)',
            max_benefit_numeric REAL DEFAULT 0,
            benefit_summary TEXT NOT NULL,
            target_audience TEXT NOT NULL,
            keywords_json TEXT NOT NULL,
            verified_notice TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS pib_fact_checks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            scam_type TEXT NOT NULL,
            pib_verdict TEXT NOT NULL,
            pib_summary TEXT NOT NULL,
            ref_url TEXT NOT NULL,
            debunk_proof TEXT NOT NULL,
            keywords_json TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            message TEXT NOT NULL,
            rating INTEGER DEFAULT 5,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # Check and insert default schemes if empty
    cur.execute("SELECT COUNT(*) FROM official_schemes")
    if cur.fetchone()[0] == 0:
        cur.executemany("""
            INSERT INTO official_schemes (
                id, name, short_name, category, ministry, official_domain, official_url,
                fee_required, official_fee, max_benefit_numeric, benefit_summary,
                target_audience, keywords_json, verified_notice
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            (
                "pm-kisan", "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)", "PM-KISAN", "Agriculture & Farmers",
                "Ministry of Agriculture and Farmers Welfare", "pmkisan.gov.in", "https://pmkisan.gov.in",
                0, "₹0 (Completely Free)", 6000.0,
                "₹6,000 per year in 3 equal installments of ₹2,000 directly via DBT into bank accounts.",
                "Small and marginal farmer families with cultivable landholding.",
                json.dumps(["pm kisan", "pmkisan", "kisan samman nidhi", "farmer installment", "kist", "17th installment", "18th installment"]),
                "Government NEVER charges registration or processing fees for PM-KISAN. Applications are made through official portal or CSC centers. Any claim of ₹15,000 or ₹25,000 bonus is fraudulent."
            ),
            (
                "pm-jay", "Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (PM-JAY & ABHA)", "Ayushman Bharat (PM-JAY)", "Healthcare",
                "National Health Authority (Ministry of Health and Family Welfare)", "nha.gov.in", "https://beneficiary.nha.gov.in",
                0, "₹0 (Completely Free)", 500000.0,
                "Free secondary and tertiary healthcare hospitalization cover of up to ₹5,00,000 per family per year, plus ABHA Digital Health Account.",
                "Bottom 40% economically vulnerable population and all eligible Indian citizens for ABHA ID.",
                json.dumps(["ayushman bharat", "pmjay", "pm-jay", "ayushman card", "golden card", "health cover 5 lakh", "abha"]),
                "Ayushman Golden Card & ABHA ID creation is completely FREE OF COST. Beware of fake download links and ₹250-₹450 fee demands."
            ),
            (
                "pm-mudra", "Pradhan Mantri MUDRA Yojana (PMMY)", "PM Mudra Yojana", "Financial Support & Loans",
                "Department of Financial Services, Ministry of Finance", "mudra.org.in", "https://www.mudra.org.in",
                0, "₹0 (No Upfront Commission)", 2000000.0,
                "Collateral-free business loans up to ₹20 Lakhs across Shishu, Kishore and Tarun categories.",
                "Non-corporate, non-farm small and micro enterprises, retail vendors, and artisans.",
                json.dumps(["mudra loan", "pm mudra", "shishu loan", "kishore loan", "tarun loan", "collateral free loan", "mudra yojana"]),
                "Government of India and MUDRA NEVER issue loan approval letters demanding stamp duty, file processing fees, or GST payments via UPI/WhatsApp."
            ),
            (
                "pm-surya-ghar", "PM Surya Ghar: Muft Bijli Yojana", "PM Surya Ghar", "Energy & Solar",
                "Ministry of New and Renewable Energy (MNRE)", "pmsuryaghar.gov.in", "https://pmsuryaghar.gov.in",
                0, "₹0 (Direct Subsidy)", 78000.0,
                "Direct capital subsidy of up to ₹78,000 for installing 3kW rooftop solar panels, providing up to 300 units of free electricity monthly.",
                "Residential households across all Indian states and Union Territories.",
                json.dumps(["pm surya ghar", "muft bijli", "solar rooftop", "free electricity", "solar subsidy"]),
                "Rooftop solar applications are ONLY processed on pmsuryaghar.gov.in. Beware of fake contractors demanding cash deposits before portal registration."
            )
        ])

    # Check and insert default PIB checks if empty
    cur.execute("SELECT COUNT(*) FROM pib_fact_checks")
    if cur.fetchone()[0] == 0:
        cur.executemany("""
            INSERT INTO pib_fact_checks (
                id, title, scam_type, pib_verdict, pib_summary, ref_url, debunk_proof, keywords_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            (
                "pib-laptop-2024", "Fake PM Free Laptop Scheme 2024 demanding ₹250–₹299 registration fee", "Financial & Data Theft", "FAKE / FRAUD",
                "PIB Fact Check confirmed that the Central Government is NOT running any Free Laptop Scheme requiring citizens to pay online registration charges or share on WhatsApp.",
                "https://factcheck.pib.gov.in",
                "Government never charges money for student benefits. Genuine student programs are announced only on education.gov.in or scholarships.gov.in.",
                json.dumps(["free laptop", "laptop yojana", "laptop scheme", "free hp laptop", "50000 laptop", "pm-laptop-yojana"])
            ),
            (
                "pib-ayushman-card", "Fake Ayushman Bharat Golden Card download fee ₹450 & Aadhaar OTP harvest", "Healthcare Identity & Cyber Fraud", "FAKE / FRAUD",
                "A fake website and WhatsApp forward offers home delivery of VIP Ayushman Golden Card for ₹450. National Health Authority (NHA) confirmed that Ayushman Card creation is 100% FREE.",
                "https://factcheck.pib.gov.in",
                "Ayushman Bharat cards are issued free of cost at government hospitals and verified CSCs. Government never charges registration fees or requests OTP via private links.",
                json.dumps(["ayushman golden card", "vip golden card", "ayushman card free", "ayushman card 450", "ayushman-card"])
            ),
            (
                "pib-mudra-loan", "Fake Mudra Loan ₹10 Lakh Approval Letter Demanding ₹1,250 Stamp Fee", "Loan Advance-Fee Fraud", "FAKE / FRAUD",
                "Fraudsters circulate forged approval letters carrying Ministry of Finance letterhead claiming a ₹10,00,000 Mudra loan has been approved and demanding ₹1,250 stamp duty or registration fee.",
                "https://factcheck.pib.gov.in",
                "PMMY loans are never sanctioned via social media or email approval letters. No upfront fee or stamp duty is ever charged via UPI.",
                json.dumps(["mudra loan", "mudra approve", "stamp duty fee", "stamp fee", "1250", "mudra approval"])
            )
        ])

    conn.commit()
    conn.close()
    logger.info("SQLite database initialized successfully.")

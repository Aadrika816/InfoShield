"""
InfoShield Application Configuration
Loads settings from environment variables using python-dotenv.
"""
import os
import tempfile
from pathlib import Path
from dotenv import load_dotenv

# Base directory of the backend folder
BASE_DIR = Path(__file__).resolve().parent

# Load .env file from backend directory
load_dotenv(BASE_DIR / ".env")


class Config:
    """Base configuration with safe defaults."""
    SECRET_KEY = os.getenv("SECRET_KEY", "infoshield-default-secret-key-change-me")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "infoshield-jwt-secret-key")
    JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", 24))

    # Running as a Vercel serverless function (read-only filesystem except /tmp)
    IS_VERCEL = bool(os.getenv("VERCEL"))

    # Database Configuration
    # On Vercel without a hosted MySQL configured, default straight to SQLite.
    DB_ENGINE = os.getenv(
        "DB_ENGINE", "sqlite" if IS_VERCEL and not os.getenv("MYSQL_HOST") else "mysql"
    ).lower()
    MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))
    MYSQL_USER = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
    MYSQL_DB = os.getenv("MYSQL_DB", "infoshield_db")
    
    # SQLite fallback database path (/tmp is the only writable dir on Vercel)
    SQLITE_PATH = Path(tempfile.gettempdir()) / "infoshield.db" if IS_VERCEL else BASE_DIR / "infoshield_dev.db"

    # External AI Services
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
    GROQ_MODEL = "qwen/qwen3.8-27b"

    # Static/Frontend directory mapping (points to dedicated frontend/ folder)
    FRONTEND_DIR = (BASE_DIR.parent / "frontend") if (BASE_DIR.parent / "frontend").exists() else BASE_DIR.parent


class DevelopmentConfig(Config):
    """Development configuration with debug mode enabled."""
    DEBUG = True
    TESTING = False


class TestingConfig(Config):
    """Testing configuration using an isolated test SQLite database."""
    DEBUG = False
    TESTING = True
    DB_ENGINE = "sqlite"
    SQLITE_PATH = BASE_DIR / "infoshield_test.db"


class ProductionConfig(Config):
    """Production configuration with strict security defaults."""
    DEBUG = False
    TESTING = False


# Map environment names to configuration classes
config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}

"""
Vercel serverless entry point.
Puts backend/ on the import path and exposes the Flask `app` object.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app import app  # noqa: E402,F401

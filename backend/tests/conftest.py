"""
Pytest Fixtures and Test Environment Setup
Configures isolated test application and database context.
"""
import sys
from pathlib import Path
import pytest

# Add backend directory to Python sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app import create_app


@pytest.fixture(scope="session")
def app():
    """Create and configure a new Flask app instance for testing."""
    test_db_path = backend_dir / "infoshield_test.db"
    if test_db_path.exists():
        try:
            test_db_path.unlink()
        except Exception:
            pass

    test_app = create_app("testing")
    yield test_app

    # Teardown
    if test_db_path.exists():
        try:
            test_db_path.unlink()
        except Exception:
            pass


@pytest.fixture
def client(app):
    """A test client for making simulated HTTP requests to the app."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """A test CLI runner for testing Flask CLI commands."""
    return app.test_cli_runner()

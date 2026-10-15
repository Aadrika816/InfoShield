"""
InfoShield Backend Application Entry Point
Flask REST API server supporting MySQL and direct static serving for the frontend.
"""
import os
import logging
from pathlib import Path
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS

from config import config_by_name
from database import init_db, close_db
from routes.auth import auth_bp
from routes.verifier import verifier_bp
from routes.reports import reports_bp
from routes.schemes import schemes_bp
from routes.pib import pib_bp
from routes.bot import bot_bp
from routes.stats import stats_bp

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("infoshield.app")


def create_app(config_name: str = None) -> Flask:
    """
    Application factory pattern to configure and return the Flask application.
    """
    if not config_name:
        config_name = os.getenv("FLASK_ENV", "development").lower()

    app = Flask(__name__, static_folder=None)
    config_class = config_by_name.get(config_name, config_by_name["default"])
    app.config.from_object(config_class)

    # Enable CORS for all routes (allows seamless local and production frontend integration)
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Register Database teardown
    app.teardown_appcontext(close_db)

    # Register API Route Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(verifier_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(schemes_bp)
    app.register_blueprint(pib_bp)
    app.register_blueprint(bot_bp)
    app.register_blueprint(stats_bp)

    # Initialize Database Schema & Seed Data
    init_db(app)

    # Frontend Static File Serving Routes
    frontend_dir = app.config.get("FRONTEND_DIR", Path(__file__).resolve().parent.parent)

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        """Serve existing frontend HTML, CSS, JS, and Assets."""
        # Check if requesting an API endpoint that wasn't matched
        if path.startswith("api/"):
            return jsonify({"success": False, "error": f"API endpoint '/{path}' not found."}), 404

        target_file = Path(frontend_dir) / path
        if path and target_file.exists() and not target_file.is_dir():
            return send_from_directory(frontend_dir, path)

        # Default fallback: serve index.html
        return send_from_directory(frontend_dir, "index.html")

    # API Error Handlers
    @app.errorhandler(400)
    def bad_request(e):
        if request.path.startswith("/api/"):
            return jsonify({"success": False, "error": "Bad request", "details": str(e)}), 400
        return e

    @app.errorhandler(404)
    def not_found(e):
        if request.path.startswith("/api/"):
            return jsonify({"success": False, "error": f"Endpoint '{request.path}' not found"}), 404
        return send_from_directory(frontend_dir, "index.html")

    @app.errorhandler(405)
    def method_not_allowed(e):
        if request.path.startswith("/api/"):
            return jsonify({"success": False, "error": f"HTTP method '{request.method}' not allowed on this endpoint"}), 405
        return e

    @app.errorhandler(500)
    def internal_error(e):
        logger.error(f"Internal server error: {e}", exc_info=True)
        return jsonify({"success": False, "error": "Internal server error. Please try again later."}), 500

    logger.info(f"InfoShield application initialized under '{config_name}' environment.")
    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    logger.info(f"Starting InfoShield Flask Backend on http://127.0.0.1:{port} ...")
    app.run(host="0.0.0.0", port=port, debug=True)

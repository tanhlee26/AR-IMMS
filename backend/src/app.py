"""
AR-IMMS Backend API Application Entrypoint
"""
import os
from flask import Flask, jsonify
from core.config import FactoryConfig
from core.cors import init_cors
from api.middleware import register_middleware
from infrastructure.databases import init_db
from api.controllers.command_controller import command_api

def create_app(config_name: str = None) -> Flask:
    if config_name is None:
        config_name = os.environ.get("FLASK_ENV", "development")

    app = Flask(__name__)
    config_cls = FactoryConfig.get_config(config_name)
    app.config.from_object(config_cls)

    # Setup CORS & Middleware
    init_cors(app)
    register_middleware(app)
    init_db(app)
    app.register_blueprint(command_api)

    if app.config.get("DEBUG") or app.config.get("TESTING"):
        from core.seed import seed_demo_data
        with app.app_context():
            seed_demo_data()

    @app.route("/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "AR-IMMS Backend API",
            "version": "1.0.0"
        }), 200

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=app.config.get("DEBUG", True))


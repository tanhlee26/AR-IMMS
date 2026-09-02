"""
AR-IMMS Điểm khởi chạy Ứng dụng Backend API & WebSocket Server
"""
import os
from flask import Flask, jsonify
from core.config import FactoryConfig
from core.cors import init_cors
from core.websocket import init_websocket, socketio
from infrastructure.databases import init_db
from api.middleware import register_middleware
from api.controllers.telemetry_controller import telemetry_bp
from api.controllers.auth_controller import auth_bp
from api.controllers.alert_controller import alert_bp

def create_app(config_name: str = None) -> Flask:
    """Hàm Factory khởi tạo ứng dụng Flask với cấu hình môi trường."""
    if config_name is None:
        config_name = os.environ.get("FLASK_ENV", "development")

    app = Flask(__name__)
    config_cls = FactoryConfig.get_config(config_name)
    app.config.from_object(config_cls)

    # Thiết lập kết nối CORS, CSDL PostgreSQL, WebSocket Gateway & Middleware
    init_cors(app)
    init_db(app)
    init_websocket(app)
    register_middleware(app)

    # Đăng ký các Blueprint Controllers
    app.register_blueprint(telemetry_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(alert_bp)

    @app.route("/health", methods=["GET"])
    def health_check():
        """Endpoint kiểm tra trạng thái hoạt động của hệ thống (Health Check)."""
        return jsonify({
            "status": "healthy",
            "service": "AR-IMMS Backend API & WebSocket Gateway",
            "version": "1.0.0"
        }), 200

    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, host="0.0.0.0", port=port, debug=app.config.get("DEBUG", True), allow_unsafe_werkzeug=True)

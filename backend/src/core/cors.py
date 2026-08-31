"""
AR-IMMS Hạ tầng Core - Cấu hình Cross-Origin Resource Sharing (CORS)
"""
from flask_cors import CORS

def init_cors(app):
    """Khởi tạo và cho phép tất cả các nguồn (origins) truy cập API qua CORS."""
    CORS(app, resources={r"/*": {"origins": "*"}})
    return app
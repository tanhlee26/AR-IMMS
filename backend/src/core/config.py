"""
AR-IMMS Hạ tầng Core - Mô-đun Cấu hình Hệ thống (Environment Configuration)
"""
import os
from dotenv import load_dotenv

# Nạp biến môi trường từ tệp .env
load_dotenv()

class Config:
    """Lớp cấu hình cơ sở cho ứng dụng AR-IMMS Flask."""
    SECRET_KEY = os.environ.get("SECRET_KEY") or "ar_imms_super_secret_jwt_key_2026"
    DEBUG = os.environ.get("DEBUG", "True").lower() in ["true", "1"]
    TESTING = os.environ.get("TESTING", "False").lower() in ["true", "1"]
    
    # Cấu hình CSDL (Supabase PostgreSQL / SQLite fallback)
    DEFAULT_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "default.db")
    SQLALCHEMY_DATABASE_URI = (
        os.environ.get("DATABASE_URI")
        or os.environ.get("POSTGRES_DATABASE_URL")
        or f"sqlite:///{DEFAULT_DB_PATH}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Thông số cấu hình hệ thống AR-IMMS
    TELEMETRY_DEFAULT_INTERVAL_SECONDS = int(os.environ.get("TELEMETRY_INTERVAL", 5))
    TELEMETRY_STALE_TIMEOUT_SECONDS = int(os.environ.get("STALE_TIMEOUT", 90))
    CORS_HEADERS = "Content-Type"

class DevelopmentConfig(Config):
    """Cấu hình cho môi trường phát triển (Development)."""
    DEBUG = True

class TestingConfig(Config):
    """Cấu hình cho môi trường kiểm thử (Testing)."""
    TESTING = True
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///test.db"

class ProductionConfig(Config):
    """Cấu hình cho môi trường vận hành thực tế (Production)."""
    DEBUG = False

class FactoryConfig:
    """Factory hỗ trợ chọn lớp cấu hình theo tên môi trường."""
    @staticmethod
    def get_config(env: str):
        if env == "testing":
            return TestingConfig
        elif env == "production":
            return ProductionConfig
        return DevelopmentConfig
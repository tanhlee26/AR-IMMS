import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration for AR-IMMS Flask application."""
    SECRET_KEY = os.environ.get("SECRET_KEY") or "ar_imms_super_secret_jwt_key_2026"
    DEBUG = os.environ.get("DEBUG", "True").lower() in ["true", "1"]
    TESTING = os.environ.get("TESTING", "False").lower() in ["true", "1"]
    
    # Database configuration (Supabase PostgreSQL / DATABASE_URI / SQLite fallback)
    DEFAULT_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "default.db")
    SQLALCHEMY_DATABASE_URI = (
        os.environ.get("DATABASE_URI")
        or os.environ.get("POSTGRES_DATABASE_URL")
        or f"sqlite:///{DEFAULT_DB_PATH}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # AR-IMMS System Parameters
    TELEMETRY_DEFAULT_INTERVAL_SECONDS = int(os.environ.get("TELEMETRY_INTERVAL", 5))
    TELEMETRY_STALE_TIMEOUT_SECONDS = int(os.environ.get("STALE_TIMEOUT", 90))
    CORS_HEADERS = "Content-Type"

class DevelopmentConfig(Config):
    DEBUG = True

class TestingConfig(Config):
    TESTING = True

class ProductionConfig(Config):
    DEBUG = False

class FactoryConfig:
    @staticmethod
    def get_config(env: str):
        if env == "production":
            return ProductionConfig
        elif env == "testing":
            return TestingConfig
        return DevelopmentConfig
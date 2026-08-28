"""
AR-IMMS Database Initialization Module (Postgres / SQLite Fallback)
"""
import os
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def init_db(app):
    """
    Khởi tạo SQLAlchemy với app context.
    Ưu tiên sử dụng PostgreSQL (Supabase / Postgres Server).
    Tự động fallback về SQLite local nếu không có mạng hoặc Postgres bị ngắt kết nối.
    """
    db_uri = app.config.get("SQLALCHEMY_DATABASE_URI")
    if not db_uri:
        db_uri = "sqlite:///default.db"
        app.config["SQLALCHEMY_DATABASE_URI"] = db_uri
        
    app.config.setdefault("SQLALCHEMY_TRACK_MODIFICATIONS", False)
    db.init_app(app)
    
    import infrastructure.models
    
    with app.app_context():
        try:
            db.create_all()
        except Exception as e:
            print(f"[Database Notice] PostgreSQL unreachable ({e}). Switching to SQLite local default.db...")
            app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///default.db"
            db.engine.dispose()
            # Re-bind engine for SQLite
            from sqlalchemy import create_engine
            sqlite_engine = create_engine("sqlite:///default.db")
            db.metadata.create_all(bind=sqlite_engine)
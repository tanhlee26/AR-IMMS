from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def init_db(app):
    """
    Khởi tạo SQLAlchemy với app context.
    Ưu tiên sử dụng SQLALCHEMY_DATABASE_URI đã cấu hình trong app.config (Supabase PostgreSQL).
    Chỉ dùng SQLite local nếu ứng dụng hoàn toàn không khai báo Database URI.
    """
    if not app.config.get("SQLALCHEMY_DATABASE_URI"):
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///default.db"
        
    app.config.setdefault("SQLALCHEMY_TRACK_MODIFICATIONS", False)
    db.init_app(app)
    
    import infrastructure.models
    
    with app.app_context():
        db.create_all()
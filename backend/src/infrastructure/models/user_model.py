"""
AR-IMMS Tầng Hạ tầng Model - Mô hình CSDL SQLAlchemy cho Người dùng & Vai trò RBAC
"""
from datetime import datetime
from infrastructure.databases import db

class RoleModel(db.Model):
    """Bảng lưu trữ thông tin các Vai trò Phân quyền RBAC (ADMINISTRATOR, SYSTEM_OPERATOR, FIELD_TECHNICIAN)."""
    __tablename__ = 'roles'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    permissions_json = db.Column(db.Text, nullable=True)
    description = db.Column(db.String(255), nullable=True)

    users = db.relationship('UserModel', backref='role', lazy=True)

class UserModel(db.Model):
    """Bảng lưu trữ thông tin Tài khoản Người dùng hệ thống."""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    notifications = db.relationship('NotificationModel', backref='user', cascade='all, delete-orphan', lazy=True)
    created_tickets = db.relationship('TicketModel', foreign_keys='TicketModel.created_by_user_id', backref='created_by_user', lazy=True)
    assigned_tickets = db.relationship('TicketModel', foreign_keys='TicketModel.assigned_to_user_id', backref='assigned_to_user', lazy=True)

class NotificationModel(db.Model):
    """Bảng lưu trữ các Thông báo gửi tới Người dùng."""
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), default='SYSTEM', nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

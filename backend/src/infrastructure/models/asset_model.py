"""
AR-IMMS Tầng Hạ tầng Model - Mô hình CSDL SQLAlchemy cho Quản lý Tài sản Máy chủ & Thông tin Bảo hành
"""
from datetime import datetime
from infrastructure.databases import db

class WarrantyInfoModel(db.Model):
    """Bảng lưu trữ Thông tin Bảo hành và Nhà cung cấp của Máy chủ Server."""
    __tablename__ = 'warranty_info'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    node_id = db.Column(db.Integer, db.ForeignKey('nodes.id'), nullable=False, unique=True)
    vendor = db.Column(db.String(100), nullable=False)
    model_number = db.Column(db.String(100), nullable=False)
    serial_number = db.Column(db.String(100), nullable=False)
    purchase_date = db.Column(db.DateTime, nullable=True)
    warranty_start = db.Column(db.DateTime, nullable=True)
    warranty_end = db.Column(db.DateTime, nullable=True)
    support_contact = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class AssetSpecModel(db.Model):
    """Bảng lưu trữ Thông số Cấu hình Phần cứng Chi tiết của Máy chủ (Asset Specifications)."""
    __tablename__ = 'asset_specs'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    node_id = db.Column(db.Integer, db.ForeignKey('nodes.id'), nullable=False, unique=True)
    cpu_model = db.Column(db.String(100), nullable=False)
    cpu_cores = db.Column(db.Integer, nullable=False)
    total_ram_gb = db.Column(db.Float, nullable=False)
    total_storage_gb = db.Column(db.Float, nullable=False)
    os_name = db.Column(db.String(100), nullable=False)
    os_version = db.Column(db.String(50), nullable=False)
    network_interfaces_json = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class MaintenanceHistoryModel(db.Model):
    """Bảng lưu trữ Lịch sử Bảo trì / Sửa chữa Thiết bị."""
    __tablename__ = 'maintenance_histories'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    node_id = db.Column(db.Integer, db.ForeignKey('nodes.id'), nullable=False)
    ticket_id = db.Column(db.Integer, db.ForeignKey('tickets.id'), nullable=True)
    maintenance_type = db.Column(db.String(50), default='PREVENTIVE', nullable=False)
    description = db.Column(db.Text, nullable=False)
    performed_by_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    performed_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    resolution_notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

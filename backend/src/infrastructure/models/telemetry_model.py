"""
AR-IMMS Tầng Hạ tầng Model - Mô hình CSDL SQLAlchemy cho Telemetry Metrics, Ngưỡng & Cảnh báo (Alerts)
"""
from datetime import datetime
from infrastructure.databases import db

class TelemetryMetricModel(db.Model):
    """Bảng lưu trữ dữ liệu Chuỗi thời gian (Time-series) các chỉ số đo đạc phần cứng."""
    __tablename__ = 'telemetry_metrics'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    node_id = db.Column(db.Integer, db.ForeignKey('nodes.id'), nullable=False, index=True)
    metric_type = db.Column(db.String(50), nullable=False, index=True)
    value = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)

class AlertThresholdModel(db.Model):
    """Bảng lưu trữ Cấu hình Ngưỡng Cảnh báo Warning / Critical cho các chỉ số phần cứng."""
    __tablename__ = 'alert_thresholds'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    metric_type = db.Column(db.String(50), unique=True, nullable=False)
    warning_threshold = db.Column(db.Float, nullable=False)
    critical_threshold = db.Column(db.Float, nullable=False)
    duration_seconds = db.Column(db.Integer, default=30, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_by_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class AlertModel(db.Model):
    """Bảng lưu trữ danh sách Cảnh báo bất thường (Alerts) phát sinh từ các máy chủ."""
    __tablename__ = 'alerts'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    node_id = db.Column(db.Integer, db.ForeignKey('nodes.id'), nullable=False, index=True)
    threshold_id = db.Column(db.Integer, db.ForeignKey('alert_thresholds.id'), nullable=True)
    alert_type = db.Column(db.String(50), nullable=False)
    severity = db.Column(db.String(20), default='WARNING', nullable=False)
    status = db.Column(db.String(20), default='OPEN', nullable=False, index=True)
    message = db.Column(db.Text, nullable=False)
    metric_value = db.Column(db.Float, default=0.0, nullable=False)
    triggered_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    acknowledged_at = db.Column(db.DateTime, nullable=True)
    resolved_at = db.Column(db.DateTime, nullable=True)
    acknowledged_by_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    resolved_by_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

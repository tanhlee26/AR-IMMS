"""
AR-IMMS Tầng Hạ tầng Model - Mô hình CSDL SQLAlchemy cho Phiếu Bảo trì Sự cố (Tickets, Notes, Closure Requests)
"""
from datetime import datetime
from infrastructure.databases import db

class TicketModel(db.Model):
    """Bảng lưu trữ thông tin các Phiếu công việc Bảo trì Sự cố (Tickets)."""
    __tablename__ = 'tickets'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    alert_id = db.Column(db.Integer, db.ForeignKey('alerts.id'), nullable=True)
    node_id = db.Column(db.Integer, db.ForeignKey('nodes.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    priority = db.Column(db.String(20), default='MEDIUM', nullable=False)
    status = db.Column(db.String(20), default='OPEN', nullable=False)
    assigned_to_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_by_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    notes = db.relationship('TicketNoteModel', backref='ticket', cascade='all, delete-orphan', lazy=True)
    closure_request = db.relationship('TicketClosureRequestModel', backref='ticket', uselist=False, cascade='all, delete-orphan', lazy=True)

class TicketNoteModel(db.Model):
    """Bảng lưu trữ Ghi chú diễn biến xử lý sự cố của Kỹ thuật viên."""
    __tablename__ = 'ticket_notes'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('tickets.id'), nullable=False)
    author_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    note_text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

class TicketClosureRequestModel(db.Model):
    """Bảng lưu trữ Yêu cầu Nghiệm thu Đóng Ticket gửi Vận hành viên phê duyệt."""
    __tablename__ = 'ticket_closure_requests'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('tickets.id'), nullable=False, unique=True)
    requested_by_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    summary = db.Column(db.String(255), nullable=False)
    resolution_details = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='PENDING', nullable=False)
    reviewed_by_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

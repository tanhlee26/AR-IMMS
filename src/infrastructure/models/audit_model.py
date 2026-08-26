from datetime import datetime
from infrastructure.databases import db

class AuditLogModel(db.Model):
    __tablename__ = 'audit_logs'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    username = db.Column(db.String(50), nullable=True)
    action = db.Column(db.String(100), nullable=False)
    target_entity = db.Column(db.String(100), nullable=False)
    target_id = db.Column(db.String(50), nullable=True)
    details_json = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(50), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)

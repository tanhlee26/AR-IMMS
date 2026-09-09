# seed_full_demo.py
import os
import sys
import json
from datetime import datetime, timezone, timedelta
from werkzeug.security import generate_password_hash

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from app import create_app
from infrastructure.databases import db
from infrastructure.models.user_model import RoleModel, UserModel
from infrastructure.models.hierarchy_model import SiteModel, RoomModel, RackModel, NodeModel
from infrastructure.models.telemetry_model import AlertThresholdModel, AlertModel, TelemetryMetricModel
from infrastructure.models.ticket_model import TicketModel, TicketNoteModel, TicketClosureRequestModel
from infrastructure.models.audit_model import AuditLogModel

def run_seed():
    app = create_app()
    with app.app_context():
        print("[1/6] Khoi tao bang CSDL...")
        db.create_all()

        print("[2/6] Nap danh sach vai tro RBAC...")
        roles_spec = [
            {"id": 1, "name": "ADMINISTRATOR", "description": "Quan tri vien toan quyen he thong", "permissions": ["all", "user:manage", "site:manage", "threshold:manage", "ticket:approve"]},
            {"id": 2, "name": "SYSTEM_OPERATOR", "description": "Van hanh vien truc ca Web Command Center", "permissions": ["telemetry:read", "alert:ack", "ticket:create", "ticket:assign", "ticket:approve"]},
            {"id": 3, "name": "FIELD_TECHNICIAN", "description": "Ky thuat vien hien truong thao tac AR Mobile", "permissions": ["ar:scan", "ticket:view_assigned", "ticket:update", "ticket:request_closure"]}
        ]
        for r in roles_spec:
            existing_r = RoleModel.query.filter_by(name=r["name"]).first()
            if not existing_r:
                new_r = RoleModel(id=r["id"], name=r["name"], description=r["description"], permissions_json=json.dumps(r["permissions"]))
                db.session.add(new_r)
        db.session.commit()

        print("[3/6] Nap danh sach nguoi dung mau (admin, operator, technician)...")
        users_spec = [
            {"id": 1, "username": "admin", "email": "admin@ar-imms.vn", "password": "adminpassword2026", "full_name": "Nguyen Van Admin", "role_name": "ADMINISTRATOR"},
            {"id": 2, "username": "operator", "email": "operator@ar-imms.vn", "password": "operatorpassword2026", "full_name": "Nguyen Van Van Hanh", "role_name": "SYSTEM_OPERATOR"},
            {"id": 3, "username": "technician", "email": "tech@ar-imms.vn", "password": "techpassword2026", "full_name": "Le Van Technician", "role_name": "FIELD_TECHNICIAN"}
        ]
        for u in users_spec:
            existing_u = UserModel.query.filter_by(username=u["username"]).first()
            role = RoleModel.query.filter_by(name=u["role_name"]).first()
            if not existing_u:
                new_u = UserModel(id=u["id"], username=u["username"], email=u["email"], password_hash=generate_password_hash(u["password"]), full_name=u["full_name"], role_id=role.id, is_active=True)
                db.session.add(new_u)
        db.session.commit()

        print("[4/6] Khoi tao cau truc Cay Phan Cap Digital Twin 4 Nodes...")
        site1 = SiteModel.query.filter_by(code="DC-HN-01").first()
        if not site1:
            site1 = SiteModel(name="Trung Tam Du Lieu Hoa Lac", code="DC-HN-01", location="Khu CNC Hoa Lac, Ha Noi", description="Trung tam du lieu chinh DC-HN-01")
            db.session.add(site1)
            db.session.commit()

        room1 = RoomModel.query.filter_by(code="ROOM-A01").first()
        if not room1:
            room1 = RoomModel(site_id=site1.id, name="Phong May Chu A01", code="ROOM-A01", floor="Tang 2", description="Phong may chu A01")
            db.session.add(room1)
            db.session.commit()

        rack1 = RackModel.query.filter_by(code="RACK-A01").first()
        if not rack1:
            rack1 = RackModel(room_id=room1.id, name="Tu Rack Server A01", code="RACK-A01", unit_capacity=42, total_power_capacity_watts=10000.0)
            db.session.add(rack1)
            db.session.commit()

        rack2 = RackModel.query.filter_by(code="RACK-A02").first()
        if not rack2:
            rack2 = RackModel(room_id=room1.id, name="Tu Rack Server A02", code="RACK-A02", unit_capacity=42, total_power_capacity_watts=10000.0)
            db.session.add(rack2)
            db.session.commit()

        nodes_spec = [
            {"id": 1, "hostname": "srv-alpha-01", "name": "Server Alpha 01 - DB Master", "rack_id": rack1.id, "ip_address": "192.168.10.11", "mac_address": "00:1A:2B:3C:4D:01", "rack_position_u": 1, "status": "ONLINE", "power_consumption_watts": 280.0},
            {"id": 2, "hostname": "srv-beta-01", "name": "Server Beta 01 - AI Inference", "rack_id": rack1.id, "ip_address": "192.168.10.12", "mac_address": "00:1A:2B:3C:4D:02", "rack_position_u": 2, "status": "ONLINE", "power_consumption_watts": 350.0},
            {"id": 3, "hostname": "srv-alpha-03", "name": "Server Alpha 03 - API Gateway", "rack_id": rack2.id, "ip_address": "192.168.10.13", "mac_address": "00:1A:2B:3C:4D:03", "rack_position_u": 1, "status": "ONLINE", "power_consumption_watts": 240.0},
            {"id": 4, "hostname": "srv-delta-04", "name": "Server Delta 04 - Worker Node", "rack_id": rack2.id, "ip_address": "192.168.10.14", "mac_address": "00:1A:2B:3C:4D:04", "rack_position_u": 2, "status": "ONLINE", "power_consumption_watts": 210.0}
        ]
        for n in nodes_spec:
            existing_n = NodeModel.query.filter_by(id=n["id"]).first()
            if not existing_n:
                new_n = NodeModel(id=n["id"], rack_id=n["rack_id"], name=n["name"], hostname=n["hostname"], ip_address=n["ip_address"], mac_address=n["mac_address"], rack_position_u=n["rack_position_u"], status=n["status"], power_consumption_watts=n["power_consumption_watts"])
                db.session.add(new_n)
        db.session.commit()

        print("[5/6] Thiet lap Nguong canh bao & Ban ghi Alert mau...")
        thresholds_spec = [
            {"metric_type": "cpu_usage_percent", "warning_threshold": 80.0, "critical_threshold": 90.0, "duration_seconds": 60},
            {"metric_type": "memory_usage_percent", "warning_threshold": 85.0, "critical_threshold": 92.0, "duration_seconds": 60},
            {"metric_type": "temperature_celsius", "warning_threshold": 65.0, "critical_threshold": 80.0, "duration_seconds": 30},
            {"metric_type": "disk_usage_percent", "warning_threshold": 85.0, "critical_threshold": 95.0, "duration_seconds": 120}
        ]
        for t in thresholds_spec:
            existing_t = AlertThresholdModel.query.filter_by(metric_type=t["metric_type"]).first()
            if not existing_t:
                new_t = AlertThresholdModel(metric_type=t["metric_type"], warning_threshold=t["warning_threshold"], critical_threshold=t["critical_threshold"], duration_seconds=t["duration_seconds"], is_active=True)
                db.session.add(new_t)
        db.session.commit()

        print("[6/6] Hoan tat!")
        print("\n=== HOÀN TẤT SEED DỮ LIỆU TOÀN DIỆN CHO AR-IMMS ===")

if __name__ == "__main__":
    run_seed()

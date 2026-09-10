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

        print("[6/7] Nap danh sach Ma AR Marker (QR Code & ArUco) cho 4 Nodes...")
        from infrastructure.models.hierarchy_model import MarkerModel
        markers_spec = [
            {"node_id": 1, "type": "QR", "code": "arimms://node/NODE-01", "coords": json.dumps({"x": 0.0, "y": 0.1, "z": -0.5})},
            {"node_id": 1, "type": "QR", "code": "NODE-01", "coords": json.dumps({"x": 0.0, "y": 0.1, "z": -0.5})},
            {"node_id": 1, "type": "ARUCO", "code": "1", "coords": json.dumps({"x": 0.0, "y": 0.1, "z": -0.5})},

            {"node_id": 2, "type": "QR", "code": "arimms://node/NODE-02", "coords": json.dumps({"x": 0.0, "y": 0.1, "z": -0.5})},
            {"node_id": 2, "type": "QR", "code": "NODE-02", "coords": json.dumps({"x": 0.0, "y": 0.1, "z": -0.5})},
            {"node_id": 2, "type": "ARUCO", "code": "2", "coords": json.dumps({"x": 0.0, "y": 0.1, "z": -0.5})},

            {"node_id": 3, "type": "QR", "code": "arimms://node/NODE-03", "coords": json.dumps({"x": 0.0, "y": 0.1, "z": -0.5})},
            {"node_id": 3, "type": "QR", "code": "NODE-03", "coords": json.dumps({"x": 0.0, "y": 0.1, "z": -0.5})},
            {"node_id": 3, "type": "ARUCO", "code": "3", "coords": json.dumps({"x": 0.0, "y": 0.1, "z": -0.5})},

            {"node_id": 4, "type": "QR", "code": "arimms://node/NODE-04", "coords": json.dumps({"x": 0.0, "y": 0.1, "z": -0.5})},
            {"node_id": 4, "type": "QR", "code": "NODE-04", "coords": json.dumps({"x": 0.0, "y": 0.1, "z": -0.5})},
            {"node_id": 4, "type": "ARUCO", "code": "4", "coords": json.dumps({"x": 0.0, "y": 0.1, "z": -0.5})},
        ]
        for m in markers_spec:
            existing_m = MarkerModel.query.filter_by(marker_code=m["code"]).first()
            if not existing_m:
                new_m = MarkerModel(node_id=m["node_id"], marker_type=m["type"], marker_code=m["code"], spatial_coordinates_json=m["coords"])
                db.session.add(new_m)
        db.session.commit()

        print("[7/7] Nap du lieu Telemetry khoi tao & Ticket mau cho Technician...")
        now = datetime.utcnow()
        # Seed metrics for all 4 nodes
        metrics_init = [
            (1, "cpu_usage_percent", 24.5, "%"), (1, "memory_usage_percent", 45.2, "%"), (1, "temperature_celsius", 52.0, "C"), (1, "disk_usage_percent", 61.0, "%"),
            (2, "cpu_usage_percent", 94.8, "%"), (2, "memory_usage_percent", 88.6, "%"), (2, "temperature_celsius", 81.5, "C"), (2, "disk_usage_percent", 68.0, "%"),
            (3, "cpu_usage_percent", 35.0, "%"), (3, "memory_usage_percent", 50.1, "%"), (3, "temperature_celsius", 55.0, "C"), (3, "disk_usage_percent", 58.0, "%"),
            (4, "cpu_usage_percent", 18.2, "%"), (4, "memory_usage_percent", 39.4, "%"), (4, "temperature_celsius", 49.0, "C"), (4, "disk_usage_percent", 45.0, "%"),
        ]
        for nid, mtype, val, unit in metrics_init:
            db.session.add(TelemetryMetricModel(node_id=nid, metric_type=mtype, value=val, unit=unit, timestamp=now))
        
        # Node 2 has critical CPU alert
        cpu_alert = AlertModel.query.filter_by(node_id=2, status="OPEN").first()
        if not cpu_alert:
            cpu_alert = AlertModel(
                node_id=2,
                threshold_id=1,
                alert_type="CPU_OVERLOAD",
                severity="CRITICAL",
                status="OPEN",
                message="Cảnh báo ĐỎ: CPU vượt ngưỡng giới hạn an toàn 94.8% (Ngưỡng Critical: 90%)",
                metric_value=94.8,
                triggered_at=now
            )
            db.session.add(cpu_alert)

        # Update Node 2 status to CRITICAL
        node2 = NodeModel.query.get(2)
        if node2:
            node2.status = "CRITICAL"

        # Seed Ticket assigned to technician (user_id=3)
        existing_ticket = TicketModel.query.filter_by(node_id=2, status="IN_PROGRESS").first()
        if not existing_ticket:
            demo_ticket = TicketModel(
                title="Khắc phục sự cố quá tải CPU srv-beta-01",
                description="Tiến trình stress test chiếm dụng toàn bộ tài nguyên CPU (>94%). Yêu cầu Kỹ thuật viên tới hiện trường sử dụng Mobile AR quét mã máy, thực hiện Step-up Verification tắt tiến trình rác và gửi Yêu cầu Nghiệm thu.",
                priority="CRITICAL",
                status="IN_PROGRESS",
                node_id=2,
                created_by_user_id=2,
                assigned_to_user_id=3,
                created_at=now - timedelta(minutes=15)
            )
            db.session.add(demo_ticket)
            db.session.flush()

            db.session.add(TicketNoteModel(
                ticket_id=demo_ticket.id,
                author_user_id=2,
                note_text="Đã phát hiện cảnh báo CPU > 90% trên Web Command Center. Đã phân công cho Technician Duy Khang tiếp nhận xử lý."
            ))

        db.session.commit()
        print("\n=== HOÀN TẤT SEED DỮ LIỆU TOÀN DIỆN CHO AR-IMMS ===")

if __name__ == "__main__":
    run_seed()

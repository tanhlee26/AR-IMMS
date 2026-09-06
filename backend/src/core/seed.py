"""Idempotent development seed for a runnable four-node command-center demo."""
from datetime import datetime, timedelta
import math
from werkzeug.security import generate_password_hash
from infrastructure.databases import db
from infrastructure.models import SiteModel, RoomModel, RackModel, NodeModel, TelemetryMetricModel, AlertModel, TicketModel, AuditLogModel, RoleModel, UserModel


def seed_demo_data():
    if SiteModel.query.first():
        return
    role = RoleModel(name="SYSTEM_OPERATOR", description="Command Center operator")
    db.session.add(role); db.session.flush()
    operator = UserModel(username="operator", email="operator@ar-imms.local", password_hash=generate_password_hash("operator123"), full_name="Nguyễn Hữu Minh", role_id=role.id)
    tech = UserModel(username="technician", email="tech@ar-imms.local", password_hash=generate_password_hash("tech123"), full_name="Trần Kỹ Thuật", role_id=role.id)
    db.session.add_all([operator, tech]); db.session.flush()
    site = SiteModel(name="DC Hồ Chí Minh", code="DC-HCM", location="TP. Hồ Chí Minh")
    db.session.add(site); db.session.flush()
    room = RoomModel(site_id=site.id, name="Phòng máy 01", code="HCM-R01", floor="Tầng 2")
    db.session.add(room); db.session.flush()
    racks = [RackModel(room_id=room.id, name="Rack A01", code="A01"), RackModel(room_id=room.id, name="Rack A02", code="A02")]
    db.session.add_all(racks); db.session.flush()
    specs = [("NODE-HCM-01", "10.10.1.11", "ONLINE", 34, 62, 42, 380), ("NODE-HCM-02", "10.10.1.12", "CRITICAL", 94, 78, 71, 512),
             ("NODE-HCM-03", "10.10.1.13", "ONLINE", 46, 51, 45, 404), ("NODE-HCM-04", "10.10.1.14", "OFFLINE", 0, 0, 0, 0)]
    nodes = []
    for i, (name, ip, status, cpu, ram, temp, power) in enumerate(specs):
        node = NodeModel(rack_id=racks[i // 2].id, name=name, hostname=name.lower(), ip_address=ip, status=status, rack_position_u=1 + (i % 2) * 4, power_consumption_watts=power, last_ping_at=datetime.utcnow() - (timedelta(minutes=8) if status == "OFFLINE" else timedelta(seconds=5)))
        db.session.add(node); db.session.flush(); nodes.append(node)
        for point in range(18):
            when = datetime.utcnow() - timedelta(minutes=(17 - point))
            for kind, base, unit in [("CPU_USAGE", cpu, "%"), ("RAM_USAGE", ram, "%"), ("TEMPERATURE", temp, "°C"), ("POWER_USAGE", power, "W"), ("DISK_USAGE", 58 + i * 4, "%")]:
                value = 0 if status == "OFFLINE" else max(0, base + math.sin(point / 2 + i) * (7 if kind == "CPU_USAGE" else 2))
                db.session.add(TelemetryMetricModel(node_id=node.id, metric_type=kind, value=round(value, 1), unit=unit, timestamp=when))
    alerts = [
      AlertModel(node_id=nodes[1].id, alert_type="CPU_USAGE", severity="CRITICAL", status="OPEN", message="CPU vượt ngưỡng 90% trong 2 phút", metric_value=94),
      AlertModel(node_id=nodes[3].id, alert_type="HEARTBEAT", severity="CRITICAL", status="ACKNOWLEDGED", message="Mất heartbeat quá 90 giây", metric_value=0, acknowledged_at=datetime.utcnow()-timedelta(minutes=6), acknowledged_by_user_id=operator.id),
      AlertModel(node_id=nodes[2].id, alert_type="TEMPERATURE", severity="WARNING", status="ACKNOWLEDGED", message="Nhiệt độ đầu vào tăng bất thường", metric_value=68),
    ]
    db.session.add_all(alerts); db.session.flush()
    db.session.add_all([
      TicketModel(alert_id=alerts[1].id, node_id=nodes[3].id, title="Kiểm tra kết nối NODE-HCM-04", description="Kiểm tra nguồn và kết nối mạng", priority="HIGH", status="IN_PROGRESS", assigned_to_user_id=tech.id, created_by_user_id=operator.id),
      TicketModel(alert_id=alerts[2].id, node_id=nodes[2].id, title="Kiểm tra luồng khí Rack A02", description="Đo nhiệt độ và kiểm tra điều hòa", priority="MEDIUM", status="OPEN", created_by_user_id=operator.id),
    ])
    db.session.add(AuditLogModel(user_id=operator.id, username="operator", action="SYSTEM_SEEDED", target_entity="system", target_id="AR-IMMS", details_json='{"nodes": 4}', ip_address="127.0.0.1"))
    db.session.commit()

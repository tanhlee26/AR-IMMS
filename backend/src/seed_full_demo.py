import os
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app import create_app
from infrastructure.databases import db
from infrastructure.models import (
    SiteModel, RoomModel, RackModel, NodeModel, ContainerModel, MarkerModel,
    TelemetryMetricModel, AlertModel, TicketModel, TicketNoteModel, TicketClosureRequestModel, UserModel
)

app = create_app()

with app.app_context():
    print("Bắt đầu khởi tạo dữ liệu mẫu cho hệ thống...")
    
    # Kiểm tra Site đã có chưa
    if SiteModel.query.count() == 0:
        # Site 1 & 2
        s1 = SiteModel(name="Trung Tâm Dữ Liệu Hòa Lạc (DC-HN-01)", code="DC-HN-01", location="Khu Công Nghệ Cao Hòa Lạc, Hà Nội", description="Trung tâm dữ liệu chính Tier III+")
        s2 = SiteModel(name="Trung Tâm Dữ Liệu Quang Trung (DC-HCM-01)", code="DC-HCM-01", location="CVPM Quang Trung, Q.12, TP.HCM", description="Trung tâm dữ liệu dự phòng thảm họa (DR Site)")
        db.session.add_all([s1, s2])
        db.session.commit()

        # Room
        r1 = RoomModel(site_id=s1.id, name="Phòng Máy Chủ A01", code="ROOM-A01", floor="Tầng 1", description="Phòng máy chủ hiệu năng cao")
        r2 = RoomModel(site_id=s1.id, name="Phòng Lưu Trữ SAN B01", code="ROOM-B01", floor="Tầng 2", description="Phòng tủ đĩa SAN và Backup")
        r3 = RoomModel(site_id=s2.id, name="Phòng Server Edge HCM", code="ROOM-HCM-01", floor="Tầng Trệt", description="Phòng máy chủ phân tán khu vực miền Nam")
        db.session.add_all([r1, r2, r3])
        db.session.commit()

        # Rack
        rack1 = RackModel(room_id=r1.id, name="Tủ Rack Server A01", code="RACK-A01", unit_capacity=42, total_power_capacity_watts=5000.0)
        rack2 = RackModel(room_id=r1.id, name="Tủ Rack Server A02", code="RACK-A02", unit_capacity=42, total_power_capacity_watts=6000.0)
        rack3 = RackModel(room_id=r2.id, name="Tủ Rack SAN Storage", code="RACK-SAN-01", unit_capacity=42, total_power_capacity_watts=4500.0)
        rack4 = RackModel(room_id=r3.id, name="Tủ Rack Edge HCM-01", code="RACK-HCM-01", unit_capacity=42, total_power_capacity_watts=4000.0)
        db.session.add_all([rack1, rack2, rack3, rack4])
        db.session.commit()

        # Nodes (Servers)
        n1 = NodeModel(rack_id=rack1.id, name="Server Alpha 01 - DB Master", hostname="srv-alpha-01", ip_address="192.168.10.11", mac_address="00:1A:2B:3C:4D:01", status="ONLINE", rack_position_u=1, power_consumption_watts=280.0)
        n2 = NodeModel(rack_id=rack1.id, name="Server Alpha 02 - Redis Cache", hostname="srv-alpha-02", ip_address="192.168.10.12", mac_address="00:1A:2B:3C:4D:02", status="ONLINE", rack_position_u=3, power_consumption_watts=190.0)
        n3 = NodeModel(rack_id=rack1.id, name="Server Alpha 03 - API Gateway", hostname="srv-alpha-03", ip_address="192.168.10.13", mac_address="00:1A:2B:3C:4D:03", status="WARNING", rack_position_u=5, power_consumption_watts=340.0)
        n4 = NodeModel(rack_id=rack2.id, name="Server Beta 01 - AI Inference", hostname="srv-beta-01", ip_address="192.168.10.21", mac_address="00:1A:2B:3C:4D:04", status="CRITICAL", rack_position_u=1, power_consumption_watts=580.0)
        n5 = NodeModel(rack_id=rack2.id, name="Server Beta 02 - Microservices", hostname="srv-beta-02", ip_address="192.168.10.22", mac_address="00:1A:2B:3C:4D:05", status="ONLINE", rack_position_u=4, power_consumption_watts=220.0)
        n6 = NodeModel(rack_id=rack3.id, name="Server Storage 01 - SAN Node", hostname="srv-san-01", ip_address="192.168.10.31", mac_address="00:1A:2B:3C:4D:06", status="ONLINE", rack_position_u=2, power_consumption_watts=310.0)
        n7 = NodeModel(rack_id=rack4.id, name="Server Edge HCM 01", hostname="srv-hcm-01", ip_address="10.20.1.11", mac_address="00:1A:2B:3C:4D:07", status="ONLINE", rack_position_u=1, power_consumption_watts=185.0)
        db.session.add_all([n1, n2, n3, n4, n5, n6, n7])
        db.session.commit()

        # Containers
        c1 = ContainerModel(node_id=n1.id, container_id="c_pg_master_99", name="postgresql-primary", image="postgres:15-alpine", status="RUNNING", cpu_usage_percent=24.5, memory_usage_mb=4096.0)
        c2 = ContainerModel(node_id=n1.id, container_id="c_pg_backup_01", name="pg-wal-archiver", image="wal-g:latest", status="RUNNING", cpu_usage_percent=3.1, memory_usage_mb=512.0)
        c3 = ContainerModel(node_id=n2.id, container_id="c_redis_sentinel", name="redis-cluster-cache", image="redis:7-alpine", status="RUNNING", cpu_usage_percent=8.2, memory_usage_mb=1024.0)
        c4 = ContainerModel(node_id=n3.id, container_id="c_kong_gw", name="kong-api-gateway", image="kong:3.4", status="RUNNING", cpu_usage_percent=88.4, memory_usage_mb=3200.0)
        c5 = ContainerModel(node_id=n4.id, container_id="c_triton_ai", name="triton-inference-server", image="nvcr.io/nvidia/tritonserver:23.08-py3", status="RUNNING", cpu_usage_percent=96.8, memory_usage_mb=16384.0)
        db.session.add_all([c1, c2, c3, c4, c5])

        # Markers
        m1 = MarkerModel(node_id=n1.id, marker_type="ARUCO", marker_code="ARUCO-4X4-11", spatial_coordinates_json='{"x": 0.0, "y": 0.45, "z": 0.8}')
        m2 = MarkerModel(node_id=n3.id, marker_type="ARUCO", marker_code="ARUCO-4X4-13", spatial_coordinates_json='{"x": 0.0, "y": 0.90, "z": 0.8}')
        m3 = MarkerModel(node_id=n4.id, marker_type="ARUCO", marker_code="ARUCO-4X4-21", spatial_coordinates_json='{"x": 0.6, "y": 0.45, "z": 0.8}')
        db.session.add_all([m1, m2, m3])
        db.session.commit()
        print("Đã seed Sites, Rooms, Racks, Nodes, Containers, Markers thành công!")

    # Lấy danh sách nodes và user
    nodes = NodeModel.query.all()
    tech_user = UserModel.query.filter_by(username="technician").first()
    admin_user = UserModel.query.filter_by(username="admin").first()
    op_user = UserModel.query.filter_by(username="operator").first()

    # Seed Telemetry Metrics (lịch sử chuỗi thời gian)
    if TelemetryMetricModel.query.count() == 0 and nodes:
        now = datetime.utcnow()
        metrics = []
        for n in nodes:
            base_cpu = 88.0 if n.status == "WARNING" else (96.0 if n.status == "CRITICAL" else 28.0)
            base_temp = 82.0 if n.status == "CRITICAL" else 42.0
            base_ram = 85.0 if n.status == "CRITICAL" else 45.0
            for i in range(20, -1, -1):
                t = now - timedelta(minutes=i * 3)
                metrics.append(TelemetryMetricModel(node_id=n.id, metric_type="cpu_usage_percent", value=min(100.0, base_cpu + (i % 5) - 2), unit="%", timestamp=t))
                metrics.append(TelemetryMetricModel(node_id=n.id, metric_type="memory_usage_percent", value=min(100.0, base_ram + (i % 3) - 1), unit="%", timestamp=t))
                metrics.append(TelemetryMetricModel(node_id=n.id, metric_type="temperature_celsius", value=min(100.0, base_temp + (i % 4) - 1.5), unit="°C", timestamp=t))
                metrics.append(TelemetryMetricModel(node_id=n.id, metric_type="power_consumption_watts", value=n.power_consumption_watts + (i % 6) * 3, unit="W", timestamp=t))
        db.session.add_all(metrics)
        db.session.commit()
        print(f"Đã seed {len(metrics)} bản ghi Telemetry Metrics thành công!")

    # Seed Alerts
    if AlertModel.query.count() == 0 and len(nodes) >= 4:
        a1 = AlertModel(node_id=nodes[3].id, alert_type="TEMPERATURE", severity="CRITICAL", status="OPEN", message="Nhiệt độ CPU vượt ngưỡng khẩn cấp (>80°C) tại Node Beta 01", metric_value=84.5, triggered_at=datetime.utcnow() - timedelta(minutes=25))
        a2 = AlertModel(node_id=nodes[2].id, alert_type="CPU_USAGE", severity="WARNING", status="OPEN", message="Mức tải CPU vượt ngưỡng cảnh báo (>85%) tại Server API Gateway", metric_value=88.4, triggered_at=datetime.utcnow() - timedelta(minutes=40))
        a3 = AlertModel(node_id=nodes[3].id, alert_type="MEMORY_USAGE", severity="CRITICAL", status="ACKNOWLEDGED", message="Sử dụng bộ nhớ RAM xấp xỉ cạn kiệt (>92%)", metric_value=94.2, triggered_at=datetime.utcnow() - timedelta(hours=2), acknowledged_at=datetime.utcnow() - timedelta(minutes=50), acknowledged_by_user_id=op_user.id if op_user else None)
        db.session.add_all([a1, a2, a3])
        db.session.commit()
        print("Đã seed Alerts thành công!")

    # Seed Tickets
    if TicketModel.query.count() == 0 and len(nodes) >= 4:
        now = datetime.utcnow()
        t1 = TicketModel(
            node_id=nodes[3].id,
            title="Khắc phục sự cố quá nhiệt Server Beta 01 (Chassis AI)",
            description="Nhiệt độ tăng liên tục lên 84.5°C, nghi ngờ nghẽn luồng gió tản nhiệt hoặc hỏng quạt gió U2 trong Rack A02.",
            priority="CRITICAL",
            status="OPEN",
            created_by_user_id=op_user.id if op_user else 1,
            created_at=now - timedelta(minutes=20)
        )
        t2 = TicketModel(
            node_id=nodes[2].id,
            title="Kiểm tra tắc nghẽn tiến trình Kong Gateway gây tràn CPU",
            description="Tải CPU duy trì >88% trong 15 phút, yêu cầu kỹ thuật viên kiểm tra log access và cân bằng tải.",
            priority="HIGH",
            status="IN_PROGRESS",
            created_by_user_id=op_user.id if op_user else 1,
            assigned_to_user_id=tech_user.id if tech_user else 3,
            created_at=now - timedelta(minutes=45)
        )
        t3 = TicketModel(
            node_id=nodes[5].id,
            title="Thay thế module quạt làm mát dự phòng Node Storage 01",
            description="Kỹ thuật viên đã kiểm tra và thay thế quạt hot-swap Fan-02 tại hiện trường, gửi yêu cầu nghiệm thu đóng ticket.",
            priority="MEDIUM",
            status="PENDING_CLOSURE",
            created_by_user_id=admin_user.id if admin_user else 1,
            assigned_to_user_id=tech_user.id if tech_user else 3,
            created_at=now - timedelta(hours=4)
        )
        t4 = TicketModel(
            node_id=nodes[0].id,
            title="Bảo dưỡng định kỳ và gắn nhãn QR Code AR",
            description="Đã gắn tem QR ArUco ID #11 lên mặt trước server và đo kiểm thông số cáp mạng LAN kép.",
            priority="LOW",
            status="CLOSED",
            created_by_user_id=admin_user.id if admin_user else 1,
            assigned_to_user_id=tech_user.id if tech_user else 3,
            created_at=now - timedelta(days=2)
        )
        db.session.add_all([t1, t2, t3, t4])
        db.session.commit()

        # Tạo Closure Request cho Ticket 3
        closure_req = TicketClosureRequestModel(
            ticket_id=t3.id,
            requested_by_user_id=tech_user.id if tech_user else 3,
            summary="Đã hoàn tất thay module quạt Hot-Swap Fan 02 tại mặt sau Server Storage 01",
            resolution_details="Đã tháo module quạt cũ bị rơ bạc đạn, lắp quạt Delta 12V chính hãng mới. Nhiệt độ ổ đĩa SAN hạ từ 54°C xuống 38°C ổn định. Hệ thống vận hành trơn tru.",
            status="PENDING",
            created_at=now - timedelta(minutes=15)
        )
        # Tạo ghi chú cho Ticket 2 và Ticket 3
        note1 = TicketNoteModel(ticket_id=t2.id, author_user_id=tech_user.id if tech_user else 3, note_text="Đang SSH vào server phân tích log Docker container kong-api-gateway.")
        note2 = TicketNoteModel(ticket_id=t3.id, author_user_id=tech_user.id if tech_user else 3, note_text="Đã nhận linh kiện quạt từ kho vật tư, bắt đầu thay thế nóng không cần tắt nguồn server.")
        db.session.add_all([closure_req, note1, note2])
        db.session.commit()
        print("Đã seed Tickets, Notes và Closure Request thành công!")

    print("=== HOÀN TẤT SEED DỮ LIỆU TOÀN DIỆN CHO AR-IMMS ===")

"""
AR-IMMS Tầng Nghiệp vụ Service - Dịch vụ Telemetry Dữ liệu Đo đạc
Trích xuất thông số thời gian thực theo Node ID, theo mã QR/ArUco Marker, tra cứu lịch sử đo đạc và tiếp nhận bản tin telemetry snapshot.
"""
from datetime import datetime
from typing import Dict, Any, List, Optional
from domain.exceptions import EntityNotFoundError, ValidationFailedError
from infrastructure.models import (
    NodeModel, MarkerModel, ContainerModel, AlertModel,
    TelemetryMetricModel, SiteModel, RoomModel, RackModel
)
from infrastructure.repositories.telemetry_repository import TelemetryRepository

class TelemetryService:
    def __init__(self):
        self.repository = TelemetryRepository()

    def get_realtime_telemetry_by_node_id(self, node_id: int) -> Dict[str, Any]:
        """
        Trích xuất toàn bộ dữ liệu đo đạc phần cứng thời gian thực cho máy chủ theo Node ID,
        bao gồm chỉ số đo đạc, vị trí trong cây Digital Twin, các alert đang bật và danh sách container workload.
        """
        node = NodeModel.query.get(node_id)
        if not node:
            raise EntityNotFoundError("Máy chủ Node", str(node_id))

        # Tra cứu tên phân cấp cấu trúc hạ tầng
        rack = RackModel.query.get(node.rack_id) if node.rack_id else None
        room = RoomModel.query.get(rack.room_id) if rack and rack.room_id else None
        site = SiteModel.query.get(room.site_id) if room and room.site_id else None

        rack_name = rack.name if rack else "Rack chưa phân công"
        room_name = room.name if room else "Phòng chưa phân công"
        site_name = site.name if site else "Trung tâm chưa phân công"

        # Trích xuất các chỉ số telemetry mới nhất
        latest_metrics = self.repository.get_latest_metrics_by_node(node_id)

        # Trích xuất danh sách cảnh báo đang bật
        active_alerts = self.repository.get_active_alerts_by_node(node_id)
        alerts_list = [
            {
                "id": alert.id,
                "alert_type": alert.alert_type,
                "severity": alert.severity,
                "status": alert.status,
                "message": alert.message,
                "metric_value": alert.metric_value,
                "triggered_at": alert.triggered_at.strftime("%Y-%m-%dT%H:%M:%SZ") if alert.triggered_at else None
            }
            for alert in active_alerts
        ]

        # Trích xuất danh sách Docker container đang chạy trên máy chủ
        containers = ContainerModel.query.filter_by(node_id=node_id).all()
        containers_list = [
            {
                "id": c.id,
                "container_id": c.container_id,
                "name": c.name,
                "image": c.image,
                "status": c.status,
                "cpu_usage_percent": c.cpu_usage_percent,
                "memory_usage_mb": c.memory_usage_mb
            }
            for c in containers
        ]

        # Tính toán trạng thái sức khỏe tổng thể của máy chủ
        health_status = node.status
        if alerts_list:
            has_critical = any(a["severity"] == "CRITICAL" for a in alerts_list)
            health_status = "CRITICAL" if has_critical else "WARNING"

        response_payload = {
            "node_id": node.id,
            "name": node.name,
            "hostname": node.hostname,
            "ip_address": node.ip_address,
            "mac_address": node.mac_address,
            "status": health_status,
            "rack_position_u": node.rack_position_u,
            "power_consumption_watts": node.power_consumption_watts,
            "hierarchy": {
                "site_name": site_name,
                "room_name": room_name,
                "rack_name": rack_name,
                "rack_position_u": node.rack_position_u
            },
            "metrics": latest_metrics,
            "active_alerts_count": len(alerts_list),
            "active_alerts": alerts_list,
            "containers_count": len(containers_list),
            "containers": containers_list
        }
        return response_payload

    def get_realtime_telemetry_by_marker_code(self, marker_code: str) -> Dict[str, Any]:
        """
        Trích xuất dữ liệu telemetry thời gian thực khi camera di động quét mã QR Code hoặc ArUco Marker.
        Phục vụ hiển thị thẻ AR Overlay ảo đè lên ống kính hiện trường.
        """
        marker = MarkerModel.query.filter_by(marker_code=marker_code).first()
        if not marker:
            raise EntityNotFoundError("Mã AR Marker", marker_code)

        telemetry_payload = self.get_realtime_telemetry_by_node_id(marker.node_id)
        
        # Đính kèm metadata tọa độ không gian 3D AR
        telemetry_payload["ar_marker"] = {
            "marker_id": marker.id,
            "marker_code": marker.marker_code,
            "marker_type": marker.marker_type,
            "spatial_coordinates_json": marker.spatial_coordinates_json
        }
        return telemetry_payload

    def record_telemetry_snapshot(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Tiếp nhận, kiểm tra dữ liệu và lưu bản tin telemetry snapshot từ Collector Agent."""
        node_id = payload.get("node_id")
        metrics = payload.get("metrics")
        
        if not node_id or not metrics:
            raise ValidationFailedError("Bản tin telemetry không hợp lệ: 'node_id' và 'metrics' là bắt buộc.")

        node = NodeModel.query.get(node_id)
        if not node:
            raise EntityNotFoundError("Máy chủ Node", str(node_id))

        # Cập nhật thời gian nhận tín hiệu heartbeat
        node.last_ping_at = datetime.utcnow()
        if node.status == "UNAVAILABLE":
            node.status = "ONLINE"

        # Lưu dữ liệu chỉ số đo đạc vào CSDL
        saved_metrics = self.repository.save_snapshot_metrics(node_id, metrics)

        # Xử lý danh sách Docker Container nếu có trong bản tin
        if "containers" in payload and isinstance(payload["containers"], list):
            for c_data in payload["containers"]:
                c_id = c_data.get("container_id")
                if c_id:
                    container = ContainerModel.query.filter_by(node_id=node_id, container_id=c_id).first()
                    if not container:
                        container = ContainerModel(
                            node_id=node_id,
                            container_id=c_id,
                            name=c_data.get("name", "unknown"),
                            image=c_data.get("image", "unknown"),
                            status=c_data.get("status", "RUNNING")
                        )
                        from infrastructure.databases import db
                        db.session.add(container)
                    else:
                        container.status = c_data.get("status", container.status)
                        container.updated_at = datetime.utcnow()
            from infrastructure.databases import db
            db.session.commit()

        # Phát truyền bản tin dữ liệu mới qua WebSocket Gateway tới Web Dashboard & Mobile AR
        try:
            from core.websocket import broadcast_telemetry_update
            full_telemetry = self.get_realtime_telemetry_by_node_id(node_id)
            broadcast_telemetry_update(full_telemetry)
        except Exception:
            # Dự phòng nếu dịch vụ WebSocket chưa sẵn sàng
            pass

        return {
            "node_id": node_id,
            "saved_metrics_count": len(saved_metrics),
            "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        }

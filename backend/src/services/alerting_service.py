"""
AR-IMMS Tầng Nghiệp vụ Service - Engine So sánh Ngưỡng & Thuật toán Khử trùng Bão Alert (Alert Engine)
Thực thi kiểm tra ngưỡng cảnh báo, khử trùng lặp dữ liệu bão alert (Debouncing), tự động phục hồi và phát tín hiệu báo động thời gian thực.
"""
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from domain.exceptions import EntityNotFoundError, ValidationFailedError
from infrastructure.models import NodeModel, AlertModel, AlertThresholdModel
from infrastructure.repositories.alert_repository import AlertRepository

class AlertingService:
    def __init__(self):
        self.repository = AlertRepository()
        self.repository.seed_default_thresholds()

    def evaluate_telemetry_snapshot(self, node_id: int, metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Engine Đánh giá Ngưỡng & Thuật toán Khử trùng Bão Alert (Alert Storm Deduplication / Debouncing Algorithm).
        Được gọi mỗi khi có dữ liệu đo đạc mới từ Collector Agent.
        """
        node = NodeModel.query.get(node_id)
        if not node:
            raise EntityNotFoundError("Máy chủ Node", str(node_id))

        evaluated_results = []
        monitored_metrics = ["cpu_usage_percent", "memory_usage_percent", "temperature_celsius", "disk_usage_percent"]

        for metric_type in monitored_metrics:
            if metric_type not in metrics or not isinstance(metrics[metric_type], (int, float)):
                continue

            current_val = float(metrics[metric_type])
            threshold = self.repository.get_threshold_by_metric(metric_type)
            if not threshold:
                continue

            # Xác định mức độ vi phạm ngưỡng
            severity = None
            if current_val >= threshold.critical_threshold:
                severity = "CRITICAL"
            elif current_val >= threshold.warning_threshold:
                severity = "WARNING"

            # Kiểm tra xem máy chủ đã có Alert đang mở (OPEN/ACKNOWLEDGED) cùng loại hay chưa
            active_alert = self.repository.get_active_alert_by_node_and_type(node_id, metric_type)

            if severity:
                # -------------------------------------------------------------
                # 1. TRƯỜNG HỢP VI PHẠM NGƯỠNG (KÍCH HOẠT / CẬP NHẬT CẢNH BÁO)
                # -------------------------------------------------------------
                metric_labels = {
                    "cpu_usage_percent": "CPU",
                    "memory_usage_percent": "Bộ nhớ RAM",
                    "temperature_celsius": "Nhiệt độ CPU",
                    "disk_usage_percent": "Dung lượng Đĩa cứng"
                }
                label = metric_labels.get(metric_type, metric_type)
                msg = f"Cảnh báo {severity}: {label} đạt {current_val}% (Ngưỡng {severity.lower()}: {threshold.critical_threshold if severity == 'CRITICAL' else threshold.warning_threshold}%)"

                if active_alert:
                    # KHỬ TRÙNG BÃO ALERT (DEDUPLICATION): Đã có Alert mở -> Cập nhật giá trị, không tạo tệp trùng lặp
                    self.repository.update_active_alert_value(
                        alert=active_alert,
                        new_value=current_val,
                        new_severity=severity,
                        new_message=msg
                    )
                    evaluated_results.append({
                        "action": "updated",
                        "alert_id": active_alert.id,
                        "severity": active_alert.severity,
                        "metric_type": metric_type,
                        "value": current_val
                    })
                else:
                    # Tạo cảnh báo mới (Single Alert Creation)
                    new_alert = self.repository.create_alert(
                        node_id=node_id,
                        alert_type=metric_type,
                        severity=severity,
                        message=msg,
                        metric_value=current_val,
                        threshold_id=threshold.id
                    )

                    # Cập nhật trạng thái máy chủ thành WARNING hoặc CRITICAL
                    if severity == "CRITICAL" or node.status != "CRITICAL":
                        node.status = severity
                        from infrastructure.databases import db
                        db.session.commit()

                    # Phát tín hiệu báo động thời gian thực qua WebSocket
                    self._broadcast_alert_to_websocket(new_alert, event_type="alert_triggered")

                    evaluated_results.append({
                        "action": "created",
                        "alert_id": new_alert.id,
                        "severity": new_alert.severity,
                        "metric_type": metric_type,
                        "value": current_val
                    })

            else:
                # -------------------------------------------------------------
                # 2. TRƯỜNG HỢP CHỈ SỐ TRỞ LẠI BÌNH THƯỜNG (TỰ ĐỘNG KHÔI PHỤC)
                # -------------------------------------------------------------
                if active_alert:
                    # Tự động giải tỏa (Auto-Resolve Alert) khi thông số hạ xuống dưới ngưỡng Warning
                    self.repository.resolve_alert(active_alert)
                    self._broadcast_alert_to_websocket(active_alert, event_type="alert_resolved")

                    # Kiểm tra lại các alert còn tồn tại để cập nhật màu sắc node
                    remaining_alerts = self.repository.get_all_active_alerts(node_id=node_id)
                    if not remaining_alerts:
                        node.status = "ONLINE"
                        from infrastructure.databases import db
                        db.session.commit()

                    evaluated_results.append({
                        "action": "resolved",
                        "alert_id": active_alert.id,
                        "metric_type": metric_type,
                        "value": current_val
                    })

        return evaluated_results

    def acknowledge_alert(self, alert_id: int, user_id: int) -> Dict[str, Any]:
        """Vận hành viên nhấn xác nhận đã tiếp nhận xử lý Alert (Acknowledge Alert)."""
        alert = self.repository.get_alert_by_id(alert_id)
        if not alert:
            raise EntityNotFoundError("Cảnh báo Alert", str(alert_id))

        self.repository.acknowledge_alert(alert, user_id)
        self._broadcast_alert_to_websocket(alert, event_type="alert_acknowledged")

        return {
            "id": alert.id,
            "status": alert.status,
            "acknowledged_at": alert.acknowledged_at.strftime("%Y-%m-%dT%H:%M:%SZ") if alert.acknowledged_at else None
        }

    def check_stale_node_heartbeats(self, stale_seconds: int = 90) -> List[Dict[str, Any]]:
        """
        Tiến trình ngầm kiểm tra mất kết nối Heartbeat của tất cả các máy chủ (>90 giây).
        Tự động chuyển trạng thái máy chủ sang UNAVAILABLE và kích hoạt Alert ngắt mạng.
        """
        cutoff_time = datetime.utcnow() - timedelta(seconds=stale_seconds)
        stale_nodes = NodeModel.query.filter(
            NodeModel.status != "UNAVAILABLE",
            (NodeModel.last_ping_at < cutoff_time) | (NodeModel.last_ping_at.is_(None))
        ).all()

        results = []
        for node in stale_nodes:
            node.status = "UNAVAILABLE"
            from infrastructure.databases import db
            db.session.commit()

            # Kiểm tra hoặc tạo Alert mất kết nối
            active_alert = self.repository.get_active_alert_by_node_and_type(node.id, "heartbeat_timeout")
            if not active_alert:
                alert = self.repository.create_alert(
                    node_id=node.id,
                    alert_type="heartbeat_timeout",
                    severity="CRITICAL",
                    message=f"Máy chủ {node.name} ({node.hostname}) bị mất kết nối mạng (Heartbeat Timeout >{stale_seconds}s).",
                    metric_value=0.0
                )
                self._broadcast_alert_to_websocket(alert, event_type="alert_triggered")
                results.append({"node_id": node.id, "alert_id": alert.id, "status": "UNAVAILABLE"})

        return results

    def _broadcast_alert_to_websocket(self, alert: AlertModel, event_type: str = "alert_triggered"):
        """Hàm trợ giúp phát truyền sự kiện cảnh báo qua WebSocket Gateway."""
        try:
            from core.websocket import broadcast_alert_event
            payload = {
                "event_type": event_type,
                "alert_id": alert.id,
                "node_id": alert.node_id,
                "alert_type": alert.alert_type,
                "severity": alert.severity,
                "status": alert.status,
                "message": alert.message,
                "metric_value": alert.metric_value,
                "triggered_at": alert.triggered_at.strftime("%Y-%m-%dT%H:%M:%SZ") if alert.triggered_at else None
            }
            broadcast_alert_event(payload)
        except Exception:
            pass


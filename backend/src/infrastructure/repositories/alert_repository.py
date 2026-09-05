"""
AR-IMMS Tầng Hạ tầng Repository - Kho lưu trữ Cảnh báo & Cấu hình Ngưỡng (Alert Repository)
Thực hiện các thao tác CSDL cho Alert, Alert Thresholds và Khử trùng lặp Alert.
"""
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from infrastructure.databases import db
from infrastructure.models import AlertModel, AlertThresholdModel, NodeModel

class AlertRepository:
    def get_alert_by_id(self, alert_id: int) -> Optional[AlertModel]:
        """Tra cứu cảnh báo theo ID."""
        return AlertModel.query.get(alert_id)

    def get_active_alert_by_node_and_type(self, node_id: int, alert_type: str) -> Optional[AlertModel]:
        """
        Tra cứu xem nút máy chủ đã có cảnh báo đang mở (OPEN hoặc ACKNOWLEDGED) cùng loại hay chưa.
        Phục vụ thuật toán Khử trùng bão Alert (Alert Storm Deduplication).
        """
        return (
            AlertModel.query
            .filter(
                AlertModel.node_id == node_id,
                AlertModel.alert_type == alert_type,
                AlertModel.status.in_(["OPEN", "ACKNOWLEDGED"])
            )
            .first()
        )

    def get_all_active_alerts(self, node_id: Optional[int] = None) -> List[AlertModel]:
        """Lấy danh sách tất cả các cảnh báo đang mở trong hệ thống."""
        query = AlertModel.query.filter(AlertModel.status.in_(["OPEN", "ACKNOWLEDGED"]))
        if node_id:
            query = query.filter(AlertModel.node_id == node_id)
        return query.order_by(AlertModel.triggered_at.desc()).all()

    def create_alert(
        self, node_id: int, alert_type: str, severity: str, message: str,
        metric_value: float, threshold_id: Optional[int] = None
    ) -> AlertModel:
        """Tạo mới một bản ghi cảnh báo bất thường trong CSDL."""
        alert = AlertModel(
            node_id=node_id,
            threshold_id=threshold_id,
            alert_type=alert_type,
            severity=severity,
            status="OPEN",
            message=message,
            metric_value=metric_value,
            triggered_at=datetime.utcnow()
        )
        db.session.add(alert)
        db.session.commit()
        return alert

    def update_active_alert_value(self, alert: AlertModel, new_value: float, new_severity: str, new_message: str):
        """
        Cập nhật giá trị đo đạc và nâng mức độ nghiêm trọng (nếu có) cho cảnh báo đang mở.
        Không tạo thêm bản ghi trùng lặp trong CSDL.
        """
        alert.metric_value = new_value
        if new_severity == "CRITICAL" and alert.severity == "WARNING":
            alert.severity = "CRITICAL"
            alert.message = new_message
        db.session.commit()

    def resolve_alert(self, alert: AlertModel, user_id: Optional[int] = None):
        """Đóng/Tự động giải tỏa cảnh báo khi chỉ số đo đạc trở lại bình thường."""
        alert.status = "RESOLVED"
        alert.resolved_at = datetime.utcnow()
        if user_id:
            alert.resolved_by_user_id = user_id
        db.session.commit()

    def acknowledge_alert(self, alert: AlertModel, user_id: int):
        """Vận hành viên xác nhận đã tiếp nhận cảnh báo (Acknowledge Alert)."""
        alert.status = "ACKNOWLEDGED"
        alert.acknowledged_at = datetime.utcnow()
        alert.acknowledged_by_user_id = user_id
        db.session.commit()

    def get_threshold_by_metric(self, metric_type: str) -> Optional[AlertThresholdModel]:
        """Lấy cấu hình ngưỡng cảnh báo cho chỉ số phần cứng chỉ định."""
        return AlertThresholdModel.query.filter_by(metric_type=metric_type, is_active=True).first()

    def seed_default_thresholds(self) -> List[AlertThresholdModel]:
        """Khởi tạo cấu hình ngưỡng cảnh báo mặc định nếu CSDL chưa có."""
        default_specs = [
            {
                "metric_type": "cpu_usage_percent",
                "warning_threshold": 80.0,
                "critical_threshold": 90.0,
                "duration_seconds": 10
            },
            {
                "metric_type": "memory_usage_percent",
                "warning_threshold": 85.0,
                "critical_threshold": 95.0,
                "duration_seconds": 15
            },
            {
                "metric_type": "temperature_celsius",
                "warning_threshold": 65.0,
                "critical_threshold": 75.0,
                "duration_seconds": 10
            },
            {
                "metric_type": "disk_usage_percent",
                "warning_threshold": 85.0,
                "critical_threshold": 95.0,
                "duration_seconds": 60
            }
        ]

        created = []
        for spec in default_specs:
            t = self.get_threshold_by_metric(spec["metric_type"])
            if not t:
                t = AlertThresholdModel(
                    metric_type=spec["metric_type"],
                    warning_threshold=spec["warning_threshold"],
                    critical_threshold=spec["critical_threshold"],
                    duration_seconds=spec["duration_seconds"],
                    is_active=True
                )
                db.session.add(t)
                created.append(t)
        db.session.commit()
        return created


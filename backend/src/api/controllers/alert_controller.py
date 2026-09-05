"""
AR-IMMS Tầng API Controller - Bộ điều khiển Quản lý Cảnh báo Alert & Ngưỡng
Các endpoint trích xuất danh sách Alert, xác nhận Alert và quản lý cấu hình ngưỡng cảnh báo.
"""
from flask import Blueprint, request, g
from core.container import container
from api.responses import success_response, error_response
from api.middleware import jwt_required, role_required

alert_bp = Blueprint("alert", __name__, url_prefix="/api/v1")

@alert_bp.route("/alerts", methods=["GET"])
def get_active_alerts():
    """
    [GET] /api/v1/alerts?node_id=1
    Trích xuất danh sách các cảnh báo (Alerts) đang hoạt động trong hệ thống.
    """
    node_id_arg = request.args.get("node_id")
    node_id = int(node_id_arg) if node_id_arg else None

    alerting_service = container.alerting_service()
    alerts = alerting_service.repository.get_all_active_alerts(node_id=node_id)

    data = [
        {
            "id": a.id,
            "node_id": a.node_id,
            "threshold_id": a.threshold_id,
            "alert_type": a.alert_type,
            "severity": a.severity,
            "status": a.status,
            "message": a.message,
            "metric_value": a.metric_value,
            "triggered_at": a.triggered_at.strftime("%Y-%m-%dT%H:%M:%SZ") if a.triggered_at else None,
            "acknowledged_at": a.acknowledged_at.strftime("%Y-%m-%dT%H:%M:%SZ") if a.acknowledged_at else None,
            "acknowledged_by_user_id": a.acknowledged_by_user_id
        }
        for a in alerts
    ]

    return success_response(data=data, message="Trích xuất danh sách cảnh báo đang mở thành công.")

@alert_bp.route("/alerts/<int:alert_id>/acknowledge", methods=["POST"])
@jwt_required
def acknowledge_alert(alert_id: int):
    """
    [POST] /api/v1/alerts/<alert_id>/acknowledge
    Vận hành viên (Operator) nhấn xác nhận tiếp nhận xử lý Cảnh báo (Acknowledge Alert).
    """
    user_id = g.current_user.id
    alerting_service = container.alerting_service()
    result = alerting_service.acknowledge_alert(alert_id, user_id)
    return success_response(data=result, message=f"Xác nhận tiếp nhận cảnh báo ID {alert_id} thành công.")

@alert_bp.route("/alert-thresholds", methods=["GET"])
def get_alert_thresholds():
    """
    [GET] /api/v1/alert-thresholds
    Trích xuất cấu hình các ngưỡng cảnh báo hiện tại (Warning/Critical).
    """
    alerting_service = container.alerting_service()
    metrics = ["cpu_usage_percent", "memory_usage_percent", "temperature_celsius", "disk_usage_percent"]
    thresholds = []

    for m in metrics:
        t = alerting_service.repository.get_threshold_by_metric(m)
        if t:
            thresholds.append({
                "id": t.id,
                "metric_type": t.metric_type,
                "warning_threshold": t.warning_threshold,
                "critical_threshold": t.critical_threshold,
                "duration_seconds": t.duration_seconds,
                "is_active": t.is_active
            })

    return success_response(data=thresholds, message="Trích xuất cấu hình ngưỡng cảnh báo thành công.")

@alert_bp.route("/alerts/check-heartbeats", methods=["POST"])
def trigger_stale_heartbeat_check():
    """
    [POST] /api/v1/alerts/check-heartbeats
    Kích hoạt tiến trình kiểm tra mất kết nối Heartbeat (>90s) cho tất cả các máy chủ.
    """
    alerting_service = container.alerting_service()
    stale_results = alerting_service.check_stale_node_heartbeats(stale_seconds=90)
    return success_response(data=stale_results, message="Hoàn tất kiểm tra mất kết nối máy chủ.")


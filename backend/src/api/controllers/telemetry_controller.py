"""
AR-IMMS Tầng API Controller - Bộ điều khiển Thu thập & Trích xuất Telemetry
Các endpoint trích xuất dữ liệu đo đạc thời gian thực theo Node ID, theo mã QR/ArUco Marker và tiếp nhận dữ liệu từ Agent.
"""
from flask import Blueprint, request, jsonify
from core.container import container
from api.responses import success_response, error_response
from api.middleware import jwt_required

telemetry_bp = Blueprint("telemetry", __name__, url_prefix="/api/v1")

@telemetry_bp.route("/nodes/<int:node_id>/telemetry/realtime", methods=["GET"])
@telemetry_bp.route("/telemetry/nodes/<int:node_id>/realtime", methods=["GET"])
def get_realtime_telemetry_by_node(node_id: int):
    """
    [GET] /api/v1/nodes/<node_id>/telemetry/realtime
    Trích xuất dữ liệu đo đạc phần cứng thời gian thực, các alert đang hoạt động, phân cấp Digital Twin và container workload theo Node ID.
    """
    telemetry_service = container.telemetry_service()
    data = telemetry_service.get_realtime_telemetry_by_node_id(node_id)
    return success_response(data=data, message=f"Trích xuất thông số thời gian thực thành công cho máy chủ ID {node_id}")

@telemetry_bp.route("/telemetry/markers/<string:marker_code>/realtime", methods=["GET"])
def get_realtime_telemetry_by_marker(marker_code: str):
    """
    [GET] /api/v1/telemetry/markers/<marker_code>/realtime
    Trích xuất dữ liệu telemetry thời gian thực phục vụ hiển thị thẻ AR Overlay khi quét mã QR Code hoặc ArUco Marker.
    Dùng cho ứng dụng Mobile AR Client hiển thị dữ liệu trực tiếp trên camera.
    """
    telemetry_service = container.telemetry_service()
    data = telemetry_service.get_realtime_telemetry_by_marker_code(marker_code)
    return success_response(data=data, message=f"Trích xuất dữ liệu AR telemetry thời gian thực thành công cho mã Marker '{marker_code}'")

@telemetry_bp.route("/telemetry", methods=["POST"])
def ingest_telemetry_snapshot():
    """
    [POST] /api/v1/telemetry
    Tiếp nhận bản tin dữ liệu telemetry snapshot được gửi từ Data Collector Agent.
    """
    payload = request.get_json()
    if not payload:
        return error_response(message="Thiếu dữ liệu JSON trong request body", code="BAD_REQUEST", status_code=400)

    telemetry_service = container.telemetry_service()
    result = telemetry_service.record_telemetry_snapshot(payload)
    return success_response(data=result, message="Tiếp nhận bản tin telemetry snapshot thành công", status_code=201)

@telemetry_bp.route("/nodes/<int:node_id>/telemetry/history", methods=["GET"])
def get_historical_telemetry(node_id: int):
    """
    [GET] /api/v1/nodes/<node_id>/telemetry/history?metric_type=cpu_usage_percent&hours=24
    Trích xuất dữ liệu chuỗi thời gian lịch sử đo đạc của máy chủ phục vụ vẽ đồ thị trên Web Command Center.
    """
    metric_type = request.args.get("metric_type", "cpu_usage_percent")
    hours = int(request.args.get("hours", 24))

    telemetry_service = container.telemetry_service()
    metrics = telemetry_service.repository.get_historical_metrics(node_id, metric_type, hours)
    
    data_points = [
        {
            "id": m.id,
            "metric_type": m.metric_type,
            "value": m.value,
            "unit": m.unit,
            "timestamp": m.timestamp.strftime("%Y-%m-%dT%H:%M:%SZ") if m.timestamp else None
        }
        for m in metrics
    ]

    return success_response(
        data={
            "node_id": node_id,
            "metric_type": metric_type,
            "hours": hours,
            "total_points": len(data_points),
            "data_points": data_points
        },
        message=f"Trích xuất chuỗi lịch sử telemetry thành công cho máy chủ ID {node_id}"
    )

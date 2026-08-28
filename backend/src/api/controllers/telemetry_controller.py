"""
AR-IMMS API Layer - Telemetry Controller
Endpoints for real-time telemetry extraction by Node ID, AR Marker Code, and Telemetry Ingestion.
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
    Extracts real-time hardware telemetry, active alerts, hierarchy context, and workloads for a Node ID.
    """
    telemetry_service = container.telemetry_service()
    data = telemetry_service.get_realtime_telemetry_by_node_id(node_id)
    return success_response(data=data, message=f"Real-time telemetry extracted for Node ID {node_id}")

@telemetry_bp.route("/telemetry/markers/<string:marker_code>/realtime", methods=["GET"])
def get_realtime_telemetry_by_marker(marker_code: str):
    """
    [GET] /api/v1/telemetry/markers/<marker_code>/realtime
    Extracts real-time AR telemetry snapshot by scanning a QR Code or ArUco Marker code.
    Used by Mobile AR Client for live camera overlay rendering.
    """
    telemetry_service = container.telemetry_service()
    data = telemetry_service.get_realtime_telemetry_by_marker_code(marker_code)
    return success_response(data=data, message=f"Real-time AR telemetry extracted for Marker '{marker_code}'")

@telemetry_bp.route("/telemetry", methods=["POST"])
def ingest_telemetry_snapshot():
    """
    [POST] /api/v1/telemetry
    Ingests telemetry snapshot payload from Data Collector Agent.
    """
    payload = request.get_json()
    if not payload:
        return error_response(message="Missing JSON request body", code="BAD_REQUEST", status_code=400)

    telemetry_service = container.telemetry_service()
    result = telemetry_service.record_telemetry_snapshot(payload)
    return success_response(data=result, message="Telemetry snapshot ingested successfully", status_code=201)

@telemetry_bp.route("/nodes/<int:node_id>/telemetry/history", methods=["GET"])
def get_historical_telemetry(node_id: int):
    """
    [GET] /api/v1/nodes/<node_id>/telemetry/history?metric_type=cpu_usage_percent&hours=24
    Retrieves historical time-series telemetry records for dashboard charts.
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
        message=f"Historical telemetry extracted for Node ID {node_id}"
    )


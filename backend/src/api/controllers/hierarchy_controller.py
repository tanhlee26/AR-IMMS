"""
AR-IMMS Tầng API Controller - Bộ điều khiển Phân cấp Cấu trúc Digital Twin
Các endpoint trích xuất Cây phân cấp (Site -> Room -> Rack -> Server/Node) và thống kê hạ tầng.
"""
from flask import Blueprint, jsonify, request
from infrastructure.models.hierarchy_model import (
    SiteModel, RoomModel, RackModel, NodeModel, ContainerModel, MarkerModel
)
from infrastructure.repositories.telemetry_repository import TelemetryRepository
from api.responses import success_response, error_response

hierarchy_bp = Blueprint("hierarchy", __name__, url_prefix="/api/v1/hierarchy")
telemetry_repo = TelemetryRepository()

@hierarchy_bp.route("/tree", methods=["GET"])
def get_digital_twin_tree():
    """
    [GET] /api/v1/hierarchy/tree
    Trích xuất toàn bộ cây phân cấp Digital Twin: Site -> Room -> Rack -> Server (Node)
    kèm thông số đo đạc thời gian thực, container workload và mã định danh AR Marker.
    """
    sites = SiteModel.query.all()
    tree = []

    status_map = {
        "ONLINE": "healthy",
        "WARNING": "warning",
        "CRITICAL": "critical",
        "UNAVAILABLE": "offline"
    }

    for site in sites:
        site_data = {
            "id": site.id,
            "type": "site",
            "name": site.name,
            "code": site.code,
            "location": site.location or "Chưa cập nhật",
            "description": site.description,
            "rooms": []
        }

        for room in site.rooms:
            room_data = {
                "id": room.id,
                "type": "room",
                "site_id": site.id,
                "name": room.name,
                "code": room.code,
                "floor": room.floor or "Tầng 1",
                "racks": []
            }

            for rack in room.racks:
                rack_data = {
                    "id": rack.id,
                    "type": "rack",
                    "room_id": room.id,
                    "name": rack.name,
                    "code": rack.code,
                    "unit_capacity": rack.unit_capacity,
                    "total_power_capacity_watts": rack.total_power_capacity_watts,
                    "nodes": []
                }

                for node in rack.nodes:
                    latest_metrics = telemetry_repo.get_latest_metrics_by_node(node.id)
                    cpu = latest_metrics.get("cpu_usage_percent", 0.0)
                    ram = latest_metrics.get("memory_usage_percent", 0.0)
                    temp = latest_metrics.get("temperature_celsius", 0.0)
                    disk = latest_metrics.get("disk_usage_percent", 0.0)

                    containers = [
                        {
                            "id": c.id,
                            "container_id": c.container_id,
                            "name": c.name,
                            "image": c.image,
                            "status": c.status,
                            "cpu_usage_percent": c.cpu_usage_percent,
                            "memory_usage_mb": c.memory_usage_mb
                        }
                        for c in node.containers
                    ]

                    markers = [
                        {
                            "id": m.id,
                            "marker_type": m.marker_type,
                            "marker_code": m.marker_code,
                            "spatial_coordinates": m.spatial_coordinates_json
                        }
                        for m in node.markers
                    ]

                    node_data = {
                        "id": node.id,
                        "type": "server",
                        "rack_id": rack.id,
                        "name": node.name,
                        "hostname": node.hostname,
                        "ip_address": node.ip_address,
                        "mac_address": node.mac_address,
                        "status": node.status,
                        "ui_status": status_map.get(node.status, "healthy"),
                        "rack_position_u": node.rack_position_u,
                        "power_consumption_watts": node.power_consumption_watts,
                        "last_ping_at": node.last_ping_at.strftime("%Y-%m-%d %H:%M:%S") if node.last_ping_at else None,
                        "telemetry": {
                            "cpu": cpu,
                            "ram": ram,
                            "temp": temp,
                            "disk": disk,
                            "power": node.power_consumption_watts
                        },
                        "containers": containers,
                        "markers": markers
                    }
                    rack_data["nodes"].append(node_data)

                room_data["racks"].append(rack_data)

            site_data["rooms"].append(room_data)

        tree.append(site_data)

    return success_response(data=tree, message="Trích xuất Cây phân cấp Digital Twin thành công.")

@hierarchy_bp.route("/sites", methods=["GET"])
def list_sites():
    """[GET] /api/v1/hierarchy/sites"""
    sites = SiteModel.query.all()
    data = [
        {
            "id": s.id,
            "name": s.name,
            "code": s.code,
            "location": s.location,
            "room_count": len(s.rooms)
        }
        for s in sites
    ]
    return success_response(data=data, message="Trích xuất danh sách Sites thành công.")

@hierarchy_bp.route("/nodes/<int:node_id>", methods=["GET"])
def get_node_detail(node_id: int):
    """[GET] /api/v1/hierarchy/nodes/<node_id>"""
    node = NodeModel.query.get(node_id)
    if not node:
        return error_response(message="Không tìm thấy máy chủ", code="NOT_FOUND", status_code=404)

    latest_metrics = telemetry_repo.get_latest_metrics_by_node(node.id)
    return success_response(
        data={
            "id": node.id,
            "name": node.name,
            "hostname": node.hostname,
            "ip_address": node.ip_address,
            "mac_address": node.mac_address,
            "status": node.status,
            "rack_id": node.rack_id,
            "rack_name": node.rack.name if node.rack else None,
            "room_name": node.rack.room.name if (node.rack and node.rack.room) else None,
            "site_name": node.rack.room.site.name if (node.rack and node.rack.room and node.rack.room.site) else None,
            "rack_position_u": node.rack_position_u,
            "power_consumption_watts": node.power_consumption_watts,
            "last_ping_at": node.last_ping_at.strftime("%Y-%m-%d %H:%M:%S") if node.last_ping_at else None,
            "telemetry": latest_metrics,
            "containers": [
                {
                    "id": c.id,
                    "name": c.name,
                    "image": c.image,
                    "status": c.status,
                    "cpu": c.cpu_usage_percent,
                    "ram": c.memory_usage_mb
                }
                for c in node.containers
            ],
            "markers": [
                {
                    "id": m.id,
                    "marker_code": m.marker_code,
                    "type": m.marker_type,
                    "coordinates": m.spatial_coordinates_json
                }
                for m in node.markers
            ]
        },
        message="Trích xuất thông tin chi tiết máy chủ thành công."
    )

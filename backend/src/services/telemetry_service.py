"""
AR-IMMS Business Logic Layer - Telemetry Service
Provides real-time telemetry extraction by Node ID or AR Marker Code, historical telemetry, and snapshot persistence.
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
        Extracts comprehensive real-time telemetry data for a specified Node ID,
        including hardware metrics, hierarchy context, active alerts, and container workloads.
        """
        node = NodeModel.query.get(node_id)
        if not node:
            raise EntityNotFoundError("Node", str(node_id))

        # Resolve hierarchy names
        rack = RackModel.query.get(node.rack_id) if node.rack_id else None
        room = RoomModel.query.get(rack.room_id) if rack and rack.room_id else None
        site = SiteModel.query.get(room.site_id) if room and room.site_id else None

        rack_name = rack.name if rack else "Unassigned Rack"
        room_name = room.name if room else "Unassigned Room"
        site_name = site.name if site else "Unassigned Site"

        # Fetch latest metrics
        latest_metrics = self.repository.get_latest_metrics_by_node(node_id)

        # Fetch active alerts
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

        # Fetch container workloads
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

        # Determine overall node health status
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
        Extracts real-time telemetry data by scanning an AR QR Code or ArUco Marker code.
        Designed for instant Mobile AR Client overlay rendering.
        """
        marker = MarkerModel.query.filter_by(marker_code=marker_code).first()
        if not marker:
            raise EntityNotFoundError("AR Marker Code", marker_code)

        telemetry_payload = self.get_realtime_telemetry_by_node_id(marker.node_id)
        
        # Attach marker AR context metadata
        telemetry_payload["ar_marker"] = {
            "marker_id": marker.id,
            "marker_code": marker.marker_code,
            "marker_type": marker.marker_type,
            "spatial_coordinates_json": marker.spatial_coordinates_json
        }
        return telemetry_payload

    def record_telemetry_snapshot(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Receives, validates, and stores a telemetry snapshot from a Collector Agent."""
        node_id = payload.get("node_id")
        metrics = payload.get("metrics")
        
        if not node_id or not metrics:
            raise ValidationFailedError("Invalid telemetry payload: 'node_id' and 'metrics' are required.")

        node = NodeModel.query.get(node_id)
        if not node:
            raise EntityNotFoundError("Node", str(node_id))

        # Update node ping time
        node.last_ping_at = datetime.utcnow()
        if node.status == "UNAVAILABLE":
            node.status = "ONLINE"

        # Save metrics
        saved_metrics = self.repository.save_snapshot_metrics(node_id, metrics)

        # Process Docker containers if present in payload
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

        return {
            "node_id": node_id,
            "saved_metrics_count": len(saved_metrics),
            "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        }


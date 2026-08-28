"""
AR-IMMS Infrastructure Layer - Telemetry Repository
Handles database persistence and queries for telemetry metrics, thresholds, and alerts.
"""
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from infrastructure.databases import db
from infrastructure.models import (
    TelemetryMetricModel, AlertThresholdModel, AlertModel,
    NodeModel, MarkerModel, ContainerModel
)

class TelemetryRepository:
    def create_metric(self, node_id: int, metric_type: str, value: float, unit: str, timestamp: datetime = None) -> TelemetryMetricModel:
        if timestamp is None:
            timestamp = datetime.utcnow()
        metric = TelemetryMetricModel(
            node_id=node_id,
            metric_type=metric_type,
            value=value,
            unit=unit,
            timestamp=timestamp
        )
        db.session.add(metric)
        db.session.commit()
        return metric

    def save_snapshot_metrics(self, node_id: int, metrics_data: Dict[str, Any], timestamp: datetime = None) -> List[TelemetryMetricModel]:
        """Saves a complete snapshot of telemetry metrics for a node."""
        if timestamp is None:
            timestamp = datetime.utcnow()

        created_metrics = []
        metric_units = {
            "cpu_usage_percent": "%",
            "memory_usage_percent": "%",
            "memory_used_gb": "GB",
            "disk_usage_percent": "%",
            "disk_used_gb": "GB",
            "temperature_celsius": "°C",
            "network_rx_kbps": "KB/s",
            "network_tx_kbps": "KB/s"
        }

        for metric_key, value in metrics_data.items():
            if metric_key in metric_units and isinstance(value, (int, float)):
                unit = metric_units[metric_key]
                metric = TelemetryMetricModel(
                    node_id=node_id,
                    metric_type=metric_key,
                    value=float(value),
                    unit=unit,
                    timestamp=timestamp
                )
                db.session.add(metric)
                created_metrics.append(metric)

        db.session.commit()
        return created_metrics

    def get_latest_metrics_by_node(self, node_id: int) -> Dict[str, Any]:
        """Retrieves the most recent telemetry metrics for a specific node."""
        metric_types = [
            "cpu_usage_percent", "memory_usage_percent", "memory_used_gb",
            "disk_usage_percent", "temperature_celsius",
            "network_rx_kbps", "network_tx_kbps"
        ]
        
        latest_data = {}
        last_updated_at = None

        for m_type in metric_types:
            record = (
                TelemetryMetricModel.query
                .filter_by(node_id=node_id, metric_type=m_type)
                .order_by(TelemetryMetricModel.timestamp.desc())
                .first()
            )
            if record:
                latest_data[m_type] = record.value
                if last_updated_at is None or record.timestamp > last_updated_at:
                    last_updated_at = record.timestamp
            else:
                # Default fallback values if no metric recorded yet
                defaults = {
                    "cpu_usage_percent": 0.0,
                    "memory_usage_percent": 0.0,
                    "memory_used_gb": 0.0,
                    "disk_usage_percent": 0.0,
                    "temperature_celsius": 45.0,
                    "network_rx_kbps": 0.0,
                    "network_tx_kbps": 0.0
                }
                latest_data[m_type] = defaults.get(m_type, 0.0)

        latest_data["last_updated_at"] = (
            last_updated_at.strftime("%Y-%m-%dT%H:%M:%SZ") if last_updated_at else datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        )
        return latest_data

    def get_historical_metrics(self, node_id: int, metric_type: str, hours: int = 24) -> List[TelemetryMetricModel]:
        """Queries time-series telemetry metrics for a node within the specified time window."""
        start_time = datetime.utcnow() - timedelta(hours=hours)
        return (
            TelemetryMetricModel.query
            .filter(
                TelemetryMetricModel.node_id == node_id,
                TelemetryMetricModel.metric_type == metric_type,
                TelemetryMetricModel.timestamp >= start_time
            )
            .order_by(TelemetryMetricModel.timestamp.asc())
            .all()
        )

    def get_active_alerts_by_node(self, node_id: int) -> List[AlertModel]:
        """Retrieves active (OPEN or ACKNOWLEDGED) alerts for a node."""
        return (
            AlertModel.query
            .filter(
                AlertModel.node_id == node_id,
                AlertModel.status.in_(["OPEN", "ACKNOWLEDGED"])
            )
            .order_by(AlertModel.triggered_at.desc())
            .all()
        )


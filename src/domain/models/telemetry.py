from dataclasses import dataclass
from typing import Optional
from datetime import datetime
from domain.constants import MetricType, AlertSeverity, AlertStatus

@dataclass
class TelemetryMetricDomain:
    id: int
    node_id: int
    metric_type: str
    value: float
    unit: str
    timestamp: datetime

@dataclass
class AlertThresholdDomain:
    id: int
    metric_type: str
    warning_threshold: float
    critical_threshold: float
    duration_seconds: int = 30
    is_active: bool = True
    created_by_user_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

@dataclass
class AlertDomain:
    id: int
    node_id: int
    threshold_id: Optional[int]
    alert_type: str
    severity: str = AlertSeverity.WARNING.value
    status: str = AlertStatus.OPEN.value
    message: str = ""
    metric_value: float = 0.0
    triggered_at: Optional[datetime] = None
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    acknowledged_by_user_id: Optional[int] = None
    resolved_by_user_id: Optional[int] = None
    node_name: Optional[str] = None
    rack_name: Optional[str] = None

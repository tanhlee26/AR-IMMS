from enum import Enum

class UserRole(str, Enum):
    ADMINISTRATOR = "ADMINISTRATOR"
    SYSTEM_OPERATOR = "SYSTEM_OPERATOR"
    TECHNICIAN = "TECHNICIAN"

class NodeStatus(str, Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"

class ContainerStatus(str, Enum):
    RUNNING = "RUNNING"
    STOPPED = "STOPPED"
    PAUSED = "PAUSED"
    CRASHED = "CRASHED"

class AgentStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    DISCONNECTED = "DISCONNECTED"

class AlertSeverity(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"

class AlertStatus(str, Enum):
    OPEN = "OPEN"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

class TicketPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"

class TicketStatus(str, Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

class ClosureRequestStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class MetricType(str, Enum):
    CPU_USAGE = "CPU_USAGE"            # %
    RAM_USAGE = "RAM_USAGE"            # %
    DISK_USAGE = "DISK_USAGE"          # %
    NETWORK_RX = "NETWORK_RX"          # KB/s
    NETWORK_TX = "NETWORK_TX"          # KB/s
    TEMPERATURE = "TEMPERATURE"        # Celsius
    POWER_USAGE = "POWER_USAGE"        # Watts

class MarkerType(str, Enum):
    QR = "QR"
    ARUCO = "ARUCO"

DEFAULT_TELEMETRY_INTERVAL_SECONDS = 5
DEFAULT_STALE_TIMEOUT_SECONDS = 90
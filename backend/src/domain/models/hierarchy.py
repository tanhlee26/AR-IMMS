from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime
from domain.constants import NodeStatus, ContainerStatus, AgentStatus, MarkerType

@dataclass
class SiteDomain:
    id: int
    name: str
    code: str
    location: Optional[str] = None
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    room_count: int = 0

@dataclass
class RoomDomain:
    id: int
    site_id: int
    name: str
    code: str
    floor: Optional[str] = None
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    site_name: Optional[str] = None
    rack_count: int = 0

@dataclass
class RackDomain:
    id: int
    room_id: int
    name: str
    code: str
    unit_capacity: int = 42
    total_power_capacity_watts: float = 5000.0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    room_name: Optional[str] = None
    node_count: int = 0

@dataclass
class ContainerDomain:
    id: int
    node_id: int
    container_id: str
    name: str
    image: str
    status: str = ContainerStatus.RUNNING.value
    cpu_usage_percent: float = 0.0
    memory_usage_mb: float = 0.0
    restarted_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

@dataclass
class MarkerDomain:
    id: int
    node_id: int
    marker_type: str = MarkerType.ARUCO.value
    marker_code: str = ""
    spatial_coordinates_json: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

@dataclass
class DataCollectorAgentDomain:
    id: int
    node_id: int
    agent_version: str
    status: str = AgentStatus.ACTIVE.value
    api_key_hash: Optional[str] = None
    last_heartbeat_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

@dataclass
class NodeDomain:
    id: int
    rack_id: int
    name: str
    hostname: str
    ip_address: str
    mac_address: Optional[str] = None
    status: str = NodeStatus.ONLINE.value
    rack_position_u: int = 1
    power_consumption_watts: float = 150.0
    last_ping_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    rack_name: Optional[str] = None
    containers: Optional[List[ContainerDomain]] = None
    markers: Optional[List[MarkerDomain]] = None
    agents: Optional[List[DataCollectorAgentDomain]] = None

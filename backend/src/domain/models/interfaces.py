from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from datetime import datetime

from domain.models.user import UserDomain, RoleDomain
from domain.models.hierarchy import SiteDomain, RoomDomain, RackDomain, NodeDomain, ContainerDomain, MarkerDomain, DataCollectorAgentDomain
from domain.models.telemetry import TelemetryMetricDomain, AlertThresholdDomain, AlertDomain
from domain.models.ticket import TicketDomain, TicketNoteDomain, TicketClosureRequestDomain
from domain.models.asset import AssetSpecDomain, WarrantyInfoDomain, MaintenanceHistoryDomain
from domain.models.audit import AuditLogDomain, NotificationDomain

class IUserRepository(ABC):
    @abstractmethod
    def get_by_id(self, user_id: int) -> Optional[UserDomain]: pass
    @abstractmethod
    def get_by_username(self, username: str) -> Optional[UserDomain]: pass
    @abstractmethod
    def get_by_email(self, email: str) -> Optional[UserDomain]: pass
    @abstractmethod
    def list_users(self) -> List[UserDomain]: pass
    @abstractmethod
    def create_user(self, user: UserDomain) -> UserDomain: pass
    @abstractmethod
    def update_user(self, user: UserDomain) -> UserDomain: pass
    @abstractmethod
    def get_roles(self) -> List[RoleDomain]: pass
    @abstractmethod
    def get_role_by_id(self, role_id: int) -> Optional[RoleDomain]: pass

class IHierarchyRepository(ABC):
    @abstractmethod
    def list_sites(self) -> List[SiteDomain]: pass
    @abstractmethod
    def get_site_by_id(self, site_id: int) -> Optional[SiteDomain]: pass
    @abstractmethod
    def create_site(self, site: SiteDomain) -> SiteDomain: pass

    @abstractmethod
    def list_rooms(self, site_id: Optional[int] = None) -> List[RoomDomain]: pass
    @abstractmethod
    def get_room_by_id(self, room_id: int) -> Optional[RoomDomain]: pass
    @abstractmethod
    def create_room(self, room: RoomDomain) -> RoomDomain: pass

    @abstractmethod
    def list_racks(self, room_id: Optional[int] = None) -> List[RackDomain]: pass
    @abstractmethod
    def get_rack_by_id(self, rack_id: int) -> Optional[RackDomain]: pass
    @abstractmethod
    def create_rack(self, rack: RackDomain) -> RackDomain: pass

    @abstractmethod
    def list_nodes(self, rack_id: Optional[int] = None, status: Optional[str] = None) -> List[NodeDomain]: pass
    @abstractmethod
    def get_node_by_id(self, node_id: int) -> Optional[NodeDomain]: pass
    @abstractmethod
    def create_node(self, node: NodeDomain) -> NodeDomain: pass
    @abstractmethod
    def update_node(self, node: NodeDomain) -> NodeDomain: pass

    @abstractmethod
    def list_containers(self, node_id: Optional[int] = None) -> List[ContainerDomain]: pass
    @abstractmethod
    def save_container(self, container: ContainerDomain) -> ContainerDomain: pass

    @abstractmethod
    def get_marker_by_code(self, marker_code: str) -> Optional[MarkerDomain]: pass
    @abstractmethod
    def get_marker_by_node_id(self, node_id: int) -> Optional[MarkerDomain]: pass
    @abstractmethod
    def create_or_update_marker(self, marker: MarkerDomain) -> MarkerDomain: pass

    @abstractmethod
    def get_agent_by_node_id(self, node_id: int) -> Optional[DataCollectorAgentDomain]: pass
    @abstractmethod
    def create_or_update_agent(self, agent: DataCollectorAgentDomain) -> DataCollectorAgentDomain: pass

class ITelemetryRepository(ABC):
    @abstractmethod
    def add_telemetry(self, metric: TelemetryMetricDomain) -> TelemetryMetricDomain: pass
    @abstractmethod
    def add_telemetry_batch(self, metrics: List[TelemetryMetricDomain]) -> None: pass
    @abstractmethod
    def get_latest_node_metrics(self, node_id: int) -> List[TelemetryMetricDomain]: pass
    @abstractmethod
    def query_metrics_history(self, node_id: int, metric_type: str, start_time: datetime, end_time: datetime) -> List[TelemetryMetricDomain]: pass

class IAlertRepository(ABC):
    @abstractmethod
    def list_thresholds(self) -> List[AlertThresholdDomain]: pass
    @abstractmethod
    def get_threshold_by_id(self, threshold_id: int) -> Optional[AlertThresholdDomain]: pass
    @abstractmethod
    def create_or_update_threshold(self, threshold: AlertThresholdDomain) -> AlertThresholdDomain: pass
    @abstractmethod
    def get_active_threshold_for_metric(self, metric_type: str) -> Optional[AlertThresholdDomain]: pass

    @abstractmethod
    def create_alert(self, alert: AlertDomain) -> AlertDomain: pass
    @abstractmethod
    def update_alert(self, alert: AlertDomain) -> AlertDomain: pass
    @abstractmethod
    def get_alert_by_id(self, alert_id: int) -> Optional[AlertDomain]: pass
    @abstractmethod
    def get_open_alert_for_node_metric(self, node_id: int, metric_type: str) -> Optional[AlertDomain]: pass
    @abstractmethod
    def list_alerts(self, node_id: Optional[int] = None, status: Optional[str] = None, severity: Optional[str] = None) -> List[AlertDomain]: pass

class ITicketRepository(ABC):
    @abstractmethod
    def create_ticket(self, ticket: TicketDomain) -> TicketDomain: pass
    @abstractmethod
    def update_ticket(self, ticket: TicketDomain) -> TicketDomain: pass
    @abstractmethod
    def get_ticket_by_id(self, ticket_id: int) -> Optional[TicketDomain]: pass
    @abstractmethod
    def list_tickets(self, status: Optional[str] = None, assigned_to_user_id: Optional[int] = None, node_id: Optional[int] = None) -> List[TicketDomain]: pass
    @abstractmethod
    def add_ticket_note(self, note: TicketNoteDomain) -> TicketNoteDomain: pass
    @abstractmethod
    def create_closure_request(self, req: TicketClosureRequestDomain) -> TicketClosureRequestDomain: pass
    @abstractmethod
    def update_closure_request(self, req: TicketClosureRequestDomain) -> TicketClosureRequestDomain: pass
    @abstractmethod
    def get_closure_request(self, request_id: int) -> Optional[TicketClosureRequestDomain]: pass

class IAssetRepository(ABC):
    @abstractmethod
    def get_asset_spec(self, node_id: int) -> Optional[AssetSpecDomain]: pass
    @abstractmethod
    def save_asset_spec(self, spec: AssetSpecDomain) -> AssetSpecDomain: pass
    @abstractmethod
    def get_warranty_info(self, node_id: int) -> Optional[WarrantyInfoDomain]: pass
    @abstractmethod
    def save_warranty_info(self, info: WarrantyInfoDomain) -> WarrantyInfoDomain: pass
    @abstractmethod
    def list_maintenance_history(self, node_id: Optional[int] = None) -> List[MaintenanceHistoryDomain]: pass
    @abstractmethod
    def add_maintenance_record(self, record: MaintenanceHistoryDomain) -> MaintenanceHistoryDomain: pass

class IAuditRepository(ABC):
    @abstractmethod
    def add_audit_log(self, log: AuditLogDomain) -> AuditLogDomain: pass
    @abstractmethod
    def list_audit_logs(self, limit: int = 100) -> List[AuditLogDomain]: pass
    @abstractmethod
    def create_notification(self, notif: NotificationDomain) -> NotificationDomain: pass
    @abstractmethod
    def list_notifications(self, user_id: int) -> List[NotificationDomain]: pass

"""
AR-IMMS Hạ tầng Core - Container Quản lý Phụ thuộc (Dependency Injection Container)
Quản lý tập trung Singleton và khởi tạo lười (lazy initialization) cho các lớp Service.
"""
from typing import Optional

class DependencyContainer:
    _instance: Optional['DependencyContainer'] = None

    def __init__(self):
        self._auth_service = None
        self._asset_service = None
        self._hierarchy_service = None
        self._telemetry_service = None
        self._alerting_service = None
        self._ticket_service = None
        self._reporting_service = None
        self._audit_service = None

    @classmethod
    def get_instance(cls) -> 'DependencyContainer':
        """Trả về duy nhất một thể hiện Singleton của Container."""
        if cls._instance is None:
            cls._instance = DependencyContainer()
        return cls._instance

    def auth_service(self):
        """Khởi tạo và trả về dịch vụ AuthService."""
        if not self._auth_service:
            from services.auth_service import AuthService
            self._auth_service = AuthService()
        return self._auth_service

    def hierarchy_service(self):
        """Khởi tạo và trả về dịch vụ HierarchyService."""
        if not self._hierarchy_service:
            from services.hierarchy_service import HierarchyService
            self._hierarchy_service = HierarchyService()
        return self._hierarchy_service

    def telemetry_service(self):
        """Khởi tạo và trả về dịch vụ TelemetryService."""
        if not self._telemetry_service:
            from services.telemetry_service import TelemetryService
            self._telemetry_service = TelemetryService()
        return self._telemetry_service

    def alerting_service(self):
        """Khởi tạo và trả về dịch vụ AlertingService."""
        if not self._alerting_service:
            from services.alerting_service import AlertingService
            self._alerting_service = AlertingService()
        return self._alerting_service

    def ticket_service(self):
        """Khởi tạo và trả về dịch vụ TicketService."""
        if not self._ticket_service:
            from services.ticket_service import TicketService
            self._ticket_service = TicketService()
        return self._ticket_service

    def asset_service(self):
        """Khởi tạo và trả về dịch vụ AssetService."""
        if not self._asset_service:
            from services.asset_service import AssetService
            self._asset_service = AssetService()
        return self._asset_service

    def reporting_service(self):
        """Khởi tạo và trả về dịch vụ ReportingService."""
        if not self._reporting_service:
            from services.reporting_service import ReportingService
            self._reporting_service = ReportingService()
        return self._reporting_service

    def audit_service(self):
        """Khởi tạo và trả về dịch vụ AuditService."""
        if not self._audit_service:
            from services.audit_service import AuditService
            self._audit_service = AuditService()
        return self._audit_service

# Thể hiện dùng chung cho toàn bộ ứng dụng
container = DependencyContainer.get_instance()

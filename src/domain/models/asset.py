from dataclasses import dataclass
from typing import Optional
from datetime import datetime

@dataclass
class WarrantyInfoDomain:
    id: int
    node_id: int
    vendor: str
    model_number: str
    serial_number: str
    purchase_date: Optional[datetime] = None
    warranty_start: Optional[datetime] = None
    warranty_end: Optional[datetime] = None
    support_contact: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

@dataclass
class AssetSpecDomain:
    id: int
    node_id: int
    cpu_model: str
    cpu_cores: int
    total_ram_gb: float
    total_storage_gb: float
    os_name: str
    os_version: str
    network_interfaces_json: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

@dataclass
class MaintenanceHistoryDomain:
    id: int
    node_id: int
    ticket_id: Optional[int] = None
    maintenance_type: str = "PREVENTIVE"
    description: str = ""
    performed_by_user_id: int = 0
    performed_by_name: Optional[str] = None
    performed_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    created_at: Optional[datetime] = None

from dataclasses import dataclass
from typing import Optional
from datetime import datetime

@dataclass
class AuditLogDomain:
    id: int
    user_id: Optional[int]
    username: Optional[str]
    action: str
    target_entity: str
    target_id: Optional[str]
    details_json: Optional[str]
    ip_address: Optional[str]
    timestamp: datetime

@dataclass
class NotificationDomain:
    id: int
    user_id: int
    title: str
    message: str
    type: str = "SYSTEM"
    is_read: bool = False
    created_at: Optional[datetime] = None

from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime
from domain.constants import TicketPriority, TicketStatus, ClosureRequestStatus

@dataclass
class TicketNoteDomain:
    id: int
    ticket_id: int
    author_user_id: int
    author_name: Optional[str] = None
    note_text: str = ""
    created_at: Optional[datetime] = None

@dataclass
class TicketClosureRequestDomain:
    id: int
    ticket_id: int
    requested_by_user_id: int
    requested_by_name: Optional[str] = None
    summary: str = ""
    resolution_details: str = ""
    status: str = ClosureRequestStatus.PENDING.value
    reviewed_by_user_id: Optional[int] = None
    reviewed_by_name: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

@dataclass
class TicketDomain:
    id: int
    alert_id: Optional[int]
    node_id: int
    title: str
    description: str
    priority: str = TicketPriority.MEDIUM.value
    status: str = TicketStatus.OPEN.value
    assigned_to_user_id: Optional[int] = None
    assigned_to_name: Optional[str] = None
    created_by_user_id: Optional[int] = None
    created_by_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    node_name: Optional[str] = None
    rack_name: Optional[str] = None
    notes: Optional[List[TicketNoteDomain]] = None
    closure_request: Optional[TicketClosureRequestDomain] = None

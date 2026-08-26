from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime

@dataclass
class RoleDomain:
    id: int
    name: str
    permissions_json: Optional[str] = None
    description: Optional[str] = None

@dataclass
class UserDomain:
    id: int
    username: str
    email: str
    password_hash: str
    full_name: str
    role_id: int
    role_name: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
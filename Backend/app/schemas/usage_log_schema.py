from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UsageLog(BaseModel):
    user_id: str
    user_name: str
    license_id: str
    license_no: str
    action: str  # "activated", "released", "expired", "extended"
    timestamp: str
    duration_seconds: Optional[int] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

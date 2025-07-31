from typing import Optional
from pydantic import BaseModel

class licenses(BaseModel):
    No: str
    username: str
    password: str
    gmail: str
    mail_password: str
    is_available: bool = True

class Updatelicenses(BaseModel):
    No: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    gmail: Optional[str] = None
    mail_password: Optional[str] = None
    is_available: Optional[bool] = None
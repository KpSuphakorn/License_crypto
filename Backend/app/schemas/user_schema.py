from typing import Optional
from pydantic import BaseModel, EmailStr

class UserAccount(BaseModel):
    No: str
    username: str
    password: str
    gmail: str
    mail_password: str

class UpdateUserAccount(BaseModel):
    No: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    gmail: Optional[str] = None
    mail_password: Optional[str] = None
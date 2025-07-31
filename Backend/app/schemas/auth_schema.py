from pydantic import BaseModel
from enum import Enum
from typing import Optional

class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"

class RegisterUser(BaseModel):
    first_name: str 
    last_name: str 
    phone_number: str 
    email: str
    password: str
    rank: str
    position: str
    division: str
    bureau: str
    command: str
    role: UserRole = UserRole.USER

class LoginUser(BaseModel):
    phone_number: str 
    password: str

class UpdateUser(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
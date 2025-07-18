from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional
from datetime import datetime

class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"

class RegisterUser(BaseModel):
    first_name: str 
    last_name: str 
    phone_number: str 
    email: str
    password: str
    role: UserRole = UserRole.USER  # Default role is user

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
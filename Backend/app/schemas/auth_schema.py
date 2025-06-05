from pydantic import BaseModel, Field

class RegisterUser(BaseModel):
    first_name: str 
    last_name: str 
    phone_number: str 
    password: str 

class LoginUser(BaseModel):
    phone_number: str 
    password: str 
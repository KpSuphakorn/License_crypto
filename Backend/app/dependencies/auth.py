from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from app.utils.jwt_handler import verify_token
from app.models.auth_model import get_user_collection

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    phone_number = payload.get("phone_number")
    if not phone_number:
        raise HTTPException(status_code=401, detail="Invalid token data")
    
    user = get_user_collection().find_one({"phone_number": phone_number}, {"password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account is deactivated")
    
    user["user_id"] = str(user["_id"])
    del user["_id"]
    
    if "role" not in user:
        user["role"] = "user"
    
    return user

def require_admin(current_user: dict = Depends(get_current_user)):
    """Dependency to require admin role"""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=403, 
            detail="Admin access required"
        )
    return current_user

def require_user_or_admin(current_user: dict = Depends(get_current_user)):
    """Dependency to require user or admin role"""
    role = current_user.get("role")
    if role not in ["user", "admin"]:
        raise HTTPException(
            status_code=403, 
            detail="Access denied"
        )
    return current_user

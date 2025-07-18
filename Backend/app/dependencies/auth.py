from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from app.utils.jwt_handler import verify_token
from app.models.auth_model import get_user_collection

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Get phone number from payload
    phone_number = payload.get("phone_number")
    if not phone_number:
        raise HTTPException(status_code=401, detail="Invalid token data")
    
    # Fetch full user data from database
    user = get_user_collection().find_one({"phone_number": phone_number}, {"password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Convert _id to user_id and make it a string
    user["user_id"] = str(user["_id"])
    del user["_id"]
    
    # Add default role if not present
    if "role" not in user:
        user["role"] = "user"
    
    return user

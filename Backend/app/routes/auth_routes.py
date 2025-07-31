from fastapi import APIRouter, HTTPException, Depends
from app.schemas.auth_schema import RegisterUser, LoginUser, UpdateUser
from app.models.auth_model import get_user_collection
from app.utils.jwt_handler import create_access_token
from fastapi.responses import JSONResponse
from app.dependencies.auth import get_current_user, require_admin
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register")
def register_user(user: RegisterUser):
    user_collection = get_user_collection()

    allowed_domains = ["@cyberpolice.go.th"]
    if not any(user.email.lower().endswith(domain) for domain in allowed_domains):
        raise HTTPException(status_code=400, detail="Email must be @cyberpolice.go.th")

    if user_collection.find_one({"phone_number": user.phone_number}):
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    if user_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    user_data = user.dict()
    user_data["created_at"] = datetime.utcnow().isoformat() + "Z"
    user_data["updated_at"] = datetime.utcnow().isoformat() + "Z"
    user_data["is_active"] = True
    user_data["last_login"] = None
    
    user_collection.insert_one(user_data)
    return {"message": "User registered successfully"}

@router.post("/login")
def login(user: LoginUser):
    user_collection = get_user_collection()
    user_data = user_collection.find_one({"phone_number": user.phone_number})
    
    if not user_data or user_data["password"] != user.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user_data.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account is deactivated")

    user_collection.update_one(
        {"_id": user_data["_id"]},
        {"$set": {"last_login": datetime.utcnow().isoformat() + "Z"}}
    )

    token = create_access_token({"phone_number": user.phone_number})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/logout")
def logout(current_user: dict = Depends(get_current_user)):
    return JSONResponse(content={
        "message": "Logout successful."
    })

@router.get("/")
def get_my_info(current_user: dict = Depends(get_current_user)):
    phone_number = current_user.get("phone_number")
    if not phone_number:
        raise HTTPException(status_code=400, detail="Invalid token data")

    user = get_user_collection().find_one({"phone_number": phone_number}, {"password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user["user_id"] = str(user["_id"])
    del user["_id"]
    
    return user

@router.get("/users", dependencies=[Depends(require_admin)])
def get_all_users(current_user: dict = Depends(get_current_user)):
    users = list(get_user_collection().find({}, {"password": 0}))
    for user in users:
        user["user_id"] = str(user["_id"])
        del user["_id"]
    return {"users": users}

@router.put("/users/{user_id}", dependencies=[Depends(require_admin)])
def update_user(user_id: str, user_update: UpdateUser, current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    user_collection = get_user_collection()
    update_data = {k: v for k, v in user_update.dict().items() if v is not None}
    
    if update_data:
        update_data["updated_at"] = datetime.utcnow().isoformat() + "Z"
        result = user_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User updated successfully"}

@router.delete("/users/{user_id}", dependencies=[Depends(require_admin)])
def deactivate_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    user_collection = get_user_collection()
    result = user_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow().isoformat() + "Z"}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deactivated successfully"}
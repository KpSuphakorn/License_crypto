from fastapi import APIRouter, HTTPException, Depends
from app.schemas.auth_schema import RegisterUser, LoginUser
from app.models.auth_model import get_user_collection
from app.utils.jwt_handler import create_access_token
from fastapi.responses import JSONResponse
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register")
def register_user(user: RegisterUser):
    user_collection = get_user_collection()

    # ตรวจสอบว่าหมายเลขโทรศัพท์ซ้ำหรือไม่
    if user_collection.find_one({"phone_number": user.phone_number}):
        raise HTTPException(status_code=400, detail="Phone number already registered")

    user_data = user.dict()
    user_collection.insert_one(user_data)
    return {"message": "User registered successfully"}

@router.post("/login")
def login(user: LoginUser):
    user_data = get_user_collection().find_one({"phone_number": user.phone_number})
    
    if not user_data or user_data["password"] != user.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

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

    # Convert _id to user_id and make it a string
    user["user_id"] = str(user["_id"])
    del user["_id"]
    
    # Add default role if not present
    if "role" not in user:
        user["role"] = "user"

    return user
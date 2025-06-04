from fastapi import APIRouter, HTTPException, Path
from app.schemas.licenses_schema import licenses, Updatelicenses
from app.models.licenses_model import licenses_collection
from bson import ObjectId

router = APIRouter(prefix="/licenses", tags=["Licenses"])

@router.post("/add")
def add_user(user: licenses):
    existing_user = licenses_collection().find_one({"gmail": user.gmail})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    licenses_collection().insert_one(user.dict())
    return {"message": "User added successfully"}

@router.delete("/delete/{user_id}")
def delete_user(user_id: str = Path(..., title="User ID to delete")):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")

    result = licenses_collection().delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "User deleted successfully"}

@router.put("/edit/{user_id}")
def update_user(user_id: str = Path(..., title="User ID to update"), updated_user: Updatelicenses = ...):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")

    update_data = {k: v for k, v in updated_user.dict().items() if v is not None}
    result = licenses_collection().update_one({"_id": ObjectId(user_id)}, {"$set": update_data})

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "User updated successfully"}

@router.get("/")
def get_all_users():
    users = list(licenses_collection().find())
    for user in users:
        user["_id"] = str(user["_id"])
    return {
        "total_users": len(users),
        "users": users
    }

@router.get("/{user_id}")
def get_user_by_id(user_id: str = Path(..., title="User ID to get")):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")

    user = licenses_collection().find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user["_id"] = str(user["_id"])
    return user

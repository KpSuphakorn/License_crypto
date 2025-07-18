from fastapi import APIRouter, HTTPException, Path, Depends
from app.schemas.licenses_schema import licenses, Updatelicenses
from app.models.licenses_model import licenses_collection
from app.dependencies.auth import get_current_user
from bson import ObjectId
from datetime import datetime, timedelta

router = APIRouter(prefix="/licenses", tags=["Licenses"])

@router.post("/add")
def add_licenses(licenses: licenses, user: dict = Depends(get_current_user)):
    existing_licenses = licenses_collection().find_one({"gmail": licenses.gmail})
    if existing_licenses:
        raise HTTPException(status_code=400, detail="licenses already exists")

    licenses_collection().insert_one(licenses.dict())
    return {"message": "licenses added successfully"}

@router.delete("/delete/{licenses_id}")
def delete_licenses(licenses_id: str = Path(...), user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(licenses_id):
        raise HTTPException(status_code=400, detail="Invalid licenses ID")

    result = licenses_collection().delete_one({"_id": ObjectId(licenses_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="licenses not found")

    return {"message": "licenses deleted successfully"}

@router.put("/edit/{licenses_id}")
def update_licenses(licenses_id: str = Path(...), updated_licenses: Updatelicenses = ..., user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(licenses_id):
        raise HTTPException(status_code=400, detail="Invalid licenses ID")

    update_data = {k: v for k, v in updated_licenses.dict().items() if v is not None}
    result = licenses_collection().update_one({"_id": ObjectId(licenses_id)}, {"$set": update_data})

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="licenses not found")

    return {"message": "licenses updated successfully"}

@router.get("/")
def get_all_licensess():
    licensess = list(licenses_collection().find())
    for licenses in licensess:
        licenses["_id"] = str(licenses["_id"])
        # Fix field name inconsistency - convert is_avaliable to is_available
        if "is_avaliable" in licenses:
            licenses["is_available"] = licenses.pop("is_avaliable")
        # Default to True if neither field exists
        if "is_available" not in licenses:
            licenses["is_available"] = True
    return {
        "total_licensess": len(licensess),
        "licensess": licensess
    }

@router.get("/{licenses_id}")
def get_licenses_by_id(licenses_id: str = Path(...), user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(licenses_id):
        raise HTTPException(status_code=400, detail="Invalid licenses ID")

    licenses = licenses_collection().find_one({"_id": ObjectId(licenses_id)})
    if not licenses:
        raise HTTPException(status_code=404, detail="licenses not found")

    licenses["_id"] = str(licenses["_id"])
    # Fix field name inconsistency - convert is_avaliable to is_available
    if "is_avaliable" in licenses:
        licenses["is_available"] = licenses.pop("is_avaliable")
    # Default to True if neither field exists
    if "is_available" not in licenses:
        licenses["is_available"] = True
    return licenses

@router.post("/{licenses_id}/request")
def request_license(licenses_id: str = Path(...), user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(licenses_id):
        raise HTTPException(status_code=400, detail="Invalid licenses ID")

    # First, check if the license exists and is available
    licenses = licenses_collection().find_one({"_id": ObjectId(licenses_id)})
    if not licenses:
        raise HTTPException(status_code=404, detail="License not found")
    
    # Handle field name inconsistency - check both is_available and is_avaliable
    is_available = licenses.get("is_available", licenses.get("is_avaliable", True))
    
    # Check if already taken by another user (race condition protection)
    if not is_available:
        current_user_id = licenses.get("current_user")
        if current_user_id != user.get("user_id"):
            raise HTTPException(status_code=409, detail="License is already in use by another user")
        else:
            # If it's the same user, allow re-request
            pass
    
    # Reserve the license for this user but don't mark as "in use" yet
    # The license will be marked as "in use" when they request OTP
    update_data = {
        "is_available": True,  # Keep as available until OTP is requested
        "reserved_by": user.get("user_id"),  # New field to track who reserved it
        "reserved_by_name": f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
        "reserved_at": datetime.utcnow().isoformat(),
        "last_activity": datetime.utcnow().isoformat()
    }
    
    print(f"Reserving license {licenses_id} for user {user.get('user_id')}")
    print(f"Update data: {update_data}")
    
    # Use atomic update to prevent race conditions
    result = licenses_collection().update_one(
        {"_id": ObjectId(licenses_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="License not found")
    
    print(f"License reserved successfully. Modified count: {result.modified_count}")
    
    return {"message": "License reserved successfully. Request OTP to activate."}

@router.post("/{licenses_id}/activate")
def activate_license(licenses_id: str = Path(...), user: dict = Depends(get_current_user)):
    """Activate a reserved license when user requests OTP"""
    print(f"Activating license {licenses_id} for user {user.get('user_id')}")
    
    if not ObjectId.is_valid(licenses_id):
        raise HTTPException(status_code=400, detail="Invalid licenses ID")

    # First, check if the license exists
    licenses = licenses_collection().find_one({"_id": ObjectId(licenses_id)})
    if not licenses:
        raise HTTPException(status_code=404, detail="License not found")
    
    print(f"License found: {licenses}")
    
    # Check if user has reserved this license
    user_id = user.get("user_id")
    reserved_by = licenses.get("reserved_by")
    
    print(f"User ID: {user_id}, Reserved by: {reserved_by}")
    
    if reserved_by != user_id:
        raise HTTPException(status_code=403, detail="You haven't reserved this license")
    
    # Check if license is already active
    if not licenses.get("is_available", True):
        current_user_id = licenses.get("current_user")
        if current_user_id == user_id:
            # User is trying to activate again - if it's the same user and not expired, just return success
            expires_at = licenses.get("expires_at")
            if expires_at:
                expires_time = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
                if datetime.utcnow() < expires_time:
                    print("License already active and not expired - returning existing expiration")
                    return {"message": "License is already active", "expires_at": expires_at}
        else:
            raise HTTPException(status_code=409, detail="License is already in use by another user")
    
    # Calculate expiration time (2 hours from now)
    expires_at = datetime.utcnow() + timedelta(hours=2)
    
    print(f"Setting expiration time to: {expires_at.isoformat()}")
    
    # Activate the license
    update_data = {
        "is_available": False,
        "current_user": user_id,
        "current_user_name": f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
        "assigned_at": datetime.utcnow().isoformat(),
        "expires_at": expires_at.isoformat(),
        "last_activity": datetime.utcnow().isoformat(),
        # Keep reservation info for reference
        "reserved_by": reserved_by,
        "reserved_by_name": licenses.get("reserved_by_name"),
        "reserved_at": licenses.get("reserved_at")
    }
    
    print(f"Update data: {update_data}")
    
    # Use atomic update to prevent race conditions
    result = licenses_collection().update_one(
        {"_id": ObjectId(licenses_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="License not found")
    
    print(f"License activated successfully. Expires at: {expires_at.isoformat()}")
    
    return {"message": "License activated successfully", "expires_at": expires_at.isoformat()}

@router.post("/{licenses_id}/release")
def release_license(licenses_id: str = Path(...), user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(licenses_id):
        raise HTTPException(status_code=400, detail="Invalid licenses ID")

    # First, check if the license exists
    licenses = licenses_collection().find_one({"_id": ObjectId(licenses_id)})
    if not licenses:
        raise HTTPException(status_code=404, detail="License not found")
    
    # Check if user has permission to release this license
    user_id = user.get("user_id")
    is_admin = user.get("role") == "admin"
    is_current_user = licenses.get("current_user") == user_id
    
    if not is_admin and not is_current_user:
        raise HTTPException(status_code=403, detail="You don't have permission to release this license")
    
    # Update the license to mark it as available and clear all reservations
    update_data = {
        "is_available": True,
        "current_user": None,
        "current_user_name": None,
        "assigned_at": None,
        "expires_at": None,
        "reserved_by": None,  # Clear reservation
        "reserved_by_name": None,  # Clear reservation
        "reserved_at": None,  # Clear reservation
        "last_activity": datetime.utcnow().isoformat()
    }
    
    print(f"Releasing license {licenses_id} - clearing all reservations and assignments")
    print(f"Update data: {update_data}")
    
    result = licenses_collection().update_one(
        {"_id": ObjectId(licenses_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="License not found")
    
    return {"message": "License released successfully"}

@router.post("/cleanup-expired")
def cleanup_expired_licenses():
    """Clean up expired licenses and make them available again"""
    current_time = datetime.utcnow()
    
    # Find all licenses that are not available and have an expiration time
    potential_expired_licenses = licenses_collection().find({
        "is_available": False,
        "expires_at": {"$exists": True, "$ne": None}
    })
    
    count = 0
    for license in potential_expired_licenses:
        # Parse the expiration time and compare properly
        expires_at_str = license.get("expires_at")
        if expires_at_str:
            try:
                # Parse the ISO format datetime string
                expires_at = datetime.fromisoformat(expires_at_str.replace('Z', '+00:00'))
                # Convert to UTC if it has timezone info
                if expires_at.tzinfo is not None:
                    expires_at = expires_at.replace(tzinfo=None)
                
                # Only clean up if truly expired
                if current_time > expires_at:
                    # Update the license to mark it as available and clear reservations
                    update_data = {
                        "is_available": True,
                        "current_user": None,
                        "current_user_name": None,
                        "assigned_at": None,
                        "expires_at": None,
                        "reserved_by": None,  # Clear reservation
                        "reserved_by_name": None,  # Clear reservation
                        "reserved_at": None,  # Clear reservation
                        "last_activity": current_time.isoformat()
                    }
                    
                    licenses_collection().update_one(
                        {"_id": license["_id"]},
                        {"$set": update_data}
                    )
                    count += 1
            except Exception as e:
                # If we can't parse the date, skip this license
                print(f"Error parsing expiration time for license {license['_id']}: {e}")
                continue
    
    return {"message": f"Cleaned up {count} expired licenses"}

@router.post("/fix-data-inconsistencies")
def fix_data_inconsistencies():
    """Fix data inconsistencies in the database"""
    
    # 1. Convert is_avaliable to is_available for all licenses
    licenses_with_old_field = licenses_collection().find({"is_avaliable": {"$exists": True}})
    
    converted_count = 0
    for license in licenses_with_old_field:
        update_data = {
            "is_available": license.get("is_avaliable", True)
        }
        
        # Remove the old field
        licenses_collection().update_one(
            {"_id": license["_id"]},
            {
                "$set": update_data,
                "$unset": {"is_avaliable": ""}
            }
        )
        converted_count += 1
    
    # 2. Fix licenses that are marked as unavailable but have no current_user
    inconsistent_licenses = licenses_collection().find({
        "$or": [
            {"is_available": False, "current_user": None},
            {"is_available": False, "current_user": ""}
        ]
    })
    
    fixed_count = 0
    for license in inconsistent_licenses:
        # If no current user, make it available
        update_data = {
            "is_available": True,
            "current_user": None,
            "current_user_name": None,
            "assigned_at": None,
            "expires_at": None,
            "last_activity": datetime.utcnow().isoformat()
        }
        
        licenses_collection().update_one(
            {"_id": license["_id"]},
            {"$set": update_data}
        )
        fixed_count += 1
    
    return {
        "message": f"Fixed data inconsistencies: {converted_count} field names converted, {fixed_count} orphaned licenses fixed"
    }

@router.post("/{licenses_id}/extend")
def extend_license(licenses_id: str = Path(...), user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(licenses_id):
        raise HTTPException(status_code=400, detail="Invalid licenses ID")

    # Check if the license exists
    licenses = licenses_collection().find_one({"_id": ObjectId(licenses_id)})
    if not licenses:
        raise HTTPException(status_code=404, detail="License not found")
    
    # Check if user owns this license
    if licenses.get("current_user") != user.get("user_id"):
        raise HTTPException(status_code=403, detail="You don't own this license")
    
    # Check if license is still active
    if licenses.get("is_available", True):
        raise HTTPException(status_code=400, detail="License is not currently in use")
    
    # Check if the license is close to expiring (within 15 minutes)
    expires_at = licenses.get("expires_at")
    if expires_at:
        expires_time = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
        time_left = expires_time - datetime.utcnow()
        if time_left.total_seconds() > 900:  # 15 minutes
            raise HTTPException(status_code=400, detail="You can only extend the license when there are 15 minutes or less remaining")
    
    # Extend the license by 2 hours
    new_expires_at = datetime.utcnow() + timedelta(hours=2)
    
    update_data = {
        "expires_at": new_expires_at.isoformat(),
        "last_activity": datetime.utcnow().isoformat()
    }
    
    result = licenses_collection().update_one(
        {"_id": ObjectId(licenses_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="License not found")
    
    return {"message": "License extended successfully", "new_expires_at": new_expires_at.isoformat()}

from fastapi import APIRouter, HTTPException, Path, Depends, Request
from app.schemas.licenses_schema import licenses, Updatelicenses
from app.models.licenses_model import licenses_collection
from app.dependencies.auth import get_current_user
from app.routes.usage_log_routes import log_usage
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
    # First, automatically cleanup any expired reservations
    current_time = datetime.utcnow()
    
    # Find and clean up expired reservations
    potential_expired_reservations = licenses_collection().find({
        "is_available": True,
        "reserved_by": {"$exists": True, "$ne": None},
        "reservation_expires_at": {"$exists": True, "$ne": None}
    })
    
    for license in potential_expired_reservations:
        reservation_expires_at_str = license.get("reservation_expires_at")
        if reservation_expires_at_str:
            try:
                reservation_expires_at = datetime.fromisoformat(reservation_expires_at_str.replace('Z', '+00:00'))
                if reservation_expires_at.tzinfo is not None:
                    reservation_expires_at = reservation_expires_at.replace(tzinfo=None)
                
                if current_time > reservation_expires_at:
                    # Log the reservation expiration
                    try:
                        log_usage(
                            user_id=license.get("reserved_by", "system"),
                            user_name=license.get("reserved_by_name", "System Cleanup"),
                            license_id=str(license["_id"]),
                            license_no=license.get("No", ""),
                            action="reservation_expired",
                            ip_address=None,
                            user_agent="Auto Cleanup"
                        )
                    except Exception as e:
                        print(f"Failed to log reservation cleanup: {e}")
                    
                    # Clear the expired reservation
                    clear_data = {
                        "reserved_by": None,
                        "reserved_by_name": None,
                        "reserved_at": None,
                        "reservation_expires_at": None,
                        "last_activity": current_time.isoformat() + "Z"
                    }
                    
                    licenses_collection().update_one(
                        {"_id": license["_id"]},
                        {"$set": clear_data}
                    )
            except Exception as e:
                print(f"Error parsing reservation expiration time for license {license['_id']}: {e}")
                continue
    
    # Now fetch all licenses with cleaned up data
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
def request_license(licenses_id: str = Path(...), user: dict = Depends(get_current_user), request: Request = None):
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
            # If it's the same user and license is active, allow re-request (they can re-activate)
            pass
    
    # Check if license is reserved and if the reservation has expired
    reserved_by = licenses.get("reserved_by")
    reservation_expires_at_str = licenses.get("reservation_expires_at")
    
    # If the license is reserved by someone else, check expiration
    if reserved_by and reserved_by != user.get("user_id"):
        # Check if the reservation has expired
        if reservation_expires_at_str:
            try:
                reservation_expires_at = datetime.fromisoformat(reservation_expires_at_str.replace('Z', '+00:00'))
                if reservation_expires_at.tzinfo is not None:
                    reservation_expires_at = reservation_expires_at.replace(tzinfo=None)
                
                current_time = datetime.utcnow()
                if current_time > reservation_expires_at:
                    # Reservation has expired, clear it automatically
                    print(f"Clearing expired reservation for license {licenses_id}")
                    
                    # Log the reservation expiration
                    try:
                        log_usage(
                            user_id=reserved_by,
                            user_name=licenses.get("reserved_by_name", "Unknown"),
                            license_id=licenses_id,
                            license_no=licenses.get("No", ""),
                            action="reservation_expired",
                            ip_address=None,
                            user_agent="Auto Cleanup"
                        )
                    except Exception as e:
                        print(f"Failed to log reservation expiration: {e}")
                    
                    # Clear the expired reservation
                    clear_reservation_data = {
                        "reserved_by": None,
                        "reserved_by_name": None,
                        "reserved_at": None,
                        "reservation_expires_at": None,
                        "last_activity": current_time.isoformat() + "Z"
                    }
                    
                    licenses_collection().update_one(
                        {"_id": ObjectId(licenses_id)},
                        {"$set": clear_reservation_data}
                    )
                    
                    # Update the license object for the rest of the function
                    licenses.update(clear_reservation_data)
                    reserved_by = None
                else:
                    # Reservation is still valid, can't request
                    raise HTTPException(status_code=409, detail="License is reserved by another user")
            except ValueError as e:
                print(f"Error parsing reservation expiration time: {e}")
                # If we can't parse the time, assume reservation is expired and clear it
                clear_reservation_data = {
                    "reserved_by": None,
                    "reserved_by_name": None,
                    "reserved_at": None,
                    "reservation_expires_at": None,
                    "last_activity": datetime.utcnow().isoformat() + "Z"
                }
                
                licenses_collection().update_one(
                    {"_id": ObjectId(licenses_id)},
                    {"$set": clear_reservation_data}
                )
                
                licenses.update(clear_reservation_data)
                reserved_by = None
        else:
            # No expiration time set, this is an old reservation, clear it
            clear_reservation_data = {
                "reserved_by": None,
                "reserved_by_name": None,
                "reserved_at": None,
                "reservation_expires_at": None,
                "last_activity": datetime.utcnow().isoformat() + "Z"
            }
            
            licenses_collection().update_one(
                {"_id": ObjectId(licenses_id)},
                {"$set": clear_reservation_data}
            )
            
            licenses.update(clear_reservation_data)
            reserved_by = None
    
    # If user is trying to reserve the same license they already reserved, allow it (refresh reservation)
    elif reserved_by == user.get("user_id"):
        print(f"User {user.get('user_id')} is re-requesting their own reserved license {licenses_id}")
        # This is allowed - user can refresh their own reservation
        pass
    
    user_id = user.get("user_id")
    user_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
    
    # Check if user has a different active reservation and auto-cancel it
    existing_reservation = licenses_collection().find_one({
        "reserved_by": user_id,
        "is_available": True,
        "reservation_expires_at": {"$exists": True, "$ne": None}
    })
    
    if existing_reservation:
        existing_license_id = str(existing_reservation["_id"])
        
        # If this is a different license than the one being requested, auto-cancel the existing reservation
        if existing_license_id != licenses_id:
            existing_expires_at_str = existing_reservation.get("reservation_expires_at")
            if existing_expires_at_str:
                try:
                    existing_expires_at = datetime.fromisoformat(existing_expires_at_str.replace('Z', '+00:00'))
                    if existing_expires_at.tzinfo is not None:
                        existing_expires_at = existing_expires_at.replace(tzinfo=None)
                    
                    current_time = datetime.utcnow()
                    if current_time <= existing_expires_at:
                        # Auto-cancel the existing reservation to allow the new one
                        print(f"Auto-canceling user's existing reservation for license {existing_license_id} to allow new request for {licenses_id}")
                        
                        # Log the auto-cancellation
                        try:
                            log_usage(
                                user_id=user_id,
                                user_name=user_name,
                                license_id=existing_license_id,
                                license_no=existing_reservation.get("No", ""),
                                action="reservation_auto_canceled",
                                ip_address=None,
                                user_agent="Auto Switch"
                            )
                        except Exception as e:
                            print(f"Failed to log auto-cancellation: {e}")
                        
                        # Clear the existing reservation
                        licenses_collection().update_one(
                            {"_id": existing_reservation["_id"]},
                            {"$set": {
                                "reserved_by": None,
                                "reserved_by_name": None,
                                "reserved_at": None,
                                "reservation_expires_at": None,
                                "last_activity": current_time.isoformat() + "Z"
                            }}
                        )
                    else:
                        # Existing reservation has expired, clear it
                        licenses_collection().update_one(
                            {"_id": existing_reservation["_id"]},
                            {"$set": {
                                "reserved_by": None,
                                "reserved_by_name": None,
                                "reserved_at": None,
                                "reservation_expires_at": None,
                                "last_activity": current_time.isoformat() + "Z"
                            }}
                        )
                except ValueError:
                    # Invalid date format, clear the reservation
                    licenses_collection().update_one(
                        {"_id": existing_reservation["_id"]},
                        {"$set": {
                            "reserved_by": None,
                            "reserved_by_name": None,
                            "reserved_at": None,
                            "reservation_expires_at": None,
                            "last_activity": datetime.utcnow().isoformat() + "Z"
                        }}
                    )
        # If it's the same license, allow the re-request (user can refresh their reservation)
    
    # Log the license request
    try:
        ip_address = request.client.host if request else None
        user_agent = request.headers.get("user-agent") if request else None
        log_usage(
            user_id=user_id,
            user_name=user_name,
            license_id=licenses_id,
            license_no=licenses.get("No", ""),
            action="request_license",
            ip_address=ip_address,
            user_agent=user_agent
        )
    except Exception as e:
        print(f"Failed to log usage: {e}")
    
    # Reserve the license for this user but don't mark as "in use" yet
    # The license will be marked as "in use" when they request OTP
    # Add a 5-minute expiration for reservations
    reservation_expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    update_data = {
        "is_available": True,  # Keep as available until OTP is requested
        "reserved_by": user.get("user_id"),  # New field to track who reserved it
        "reserved_by_name": f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
        "reserved_at": datetime.utcnow().isoformat() + "Z",
        "reservation_expires_at": reservation_expires_at.isoformat() + "Z",  # New field for reservation timeout
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

@router.post("/{licenses_id}/cancel-reservation")
def cancel_license_reservation(licenses_id: str = Path(...), user: dict = Depends(get_current_user), request: Request = None):
    """Cancel a license reservation"""
    if not ObjectId.is_valid(licenses_id):
        raise HTTPException(status_code=400, detail="Invalid licenses ID")

    # First, check if the license exists
    licenses = licenses_collection().find_one({"_id": ObjectId(licenses_id)})
    if not licenses:
        raise HTTPException(status_code=404, detail="License not found")
    
    # Check if user has reserved this license OR if user is admin
    user_id = user.get("user_id")
    user_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
    is_admin = user.get("role") == "admin"
    reserved_by = licenses.get("reserved_by")
    
    if reserved_by != user_id and not is_admin:
        raise HTTPException(status_code=403, detail="You don't have permission to cancel this reservation")
    
    # Check if license is already activated (can't cancel active licenses)
    if not licenses.get("is_available", True):
        raise HTTPException(status_code=409, detail="License is already activated. Use release instead.")
    
    # Check if there's actually a reservation to cancel
    if not reserved_by:
        raise HTTPException(status_code=404, detail="No reservation found for this license")
    
    # Log the cancellation
    try:
        ip_address = request.client.host if request else None
        user_agent = request.headers.get("user-agent") if request else None
        action = "cancel_reservation_admin" if is_admin and reserved_by != user_id else "cancel_reservation"
        log_usage(
            user_id=user_id,
            user_name=user_name,
            license_id=licenses_id,
            license_no=licenses.get("No", ""),
            action=action,
            ip_address=ip_address,
            user_agent=user_agent
        )
    except Exception as e:
        print(f"Failed to log usage: {e}")
    
    # Clear the reservation
    update_data = {
        "reserved_by": None,
        "reserved_by_name": None,
        "reserved_at": None,
        "reservation_expires_at": None,
        "last_activity": datetime.utcnow().isoformat() + "Z"
    }
    
    result = licenses_collection().update_one(
        {"_id": ObjectId(licenses_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="License not found")
    
    return {"message": "Reservation cancelled successfully"}

@router.post("/{licenses_id}/activate")
def activate_license(licenses_id: str = Path(...), user: dict = Depends(get_current_user), request: Request = None):
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
    user_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
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
                try:
                    # Handle both Z and non-Z suffixed timestamps
                    expires_time_str = expires_at.replace('Z', '+00:00') if expires_at.endswith('Z') else expires_at
                    expires_time = datetime.fromisoformat(expires_time_str)
                    
                    # Convert to UTC naive datetime for comparison
                    if expires_time.tzinfo is not None:
                        expires_time = expires_time.replace(tzinfo=None)
                    
                    if datetime.utcnow() < expires_time:
                        print("License already active and not expired - returning existing expiration")
                        # Ensure the returned timestamp has Z suffix for consistency
                        return_expires_at = expires_at if expires_at.endswith('Z') else expires_at + 'Z'
                        return {"message": "License is already active", "expires_at": return_expires_at}
                except ValueError as e:
                    print(f"Error parsing existing expires_at: {e}")
                    # Fall through to re-activate with new expiration
        else:
            raise HTTPException(status_code=409, detail="License is already in use by another user")
    
    # Calculate expiration time (2 hours from now)
    expires_at = datetime.utcnow() + timedelta(hours=2)
    
    print(f"Setting expiration time to: {expires_at.isoformat()}Z")
    
    # Log the license activation
    try:
        ip_address = request.client.host if request else None
        user_agent = request.headers.get("user-agent") if request else None
        log_usage(
            user_id=user_id,
            user_name=user_name,
            license_id=licenses_id,
            license_no=licenses.get("No", ""),
            action="activate_license",
            ip_address=ip_address,
            user_agent=user_agent
        )
    except Exception as e:
        print(f"Failed to log usage: {e}")
    
    # Activate the license
    update_data = {
        "is_available": False,
        "current_user": user_id,
        "current_user_name": f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
        "assigned_at": datetime.utcnow().isoformat() + "Z",
        "expires_at": expires_at.isoformat() + "Z",
        "last_activity": datetime.utcnow().isoformat() + "Z",
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
    
    print(f"License activated successfully. Expires at: {expires_at.isoformat()}Z")
    
    return {"message": "License activated successfully", "expires_at": expires_at.isoformat() + "Z"}

@router.post("/{licenses_id}/release")
def release_license(licenses_id: str = Path(...), user: dict = Depends(get_current_user), request: Request = None):
    if not ObjectId.is_valid(licenses_id):
        raise HTTPException(status_code=400, detail="Invalid licenses ID")

    # First, check if the license exists
    licenses = licenses_collection().find_one({"_id": ObjectId(licenses_id)})
    if not licenses:
        raise HTTPException(status_code=404, detail="License not found")
    
    # Check if user has permission to release this license
    user_id = user.get("user_id")
    user_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
    is_admin = user.get("role") == "admin"
    is_current_user = licenses.get("current_user") == user_id
    
    if not is_admin and not is_current_user:
        raise HTTPException(status_code=403, detail="You don't have permission to release this license")
    
    # Calculate duration if license was active
    duration_seconds = None
    if licenses.get("assigned_at"):
        try:
            assigned_at_str = licenses.get("assigned_at", "").replace('Z', '+00:00')
            assigned_at = datetime.fromisoformat(assigned_at_str)
            if assigned_at.tzinfo is not None:
                assigned_at = assigned_at.replace(tzinfo=None)
            duration_seconds = int((datetime.utcnow() - assigned_at).total_seconds())
        except Exception as e:
            print(f"Error calculating duration: {e}")
    
    # Log the license release
    try:
        ip_address = request.client.host if request else None
        user_agent = request.headers.get("user-agent") if request else None
        log_usage(
            user_id=user_id,
            user_name=user_name,
            license_id=licenses_id,
            license_no=licenses.get("No", ""),
            action="release_license",
            duration_seconds=duration_seconds,
            ip_address=ip_address,
            user_agent=user_agent
        )
    except Exception as e:
        print(f"Failed to log usage: {e}")
    
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
        "reservation_expires_at": None,  # Clear reservation expiration
        "last_activity": datetime.utcnow().isoformat() + "Z"
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
    """Clean up expired licenses and reservations"""
    current_time = datetime.utcnow()
    
    # 1. Clean up expired active licenses
    potential_expired_licenses = licenses_collection().find({
        "is_available": False,
        "expires_at": {"$exists": True, "$ne": None}
    })
    
    expired_licenses_count = 0
    for license in potential_expired_licenses:
        expires_at_str = license.get("expires_at")
        if expires_at_str:
            try:
                expires_at = datetime.fromisoformat(expires_at_str.replace('Z', '+00:00'))
                if expires_at.tzinfo is not None:
                    expires_at = expires_at.replace(tzinfo=None)
                
                if current_time > expires_at:
                    # Log the automatic cleanup
                    try:
                        current_user_name = license.get("current_user_name", "")
                        assigned_at_str = license.get("assigned_at", "")
                        duration_seconds = None
                        
                        if assigned_at_str:
                            try:
                                assigned_at = datetime.fromisoformat(assigned_at_str.replace('Z', '+00:00'))
                                if assigned_at.tzinfo is not None:
                                    assigned_at = assigned_at.replace(tzinfo=None)
                                duration_seconds = int((current_time - assigned_at).total_seconds())
                            except Exception as e:
                                print(f"Error calculating duration for cleanup: {e}")
                        
                        log_usage(
                            user_id=license.get("current_user", "system"),
                            user_name=current_user_name or "System Cleanup",
                            license_id=str(license["_id"]),
                            license_no=license.get("No", ""),
                            action="license_expired",
                            duration_seconds=duration_seconds,
                            ip_address=None,
                            user_agent="System Cleanup"
                        )
                    except Exception as e:
                        print(f"Failed to log cleanup: {e}")
                    
                    # Update the license to mark it as available and clear reservations
                    update_data = {
                        "is_available": True,
                        "current_user": None,
                        "current_user_name": None,
                        "assigned_at": None,
                        "expires_at": None,
                        "reserved_by": None,
                        "reserved_by_name": None,
                        "reserved_at": None,
                        "reservation_expires_at": None,
                        "last_activity": current_time.isoformat() + "Z"
                    }
                    
                    licenses_collection().update_one(
                        {"_id": license["_id"]},
                        {"$set": update_data}
                    )
                    expired_licenses_count += 1
            except Exception as e:
                print(f"Error parsing expiration time for license {license['_id']}: {e}")
                continue
    
    # 2. Clean up expired reservations
    potential_expired_reservations = licenses_collection().find({
        "is_available": True,
        "reserved_by": {"$exists": True, "$ne": None},
        "reservation_expires_at": {"$exists": True, "$ne": None}
    })
    
    expired_reservations_count = 0
    for license in potential_expired_reservations:
        reservation_expires_at_str = license.get("reservation_expires_at")
        if reservation_expires_at_str:
            try:
                reservation_expires_at = datetime.fromisoformat(reservation_expires_at_str.replace('Z', '+00:00'))
                if reservation_expires_at.tzinfo is not None:
                    reservation_expires_at = reservation_expires_at.replace(tzinfo=None)
                
                if current_time > reservation_expires_at:
                    # Log the reservation expiration
                    try:
                        log_usage(
                            user_id=license.get("reserved_by", "system"),
                            user_name=license.get("reserved_by_name", "System Cleanup"),
                            license_id=str(license["_id"]),
                            license_no=license.get("No", ""),
                            action="reservation_expired",
                            ip_address=None,
                            user_agent="System Cleanup"
                        )
                    except Exception as e:
                        print(f"Failed to log reservation cleanup: {e}")
                    
                    # Clear the expired reservation
                    update_data = {
                        "reserved_by": None,
                        "reserved_by_name": None,
                        "reserved_at": None,
                        "reservation_expires_at": None,
                        "last_activity": current_time.isoformat() + "Z"
                    }
                    
                    licenses_collection().update_one(
                        {"_id": license["_id"]},
                        {"$set": update_data}
                    )
                    expired_reservations_count += 1
            except Exception as e:
                print(f"Error parsing reservation expiration time for license {license['_id']}: {e}")
                continue
    
    return {
        "message": f"Cleaned up {expired_licenses_count} expired licenses and {expired_reservations_count} expired reservations"
    }

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

from fastapi import APIRouter, HTTPException, Path, Depends
from app.schemas.licenses_schema import licenses, Updatelicenses
from app.models.licenses_model import licenses_collection
from app.dependencies.auth import get_current_user
from bson import ObjectId

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
    return licenses

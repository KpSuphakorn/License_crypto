def licenses_collection():
    from app.database import db
    return db["all_licenses"]

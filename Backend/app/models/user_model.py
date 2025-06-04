def user_collection():
    from app.database import db
    return db["users"]

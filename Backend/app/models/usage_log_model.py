import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME")

def get_usage_log_collection():
    client = MongoClient(MONGODB_URI)
    db = client[DB_NAME]
    return db["usage_logs"]

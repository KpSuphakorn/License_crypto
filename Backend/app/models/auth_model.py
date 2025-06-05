import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()  # โหลดตัวแปรจาก .env

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME")

def get_user_collection():
    client = MongoClient(MONGODB_URI)
    db = client[DB_NAME]
    return db["users"]
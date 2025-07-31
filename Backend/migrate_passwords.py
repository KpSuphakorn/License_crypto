#!/usr/bin/env python3
"""
Migration script to hash existing plain text passwords in the database.
Run this script once to migrate existing passwords to hashed format.
"""

import os
import sys
from dotenv import load_dotenv
from pymongo import MongoClient
from app.utils.password_handler import hash_password

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME")

def migrate_passwords():
    """Migrate existing plain text passwords to hashed format"""
    if not MONGODB_URI or not DB_NAME:
        print("Error: MONGODB_URI and DB_NAME must be set in .env file")
        return
    
    try:
        # Connect to MongoDB
        client = MongoClient(MONGODB_URI)
        db = client[DB_NAME]
        user_collection = db["users"]
        
        # Find all users with plain text passwords
        # We'll check if the password looks like a hash (starts with $2b$)
        users_to_migrate = []
        for user in user_collection.find({}):
            password = user.get("password", "")
            # If password doesn't start with $2b$ (bcrypt format), it's likely plain text
            if password and not password.startswith("$2b$"):
                users_to_migrate.append(user)
        
        if not users_to_migrate:
            print("No users found with plain text passwords. Migration not needed.")
            return
        
        print(f"Found {len(users_to_migrate)} users with plain text passwords.")
        print("Starting migration...")
        
        # Migrate each user's password
        migrated_count = 0
        for user in users_to_migrate:
            try:
                # Hash the plain text password
                hashed_password = hash_password(user["password"])
                
                # Update the user in the database
                result = user_collection.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"password": hashed_password}}
                )
                
                if result.modified_count > 0:
                    migrated_count += 1
                    print(f"✓ Migrated password for user: {user.get('phone_number', 'Unknown')}")
                else:
                    print(f"✗ Failed to migrate password for user: {user.get('phone_number', 'Unknown')}")
                    
            except Exception as e:
                print(f"✗ Error migrating password for user {user.get('phone_number', 'Unknown')}: {str(e)}")
        
        print(f"\nMigration completed! {migrated_count} out of {len(users_to_migrate)} users migrated successfully.")
        
    except Exception as e:
        print(f"Error connecting to database: {str(e)}")
    finally:
        client.close()

if __name__ == "__main__":
    print("Password Migration Script")
    print("=" * 30)
    print("This script will hash all existing plain text passwords in the database.")
    print("Make sure to backup your database before running this script!")
    
    response = input("Do you want to continue? (y/N): ")
    if response.lower() in ['y', 'yes']:
        migrate_passwords()
    else:
        print("Migration cancelled.") 
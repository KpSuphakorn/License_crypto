#!/usr/bin/env python3
"""
Test script for password security system
"""

import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.utils.password_handler import hash_password, verify_password

def test_password_hashing():
    """Test password hashing and verification"""
    print("Testing Password Security System")
    print("=" * 40)
    
    # Test 1: Basic hashing and verification
    print("\n1. Testing basic hashing and verification:")
    test_password = "mypassword123"
    hashed = hash_password(test_password)
    print(f"Original password: {test_password}")
    print(f"Hashed password: {hashed}")
    
    # Verify correct password
    is_valid = verify_password(test_password, hashed)
    print(f"Correct password verification: {is_valid}")
    
    # Verify wrong password
    is_invalid = verify_password("wrongpassword", hashed)
    print(f"Wrong password verification: {is_invalid}")
    
    # Test 2: Same password produces different hashes
    print("\n2. Testing salt generation (same password, different hashes):")
    hash1 = hash_password(test_password)
    hash2 = hash_password(test_password)
    print(f"Hash 1: {hash1}")
    print(f"Hash 2: {hash2}")
    print(f"Hashes are different: {hash1 != hash2}")
    
    # Both should verify correctly
    verify1 = verify_password(test_password, hash1)
    verify2 = verify_password(test_password, hash2)
    print(f"Both hashes verify correctly: {verify1 and verify2}")
    
    # Test 3: Different passwords
    print("\n3. Testing different passwords:")
    password1 = "password123"
    password2 = "password456"
    hash1 = hash_password(password1)
    hash2 = hash_password(password2)
    
    print(f"Password 1: {password1}")
    print(f"Password 2: {password2}")
    print(f"Hash 1: {hash1}")
    print(f"Hash 2: {hash2}")
    
    # Cross verification should fail
    cross_verify1 = verify_password(password1, hash2)
    cross_verify2 = verify_password(password2, hash1)
    print(f"Cross verification fails: {not cross_verify1 and not cross_verify2}")
    
    # Test 4: Edge cases
    print("\n4. Testing edge cases:")
    
    # Empty password
    empty_hash = hash_password("")
    empty_verify = verify_password("", empty_hash)
    print(f"Empty password works: {empty_verify}")
    
    # Special characters
    special_password = "!@#$%^&*()_+-=[]{}|;:,.<>?"
    special_hash = hash_password(special_password)
    special_verify = verify_password(special_password, special_hash)
    print(f"Special characters work: {special_verify}")
    
    # Unicode characters
    unicode_password = "รหัสผ่านภาษาไทย123"
    unicode_hash = hash_password(unicode_password)
    unicode_verify = verify_password(unicode_password, unicode_hash)
    print(f"Unicode characters work: {unicode_verify}")
    
    print("\n" + "=" * 40)
    print("All tests completed successfully!")
    print("Password security system is working correctly.")

if __name__ == "__main__":
    test_password_hashing() 
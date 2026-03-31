import asyncio
import os
import sys
import json
from passlib.context import CryptContext

# Replicate the logic from users.py to verify it works offline first
pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_young(password: str, hashed: str):
    return pwd_context.verify(password, hashed)

def verify_elder(picture_sent: str, picture_stored: str):
    return picture_sent == picture_stored

async def main():
    print("--- Testing Young User (Argon2) ---")
    raw_pass = "mypassword123"
    hashed = hash_password(raw_pass)
    print(f"Raw: {raw_pass}")
    print(f"Hashed: {hashed}")
    
    success = verify_young(raw_pass, hashed)
    print(f"Verification Success: {success}")
    assert success == True
    
    fail = verify_young("wrongpass", hashed)
    print(f"Verification Failure (Correctly rejected): {not fail}")
    assert fail == False

    print("\n--- Testing Elder User (Picture Password) ---")
    stored_pics = "1,2,5,8"
    sent_pics = "1,2,5,8"
    wrong_pics = "1,2,5,9"
    
    success_elder = verify_elder(sent_pics, stored_pics)
    print(f"Elder Success: {success_elder}")
    assert success_elder == True
    
    fail_elder = verify_elder(wrong_pics, stored_pics)
    print(f"Elder Failure (Correctly rejected): {not fail_elder}")
    assert fail_elder == False

    print("\n--- ALL TESTS PASSED ---")

if __name__ == "__main__":
    asyncio.run(main())

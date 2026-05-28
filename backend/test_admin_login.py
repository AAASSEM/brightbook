#!/usr/bin/env python3
"""
Test admin login to debug the 401 error
"""

import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from passlib.context import CryptContext
import sqlite3

def get_db_path():
    """Get the database path"""
    db_path = backend_dir / "brightbook.db"
    return str(db_path)

def verify_password(plain: str, hashed: str) -> bool:
    """Verify password"""
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    return pwd_context.verify(plain, hashed)

def test_admin_login():
    """Test admin login"""
    db_path = get_db_path()
    print(f"📍 Database: {db_path}")

    # Test credentials
    test_email = "admin@brightbook.app"
    test_password = "admin123"

    print(f"\n🔐 Testing login:")
    print(f"   Email: {test_email}")
    print(f"   Password: {test_password}")

    # Get admin from database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("SELECT admin_id, email, password_hash, name, is_active FROM admin WHERE email = ?", (test_email,))
    admin = cursor.fetchone()
    conn.close()

    if not admin:
        print("❌ No admin found with this email")
        return

    admin_id, email, password_hash, name, is_active = admin
    print(f"\n👤 Admin found:")
    print(f"   ID: {admin_id}")
    print(f"   Email: {email}")
    print(f"   Name: {name}")
    print(f"   Active: {is_active}")
    print(f"   Password Hash: {password_hash[:50]}...")

    # Test password verification
    print(f"\n🔒 Testing password verification:")
    try:
        is_valid = verify_password(test_password, password_hash)
        print(f"   Password verification result: {is_valid}")

        if is_valid and is_active:
            print("✅ Login should succeed!")
        else:
            if not is_valid:
                print("❌ Password verification failed")
            if not is_active:
                print("❌ Account is not active")
    except Exception as e:
        print(f"❌ Error during password verification: {e}")

if __name__ == "__main__":
    test_admin_login()
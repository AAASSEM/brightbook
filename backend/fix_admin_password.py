#!/usr/bin/env python3
"""
Quick fix script to update admin password with proper hashing
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
    if not db_path.exists():
        print(f"❌ Database not found at: {db_path}")
        sys.exit(1)
    return str(db_path)

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    return pwd_context.hash(password)

def fix_admin_password():
    """Fix admin password with proper hashing"""
    db_path = get_db_path()
    print(f"📍 Database location: {db_path}")

    # Hash the admin password
    plain_password = "admin123"
    hashed_password = hash_password(plain_password)
    print(f"🔒 Hashed password: {hashed_password[:20]}...")

    # Update database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Update admin password
        cursor.execute("""
            UPDATE admin
            SET password_hash = ?
            WHERE email = 'admin@brightbook.app'
        """, (hashed_password,))

        if cursor.rowcount > 0:
            print(f"✅ Updated admin password successfully")
            conn.commit()
        else:
            print(f"❌ No admin found with email admin@brightbook.app")

        # Verify the update
        cursor.execute("SELECT email, password_hash FROM admin WHERE email = 'admin@brightbook.app'")
        admin = cursor.fetchone()
        if admin:
            print(f"👤 Admin account verified:")
            print(f"   Email: {admin[0]}")
            print(f"   Password hash: {admin[1][:20]}...")

    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
    finally:
        conn.close()

    print("\n🚀 Admin login should now work with:")
    print("   Email: admin@brightbook.app")
    print("   Password: admin123")

if __name__ == "__main__":
    fix_admin_password()
#!/usr/bin/env python3
"""
Database Cleanup Script
Deletes all users and children data, keeping only admin accounts.
Creates a fresh admin account if none exists.
"""

import sqlite3
import sys
from pathlib import Path
from passlib.context import CryptContext

def get_db_path():
    """Get the database path"""
    db_path = Path(__file__).parent / "brightbook.db"
    if not db_path.exists():
        print(f"❌ Database not found at: {db_path}")
        sys.exit(1)
    return str(db_path)

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    return pwd_context.hash(password)

def cleanup_database():
    """Clean up the database by deleting all user and child data"""
    db_path = get_db_path()
    print(f"📍 Database location: {db_path}")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Get row counts before cleanup
    def get_count(table_name):
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        return cursor.fetchone()[0]

    print("\n📊 Current database state:")
    tables = ["child", "parents", "achievement", "activity", "activity_progress",
              "child_progress", "assessment", "progress", "subscription", "notification", "complaint"]

    for table in tables:
        try:
            count = get_count(table)
            print(f"  {table}: {count} rows")
        except Exception as e:
            print(f"  {table}: Error - {e}")

    print("\n🧹 Cleaning up database...")

    # Delete in order of foreign key dependencies
    cleanup_order = [
        "achievement",           # Child achievements
        "activity_progress",     # Activity progress records
        "activity",              # Child activities
        "child_progress",        # Child learning progress
        "assessment",            # Child assessments
        "child",                 # Child records
        "progress",              # User progress
        "subscription",          # User subscriptions
        "notification",          # User notifications
        "complaint",             # User complaints
        "parents"                # Parent/user accounts
    ]

    for table in cleanup_order:
        try:
            cursor.execute(f"DELETE FROM {table}")
            deleted = cursor.rowcount
            print(f"  ✅ Deleted {deleted} rows from {table}")
        except Exception as e:
            print(f"  ❌ Error deleting from {table}: {e}")

    # Create fresh admin account
    print("\n👤 Creating fresh admin account...")

    # Hash the admin password properly
    plain_password = "admin123"
    hashed_password = hash_password(plain_password)
    print(f"  🔒 Hashing password...")

    # Check if admin exists
    cursor.execute("SELECT COUNT(*) FROM admin")
    admin_count = cursor.fetchone()[0]

    if admin_count == 0:
        # Create new admin
        cursor.execute("""
            INSERT INTO admin (email, password_hash, name, is_active, created_at)
            VALUES ('admin@brightbook.app', ?, 'System Administrator', 1, datetime('now'))
        """, (hashed_password,))
        print("  ✅ Created new admin account")
    else:
        # Update existing admin
        cursor.execute("""
            UPDATE admin
            SET password_hash = ?,
                is_active = 1,
                name = 'System Administrator'
            WHERE email = 'admin@brightbook.app'
        """, (hashed_password,))
        if cursor.rowcount == 0:
            # If no admin with expected email, update first admin
            cursor.execute("""
                UPDATE admin
                SET email = 'admin@brightbook.app',
                    password_hash = ?,
                    is_active = 1,
                    name = 'System Administrator'
                WHERE admin_id = 1
            """, (hashed_password,))
        print("  ✅ Reset existing admin account")

    conn.commit()

    # Show final state
    print("\n📊 Final database state:")
    for table in tables:
        try:
            count = get_count(table)
            print(f"  {table}: {count} rows")
        except Exception as e:
            print(f"  {table}: Error - {e}")

    # Show admin account
    print("\n👤 Admin account:")
    cursor.execute("SELECT email, name, is_active FROM admin LIMIT 1")
    admin = cursor.fetchone()
    if admin:
        print(f"  Email: {admin[0]}")
        print(f"  Name: {admin[1]}")
        print(f"  Active: {admin[2]}")
        print(f"  Password: admin123 (default)")

    conn.close()
    print("\n✅ Database cleanup completed successfully!")
    print("🚀 You can now test the app from scratch with:")
    print("   Admin: admin@brightbook.app / admin123")

if __name__ == "__main__":
    cleanup_database()
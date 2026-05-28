import sqlite3

db_path = r"C:\Users\20100\bookv2\brightbook\brightbook.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

tables = ["parents", "child", "progress", "subscription", "notification", "complaint", "assessment", "activity", "child_progress", "activity_progress"]

for table in tables:
    print(f"\n--- {table} ---")
    cursor.execute(f"SELECT sql FROM sqlite_master WHERE type='table' AND name='{table}'")
    row = cursor.fetchone()
    if row:
        print(row[0])
    else:
        print("Not found")

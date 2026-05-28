import sqlite3

def update_schema():
    conn = sqlite3.connect('brightbook.db')
    cursor = conn.cursor()
    try:
        # SQLite doesn't support ALTER TABLE ALTER COLUMN to change NULLability directly.
        # We need to recreate the table or just leave it.
        # However, we can use the 'recreate' approach or just add a default.
        # Since I'm in a controlled environment, I'll do the recreate approach.
        
        cursor.execute("PRAGMA foreign_keys=OFF;")
        cursor.execute("BEGIN TRANSACTION;")
        
        # 1. Create new table with age nullable
        cursor.execute("""
            CREATE TABLE child_new (
                Child_ID INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL,
                date_of_birth DATE,
                age INTEGER,
                native_language VARCHAR(50) DEFAULT 'English' NOT NULL,
                current_level VARCHAR(10) DEFAULT '1',
                Parent_ID INTEGER NOT NULL REFERENCES parents (Parent_ID) ON DELETE CASCADE
            );
        """)
        
        # 2. Copy data
        cursor.execute("""
            INSERT INTO child_new (Child_ID, name, date_of_birth, age, native_language, current_level, Parent_ID)
            SELECT Child_ID, name, date_of_birth, age, native_language, current_level, Parent_ID FROM child;
        """)
        
        # 3. Drop old table and rename new one
        cursor.execute("DROP TABLE child;")
        cursor.execute("ALTER TABLE child_new RENAME TO child;")
        
        cursor.execute("COMMIT;")
        cursor.execute("PRAGMA foreign_keys=ON;")
        print("Child table updated: age is now nullable.")
        
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    conn.close()

if __name__ == "__main__":
    update_schema()

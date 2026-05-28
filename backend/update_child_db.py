import sqlite3

def update_schema():
    conn = sqlite3.connect('brightbook.db')
    cursor = conn.cursor()
    try:
        # Drop redundant streak_days from child table
        cursor.execute("ALTER TABLE child DROP COLUMN streak_days;")
        conn.commit()
        print("Column 'streak_days' removed from child table.")
    except Exception as e:
        print(f"Error: {e}")
    conn.close()

if __name__ == "__main__":
    update_schema()

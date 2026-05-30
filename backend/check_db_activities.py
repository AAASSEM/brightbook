import sqlite3

def check_db():
    conn = sqlite3.connect('c:/Users/20100/bookv2/brightbook/brightbook.db')
    cursor = conn.cursor()
    
    # Find the child ID
    cursor.execute("SELECT Child_ID, name, native_language FROM child WHERE name LIKE '%Nihil aperiam eligen%'")
    child = cursor.fetchone()
    if not child:
        print("Child not found.")
        return
        
    print(f"Found Child: ID={child[0]}, Name='{child[1]}', Lang='{child[2]}'")
    
    # Check activities
    cursor.execute("SELECT COUNT(*) FROM activity WHERE Child_ID = ?", (child[0],))
    count = cursor.fetchone()[0]
    print(f"Total Activities in DB: {count}")

    if count > 0:
        cursor.execute("SELECT activity_name, language FROM activity WHERE Child_ID = ? LIMIT 5", (child[0],))
        for row in cursor.fetchall():
            print(f"- {row[0]} ({row[1]})")

check_db()

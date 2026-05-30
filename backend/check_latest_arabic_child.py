import sqlite3
import json

def check_latest_child():
    conn = sqlite3.connect('c:/Users/20100/bookv2/brightbook/brightbook.db')
    cursor = conn.cursor()
    
    # Get the latest child who has Arabic native language
    cursor.execute("SELECT Child_ID, name, native_language, current_level FROM child WHERE native_language LIKE '%ar%' OR native_language LIKE '%Ar%' ORDER BY Child_ID DESC LIMIT 1")
    child = cursor.fetchone()
    if not child:
        return
        
    cursor.execute("SELECT Activity_ID, activity_name, activity_type, activity_group, activity_content FROM activity WHERE Child_ID = ?", (child[0],))
    rows = cursor.fetchall()

    with open('c:/Users/20100/bookv2/brightbook/backend/latest_activities.txt', 'w', encoding='utf-8') as f:
        f.write(f"Latest Arabic Child: ID={child[0]}, Name='{child[1]}', Level={child[3]}\n")
        f.write(f"Total Activities in DB: {len(rows)}\n\n")
        
        for r in rows:
            content = r[4]
            if content and isinstance(content, str):
                try:
                    c = json.loads(content)
                    letter = c.get('letter', 'N/A')
                except:
                    letter = 'Parse Error'
            else:
                letter = 'N/A'
            f.write(f"- ID: {r[0]} | Name: '{r[1]}' | Type: {r[2]} | Group: {r[3]} | Letter: {letter}\n")

check_latest_child()

import sqlite3

def fix_latest_child_groups():
    conn = sqlite3.connect('c:/Users/20100/bookv2/brightbook/brightbook.db')
    cursor = conn.cursor()
    
    # Get the latest child who has Arabic native language
    cursor.execute("SELECT Child_ID FROM child WHERE native_language LIKE '%ar%' OR native_language LIKE '%Ar%' ORDER BY Child_ID DESC LIMIT 1")
    child = cursor.fetchone()
    if not child:
        return
    child_id = child[0]
    
    # Update activity_group from group_X to arabic_group_X
    cursor.execute("UPDATE activity SET activity_group = replace(activity_group, 'group_', 'arabic_group_') WHERE Child_ID = ? AND activity_group LIKE 'group_%'", (child_id,))
    
    print(f"Updated {cursor.rowcount} activities for child {child_id}.")
    conn.commit()
    conn.close()

fix_latest_child_groups()

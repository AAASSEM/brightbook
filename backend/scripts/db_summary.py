from sqlmodel import Session, create_engine, text
import os

db_path = r"C:\Users\20100\bookv2\brightbook\brightbook.db"
engine = create_engine(f"sqlite:///{db_path}")

with Session(engine) as session:
    print("--- DATABASE OVERVIEW (Root DB) ---")
    
    print("\n[Parents]")
    parents = session.execute(text("SELECT Parent_ID, name, email FROM parents")).all()
    for p in parents:
        print(f" ID {p[0]}: {p[1]} ({p[2]})")

    print("\n[Admins]")
    admins = session.execute(text("SELECT admin_id, name, email FROM admin")).all()
    for a in admins:
        print(f" ID {a[0]}: {a[1]} ({a[2]})")

    print("\n[Children]")
    children = session.execute(text("SELECT Child_ID, name, current_level, Parent_ID FROM child")).all()
    for c in children:
        print(f" ID {c[0]}: {c[1]} (Level: {c[2]}, Parent ID: {c[3]})")

    print("\n[Activity Summary]")
    total_activities = session.execute(text("SELECT count(*) FROM activity")).scalar()
    boss_levels = session.execute(text("SELECT count(*) FROM activity WHERE is_boss_level = 1")).scalar()
    print(f" Total Activities: {total_activities}")
    print(f" Boss Levels: {boss_levels}")

    print("\n[Progress Tracking]")
    completed = session.execute(text("SELECT count(*) FROM activity_progress WHERE completion_status = 'completed'")).scalar()
    started = session.execute(text("SELECT count(*) FROM activity_progress WHERE completion_status = 'started'")).scalar()
    print(f" Activities Completed: {completed}")
    print(f" Activities in Progress: {started}")

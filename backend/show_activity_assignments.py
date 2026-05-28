from app.config.database import engine
from sqlmodel import Session, select
from app.models.models import Activity, Level, LevelActivities

session = Session(engine)

print("Activity Level Assignments:")
print("=" * 60)

level_activities = session.exec(select(LevelActivities)).all()

for la in level_activities:
    activity = session.get(Activity, la.Activity_ID)
    level = session.get(Level, la.Level_ID)
    print(f"{activity.activity_name}")
    print(f"  -> Level {level.level_number}: {level.level_name}")
    print(f"  -> Type: {activity.activity_type}")
    print(f"  -> Difficulty: {activity.difficulty_level}")
    print()
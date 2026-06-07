import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config.settings import settings
from app.models.models import Parents, Child, Progress, ChildProgress, ActivityProgress, Activity, CompletionStatus, Level, LevelActivities

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def seed_progress():
    print("Finding parent...")
    parent = db.query(Parents).filter(Parents.email == "moko@mailinator.com").first()
    if not parent:
        print("Parent not found!")
        return

    print("Finding child 'sara'...")
    child = db.query(Child).filter(Child.Parent_ID == parent.Parent_ID, Child.name.ilike("sara")).first()
    if not child:
        print("Child not found! Found children:")
        for c in db.query(Child).filter(Child.Parent_ID == parent.Parent_ID).all():
            print(f"- {c.name}")
        return
        
    print(f"Child found: {child.name} (ID: {child.Child_ID})")

    # Get or create Progress
    progress = db.query(Progress).filter(Progress.Child_ID == child.Child_ID).first()
    if not progress:
        print("Creating Progress...")
        progress = Progress(Child_ID=child.Child_ID, total_score=0)
        db.add(progress)
        db.commit()
        db.refresh(progress)

    # Get or create ChildProgress
    child_progress = db.query(ChildProgress).filter(ChildProgress.Child_ID == child.Child_ID).first()
    if not child_progress:
        print("Creating ChildProgress...")
        child_progress = ChildProgress(
            progress_id=progress.progress_id,
            Child_ID=child.Child_ID,
            streak_days=30,
            letters_mastered="[]"
        )
        db.add(child_progress)
    else:
        print("Updating streak days...")
        child_progress.streak_days = 30
    
    # We want to complete Level 1, 2, and Level 3 until letter G.
    # Let's collect the Activity_IDs we want to mark as complete.
    activities_to_complete = []
    
    # Levels 1 and 2 full
    for level_id in [1, 2]:
        level_acts = db.query(LevelActivities).filter(LevelActivities.Level_ID == level_id).all()
        for la in level_acts:
            activities_to_complete.append(la.Activity_ID)
            
    # Level 3 until letter G
    # Assuming Level 3 activities are named "Meet Letter G", "Hear Sound G", etc.
    # Actually, G is the FIRST letter in group 3!
    # Jolly Phonics Group 3: G, O, U, L, F, B
    # So "until letter 'G'" means we complete all activities associated with 'G' in level 3.
    level_3_acts = db.query(LevelActivities).join(Activity).filter(LevelActivities.Level_ID == 3).all()
    for la in level_3_acts:
        # Check if the activity is for letter G
        # Activities usually have the letter at the end, like "Meet Letter G"
        act = la.activity
        if ' G' in act.activity_name or 'group_3' in str(act.activity_group) and ' G' in act.activity_name:
            activities_to_complete.append(la.Activity_ID)
            
    # Also grab any activities in group_1, group_2 just in case they aren't linked to levels properly
    group_acts = db.query(Activity).filter(Activity.activity_group.in_(['group_1', 'group_2'])).all()
    for a in group_acts:
        activities_to_complete.append(a.Activity_ID)
        
    group_3_g_acts = db.query(Activity).filter(Activity.activity_group == 'group_3', Activity.activity_name.like('% G')).all()
    for a in group_3_g_acts:
        activities_to_complete.append(a.Activity_ID)
        
    activities_to_complete = list(set(activities_to_complete))
    
    print(f"Completing {len(activities_to_complete)} activities...")
    
    completed_count = 0
    for act_id in activities_to_complete:
        ap = db.query(ActivityProgress).filter(
            ActivityProgress.activity_id == act_id,
            ActivityProgress.progress_id == progress.progress_id
        ).first()
        
        if not ap:
            ap = ActivityProgress(
                activity_id=act_id,
                progress_id=progress.progress_id,
                completion_status=CompletionStatus.completed,
                total_time_spent_minutes=5,
                total_activities_completed=1,
                stars_earned=3,
                mastery_level=100
            )
            db.add(ap)
        else:
            ap.completion_status = CompletionStatus.completed
            ap.stars_earned = 3
            ap.mastery_level = 100
        completed_count += 1
            
    # Set letters mastered
    mastered = ["s", "a", "t", "i", "p", "n", "c", "k", "e", "h", "r", "m", "d", "g"]
    child_progress.letters_mastered = json.dumps(mastered)
    child_progress.current_letter_group = "group_3"
    
    progress.total_score = completed_count * 10
    
    child.current_level = "3"
    
    db.commit()
    print("Done seeding progress!")

if __name__ == "__main__":
    seed_progress()

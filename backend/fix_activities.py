import asyncio
from sqlmodel import Session, select
from app.config.database import engine
from app.models.models import Parents, Child, Assessment, Activity, ActivityProgress, Progress
from app.services.ai_service import generate_activities_for_child
from app.models.enums import ActivityType, DifficultyLevel

def fix_child_activities(child_id: int):
    with Session(engine) as session:
        child = session.get(Child, child_id)
        if not child:
            print(f"Child {child_id} not found.")
            return

        assessment = session.exec(select(Assessment).where(Assessment.Child_ID == child_id)).first()
        if not assessment:
            print("No assessment found for this child.")
            return

        print(f"Generating activities for {child.name}...")
        activities_data = generate_activities_for_child(
            child_id=child.Child_ID,
            child_name=child.name,
            child_age=child.age,
            literacy_level=1,
            weak_areas=["letter_recognition", "phonics"],
            native_language=child.native_language
        )

        created_count = 0
        for activity_data in activities_data:
            try:
                activity_type_str = activity_data.get("activity_type", "meet_letter")
                activity_type = ActivityType(activity_type_str)

                difficulty_str = activity_data.get("difficulty_level", "beginner")
                difficulty_level = DifficultyLevel(difficulty_str)

                new_activity = Activity(
                    activity_name=activity_data["activity_name"],
                    activity_type=activity_type,
                    difficulty_level=difficulty_level,
                    language=activity_data.get("language", "English"),
                    activity_content=activity_data.get("activity_content", {}),
                    estimated_duration_minutes=activity_data.get("estimated_duration_minutes", 10),
                    Child_ID=activity_data["Child_ID"],
                    activity_group=activity_data.get("activity_group", "group_1"),
                    mascot_character=activity_data.get("mascot_character", "Learning Friend"),
                    is_boss_level=activity_data.get("is_boss_level", False)
                )
                session.add(new_activity)
                session.commit()
                session.refresh(new_activity)
                created_count += 1
            except Exception as e:
                print(f"Error creating activity {activity_data.get('activity_name')}: {e}")
                continue
        
        print(f"Created {created_count} activities.")
        
        if created_count > 0:
            progress = session.exec(
                select(Progress).where(Progress.Child_ID == child.Child_ID)
            ).first()

            if progress:
                all_activities = session.exec(
                    select(Activity).where(Activity.Child_ID == child.Child_ID)
                ).all()

                for activity in all_activities:
                    existing_progress = session.exec(
                        select(ActivityProgress).where(
                            ActivityProgress.progress_id == progress.progress_id,
                            ActivityProgress.activity_id == activity.Activity_ID
                        )
                    ).first()

                    if not existing_progress:
                        new_progress = ActivityProgress(
                            progress_id=progress.progress_id,
                            activity_id=activity.Activity_ID,
                            completion_status='not_started',
                            stars_earned=0,
                            mastery_level=0,
                            total_time_spent_minutes=0,
                            total_activities_completed=0
                        )
                        session.add(new_progress)
                session.commit()
                print("Created progress records.")

if __name__ == "__main__":
    import sys
    # Child_ID is 10
    fix_child_activities(10)

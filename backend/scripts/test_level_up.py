"""
Test the level-up logic by simulating completed activities.
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlmodel import Session, select
from app.config.database import engine
from app.models.models import Child, Activity, Progress, ActivityProgress, ChildProgress
import json

def test_level_up():
    """Simulate completing activities and test level-up logic"""
    with Session(engine) as session:
        # Get Sara
        sara = session.exec(select(Child).where(Child.name == 'Sara')).first()
        if not sara:
            print("Sara not found!")
            return

        print(f"👧 Testing level-up for Sara (ID: {sara.Child_ID})")
        print(f"   Current Level: {sara.current_level}")

        # Get her progress
        progress = session.exec(select(Progress).where(Progress.Child_ID == sara.Child_ID)).first()
        if not progress:
            print("No progress record found!")
            return

        # Get first 4 activities to complete
        activities = session.exec(
            select(Activity).where(Activity.Child_ID == sara.Child_ID).limit(4)
        ).all()

        print(f"\n📝 Simulating completion of {len(activities)} activities...")

        for i, activity in enumerate(activities, 1):
            print(f"   {i}. Completing: {activity.activity_name}")

            # Create or update activity progress
            activity_progress = session.exec(
                select(ActivityProgress).where(
                    ActivityProgress.activity_id == activity.Activity_ID,
                    ActivityProgress.progress_id == progress.progress_id
                )
            ).first()

            if not activity_progress:
                activity_progress = ActivityProgress(
                    activity_id=activity.Activity_ID,
                    progress_id=progress.progress_id,
                    completion_status="not_started",
                    stars_earned=0,
                    mastery_level=0,
                    total_time_spent_minutes=0,
                    total_activities_completed=0
                )
                session.add(activity_progress)

            # Mark as completed with good performance
            activity_progress.completion_status = "completed"
            activity_progress.stars_earned = 3  # Perfect score
            activity_progress.mastery_level = 95
            activity_progress.total_time_spent_minutes = 5
            activity_progress.total_activities_completed += 1

            session.add(activity_progress)
            session.commit()

        # Check completed count
        activity_progress_list = session.exec(
            select(ActivityProgress).where(ActivityProgress.progress_id == progress.progress_id)
        ).all()

        completed_count = len([ap for ap in activity_progress_list if ap.completion_status == "completed"])

        print(f"\n✅ Completed Activities: {completed_count}")
        print(f"   Current Level: {sara.current_level}")

        # Test level-up logic
        level_requirements = {
            1: 4,   # Complete 4 activities to reach level 2
            2: 8,   # Complete 8 activities to reach level 3
            3: 12,  # Complete 12 activities to reach level 4
            4: 16,  # Complete 16 activities to reach level 5
            5: 999  # Max level
        }

        # Handle both string and integer current_level
        current_level = int(sara.current_level or 1)
        required_for_next = level_requirements.get(current_level, 999)

        if completed_count >= required_for_next and current_level < 5:
            print(f"\n🎉 Ready to level up! ({completed_count} >= {required_for_next})")

            # Apply level up
            next_level = current_level + 1
            sara.current_level = next_level
            session.add(sara)
            session.commit()

            print(f"   ➡️ Leveled up to Level {next_level}!")

            # Create new activities for level 2 (sound_blender and word_builder)
            print(f"\n🔓 Unlocking Level {next_level} activities...")

            # Create sound_blender activities for S and A
            for letter in ['S', 'A']:
                blender_activity = Activity(
                    activity_name=f"Blend Sounds with {letter}",
                    activity_type="sound_blender",
                    difficulty_level="medium",
                    language="English",
                    activity_content=json.dumps({
                        "letter": letter,
                        "mascot_character": get_mascot_for_letter(letter),
                        "words_to_build": get_blending_words(letter)
                    }),
                    activity_group="group_1_words",
                    mascot_character=get_mascot_for_letter(letter),
                    estimated_duration_minutes=8,
                    Child_ID=sara.Child_ID,
                    is_boss_level=False
                )
                session.add(blender_activity)
                session.commit()
                session.refresh(blender_activity)
                print(f"   + Created: {blender_activity.activity_name}")

            # Get total activities after level up
            total_activities = session.exec(
                select(Activity).where(Activity.Child_ID == sara.Child_ID)
            ).all()
            print(f"\n📊 Total Activities: {len(total_activities)}")

        else:
            print(f"\n📚 Keep working! Need {required_for_next - completed_count} more activities to level up.")

def get_mascot_for_letter(letter):
    """Get mascot character name for letter"""
    mascots = {
        'S': 'Sammy Snake',
        'A': 'Annie Ant',
        'T': 'Timmy Tennis',
        'I': 'Iggy Iguana',
        'P': 'Perry Pig',
        'N': 'Ned Newt'
    }
    return mascots.get(letter, 'Learning Friend')

def get_blending_words(letter):
    """Get word blending examples for a letter"""
    words = {
        'S': [
            {'word': 'SUN', 'emoji': '☀️', 'phonetic_sounds': ['/sss/', '/uh/', '/nn/'], 'blended_sound': 'sun'},
            {'word': 'SOAP', 'emoji': '🧼', 'phonetic_sounds': ['/sss/', '/oh/', '/aaa/', '/p/'], 'blended_sound': 'soap'}
        ],
        'A': [
            {'word': 'APPLE', 'emoji': '🍎', 'phonetic_sounds': ['/aaa/', '/p/', '/p/', '/l/', '/eee/'], 'blended_sound': 'apple'},
            {'word': 'ANT', 'emoji': '🐜', 'phonetic_sounds': ['/aaa/', '/nn/', '/t/'], 'blended_sound': 'ant'}
        ]
    }
    return words.get(letter, [])

if __name__ == "__main__":
    print("🧪 Testing Level-Up Logic...")
    test_level_up()
    print("✅ Test complete!")

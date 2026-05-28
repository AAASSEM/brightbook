"""
Seed demo data — levels, activities (all 5 types), and assessment questions.
Run: python scripts/seed_data.py
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlmodel import Session, select
from app.config.database import engine, create_db_and_tables
from app.models.models import Level, Activity, LevelActivities, AssessmentQuestion, Assessment, Admin
from app.models.enums import DifficultyLevel, ActivityType
from app.utils.security import hash_password
from datetime import date

def seed_all():
    create_db_and_tables()
    with Session(engine) as session:
        # ── ADMIN ──────────────────────────────────────────────────────────────────
        existing_admin = session.exec(select(Admin).where(Admin.email == "admin@brightbook.app")).first()
        if not existing_admin:
            admin = Admin(
                name="BrightBook Admin",
                email="admin@brightbook.app",
                password_hash=hash_password("Admin@123"),
                is_active=True,
            )
            session.add(admin)
            session.commit()
            print("Admin created: admin@brightbook.app / Admin@123")

        # ── LEVELS ─────────────────────────────────────────────────────────────────
        levels_data = [
            {"level_number": 1, "level_name": "Letter Explorer", "difficulty": DifficultyLevel.beginner,
             "description": "Learn to recognize letters A-Z and their sounds.", "num_activities_required": 5,
             "estimated_score_to_next_level": 70,
             "skills_json": {"skills": ["letter_recognition", "alphabet_order", "uppercase_lowercase"]}},
            {"level_number": 2, "level_name": "Sound Starter", "difficulty": DifficultyLevel.easy,
             "description": "Connect letters to their phonetic sounds.", "num_activities_required": 6,
             "estimated_score_to_next_level": 75,
             "skills_json": {"skills": ["phonics", "letter_sounds", "consonant_blends"]}},
            {"level_number": 3, "level_name": "Word Builder", "difficulty": DifficultyLevel.medium,
             "description": "Build and read simple 3-letter words.", "num_activities_required": 7,
             "estimated_score_to_next_level": 78,
             "skills_json": {"skills": ["word_formation", "CVC_words", "sight_words"]}},
            {"level_number": 4, "level_name": "Story Reader", "difficulty": DifficultyLevel.hard,
             "description": "Read short sentences and simple stories.", "num_activities_required": 8,
             "estimated_score_to_next_level": 82,
             "skills_json": {"skills": ["reading_comprehension", "sentence_structure", "punctuation"]}},
            {"level_number": 5, "level_name": "Book Champion", "difficulty": DifficultyLevel.advanced,
             "description": "Read independently and master complex vocabulary.", "num_activities_required": 10,
             "estimated_score_to_next_level": 85,
             "skills_json": {"skills": ["advanced_literacy", "critical_reading", "vocabulary_expansion"]}},
        ]

        created_levels = []
        for l_data in levels_data:
            existing = session.exec(select(Level).where(Level.level_number == l_data["level_number"])).first()
            if not existing:
                level = Level(**l_data)
                session.add(level)
                session.commit()
                session.refresh(level)
                created_levels.append(level)
            else:
                created_levels.append(existing)

        # ── ACTIVITIES ─────────────────────────────────────────────────────────────
        activities_data = [
            # Level 1
            {"activity_name": "Letter Hunt: Uppercase A-E", "activity_type": ActivityType.letter_hunt,
             "difficulty_level": DifficultyLevel.beginner, "language": "English", "estimated_duration_minutes": 10,
             "activity_content": {"instruction": "Find the letters A, B, C, D, and E in the picture.", "questions": [{"q": "Where is the letter A?", "options": ["Tree", "Sun", "Cloud"], "answer": "Sun"}]}},
            {"activity_name": "Phonics Match: A is for Apple", "activity_type": ActivityType.phonics_match,
             "difficulty_level": DifficultyLevel.beginner, "language": "English", "estimated_duration_minutes": 10,
             "activity_content": {"instruction": "Match the letter sound to the correct object.", "questions": [{"q": "Which object starts with the 'Ah' sound?", "options": ["Apple", "Ball", "Cat"], "answer": "Apple"}]}},
            # Level 2
            {"activity_name": "Letter Tracing: A, B, C", "activity_type": ActivityType.letter_tracing,
             "difficulty_level": DifficultyLevel.easy, "language": "English", "estimated_duration_minutes": 15,
             "activity_content": {"instruction": "Trace the letters A, B, and C following the arrows.", "questions": []}},
            {"activity_name": "Story Time: The Little Red Hen", "activity_type": ActivityType.story_time,
             "difficulty_level": DifficultyLevel.easy, "language": "English", "estimated_duration_minutes": 20,
             "activity_content": {"story": "The Little Red Hen found some grain. She asked for help...", "questions": [{"q": "Who found the grain?", "options": ["Dog", "Cat", "Hen"], "answer": "Hen"}]}},
            # Level 3
            {"activity_name": "Word Builder: 3-Letter Words", "activity_type": ActivityType.word_builder,
             "difficulty_level": DifficultyLevel.medium, "language": "English", "estimated_duration_minutes": 15,
             "activity_content": {"instruction": "Drag the letters to spell the word for the picture.", "questions": [{"q": "Spell the word for DOG", "options": ["D-O-G", "C-A-T", "S-U-N"], "answer": "D-O-G"}]}},
            {"activity_name": "Phonics Match: Consonant Blends", "activity_type": ActivityType.phonics_match,
             "difficulty_level": DifficultyLevel.medium, "language": "English", "estimated_duration_minutes": 12,
             "activity_content": {"instruction": "Identify the blend sound (e.g., 'bl', 'st').", "questions": [{"q": "Which word starts with 'BL'?", "options": ["Blue", "Red", "Green"], "answer": "Blue"}]}},
            # Level 4
            {"activity_name": "Letter Hunt: F-J", "activity_type": ActivityType.letter_hunt,
             "difficulty_level": DifficultyLevel.hard, "language": "English", "estimated_duration_minutes": 12,
             "activity_content": {"instruction": "Find F, G, H, I, J.", "questions": []}},
            {"activity_name": "Word Builder: Sight Words", "activity_type": ActivityType.word_builder,
             "difficulty_level": DifficultyLevel.hard, "language": "English", "estimated_duration_minutes": 15,
             "activity_content": {"instruction": "Complete the sentence with a sight word.", "questions": [{"q": "The ___ jumped over the moon.", "options": ["Cow", "Cat", "Dog"], "answer": "Cow"}]}},
            # Level 5
            {"activity_name": "Story Time: The Tortoise and the Hare", "activity_type": ActivityType.story_time,
             "difficulty_level": DifficultyLevel.advanced, "language": "English", "estimated_duration_minutes": 20,
             "activity_content": {"story": "A tortoise and a hare had a race...", "questions": [{"q": "Who won the race?", "options": ["Tortoise", "Hare"], "answer": "Tortoise"}]}},
            {"activity_name": "Advanced Phonics: Vowel Teams", "activity_type": ActivityType.phonics_match,
             "difficulty_level": DifficultyLevel.advanced, "language": "English", "estimated_duration_minutes": 15,
             "activity_content": {"instruction": "Identify the vowel team (e.g., 'ai', 'ea').", "questions": [{"q": "Which word has 'AI'?", "options": ["Rain", "Read", "Road"], "answer": "Rain"}]}},
        ]

        created_activities = []
        for a_data in activities_data:
            existing_act = session.exec(select(Activity).where(Activity.activity_name == a_data["activity_name"])).first()
            if not existing_act:
                activity = Activity(**a_data)
                session.add(activity)
                session.commit()
                session.refresh(activity)
                
                # Assign to correct level based on difficulty/index
                level_num = 1
                if "Level 2" in activity.activity_name or created_activities.count(activity) in [2, 3]: # Simple mapping
                     if len(created_activities) < 2: level_num = 1
                     elif len(created_activities) < 4: level_num = 2
                     elif len(created_activities) < 6: level_num = 3
                     elif len(created_activities) < 8: level_num = 4
                     else: level_num = 5
                
                # Hardcoded mapping for seed
                idx = len(created_activities)
                l_num = (idx // 2) + 1
                level = session.exec(select(Level).where(Level.level_number == l_num)).first()
                if level:
                    la = LevelActivities(Activity_ID=activity.Activity_ID, Level_ID=level.Level_ID)
                    session.add(la)
                    session.commit()
            else:
                activity = existing_act

            created_activities.append(activity)

        print(f"\nSeeding complete! {len(created_levels)} levels, {len(created_activities)} activities.")
        print("\nAdmin login: admin@brightbook.app / Admin@123")

if __name__ == "__main__":
    seed_all()

"""
Template activity seeding script for BrightBook
Creates sample template activities that admins can manage and assign to children
"""
from sqlmodel import Session, select
from app.config.database import engine
from app.models.models import Activity, Level, LevelActivities
from app.models.enums import ActivityType, DifficultyLevel
import json

def seed_template_activities():
    """Seed the database with template activities"""

    with Session(engine) as session:
        # Check if template activities already exist
        existing_templates = session.exec(
            select(Activity).where(Activity.Child_ID.is_(None)).limit(1)
        ).first()

        if existing_templates:
            print("Template activities already exist. Skipping seed.")
            return

        # Get levels for assignment
        levels = session.exec(select(Level).order_by(Level.level_number)).all()
        level_map = {l.level_number: l.Level_ID for l in levels}

        template_activities = [
            # Level 1 Activities - Letter Sounds & Recognition
            {
                "activity_name": "Meet the Letter S",
                "activity_type": ActivityType.meet_letter,
                "difficulty_level": DifficultyLevel.beginner,
                "language": "en",
                "activity_content": json.dumps({
                    "title": "Meet the Letter S",
                    "instruction": "Let's learn about the letter S! Can you find the snake?",
                    "stimulus": "🐍",
                    "options": ["S", "A", "M", "T"],
                    "correct_answer": "S",
                    "audio_instruction": "Touch the snake to hear the S sound",
                    "success_message": "Great job! S is for snake! 🐍"
                }),
                "estimated_duration_minutes": 5,
                "activity_group": "letters_s",
                "mascot_character": "Sammy Snake",
                "is_boss_level": False,
                "Child_ID": None
            },
            {
                "activity_name": "Hear the Sound A",
                "activity_type": ActivityType.hear_sound,
                "difficulty_level": DifficultyLevel.beginner,
                "language": "en",
                "activity_content": json.dumps({
                    "title": "Hear the Sound A",
                    "instruction": "Listen carefully! Which picture starts with the A sound?",
                    "stimulus": "🔊",
                    "options": ["🍎 Apple", "� Dog", "🐱 Cat", "🌞 Sun"],
                    "correct_answer": "🍎 Apple",
                    "audio_sound": "a",
                    "success_message": "Perfect! A is for apple! 🍎"
                }),
                "estimated_duration_minutes": 5,
                "activity_group": "sounds_a",
                "mascot_character": "Amy Apple",
                "is_boss_level": False,
                "Child_ID": None
            },
            {
                "activity_name": "Letter Hunt T",
                "activity_type": ActivityType.letter_hunt,
                "difficulty_level": DifficultyLevel.beginner,
                "language": "en",
                "activity_content": json.dumps({
                    "title": "Find the Letter T",
                    "instruction": "Can you find all the letter T's hiding in the picture?",
                    "stimulus": "A picture with hidden letters",
                    "grid_size": "3x3",
                    "target_letter": "T",
                    "distractors": ["S", "A", "M"],
                    "success_message": "Amazing! You found all the T's! 🎯"
                }),
                "estimated_duration_minutes": 8,
                "activity_group": "letters_t",
                "mascot_character": "Tiger Tim",
                "is_boss_level": False,
                "Child_ID": None
            },
            {
                "activity_name": "Trace Letter M",
                "activity_type": ActivityType.trace_write,
                "difficulty_level": DifficultyLevel.beginner,
                "language": "en",
                "activity_content": json.dumps({
                    "title": "Trace the Letter M",
                    "instruction": "Trace the letter M with your finger",
                    "letter": "M",
                    "trace_path": "M outline for tracing",
                    "success_message": "Beautiful tracing! M is for mountain! 🏔️"
                }),
                "estimated_duration_minutes": 5,
                "activity_group": "writing_m",
                "mascot_character": "Marty Mouse",
                "is_boss_level": False,
                "Child_ID": None
            },

            # Level 2 Activities - Word Building & Blending
            {
                "activity_name": "Sound Blender -at",
                "activity_type": ActivityType.sound_blender,
                "difficulty_level": DifficultyLevel.beginner,
                "language": "en",
                "activity_content": json.dumps({
                    "title": "Build Words with -at",
                    "instruction": "Combine sounds to make words: c-at, b-at, h-at",
                    "word_family": "at",
                    "letters": ["c", "b", "h", "r"],
                    "target_words": ["cat", "bat", "hat", "rat"],
                    "success_message": "Wonderful word building! 📚"
                }),
                "estimated_duration_minutes": 10,
                "activity_group": "blending_at",
                "mascot_character": "Blending Bunny",
                "is_boss_level": False,
                "Child_ID": None
            },
            {
                "activity_name": "Word Builder CV",
                "activity_type": ActivityType.word_builder,
                "difficulty_level": DifficultyLevel.easy,
                "language": "en",
                "activity_content": json.dumps({
                    "title": "Build Simple Words",
                    "instruction": "Put letters together to make words",
                    "word_patterns": ["CV", "VC"],
                    "letters": ["s", "a", "t", "m", "i"],
                    "target_words": ["at", "sat", "mat", "it"],
                    "success_message": "Great word building! 🏆"
                }),
                "estimated_duration_minutes": 10,
                "activity_group": "words_cv",
                "mascot_character": "Word Wizard",
                "is_boss_level": False,
                "Child_ID": None
            },

            # Level 3 Activities - Sentences & Stories
            {
                "activity_name": "Story Time - The Cat",
                "activity_type": ActivityType.story_time,
                "difficulty_level": DifficultyLevel.intermediate,
                "language": "en",
                "activity_content": json.dumps({
                    "title": "The Cat Sat",
                    "instruction": "Read the story and answer questions",
                    "story": "The cat sat on the mat. The cat was happy.",
                    "questions": [
                        {
                            "question": "Where did the cat sit?",
                            "options": ["mat", "chair", "bed", "table"],
                            "correct_answer": "mat"
                        },
                        {
                            "question": "How did the cat feel?",
                            "options": ["sad", "happy", "angry", "tired"],
                            "correct_answer": "happy"
                        }
                    ],
                    "success_message": "Fantastic reading! 📖"
                }),
                "estimated_duration_minutes": 15,
                "activity_group": "stories_basic",
                "mascot_character": "Storyteller Owl",
                "is_boss_level": False,
                "Child_ID": None
            },
            {
                "activity_name": "Read & Match",
                "activity_type": ActivityType.read_match,
                "difficulty_level": DifficultyLevel.intermediate,
                "language": "en",
                "activity_content": json.dumps({
                    "title": "Match Words to Pictures",
                    "instruction": "Read the word and match it to the right picture",
                    "word_picture_pairs": [
                        {"word": "dog", "picture": "🐕", "distractors": ["🐱", "🐦", "🐟"]},
                        {"word": "sun", "picture": "☀️", "distractors": ["🌙", "⭐", "☁️"]},
                        {"word": "tree", "picture": "🌳", "distractors": ["🌹", "🌾", "🍄"]}
                    ],
                    "success_message": "Perfect matching! 🎯"
                }),
                "estimated_duration_minutes": 10,
                "activity_group": "reading_match",
                "mascot_character": "Matching Monkey",
                "is_boss_level": False,
                "Child_ID": None
            },

            # Level 4 Activities - Advanced Reading
            {
                "activity_name": "Advanced Story Comprehension",
                "activity_type": ActivityType.story_time,
                "difficulty_level": DifficultyLevel.advanced,
                "language": "en",
                "activity_content": json.dumps({
                    "title": "The Lost Puppy",
                    "instruction": "Read the story and answer the questions",
                    "story": "One sunny day, a little puppy named Max wandered away from his home. He saw a butterfly and chased it into the forest. Soon, Max realized he was lost. He felt scared and alone. Suddenly, he heard a familiar bark. It was his friend, Bella! Bella led Max back to his worried owner. Max was safe again.",
                    "questions": [
                        {
                            "question": "Why did Max run away?",
                            "options": ["He was hungry", "He chased a butterfly", "He wanted to play", "He was lost"],
                            "correct_answer": "He chased a butterfly"
                        },
                        {
                            "question": "How did Max feel when he was lost?",
                            "options": ["happy", "excited", "scared", "angry"],
                            "correct_answer": "scared"
                        },
                        {
                            "question": "Who helped Max find his way home?",
                            "options": ["His owner", "Bella", "The butterfly", "He found it himself"],
                            "correct_answer": "Bella"
                        }
                    ],
                    "success_message": "Excellent comprehension! 🌟"
                }),
                "estimated_duration_minutes": 20,
                "activity_group": "stories_advanced",
                "mascot_character": "Professor Parrot",
                "is_boss_level": False,
                "Child_ID": None
            },

            # Level 5 Activities - Literacy Mastery
            {
                "activity_name": "Creative Writing Adventure",
                "activity_type": ActivityType.mini_quest,
                "difficulty_level": DifficultyLevel.expert,
                "language": "en",
                "activity_content": json.dumps({
                    "title": "Write Your Own Story",
                    "instruction": "Create your own story using these words: adventure, discovered, amazing",
                    "required_words": ["adventure", "discovered", "amazing"],
                    "story_starter": "One day, Emma went on an adventure...",
                    "word_bank": ["adventure", "discovered", "amazing", "treasure", "journey", "exciting"],
                    "min_length": 3,
                    "success_message": "Wonderful creative writing! ✍️🌟"
                }),
                "estimated_duration_minutes": 25,
                "activity_group": "creative_writing",
                "mascot_character": "Author Owl",
                "is_boss_level": False,
                "Child_ID": None
            },
            {
                "activity_name": "Literacy Boss Challenge",
                "activity_type": ActivityType.mini_quest,
                "difficulty_level": DifficultyLevel.expert,
                "language": "en",
                "activity_content": json.dumps({
                    "title": "Ultimate Literacy Challenge",
                    "instruction": "Complete all literacy challenges to become a master!",
                    "challenges": [
                        {"type": "reading", "task": "Read a complex story", "time_limit": 120},
                        {"type": "comprehension", "task": "Answer detailed questions", "accuracy_required": 90},
                        {"type": "vocabulary", "task": "Use advanced words correctly", "min_words": 5},
                        {"type": "writing", "task": "Write a creative paragraph", "min_length": 50}
                    ],
                    "success_message": "🏆 CONGRATULATIONS! You are a Literacy Master! 🏆"
                }),
                "estimated_duration_minutes": 30,
                "activity_group": "boss_challenge",
                "mascot_character": "Master Mentor",
                "is_boss_level": True,
                "Child_ID": None
            }
        ]

        # Add activities and assign to levels
        created_activities = []
        for activity_data in template_activities:
            activity = Activity(**activity_data)
            session.add(activity)
            session.flush()  # Get the Activity_ID
            created_activities.append(activity)

            # Assign to appropriate level based on difficulty
            level_number = 1
            if activity_data["difficulty_level"] == DifficultyLevel.beginner:
                level_number = 1 if activity_data["activity_group"].startswith("letters") or activity_data["activity_group"].startswith("sounds") else 2
            elif activity_data["difficulty_level"] == DifficultyLevel.easy:
                level_number = 2
            elif activity_data["difficulty_level"] == DifficultyLevel.intermediate:
                level_number = 3
            elif activity_data["difficulty_level"] == DifficultyLevel.advanced:
                level_number = 4
            elif activity_data["difficulty_level"] == DifficultyLevel.expert:
                level_number = 5

            # Assign to level
            if level_number in level_map:
                level_activity = LevelActivities(
                    Activity_ID=activity.Activity_ID,
                    Level_ID=level_map[level_number]
                )
                session.add(level_activity)

        session.commit()
        print(f"Successfully seeded {len(created_activities)} template activities!")
        print(f"Activities assigned to levels {sorted(level_map.keys())}")

if __name__ == "__main__":
    print("Seeding template activities...")
    seed_template_activities()
    print("Activity seeding complete!")
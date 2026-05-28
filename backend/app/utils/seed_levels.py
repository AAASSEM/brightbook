"""
Level seeding script for BrightBook literacy levels
Based on Jolly Phonics methodology and literacy development stages
"""
from sqlmodel import Session, select
from app.config.database import engine
from app.models.models import Level
import asyncio

def seed_levels():
    """Seed the database with initial literacy levels"""

    levels_data = [
        {
            "level_number": 1,
            "level_name": "Letter Sounds & Recognition",
            "description": "Introduction to basic letter sounds and recognition using Jolly Phonics groups 1-2",
            "difficulty": "beginner",
            "num_activities_required": 10,
            "age_range": "3-4 years",
            "skills_focus": ["Letter recognition", "Basic phonics", "Letter sounds", "Simple blending"]
        },
        {
            "level_number": 2,
            "level_name": "Word Building & Blending",
            "description": "Progress to building simple words and blending sounds using Jolly Phonics groups 3-4",
            "difficulty": "beginner",
            "num_activities_required": 15,
            "age_range": "4-5 years",
            "skills_focus": ["Word formation", "Sound blending", "Simple words", "Reading readiness"]
        },
        {
            "level_number": 3,
            "level_name": "Sentences & Stories",
            "description": "Read and understand simple sentences and stories using all Jolly Phonics sounds",
            "difficulty": "intermediate",
            "num_activities_required": 20,
            "age_range": "5-6 years",
            "skills_focus": ["Sentence reading", "Comprehension", "Vocabulary", "Fluency"]
        },
        {
            "level_number": 4,
            "level_name": "Advanced Reading",
            "description": "Develop advanced reading skills with complex texts and comprehension",
            "difficulty": "advanced",
            "num_activities_required": 25,
            "age_range": "6-7 years",
            "skills_focus": ["Advanced comprehension", "Critical thinking", "Vocabulary expansion", "Reading strategies"]
        },
        {
            "level_number": 5,
            "level_name": "Literacy Mastery",
            "description": "Master comprehensive literacy skills including independent reading and writing",
            "difficulty": "expert",
            "num_activities_required": 30,
            "age_range": "7-8 years",
            "skills_focus": ["Independent reading", "Writing skills", "Advanced comprehension", "Creative expression"]
        }
    ]

    with Session(engine) as session:
        # Check if levels already exist
        existing_levels = session.exec(select(Level).limit(1)).first()
        if existing_levels:
            print("Levels already exist in database. Skipping seed.")
            return

        # Add levels
        for level_data in levels_data:
            level = Level(**level_data)
            session.add(level)

        session.commit()
        print(f"Successfully seeded {len(levels_data)} literacy levels!")

if __name__ == "__main__":
    print("Seeding literacy levels...")
    seed_levels()
    print("Level seeding complete!")
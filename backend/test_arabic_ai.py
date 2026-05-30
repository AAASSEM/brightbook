import os
import sys
import json
import logging

sys.path.append("c:/Users/20100/bookv2/brightbook/backend")

from app.services.ai_service import generate_activities_for_child
from dotenv import load_dotenv

load_dotenv("c:/Users/20100/bookv2/brightbook/backend/.env")

def test_generation():
    print("Testing AI Activity Generation for Arabic Native Language...")
    try:
        activities = generate_activities_for_child(
            child_id=999,
            child_name="Nihil aperiam eligen",
            child_age=7,
            literacy_level=1,
            weak_areas=["Reading", "Phonics"],
            native_language="Arabic"
        )
        with open("ai_arabic_test_output.json", "w", encoding="utf-8") as f:
            json.dump(activities, f, indent=2, ensure_ascii=False)
        print("SUCCESS! Output written to ai_arabic_test_output.json")
    except Exception as e:
        print(f"\nERROR: {e}")

if __name__ == "__main__":
    test_generation()

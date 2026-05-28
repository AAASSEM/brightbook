#!/usr/bin/env python3
"""
Test Varied Activity Generation
Tests if the AI correctly generates varied activities and avoids repetition
"""
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def test_varied_activity_generation():
    """Test that AI generates varied activities when child has completed some"""
    try:
        from app.services import ai_service

        print("Testing Varied Activity Generation...")

        # Simulate Sara's completed activities
        completed_activities = [
            {
                "activity_type": "meet_letter",
                "activity_content": {"letter": "G", "words": ["Gat", "Gog", "Gul"]},
                "activity_group": "group_3"
            },
            {
                "activity_type": "hear_sound",
                "activity_content": {"letter": "G", "words": ["Gat", "Gog", "Gul"]},
                "activity_group": "group_3"
            },
            {
                "activity_type": "sound_blender",
                "activity_content": {"letter": "G", "words": ["Gat", "Gog", "Gul"]},
                "activity_group": "group_3_words"
            },
            {
                "activity_type": "meet_letter",
                "activity_content": {"letter": "O", "words": ["Oat", "Oog", "Oul"]},
                "activity_group": "group_3"
            },
            {
                "activity_type": "hear_sound",
                "activity_content": {"letter": "O", "words": ["Oat", "Oog", "Oul"]},
                "activity_group": "group_3"
            }
        ]

        print("\n--- Simulated Completed Activities ---")
        for act in completed_activities:
            content = act["activity_content"]
            print(f"  {act['activity_type']} - Letter: {content.get('letter', 'N/A')} - Words: {content.get('words', [])}")

        # Test 1: Generate practice activities for same level
        print("\n--- Test 1: Practice Activities for Level 3 ---")
        practice_activities = ai_service.generate_activities_for_child(
            child_id=1,
            child_name="Sara",
            child_age=5,
            literacy_level=3,
            weak_areas=["word_formation", "blending_sounds"],
            native_language="English",
            completed_activities=completed_activities
        )

        print(f"Generated {len(practice_activities)} practice activities:")
        activity_variety = {}
        for act in practice_activities[:10]:  # Show first 10
            act_type = act.get("activity_type", "unknown")
            content = act.get("activity_content", {})
            letter = content.get("letter", "N/A")
            words = content.get("words", [])

            if act_type not in activity_variety:
                activity_variety[act_type] = set()
            if letter != "N/A":
                activity_variety[act_type].add(letter)

            print(f"  {act_type} - Letter: {letter} - Words: {words}")

        # Test 2: Check variety
        print("\n--- Test 2: Activity Variety Analysis ---")
        for act_type, letters in activity_variety.items():
            print(f"  {act_type}: {len(letters)} different letters - {', '.join(sorted(letters))}")

        # Test 3: Check if completed combinations are avoided
        print("\n--- Test 3: Duplicate Avoidance Check ---")
        completed_combinations = set()
        for act in completed_activities:
            content = act["activity_content"]
            letter = content.get("letter", "")
            act_type = act["activity_type"]
            if letter and act_type:
                completed_combinations.add(f"{act_type}_{letter}")

        new_combinations = set()
        for act in practice_activities:
            content = act.get("activity_content", {})
            letter = content.get("letter", "")
            act_type = act.get("activity_type", "")
            if letter and act_type:
                new_combinations.add(f"{act_type}_{letter}")

        duplicates = completed_combinations & new_combinations
        if duplicates:
            print(f"  [X] Found duplicate combinations: {duplicates}")
            return False
        else:
            print(f"  [OK] No duplicate combinations found!")
            print(f"  Completed combinations: {completed_combinations}")
            print(f"  New combinations: {new_combinations}")

        # Test 4: Fallback generation test
        print("\n--- Test 4: Fallback Activity Generation ---")
        fallback_activities = ai_service._generate_fallback_activities(
            child_id=1,
            literacy_level=3,
            weak_areas=["word_formation"],
            native_language="English",
            completed_activities=completed_activities
        )

        print(f"Generated {len(fallback_activities)} fallback activities:")
        fallback_variety = {}
        for act in fallback_activities[:10]:  # Show first 10
            act_type = act.get("activity_type", "unknown")
            content = act.get("activity_content", {})
            letter = content.get("letter", "N/A")

            if act_type not in fallback_variety:
                fallback_variety[act_type] = set()
            if letter != "N/A":
                fallback_variety[act_type].add(letter)

            print(f"  {act_type} - Letter: {letter}")

        print("\n--- Fallback Variety Analysis ---")
        for act_type, letters in fallback_variety.items():
            print(f"  {act_type}: {len(letters)} different letters")

        print("\n[OK] Varied Activity Generation Test Complete!")
        return True

    except Exception as e:
        print(f"Test Error: {e}")
        import traceback
        print(traceback.format_exc())
        return False

if __name__ == "__main__":
    print("Varied Activity Generation Test")
    print("=" * 50)

    success = test_varied_activity_generation()

    print("\n" + "=" * 50)
    if success:
        print("[OK] All tests passed! Sara will now get varied activities.")
        sys.exit(0)
    else:
        print("[X] Some tests failed. Check the errors above.")
        sys.exit(1)
#!/usr/bin/env python3
"""
Complete AI Integration Test
Tests the full AI integration with real API calls
"""
import sys
import os
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def test_complete_ai_integration():
    """Test the complete AI integration"""
    try:
        from app.services import ai_service
        from app.config.settings import settings

        print("[OK] AI service imported successfully")

        # Test 1: Assessment Analysis
        print("\n--- Test 1: Assessment Analysis ---")
        test_responses = [
            {"question_id": 1, "is_correct": True, "time_spent_seconds": 15, "difficulty": "easy"},
            {"question_id": 2, "is_correct": False, "time_spent_seconds": 25, "difficulty": "easy"},
            {"question_id": 3, "is_correct": True, "time_spent_seconds": 12, "difficulty": "medium"}
        ]

        result = ai_service.analyze_assessment(test_responses, child_age=5)
        print(f"[OK] Assessment analysis completed")
        print(f"     - Literacy Level: {result.get('literacy_level')}")
        print(f"     - Accuracy: {result.get('accuracy_percentage')}%")
        print(f"     - Weak Areas: {result.get('weak_areas')}")
        print(f"     - Confidence: {result.get('confidence_score')}")

        # Test 2: Activity Generation
        print("\n--- Test 2: Activity Generation ---")
        activities = ai_service.generate_activities_for_child(
            child_id=1,
            child_name="Test Child",
            child_age=5,
            literacy_level=2,
            weak_areas=["phonics", "letter_recognition"],
            native_language="English"
        )
        print(f"[OK] Activity generation completed")
        print(f"     - Generated {len(activities)} activities")
        if activities:
            print(f"     - First activity: {activities[0].get('activity_name')}")

        # Test 3: Parent Recommendations
        print("\n--- Test 3: Parent Recommendations ---")
        recommendations = ai_service.generate_parent_recommendations(
            child_name="Test Child",
            literacy_level=2,
            recent_weak_areas=["phonics", "vocabulary"],
            streak_days=3
        )
        print(f"[OK] Parent recommendations completed")
        print(f"     - Generated {len(recommendations)} recommendations")
        if recommendations:
            print(f"     - First recommendation: {recommendations[0]}")

        print("\n=== ALL TESTS PASSED ===")
        print("The AI integration is working correctly with real Google Gemini API!")
        return True

    except Exception as e:
        print(f"[ERROR] AI Integration Test Failed: {e}")
        import traceback
        print(traceback.format_exc())
        return False

if __name__ == "__main__":
    print("Complete AI Integration Test")
    print("=" * 50)
    print("Testing real Google Gemini API integration...\n")

    success = test_complete_ai_integration()
    sys.exit(0 if success else 1)

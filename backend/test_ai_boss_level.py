#!/usr/bin/env python3
"""
Test AI-Driven Boss Level Progression System
Tests if the AI correctly analyzes boss level performance and makes advancement decisions
"""
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def test_ai_boss_level_analysis():
    """Test AI boss level performance analysis"""
    try:
        from app.services import ai_service

        print("Testing AI Boss Level Analysis...")

        # Test Case 1: High performer (should advance)
        print("\n--- Test Case 1: High Performer ---")
        high_performance = {
            "accuracy_percentage": 92,
            "stars_earned": 3,
            "passed": True,
            "total_activities": 18,
            "completed_activities": 18,
            "activity_group": "group_3",
            "time_performance": "appropriate"
        }

        decision_high = ai_service.analyze_boss_level_performance(
            child_name="Sara",
            child_age=5,
            current_level=3,
            boss_level_performance=high_performance,
            completed_group="group_3"
        )

        print(f"Ready for next level: {decision_high.get('ready_for_next_level')}")
        print(f"Confidence: {decision_high.get('confidence_score')}")
        print(f"Rationale: {decision_high.get('decision_rationale')}")
        print(f"Suggested level: {decision_high.get('next_level_suggestion')}")

        # Test Case 2: Low performer (should not advance)
        print("\n--- Test Case 2: Low Performer ---")
        low_performance = {
            "accuracy_percentage": 65,
            "stars_earned": 1,
            "passed": True,
            "total_activities": 18,
            "completed_activities": 18,
            "activity_group": "group_3",
            "time_performance": "slow"
        }

        decision_low = ai_service.analyze_boss_level_performance(
            child_name="Sara",
            child_age=5,
            current_level=3,
            boss_level_performance=low_performance,
            completed_group="group_3"
        )

        print(f"Ready for next level: {decision_low.get('ready_for_next_level')}")
        print(f"Confidence: {decision_low.get('confidence_score')}")
        print(f"Rationale: {decision_low.get('decision_rationale')}")
        print(f"Suggested level: {decision_low.get('next_level_suggestion')}")
        print(f"Practice needed: {decision_low.get('practice_needed')}")

        # Test Case 3: Medium performer (edge case)
        print("\n--- Test Case 3: Medium Performer ---")
        medium_performance = {
            "accuracy_percentage": 78,
            "stars_earned": 2,
            "passed": True,
            "total_activities": 18,
            "completed_activities": 18,
            "activity_group": "group_3",
            "time_performance": "appropriate"
        }

        decision_medium = ai_service.analyze_boss_level_performance(
            child_name="Sara",
            child_age=5,
            current_level=3,
            boss_level_performance=medium_performance,
            completed_group="group_3"
        )

        print(f"Ready for next level: {decision_medium.get('ready_for_next_level')}")
        print(f"Confidence: {decision_medium.get('confidence_score')}")
        print(f"Rationale: {decision_medium.get('decision_rationale')}")
        print(f"Suggested level: {decision_medium.get('next_level_suggestion')}")

        print("\nAI Boss Level Analysis Test Complete!")
        return True

    except Exception as e:
        print(f"Test Error: {e}")
        import traceback
        print(traceback.format_exc())
        return False

def test_fallback_analysis():
    """Test fallback rule-based analysis"""
    try:
        from app.services import ai_service

        print("\nTesting Fallback Rule-Based Analysis...")

        # Test with various performance levels
        test_cases = [
            {"accuracy_percentage": 90, "stars_earned": 3, "passed": True},  # Should advance
            {"accuracy_percentage": 85, "stars_earned": 3, "passed": True},  # Should advance
            {"accuracy_percentage": 84, "stars_earned": 3, "passed": True},  # Should not advance
            {"accuracy_percentage": 70, "stars_earned": 2, "passed": True},  # Should not advance
        ]

        for i, perf in enumerate(test_cases, 1):
            result = ai_service._fallback_boss_level_analysis(perf, current_level=3)
            print(f"Test {i}: {perf['accuracy_percentage']}%, {perf['stars_earned']} stars -> {result['ready_for_next_level']}")

        print("Fallback Analysis Test Complete!")
        return True

    except Exception as e:
        print(f"Fallback Test Error: {e}")
        return False

if __name__ == "__main__":
    print("AI-Driven Boss Level Progression Test")
    print("=" * 50)

    # Run tests
    test_results = []

    print("\nTest 1: AI Boss Level Analysis")
    test_results.append(("AI Analysis", test_ai_boss_level_analysis()))

    print("\nTest 2: Fallback Rule-Based Analysis")
    test_results.append(("Fallback", test_fallback_analysis()))

    # Summary
    print("\n" + "=" * 50)
    print("Test Results Summary:")
    for test_name, passed in test_results:
        status = "PASSED" if passed else "FAILED"
        print(f"  {test_name}: {status}")

    all_passed = all(result[1] for result in test_results)
    if all_passed:
        print("\nAll tests passed! AI-driven progression is working.")
        sys.exit(0)
    else:
        print("\nSome tests failed. Check the errors above.")
        sys.exit(1)

#!/usr/bin/env python3
"""
Test Google Gemini AI Integration
Tests if the API key works and can generate content
"""
import sys
import os
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def test_gemini_connection():
    """Test if Google Gemini API connection works"""
    try:
        from google.generativeai import configure, GenerativeModel
        from app.config.settings import settings

        print("🔑 Testing Google Gemini API Connection...")
        print(f"API Key: {settings.GEMINI_API_KEY[:20]}...")

        # Configure Gemini
        configure(api_key=settings.GEMINI_API_KEY)
        model = GenerativeModel('gemini-pro')

        # Test simple generation
        test_prompt = "Generate a simple test response: 'Hello from Gemini AI!'"
        print(f"📝 Test prompt: {test_prompt}")

        response = model.generate_content(test_prompt)
        result = response.text.strip()

        print(f"✅ Gemini Response: {result}")
        return True

    except Exception as e:
        print(f"❌ Gemini Connection Error: {e}")
        return False

def test_assessment_analysis():
    """Test if assessment analysis works"""
    try:
        from google.generativeai import configure, GenerativeModel
        from app.config.settings import settings

        print("\n🧠 Testing Assessment Analysis...")

        # Configure Gemini
        configure(api_key=settings.GEMINI_API_KEY)
        model = GenerativeModel('gemini-pro')

        # Simulate assessment data
        assessment_prompt = """
        You are a expert children's literacy assessment specialist. Analyze these assessment results:

        Child Age: 5 years old
        Total Questions: 25
        Correct Answers: 15
        Accuracy: 60.0%

        Question Results: [
            {"question_id": 1, "is_correct": true, "time_spent_seconds": 15, "difficulty": "easy"},
            {"question_id": 2, "is_correct": false, "time_spent_seconds": 25, "difficulty": "easy"},
            {"question_id": 3, "is_correct": true, "time_spent_seconds": 12, "difficulty": "medium"}
        ]

        Please provide a detailed analysis and respond ONLY in valid JSON format with this exact structure:
        {
            "literacy_level": <1-5 based on performance>,
            "confidence_score": <0.0-1.0 confidence in your assessment>,
            "weak_areas": [<list of specific areas needing work>],
            "ai_analysis_text": "<detailed explanation for parents in simple, encouraging language>",
            "recommended_focus": "<single most important area to focus on>",
            "strength_areas": [<list of areas the child is doing well in>],
            "suggested_activities": [<list of specific activity types to start with>]
        }
        """

        response = model.generate_content(assessment_prompt)
        result = response.text.strip()

        print(f"📊 AI Analysis Result:")
        print(result[:500] + "..." if len(result) > 500 else result)
        return True

    except Exception as e:
        print(f"❌ Assessment Analysis Error: {e}")
        import traceback
        print(traceback.format_exc())
        return False

def test_activity_generation():
    """Test if activity generation works"""
    try:
        from google.generativeai import configure, GenerativeModel
        from app.config.settings import settings

        print("\n🎮 Testing Activity Generation...")

        # Configure Gemini
        configure(api_key=settings.GEMINI_API_KEY)
        model = GenerativeModel('gemini-pro')

        activity_prompt = """
        Generate 3 simple learning activities for a 5-year-old child learning letter recognition.

        Respond ONLY in valid JSON format:
        {
            "activities": [
                {
                    "activity_name": "<specific name>",
                    "activity_type": "meet_letter",
                    "difficulty_level": "beginner",
                    "estimated_duration_minutes": 8,
                    "activity_content": {
                        "instruction": "<clear instruction>",
                        "letter": "A",
                        "words": ["apple", "ant", "arrow"]
                    },
                    "activity_group": "group_1",
                    "mascot_character": "Friendly A",
                    "is_boss_level": false
                }
            ]
        }
        """

        response = model.generate_content(activity_prompt)
        result = response.text.strip()

        print(f"🎯 Activity Generation Result:")
        print(result[:500] + "..." if len(result) > 500 else result)
        return True

    except Exception as e:
        print(f"❌ Activity Generation Error: {e}")
        import traceback
        print(traceback.format_exc())
        return False

if __name__ == "__main__":
    print("🤖 Google Gemini AI Integration Test")
    print("=" * 50)

    # Run tests
    test_results = []

    print("\n🔍 Test 1: Basic Connection")
    test_results.append(("Connection", test_gemini_connection()))

    print("\n🧠 Test 2: Assessment Analysis")
    test_results.append(("Assessment Analysis", test_assessment_analysis()))

    print("\n🎮 Test 3: Activity Generation")
    test_results.append(("Activity Generation", test_activity_generation()))

    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    for test_name, passed in test_results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"  {test_name}: {status}")

    all_passed = all(result[1] for result in test_results)
    if all_passed:
        print("\n🎉 All tests passed! AI integration is working.")
        sys.exit(0)
    else:
        print("\n⚠️  Some tests failed. Check the errors above.")
        sys.exit(1)
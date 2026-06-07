import sys
from app.services.ai_service import analyze_assessment

def run_test():
    responses = [
        {"question_id": 1, "is_correct": True, "time_spent_seconds": 10, "difficulty": 1},
        {"question_id": 2, "is_correct": False, "time_spent_seconds": 15, "difficulty": 2}
    ]
    try:
        print("Running analyze_assessment...")
        res = analyze_assessment(responses, child_age=7)
        print("Result:")
        print(res)
        print("SUCCESS!")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    run_test()

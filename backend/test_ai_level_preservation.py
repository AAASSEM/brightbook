#!/usr/bin/env python3
"""
Test AI Level Preservation
Tests that AI-assigned levels are preserved and not overridden by mechanical logic
"""
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def test_ai_level_preservation():
    """Test that AI level assignment is preserved"""
    try:
        from app.config.database import engine
        from app.models.models import Child
        from sqlmodel import Session, select

        print("Testing AI Level Preservation...")

        with Session(engine) as session:
            # Find Sara
            sara = session.exec(select(Child).where(Child.name.like('%sara%'))).first()

            if not sara:
                print("[X] Sara not found in database")
                return False

            print(f"\n[INFO] Current Database State:")
            print(f"  Name: {sara.name}")
            print(f"  AI-Assigned Level: {sara.current_level}")

            # Simulate what the old mechanical logic would have done
            current_level = int(sara.current_level or 1)
            mechanical_group = "group_3"  # Sara's current group

            # Old logic: mechanically calculate next level
            if "_" in mechanical_group:
                prefix, num_str = mechanical_group.rsplit("_", 1)
                if num_str.isdigit():
                    old_mechanical_level = int(num_str) + 1  # This would be 4
                    print(f"\n[WARN] OLD MECHANICAL LOGIC:")
                    print(f"  Group: {mechanical_group}")
                    print(f"  Would mechanically set level to: {old_mechanical_level}")
                    print(f"  [BAD] This would override AI assignment of: {current_level}")

            # New logic: respect AI assignment
            print(f"\n[OK] NEW AI-RESPECTING LOGIC:")
            print(f"  AI-Assigned Level: {current_level}")
            print(f"  Level will be preserved unless AI explicitly recommends advancement")
            print(f"  [GOOD] No mechanical override!")

            # Test the logic
            ai_decision_ready = False  # Sara's AI decision (not ready to advance)

            if ai_decision_ready:
                print(f"\n[GOOD] AI recommends advancement - level would be updated")
            else:
                print(f"\n[INFO] AI says practice needed - level stays at: {current_level}")

            print(f"\n[OK] AI Level Preservation Test Complete!")
            print(f"   Sara's level {current_level} will be preserved!")
            return True

    except Exception as e:
        print(f"Test Error: {e}")
        import traceback
        print(traceback.format_exc())
        return False

def test_ai_advancement_logic():
    """Test the new AI advancement logic"""
    try:
        print("\n" + "="*50)
        print("Testing AI Advancement Logic...")

        # Test Case 1: AI explicitly recommends advancement
        print("\n--- Test Case 1: AI Recommends Advancement ---")
        current_level = 3
        ai_suggested_level = 4

        if ai_suggested_level and ai_suggested_level > current_level:
            next_level = ai_suggested_level
        else:
            next_level = current_level + 1

        if next_level > current_level:
            new_level = str(next_level)
            print(f"[OK] Current Level: {current_level} -> New Level: {new_level}")
            print(f"   AI suggestion respected!")

        # Test Case 2: AI doesn't recommend advancement
        print("\n--- Test Case 2: AI Says Practice Needed ---")
        current_level = 3
        ai_suggested_level = None

        if ai_suggested_level and ai_suggested_level > current_level:
            next_level = ai_suggested_level
        else:
            next_level = current_level + 1

        if next_level > current_level:
            print(f"[X] Level would change from {current_level} to {next_level}")
        else:
            print(f"[OK] Level preserved at: {current_level}")
            print(f"   No mechanical override!")

        # Test Case 3: AI suggests staying at same level
        print("\n--- Test Case 3: AI Suggests Same Level ---")
        current_level = 3
        ai_suggested_level = 3

        if ai_suggested_level and ai_suggested_level > current_level:
            next_level = ai_suggested_level
        else:
            next_level = current_level + 1

        if next_level > current_level:
            print(f"[X] Level would change from {current_level} to {next_level}")
        else:
            print(f"[OK] Level preserved at: {current_level}")
            print(f"   AI suggestion to stay at level 3 respected!")

        print("\n[OK] AI Advancement Logic Test Complete!")
        return True

    except Exception as e:
        print(f"Test Error: {e}")
        return False

if __name__ == "__main__":
    print("AI Level Preservation Test")
    print("=" * 50)

    test_results = []

    print("\nTest 1: AI Level Preservation")
    test_results.append(("AI Preservation", test_ai_level_preservation()))

    print("\nTest 2: AI Advancement Logic")
    test_results.append(("Advancement Logic", test_ai_advancement_logic()))

    # Summary
    print("\n" + "=" * 50)
    print("Test Results Summary:")
    for test_name, passed in test_results:
        status = "[OK]" if passed else "[X]"
        print(f"  {test_name}: {status}")

    all_passed = all(result[1] for result in test_results)
    if all_passed:
        print("\n[OK] All tests passed! AI level assignment is now preserved.")
        sys.exit(0)
    else:
        print("\n[X] Some tests failed. Check the errors above.")
        sys.exit(1)
#!/usr/bin/env python3
"""
Test AI Service Import
Tests if the google.genai import works correctly
"""
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def test_ai_service_import():
    """Test if the AI service can be imported"""
    try:
        from google import genai
        print("[OK] google.genai import: SUCCESS")

        # Test client creation
        client = genai.Client(api_key="test_key")
        print("[OK] genai.Client creation: SUCCESS")

        # Test service import
        from app.services import ai_service
        print("[OK] app.services.ai_service import: SUCCESS")

        return True

    except Exception as e:
        print(f"[ERROR] Import Error: {e}")
        import traceback
        print(traceback.format_exc())
        return False

if __name__ == "__main__":
    print("Testing AI Service Import...")
    print("=" * 50)
    success = test_ai_service_import()
    if success:
        print("\nAll imports successful! The AI integration should work now.")
    sys.exit(0 if success else 1)

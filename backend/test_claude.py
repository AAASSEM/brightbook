import os
import sys
from dotenv import load_dotenv
from app.services.ai_service import ClaudeClient

def test_claude():
    # Load .env file
    load_dotenv()
    
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("Error: ANTHROPIC_API_KEY not found in .env")
        sys.exit(1)
        
    print(f"Using API Key: {api_key[:10]}...")
    
    # Initialize the client
    client = ClaudeClient(api_key)
    
    try:
        print("Sending request to Claude...")
        # Since ClaudeModels.generate_content ignores the model parameter and hardcodes claude-3-5-haiku-20241022, 
        # we can just pass a dummy model string.
        response = client.models.generate_content(
            model="dummy_model_string", 
            contents="Say hello and confirm you are Claude 3.5 Haiku."
        )
        print("\n=== CLAUDE RESPONSE ===")
        print(response.text)
        print("=======================")
        print("\nTest passed! The API key and model are working correctly.")
        
    except Exception as e:
        print(f"\nError occurred: {e}")

if __name__ == "__main__":
    test_claude()

"""
Direct test of AI activity generation - writes results to file to avoid console encoding issues
"""
import sys, os, json, traceback
sys.path.insert(0, 'c:/Users/20100/bookv2/brightbook/backend')
os.chdir('c:/Users/20100/bookv2/brightbook/backend')

from dotenv import load_dotenv
load_dotenv('.env')

from app.services.ai_service import generate_activities_for_child

OUTPUT = 'c:/Users/20100/bookv2/brightbook/backend/test_ai_result.txt'

with open(OUTPUT, 'w', encoding='utf-8') as f:
    f.write("=== AI Activity Generation Test - Arabic Child ===\n\n")
    try:
        result = generate_activities_for_child(
            child_id=999,
            child_name="Test Child",
            child_age=6,
            literacy_level=1,
            weak_areas=["letter_recognition"],
            native_language="Arabic",
            completed_activities=[]
        )

        if not result:
            f.write("ERROR: Got empty result (no activities)\n")
        else:
            f.write(f"SUCCESS: Generated {len(result)} activities\n\n")
            for i, a in enumerate(result):
                content = a.get('activity_content', {})
                if isinstance(content, str):
                    try: content = json.loads(content)
                    except: content = {}
                f.write(f"[{i+1}] Name:   {a.get('activity_name')}\n")
                f.write(f"     Type:   {a.get('activity_type')}\n")
                f.write(f"     Group:  {a.get('activity_group')}\n")
                f.write(f"     Letter: {content.get('letter', 'N/A')}\n")
                f.write(f"     Instr:  {content.get('instruction', 'N/A')[:80]}\n\n")

    except Exception as e:
        f.write(f"EXCEPTION: {e}\n")
        f.write(traceback.format_exc())

print("Done. Results written to test_ai_result.txt")

from app.config.settings import settings

print('AI Configuration:')
print(f'Gemini Key: {bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "")}')
print(f'Anthropic Key: {bool(settings.ANTHROPIC_API_KEY and settings.ANTHROPIC_API_KEY != "")}')
print(f'Gemini Key Length: {len(settings.GEMINI_API_KEY) if settings.GEMINI_API_KEY else 0}')

# Check if assessment completion triggers AI
print('\nChecking AI generation flow...')

# Check recent assessments
from app.config.database import engine
from sqlmodel import Session, select
from app.models.models import Assessment, Child

session = Session(engine)

# Get recent assessments
assessments = session.exec(select(Assessment).order_by(Assessment.assessment_date.desc()).limit(5)).all()
print(f'\nRecent assessments: {len(assessments)}')

for assessment in assessments:
    child = session.get(Child, assessment.Child_ID)
    print(f'- Child: {child.name if child else "Unknown"} | Score: {assessment.total_correct_answers}/{assessment.total_questions} | Level: {assessment.Level_ID}')

# Check AI-generated activities
from app.models.models import Activity
personalized = session.exec(select(Activity).where(Activity.Child_ID.is_not(None)).limit(5)).all()
print(f'\nAI-generated activities: {len(personalized)}')

for activity in personalized:
    child = session.get(Child, activity.Child_ID)
    print(f'- {activity.activity_name} for {child.name if child else "Unknown"}')

# Check assessment completion endpoint
print('\nChecking if assessment completion should trigger AI...')
import requests
try:
    # Test the AI status endpoint
    response = requests.get('http://localhost:8000/api/admin/ai-status', timeout=2)
    if response.status_code == 200:
        data = response.json()
        print(f'AI Status: {data}')
    else:
        print('AI status endpoint not accessible')
except Exception as e:
    print(f'Cannot reach AI status endpoint: {e}')
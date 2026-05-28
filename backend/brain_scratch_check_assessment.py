import logging
logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
from sqlmodel import Session, select
from app.config.database import engine
from app.models.models import Parents, Child, Assessment, AssessmentQuestion

with Session(engine) as session:
    children = session.exec(select(Child).where(Child.name.ilike("%sara%"))).all()
    for child in children:
        parent = session.get(Parents, child.Parent_ID)
        print(f"Child ID: {child.Child_ID}, Parent: {parent.name if parent else 'None'}")
        assessment = session.exec(
            select(Assessment)
            .where(Assessment.Child_ID == child.Child_ID)
            .order_by(Assessment.Assessment_ID.desc())
        ).first()
        if assessment:
            print(f"  Total Correct: {assessment.total_correct_answers} / {assessment.total_questions}")
            print(f"  Accuracy: {assessment.accuracy_percentage}%")
            print(f"  AI Level: {assessment.ai_analysis.get('dyslexia_level') if assessment.ai_analysis else 'None'}")
            print(f"  Child Level: {child.current_level}")
        print("-" * 40)

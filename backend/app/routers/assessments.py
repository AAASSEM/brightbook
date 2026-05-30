from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
import os
import uuid
from sqlmodel import Session, select
from typing import List
from datetime import date
from app.config.database import get_session
from app.middleware.auth_middleware import get_current_parent
from app.models.models import (
    Parents, Child, Assessment, AssessmentQuestion, Level, Progress, ChildProgress, Activity, ActivityProgress
)
from app.models.schemas import (
    AssessmentStart, AnswerSubmit, AssessmentRead, AssessmentQuestionRead, MessageResponse)
from app.models.enums import AssessmentType, ActivityType, DifficultyLevel
from app.services import ai_service

router = APIRouter(prefix="/api/assessments", tags=["assessments"])


@router.post("/start", response_model=AssessmentRead, status_code=201)
def start_assessment(
    data: AssessmentStart,
    parent: Parents = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    # Verify child belongs to parent
    child = session.get(Child, data.child_id)
    if not child or child.Parent_ID != parent.Parent_ID:
        raise HTTPException(status_code=404, detail="Child not found")

    assessment = Assessment(
        assessment_type=data.assessment_type,
        total_questions=25,
        total_correct_answers=0,
        accuracy_percentage=0.0,
        assessment_date=date.today(),
        is_initial=(data.assessment_type == AssessmentType.initial),
        Child_ID=data.child_id,
        Level_ID=data.level_id,
    )
    session.add(assessment)
    session.commit()
    session.refresh(assessment)

    return assessment


@router.post("/{assessment_id}/answer", response_model=AssessmentQuestionRead, status_code=201)
def submit_answer(
    assessment_id: int,
    data: AnswerSubmit,
    parent: Parents = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    assessment = session.get(Assessment, assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    child = session.get(Child, assessment.Child_ID)
    if not child or child.Parent_ID != parent.Parent_ID:
        raise HTTPException(status_code=403, detail="Not authorized to access this assessment")

    # Try to find existing question record for THIS assessment
    statement = select(AssessmentQuestion).where(
        AssessmentQuestion.Question_ID == data.question_id,
        AssessmentQuestion.Assessment_ID == assessment_id
    )
    question = session.exec(statement).first()

    if not question:
        question = AssessmentQuestion(
            Question_ID=data.question_id,
            Assessment_ID=assessment_id,
            question_type=data.question_type or "unknown",
            question_content=data.question_content or "{}",
            correct_answer=data.correct_answer or "",
        )

    question.child_answer = str(data.child_answer)
    question.is_correct = data.is_correct
    question.time_spent_seconds = data.time_spent_seconds

    session.add(question)
    session.commit()
    session.refresh(question)
    return question


@router.post("/{assessment_id}/complete", response_model=AssessmentRead)
def complete_assessment(
    assessment_id: int,
    parent: Parents = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    assessment = session.get(Assessment, assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    child = session.get(Child, assessment.Child_ID)
    if not child or child.Parent_ID != parent.Parent_ID:
        raise HTTPException(status_code=403, detail="Not authorized to access this assessment")

    questions = session.exec(
        select(AssessmentQuestion).where(AssessmentQuestion.Assessment_ID == assessment_id)
    ).all()

    # Build responses for AI
    responses = [
        {
            "question_id": q.Question_ID,
            "is_correct": q.is_correct or False,
            "time_spent_seconds": q.time_spent_seconds or 30,
            "difficulty": "medium",
        }
        for q in questions
    ]

    child = session.get(Child, assessment.Child_ID)
    ai_result = ai_service.analyze_assessment(responses, child.age if child else 7)

    # Update assessment record
    assessment.total_correct_answers = ai_result["total_correct"]
    assessment.accuracy_percentage = ai_result["accuracy_percentage"]
    assessment.ai_analysis = ai_result

    # Update child's current level if initial assessment
    if assessment.is_initial and child:
        child.current_level = str(ai_result["dyslexia_level"])
        session.add(child)

    session.add(assessment)
    session.commit()
    session.refresh(assessment)

    # 🎯 AUTOMATICALLY GENERATE ACTIVITIES AFTER ASSESSMENT
    try:
        # Generate activities using AI
        activities_data = ai_service.generate_activities_for_child(
            child_id=assessment.Child_ID,
            child_name=child.name if child else "Child",
            child_age=child.age if child else 7,
            literacy_level=ai_result["dyslexia_level"],
            weak_areas=ai_result.get("weak_areas", []),
            native_language=child.native_language if child else "English"
        )

        # Create activities in database
        created_count = 0
        for activity_data in activities_data:
            try:
                # Handle activity_type enum conversion
                activity_type_str = activity_data.get("activity_type", "meet_letter")
                activity_type = ActivityType(activity_type_str)

                # Handle difficulty_level enum conversion
                difficulty_str = activity_data.get("difficulty_level", "beginner")
                difficulty_level = DifficultyLevel(difficulty_str)

                new_activity = Activity(
                    activity_name=activity_data["activity_name"],
                    activity_type=activity_type,
                    difficulty_level=difficulty_level,
                    language=activity_data.get("language", "English"),
                    activity_content=activity_data.get("activity_content", {}),
                    estimated_duration_minutes=activity_data.get("estimated_duration_minutes", 10),
                    Child_ID=activity_data["Child_ID"],
                    activity_group=activity_data.get("activity_group", "group_1"),
                    mascot_character=activity_data.get("mascot_character", "Learning Friend"),
                    is_boss_level=activity_data.get("is_boss_level", False)
                )
                session.add(new_activity)
                session.commit()
                session.refresh(new_activity)
                created_count += 1

            except Exception as e:
                import logging
                logging.error(f"Error creating activity {activity_data.get('activity_name')}: {e}")
                continue

        # Initialize progress records for new activities
        if created_count > 0:
            progress = session.exec(
                select(Progress).where(Progress.Child_ID == assessment.Child_ID)
            ).first()

            if progress:
                # Get all activities for this child
                all_activities = session.exec(
                    select(Activity).where(Activity.Child_ID == assessment.Child_ID)
                ).all()

                # Create progress records for new activities
                for activity in all_activities:
                    existing_progress = session.exec(
                        select(ActivityProgress).where(
                            ActivityProgress.progress_id == progress.progress_id,
                            ActivityProgress.activity_id == activity.Activity_ID
                        )
                    ).first()

                    if not existing_progress:
                        new_progress = ActivityProgress(
                            progress_id=progress.progress_id,
                            activity_id=activity.Activity_ID,
                            completion_status='not_started',
                            stars_earned=0,
                            mastery_level=0,
                            total_time_spent_minutes=0,
                            total_activities_completed=0
                        )
                        session.add(new_progress)

                session.commit()

    except Exception as e:
        import logging, traceback
        logging.error(f"Error generating activities after assessment: {e}\n{traceback.format_exc()}")
        # Assessment is still saved — activities will be empty until user retries

    return assessment


@router.get("/child/{child_id}", response_model=List[AssessmentRead])
def get_child_assessments(
    child_id: int,
    parent: Parents = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    child = session.get(Child, child_id)
    if not child or child.Parent_ID != parent.Parent_ID:
        raise HTTPException(status_code=404, detail="Child not found")
    return session.exec(
        select(Assessment).where(Assessment.Child_ID == child_id)
    ).all()


@router.get("/{assessment_id}/questions", response_model=List[AssessmentQuestionRead])
def get_assessment_questions(
    assessment_id: int,
    parent: Parents = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    assessment = session.get(Assessment, assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    child = session.get(Child, assessment.Child_ID)
    if not child or child.Parent_ID != parent.Parent_ID:
        raise HTTPException(status_code=403, detail="Not authorized to access this assessment")
    return session.exec(
        select(AssessmentQuestion).where(AssessmentQuestion.Assessment_ID == assessment_id)
    ).all()


UPLOAD_DIR = "uploads/audio"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/{assessment_id}/question/{question_id}/audio")
async def upload_audio(
    assessment_id: int,
    question_id: int,
    file: UploadFile = File(...),
    parent: Parents = Depends(get_current_parent),
    session: Session = Depends(get_session)
):
    assessment = session.get(Assessment, assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    child = session.get(Child, assessment.Child_ID)
    if not child or child.Parent_ID != parent.Parent_ID:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Generate unique filename
    file_ext = file.filename.split(".")[-1] if "." in file.filename else "wav"
    filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    # Save file
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    # Update or create question record
    question = session.exec(
        select(AssessmentQuestion)
        .where(AssessmentQuestion.Assessment_ID == assessment_id)
        .where(AssessmentQuestion.Question_ID == question_id)
    ).first()

    if not question:
        question = AssessmentQuestion(
            Question_ID=question_id,
            Assessment_ID=assessment_id,
            question_type="reading_timed",
            question_content="{}",
            correct_answer="",
        )

    question.child_answer = f"/uploads/audio/{filename}"
    session.add(question)
    session.commit()
    session.refresh(question)

    return {"url": question.child_answer}

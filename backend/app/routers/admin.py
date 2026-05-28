from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from typing import List
from datetime import datetime
import json
from pathlib import Path
from app.config.database import get_session
from app.middleware.auth_middleware import get_current_admin
from app.models.models import (
    Admin, Parents, Child, Assessment, Activity, Level, LevelActivities,
    Complaint, Subscription, Progress, ChildProgress
)
from app.models.schemas import (
    AdminCreate, ActivityCreate, ActivityRead, LevelCreate, LevelRead,
    ComplaintRead, ComplaintReply, SystemHealthRead, MessageResponse, ChildRead
)
from app.models.enums import SubscriptionStatus, ComplaintStatus
from app.utils.security import hash_password

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ── SYSTEM HEALTH ──────────────────────────────────────────────────────────────
@router.get("/system-health", response_model=SystemHealthRead)
def system_health(
    admin: Admin = Depends(get_current_admin),
    session: Session = Depends(get_session),
):
    total_parents = len(session.exec(select(Parents)).all())
    total_children = len(session.exec(select(Child)).all())
    active_subs = len(session.exec(
        select(Subscription).where(Subscription.subscription_status == SubscriptionStatus.active)
    ).all())
    open_complaints = len(session.exec(
        select(Complaint).where(Complaint.status == ComplaintStatus.open)
    ).all())
    total_assessments = len(session.exec(select(Assessment)).all())
    total_activities_completed = len(session.exec(
        select(ChildProgress)
    ).all())

    return SystemHealthRead(
        total_parents=total_parents,
        total_children=total_children,
        active_subscriptions=active_subs,
        open_complaints=open_complaints,
        total_assessments=total_assessments,
        total_activities_completed=total_activities_completed,
    )


# ── USERS ──────────────────────────────────────────────────────────────────────
@router.get("/users/parents")
def list_parents(admin: Admin = Depends(get_current_admin), session: Session = Depends(get_session)):
    parents = session.exec(select(Parents)).all()
    return [
        {
            "id": p.Parent_ID,
            "name": p.name,
            "email": p.email,
            "phone": p.phone_number,
            "children_count": len(p.children),
        }
        for p in parents
    ]


@router.get("/users/children")
def list_children(admin: Admin = Depends(get_current_admin), session: Session = Depends(get_session)):
    children = session.exec(select(Child)).all()
    return [ChildRead.model_validate(c) for c in children]


@router.delete("/users/parents/{parent_id}", response_model=MessageResponse)
def delete_parent(
    parent_id: int,
    admin: Admin = Depends(get_current_admin),
    session: Session = Depends(get_session),
):
    parent = session.get(Parents, parent_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")
    session.delete(parent)
    session.commit()
    return {"message": f"Parent {parent.name} deleted"}


# ── CONTENT: LEVELS ───────────────────────────────────────────────────────────
@router.get("/levels", response_model=List[LevelRead])
def list_levels(admin: Admin = Depends(get_current_admin), session: Session = Depends(get_session)):
    return session.exec(select(Level).order_by(Level.level_number)).all()


@router.post("/levels", response_model=LevelRead, status_code=201)
def create_level(
    data: LevelCreate,
    admin: Admin = Depends(get_current_admin),
    session: Session = Depends(get_session),
):
    level = Level(**data.model_dump())
    session.add(level)
    session.commit()
    session.refresh(level)
    return level


@router.put("/levels/{level_id}", response_model=LevelRead)
def update_level(
    level_id: int,
    data: LevelCreate,
    admin: Admin = Depends(get_current_admin),
    session: Session = Depends(get_session),
):
    level = session.get(Level, level_id)
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(level, field, value)
    session.add(level)
    session.commit()
    session.refresh(level)
    return level


@router.delete("/levels/{level_id}", response_model=MessageResponse)
def delete_level(
    level_id: int,
    admin: Admin = Depends(get_current_admin),
    session: Session = Depends(get_session),
):
    level = session.get(Level, level_id)
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")

    # First, remove all activity assignments for this level
    activity_assignments = session.exec(
        select(LevelActivities).where(LevelActivities.Level_ID == level_id)
    ).all()

    for assignment in activity_assignments:
        session.delete(assignment)

    # Then delete the level
    session.delete(level)
    session.commit()
    return {"message": "Level deleted"}


@router.post("/levels/seed", response_model=MessageResponse)
def seed_levels(
    admin: Admin = Depends(get_current_admin),
    session: Session = Depends(get_session),
):
    """Seed the database with default literacy levels"""
    # Check if levels already exist
    existing_levels = session.exec(select(Level).limit(1)).first()
    if existing_levels:
        raise HTTPException(status_code=400, detail="Levels already exist in database")

    levels_data = [
        {
            "level_number": 1,
            "level_name": "Letter Sounds & Recognition",
            "description": "Introduction to basic letter sounds and recognition using Jolly Phonics groups 1-2",
            "difficulty": "beginner",
            "num_activities_required": 10,
            "age_range": "3-4 years",
            "skills_focus": ["Letter recognition", "Basic phonics", "Letter sounds", "Simple blending"]
        },
        {
            "level_number": 2,
            "level_name": "Word Building & Blending",
            "description": "Progress to building simple words and blending sounds using Jolly Phonics groups 3-4",
            "difficulty": "beginner",
            "num_activities_required": 15,
            "age_range": "4-5 years",
            "skills_focus": ["Word formation", "Sound blending", "Simple words", "Reading readiness"]
        },
        {
            "level_number": 3,
            "level_name": "Sentences & Stories",
            "description": "Read and understand simple sentences and stories using all Jolly Phonics sounds",
            "difficulty": "intermediate",
            "num_activities_required": 20,
            "age_range": "5-6 years",
            "skills_focus": ["Sentence reading", "Comprehension", "Vocabulary", "Fluency"]
        },
        {
            "level_number": 4,
            "level_name": "Advanced Reading",
            "description": "Develop advanced reading skills with complex texts and comprehension",
            "difficulty": "advanced",
            "num_activities_required": 25,
            "age_range": "6-7 years",
            "skills_focus": ["Advanced comprehension", "Critical thinking", "Vocabulary expansion", "Reading strategies"]
        },
        {
            "level_number": 5,
            "level_name": "Literacy Mastery",
            "description": "Master comprehensive literacy skills including independent reading and writing",
            "difficulty": "expert",
            "num_activities_required": 30,
            "age_range": "7-8 years",
            "skills_focus": ["Independent reading", "Writing skills", "Advanced comprehension", "Creative expression"]
        }
    ]

    for level_data in levels_data:
        level = Level(**level_data)
        session.add(level)

    session.commit()
    return {"message": f"Successfully seeded {len(levels_data)} literacy levels!"}


# ── CONTENT: ACTIVITIES ────────────────────────────────────────────────────────
@router.get("/activities", response_model=List[ActivityRead])
def list_activities(admin: Admin = Depends(get_current_admin), session: Session = Depends(get_session)):
    # Only return template activities (Child_ID IS NULL) - these are reusable activities
    # Personalized activities (with Child_ID) are managed separately
    return session.exec(select(Activity).where(Activity.Child_ID.is_(None))).all()


@router.get("/activities/personalized", response_model=List[ActivityRead])
def list_personalized_activities(admin: Admin = Depends(get_current_admin), session: Session = Depends(get_session)):
    # Return AI-generated/personalized activities (with Child_ID)
    return session.exec(select(Activity).where(Activity.Child_ID.is_not(None))).all()


@router.post("/activities", response_model=ActivityRead, status_code=201)
def create_activity(
    data: ActivityCreate,
    admin: Admin = Depends(get_current_admin),
    session: Session = Depends(get_session),
):
    activity = Activity(**data.model_dump())
    session.add(activity)
    session.commit()
    session.refresh(activity)
    return activity


@router.put("/activities/{activity_id}", response_model=ActivityRead)
def update_activity(
    activity_id: int,
    data: ActivityCreate,
    admin: Admin = Depends(get_current_admin),
    session: Session = Depends(get_session),
):
    activity = session.get(Activity, activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(activity, field, value)
    session.add(activity)
    session.commit()
    session.refresh(activity)
    return activity


@router.delete("/activities/{activity_id}", response_model=MessageResponse)
def delete_activity(
    activity_id: int,
    admin: Admin = Depends(get_current_admin),
    session: Session = Depends(get_session),
):
    activity = session.get(Activity, activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    # First, remove all level assignments for this activity
    level_assignments = session.exec(
        select(LevelActivities).where(LevelActivities.Activity_ID == activity_id)
    ).all()

    for assignment in level_assignments:
        session.delete(assignment)

    # Then delete the activity
    session.delete(activity)
    session.commit()
    return {"message": "Activity deleted"}


@router.post("/activities/{activity_id}/assign-level/{level_id}", response_model=MessageResponse)
def assign_activity_to_level(
    activity_id: int,
    level_id: int,
    admin: Admin = Depends(get_current_admin),
    session: Session = Depends(get_session),
):
    existing = session.exec(
        select(LevelActivities).where(
            LevelActivities.Activity_ID == activity_id,
            LevelActivities.Level_ID == level_id,
        )
    ).first()
    if not existing:
        la = LevelActivities(Activity_ID=activity_id, Level_ID=level_id)
        session.add(la)
        session.commit()
    return {"message": "Activity assigned to level"}


# ── SUPPORT TICKETS ────────────────────────────────────────────────────────────
@router.get("/tickets", response_model=List[ComplaintRead])
def list_tickets(admin: Admin = Depends(get_current_admin), session: Session = Depends(get_session)):
    return session.exec(select(Complaint).order_by(Complaint.created_at.desc())).all()


@router.put("/tickets/{ticket_id}/reply", response_model=ComplaintRead)
def reply_to_ticket(
    ticket_id: int,
    data: ComplaintReply,
    admin: Admin = Depends(get_current_admin),
    session: Session = Depends(get_session),
):
    ticket = session.get(Complaint, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket.admin_response = data.admin_response
    ticket.status = data.status
    ticket.admin_id = admin.admin_id
    if data.status == ComplaintStatus.resolved:
        ticket.resolved_at = datetime.utcnow()
    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    return ticket


# ── ASSESSMENT QUESTIONS ─────────────────────────────────────────────────────────
@router.get("/assessment-questions")
def get_assessment_questions(admin: Admin = Depends(get_current_admin)):
    """Get all assessment questions from the JSON seed file"""
    try:
        # Read from the JSON seed file
        seed_file = Path(__file__).parent.parent / "utils" / "literacy_questions_seed.json"
        if not seed_file.exists():
            raise HTTPException(status_code=404, detail="Assessment questions file not found")

        with open(seed_file, 'r', encoding='utf-8') as f:
            questions = json.load(f)

        return questions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading assessment questions: {str(e)}")


@router.put("/assessment-questions")
def update_assessment_questions(
    questions: List[dict],
    admin: Admin = Depends(get_current_admin),
):
    """Update assessment questions in the JSON seed file"""
    try:
        # Validate the questions structure
        if not isinstance(questions, list) or len(questions) == 0:
            raise HTTPException(status_code=400, detail="Questions must be a non-empty list")

        # Validate each question has required fields
        required_fields = ["id", "order", "group", "type", "title_en", "title_ar", "instruction_en", "instruction_ar", "stimulus", "options", "correct_answer"]
        for question in questions:
            for field in required_fields:
                if field not in question:
                    raise HTTPException(status_code=400, detail=f"Question missing required field: {field}")

        # Write to the JSON seed file
        seed_file = Path(__file__).parent.parent / "utils" / "literacy_questions_seed.json"
        with open(seed_file, 'w', encoding='utf-8') as f:
            json.dump(questions, f, indent=2, ensure_ascii=False)

        return {"message": f"Successfully updated {len(questions)} assessment questions"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating assessment questions: {str(e)}")


@router.get("/assessment-questions/stats")
def get_assessment_questions_stats(admin: Admin = Depends(get_current_admin), session: Session = Depends(get_session)):
    """Get statistics about assessment questions and usage"""
    try:
        # Get questions from JSON
        seed_file = Path(__file__).parent.parent / "utils" / "literacy_questions_seed.json"
        if seed_file.exists():
            with open(seed_file, 'r', encoding='utf-8') as f:
                questions = json.load(f)
                total_questions = len(questions)
        else:
            total_questions = 0

        # Get assessment usage statistics
        total_assessments = len(session.exec(select(Assessment)).all())

        # Group questions by type
        seed_file = Path(__file__).parent.parent / "utils" / "literacy_questions_seed.json"
        question_types = {}
        if seed_file.exists():
            with open(seed_file, 'r', encoding='utf-8') as f:
                questions = json.load(f)
                for q in questions:
                    q_type = q.get("type", "unknown")
                    question_types[q_type] = question_types.get(q_type, 0) + 1

        return {
            "total_questions": total_questions,
            "total_assessments_completed": total_assessments,
            "question_types": question_types,
            "question_groups": len(set(q.get("group", "") for q in questions)) if seed_file.exists() else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting assessment questions stats: {str(e)}")


# ── AI STATUS ───────────────────────────────────────────────────────────────
@router.get("/ai-status")
def get_ai_status(admin: Admin = Depends(get_current_admin), session: Session = Depends(get_session)):
    """Get AI system status and configuration information from real data"""
    try:
        from app.config.settings import settings
        from app.services.ai_metrics import ai_metrics

        # 1. Configuration Check
        gemini_configured = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "")
        anthropic_configured = bool(settings.ANTHROPIC_API_KEY and settings.ANTHROPIC_API_KEY != "")

        # 2. Real Usage Metrics from in-memory tracker
        metrics = ai_metrics.get_metrics()

        # 3. Real Quality Metrics
        all_assessments = session.exec(select(Assessment)).all()
        total_count = len(all_assessments)
        avg_accuracy = (
            sum(a.accuracy_percentage for a in all_assessments) / total_count
            if total_count > 0
            else 0
        )

        return {
            "api_configured": gemini_configured or anthropic_configured,
            "ai_provider": "Google Gemini" if gemini_configured else ("Anthropic" if anthropic_configured else "Not configured"),
            "api_calls_today": metrics["calls_today"],
            "success_rate": metrics["success_rate"],
            "assessment_accuracy": round(avg_accuracy, 1),
            "avg_response_time": metrics["avg_response_time"],
            "total_assessments_processed": total_count,
            "total_calls_all_time": metrics["total_calls_all_time"],
            "failures_today": metrics["failures_today"],
            "fallback_mode_active": not (gemini_configured or anthropic_configured)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting AI status: {str(e)}")



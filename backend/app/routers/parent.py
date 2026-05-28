from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from app.config.database import get_session
from app.middleware.auth_middleware import get_current_parent
from app.models.models import (
    Parents, Child, Progress, ChildProgress, Achievement,
    Assessment, ActivityProgress, Notification
)
from app.models.schemas import (
    ParentDashboardRead, ChildRead, ProgressRead, AchievementRead, NotificationRead, MessageResponse, ParentUpdate, NotificationPreferencesUpdate, NotificationPreferencesRead, ChangePasswordRequest
)
from app.services import ai_service

router = APIRouter(prefix="/api/parent", tags=["parent"])


@router.put("/me", response_model=MessageResponse)
def update_parent_profile(
    data: ParentUpdate,
    parent: Parents = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(parent, field, value)

    session.add(parent)
    session.commit()
    return {"message": "Profile updated successfully"}


@router.get("/notification/preferences", response_model=NotificationPreferencesRead)
def get_notification_preferences(
    parent: Parents = Depends(get_current_parent),
):
    return {"notification_preferences": parent.notification_preferences}


@router.put("/notification/preferences", response_model=MessageResponse)
def update_notification_preferences(
    data: NotificationPreferencesUpdate,
    parent: Parents = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    parent.notification_preferences = data.notification_preferences
    session.add(parent)
    session.commit()
    return {"message": "Notification preferences updated successfully"}


@router.delete("/me", response_model=MessageResponse)
def delete_parent_profile(
    parent: Parents = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    session.delete(parent)
    session.commit()
    return {"message": "Account deleted successfully"}


@router.get("/dashboard/{child_id}", response_model=ParentDashboardRead)
def get_dashboard(
    child_id: int,
    parent: Parents = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    try:
        child = session.get(Child, child_id)
        if not child or child.Parent_ID != parent.Parent_ID:
            raise HTTPException(status_code=404, detail="Child not found")

        child_prog = session.exec(
            select(ChildProgress).where(ChildProgress.Child_ID == child_id)
        ).first()

        progress_read = None
        if child_prog:
            prog = session.get(Progress, child_prog.progress_id)
            if prog:
                # Calculate actual activities completed from ActivityProgress table
                from app.models.models import ActivityProgress
                activity_progress = session.exec(
                    select(ActivityProgress).where(
                        ActivityProgress.progress_id == child_prog.progress_id
                    )
                ).all()

                # Debug: Print individual activity times to understand the data
                activity_times = [(ap.activity_id, ap.total_time_spent_minutes or 0) for ap in activity_progress]
                print(f"DEBUG Dashboard: Individual activity times: {activity_times}")

                # Validate time data - check for unrealistic individual activity times
                reasonable_activities = [ap for ap in activity_progress if (ap.total_time_spent_minutes or 0) <= 120]  # 2 hours max per activity

                if len(reasonable_activities) < len(activity_progress):
                    print(f"DEBUG Dashboard: Filtered out {len(activity_progress) - len(reasonable_activities)} activities with unrealistic times")

                activities_completed = len([ap for ap in reasonable_activities if ap.completion_status == 'completed'])

                progress_read = ProgressRead(
                    progress_id=prog.progress_id,
                    total_score=prog.total_score,
                    streak_days=child_prog.streak_days,
                    activities_completed=activities_completed,
                    Child_ID=child_id,
                )

        # Recent achievements (last 5)
        achievements = session.exec(
            select(Achievement).where(Achievement.Child_ID == child_id)
        ).all()
        recent_achievements = [
            {"name": a.achievement_name, "icon": a.badge_icon or "🏆", "description": a.description}
            for a in achievements[-5:]
        ]

        # Weekly scores (simplified — last 7 assessments)
        assessments = session.exec(
            select(Assessment).where(Assessment.Child_ID == child_id)
        ).all()
        weekly_scores = [
            {"date": str(a.assessment_date), "score": int(a.accuracy_percentage)}
            for a in assessments[-7:]
        ]

        # AI recommendations removed from dashboard load to make it fast
        recommendations = []

        return ParentDashboardRead(
            child=ChildRead.model_validate(child),
            progress=progress_read,
            recent_achievements=recent_achievements,
            weekly_scores=weekly_scores,
            ai_recommendations=recommendations,
        )
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        print(f"Dashboard loading error: {e}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Error loading dashboard data")


@router.get("/recommendations/{child_id}")
def get_recommendations(
    child_id: int,
    parent: Parents = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    """Fetch AI learning recommendations separately to avoid blocking the main dashboard load"""
    try:
        child = session.get(Child, child_id)
        if not child or child.Parent_ID != parent.Parent_ID:
            raise HTTPException(status_code=404, detail="Child not found")

        child_prog = session.exec(
            select(ChildProgress).where(ChildProgress.Child_ID == child_id)
        ).first()

        # Get weak areas from latest assessment
        weak_areas = []
        assessments = session.exec(
            select(Assessment).where(Assessment.Child_ID == child_id)
        ).all()

        if assessments:
            last = assessments[-1]
            if last.ai_analysis:
                weak_areas = last.ai_analysis.get("weak_areas", [])

        # Generate parent recommendations using AI service
        recommendations = ai_service.generate_parent_recommendations(
            child.name,
            int(child.current_level or 1),
            weak_areas,
            child_prog.streak_days if child_prog else 0
        )
        return {"recommendations": recommendations}
    except Exception as e:
        print(f"Lazy recommendations load error: {e}")
        # Return fallback tips instead of failing
        return {
            "recommendations": [
                f"Keep up the great work with {child.name}'s learning!",
                "Practice letter sounds daily for 10-15 minutes",
                "Read stories together to build vocabulary",
                "Celebrate small wins to build confidence"
            ]
        }



@router.get("/notifications", response_model=List[NotificationRead])
def get_notifications(
    parent: Parents = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    return session.exec(
        select(Notification).where(Notification.Parent_ID == parent.Parent_ID)
    ).all()


@router.put("/notifications/{notif_id}/read", response_model=MessageResponse)
def mark_notification_read(
    notif_id: int,
    parent: Parents = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    notif = session.get(Notification, notif_id)
    if not notif or notif.Parent_ID != parent.Parent_ID:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    session.add(notif)
    session.commit()
    return {"message": "Marked as read"}


@router.put("/change-password", response_model=MessageResponse)
def change_password(
    data: ChangePasswordRequest,
    parent: Parents = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    from app.utils.security import verify_password, hash_password

    # 1. Verify old password
    if not verify_password(data.old_password, parent.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    # 2. Update to new password
    parent.password_hash = hash_password(data.new_password)
    session.add(parent)
    session.commit()

    return {"message": "Password changed successfully"}


@router.post("/regenerate-recommendations/{child_id}")
def regenerate_recommendations(
    child_id: int,
    parent: Parents = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    """Regenerate AI recommendations for a specific child"""
    try:
        child = session.get(Child, child_id)
        if not child or child.Parent_ID != parent.Parent_ID:
            raise HTTPException(status_code=404, detail="Child not found")

        child_prog = session.exec(
            select(ChildProgress).where(ChildProgress.Child_ID == child_id)
        ).first()

        # Get weak areas from latest assessment
        weak_areas = []
        assessments = session.exec(
            select(Assessment).where(Assessment.Child_ID == child_id)
        ).all()

        if assessments:
            last = assessments[-1]
            if last.ai_analysis:
                weak_areas = last.ai_analysis.get("weak_areas", [])

        # Generate fresh AI recommendations
        recommendations = ai_service.generate_parent_recommendations(
            child.name,
            int(child.current_level or 1),
            weak_areas,
            child_prog.streak_days if child_prog else 0
        )

        return {"recommendations": recommendations}

    except Exception as e:
        print(f"Regenerate recommendations error: {e}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Failed to regenerate recommendations")

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlmodel import Session, select
from typing import List, Dict, Any, Optional
from app.config.database import get_session
from app.middleware.auth_middleware import get_current_parent, get_current_user_payload
from app.models.models import (
    Activity, ActivityProgress, Child, ChildProgress, Progress, Parents
)
from app.models.schemas import MessageResponse, ActivityRead
from app.services import ai_service
import json
import base64

router = APIRouter(prefix="/api/learning", tags=["learning"])


def calculate_mastery(score: int, time_spent: int, target_time: int = 300) -> Dict[str, Any]:
    """Calculate mastery level and stars based on performance"""
    # Calculate mastery score (0-100)
    speed_factor = 1.0 if time_spent <= target_time else 0.5
    score_factor = score / 100.0

    mastery = int((score_factor * 0.7) + (speed_factor * 0.3) * 100)
    mastery = max(0, min(100, mastery))  # Clamp between 0-100

    # Calculate stars (1-3)
    if score >= 90:
        stars = 3
    elif score >= 70:
        stars = 2
    elif score >= 50:
        stars = 1
    else:
        stars = 0

    return {
        "mastery_level": mastery,
        "stars_earned": stars,
        "passed": score >= 70  # 70% is passing threshold
    }


@router.get("/activities/child/{child_id}")
def get_child_activities(
    child_id: int,
    group: str = None,
    session: Session = Depends(get_session),
):
    """Get activities for a child, optionally filtered by group. Uses raw SQL to avoid enum mismatch on legacy rows."""
    from sqlalchemy import text

    if group:
        sql = text("""
            SELECT Activity_ID, activity_name, activity_type, difficulty_level, language,
                   activity_content, estimated_duration_minutes, Child_ID,
                   activity_group, mascot_character, is_boss_level
            FROM activity
            WHERE Child_ID = :cid AND activity_group = :grp
            ORDER BY activity_group, activity_type
        """)
        rows = session.exec(sql.bindparams(cid=child_id, grp=group)).all()
    else:
        sql = text("""
            SELECT Activity_ID, activity_name, activity_type, difficulty_level, language,
                   activity_content, estimated_duration_minutes, Child_ID,
                   activity_group, mascot_character, is_boss_level
            FROM activity
            WHERE Child_ID = :cid
            ORDER BY activity_group, activity_type
        """)
        rows = session.exec(sql.bindparams(cid=child_id)).all()

    return [
        {
            "Activity_ID": r[0],
            "activity_name": r[1],
            "activity_type": r[2],
            "difficulty_level": r[3],
            "language": r[4],
            "activity_content": r[5],
            "estimated_duration_minutes": r[6],
            "Child_ID": r[7],
            "activity_group": r[8],
            "mascot_character": r[9],
            "is_boss_level": bool(r[10]),
        }
        for r in rows
    ]



@router.get("/activities/{activity_id}", response_model=ActivityRead)
def get_activity(
    activity_id: int,
    parent = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    """Get a specific activity"""
    activity = session.get(Activity, activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Verify child belongs to parent
    if activity.Child_ID:
        child = session.get(Child, activity.Child_ID)
        if not child or child.Parent_ID != parent.Parent_ID:
            raise HTTPException(status_code=403, detail="Not authorized")

    return activity


@router.post("/activities/{activity_id}/complete", response_model=MessageResponse)
def complete_activity(
    activity_id: int,
    data: Dict[str, Any],
    parent = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    """Complete an activity and update progress"""
    activity = session.get(Activity, activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Verify child belongs to parent
    child = session.get(Child, activity.Child_ID)
    if not child or child.Parent_ID != parent.Parent_ID:
        raise HTTPException(status_code=403, detail="Not authorized")

    try:
        # Get or create progress record
        progress = session.exec(
            select(Progress).where(Progress.Child_ID == activity.Child_ID)
        ).first()

        if not progress:
            progress = Progress(Child_ID=activity.Child_ID, total_score=0)
            session.add(progress)
            session.commit()
            session.refresh(progress)

        # Get or create activity progress
        activity_progress = session.exec(
            select(ActivityProgress).where(
                ActivityProgress.activity_id == activity_id,
                ActivityProgress.progress_id == progress.progress_id
            )
        ).first()

        if not activity_progress:
            activity_progress = ActivityProgress(
                activity_id=activity_id,
                progress_id=progress.progress_id
            )
            session.add(activity_progress)

        # Calculate performance metrics
        score = data.get("score", 0)
        time_spent = data.get("time_spent", 0)

        # Call AI service to score activity and generate custom feedback
        try:
            ai_perf = ai_service.score_activity(
                activity_type=activity.activity_type,
                difficulty_level=activity.difficulty_level,
                score=score,
                time_spent=time_spent
            )
            performance = {
                "mastery_level": ai_perf["score"],
                "stars_earned": ai_perf["stars_earned"],
                "passed": ai_perf["passed"],
                "ai_feedback": ai_perf["ai_feedback"]
            }
        except Exception as e:
            # Fallback to local calculation if AI fails
            performance = calculate_mastery(score, time_spent)
            performance["ai_feedback"] = "Great job!"

        # Update activity progress
        activity_progress.completion_status = "completed"
        activity_progress.stars_earned = performance["stars_earned"]
        activity_progress.mastery_level = performance["mastery_level"]
        activity_progress.total_time_spent_minutes = time_spent
        activity_progress.total_activities_completed += 1

        # Get or create child progress for level-up checking
        child_progress = session.exec(
            select(ChildProgress).where(ChildProgress.Child_ID == activity.Child_ID)
        ).first()

        if not child_progress:
            child_progress = ChildProgress(
                Child_ID=activity.Child_ID,
                progress_id=progress.progress_id
            )
            session.add(child_progress)
            session.commit()
            session.refresh(child_progress)

        # Update child progress if letter mastered
        if performance["passed"] and activity.activity_type in ["meet_letter", "mini_quest"]:
            # Extract letter from activity content
            if activity.activity_content:
                content = json.loads(activity.activity_content) if isinstance(activity.activity_content, str) else activity.activity_content
                letter = content.get("letter", "")

                if letter:
                    # Update mastered letters
                    mastered_letters = json.loads(child_progress.letters_mastered) if child_progress.letters_mastered else []
                    if letter not in mastered_letters:
                        mastered_letters.append(letter)
                        child_progress.letters_mastered = json.dumps(mastered_letters)

                    # Update current group (default behavior)
                    child_progress.current_letter_group = activity.activity_group

        # 🚀 BOSS LEVEL / EVALUATION LOGIC
        if activity.is_boss_level and performance["passed"]:
            # Check if all activities in this group (including all Boss levels) are completed
            all_group_activities = session.exec(
                select(Activity).where(
                    Activity.Child_ID == activity.Child_ID,
                    Activity.activity_group == activity.activity_group
                )
            ).all()
            
            activity_ids = [a.Activity_ID for a in all_group_activities]
            
            completed_progress = session.exec(
                select(ActivityProgress).where(
                    ActivityProgress.progress_id == progress.progress_id,
                    ActivityProgress.activity_id.in_(activity_ids),
                    ActivityProgress.completion_status == "completed"
                )
            ).all()
            
            # If all activities in the group are completed, move to next group
            if len(completed_progress) >= len(activity_ids):
                current_group = activity.activity_group # e.g. "group_1"
                try:
                    if "_" in current_group:
                        prefix, num_str = current_group.rsplit("_", 1)
                        if num_str.isdigit():
                            next_num = int(num_str) + 1
                            child_progress.current_letter_group = f"{prefix}_{next_num}"
                except Exception as e:
                    print(f"Error advancing group: {e}")

        session.add(activity_progress)
        session.commit()

        # Check and award achievements
        new_achievements = check_and_award_achievements(session, activity.Child_ID)

        return {
            "message": "Activity completed successfully",
            "stars_earned": performance["stars_earned"],
            "mastery_level": performance["mastery_level"],
            "passed": performance["passed"],
            "ai_feedback": performance.get("ai_feedback", ""),
            "new_achievements": new_achievements
        }

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to complete activity: {str(e)}")


@router.post("/activities/{activity_id}/complete-child")
def complete_activity_child(
    activity_id: int,
    data: Dict[str, Any],
    session: Session = Depends(get_session),
):
    """Complete an activity without parent authentication (for child use)"""
    activity = session.get(Activity, activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    try:
        # Get or create progress record
        progress = session.exec(
            select(Progress).where(Progress.Child_ID == activity.Child_ID)
        ).first()

        if not progress:
            progress = Progress(Child_ID=activity.Child_ID, total_score=0)
            session.add(progress)
            session.commit()
            session.refresh(progress)

        # Get or create activity progress
        activity_progress = session.exec(
            select(ActivityProgress).where(
                ActivityProgress.activity_id == activity_id,
                ActivityProgress.progress_id == progress.progress_id
            )
        ).first()

        if not activity_progress:
            activity_progress = ActivityProgress(
                activity_id=activity_id,
                progress_id=progress.progress_id
            )
            session.add(activity_progress)

        # Calculate performance metrics
        score = data.get("score", 0)
        time_spent = data.get("time_spent", 0)

        # Call AI service to score activity and generate custom feedback
        try:
            ai_perf = ai_service.score_activity(
                activity_type=activity.activity_type,
                difficulty_level=activity.difficulty_level,
                score=score,
                time_spent=time_spent
            )
            performance = {
                "mastery_level": ai_perf["score"],
                "stars_earned": ai_perf["stars_earned"],
                "passed": ai_perf["passed"],
                "ai_feedback": ai_perf["ai_feedback"]
            }
        except Exception as e:
            # Fallback to local calculation if AI fails
            performance = calculate_mastery(score, time_spent)
            performance["ai_feedback"] = "Great job!"

        # Update activity progress
        activity_progress.completion_status = "completed"
        activity_progress.stars_earned = performance["stars_earned"]
        activity_progress.mastery_level = performance["mastery_level"]
        activity_progress.total_time_spent_minutes = time_spent
        activity_progress.total_activities_completed += 1

        # Get or create child progress for level-up checking
        child_progress = session.exec(
            select(ChildProgress).where(ChildProgress.Child_ID == activity.Child_ID)
        ).first()

        if not child_progress:
            child_progress = ChildProgress(
                Child_ID=activity.Child_ID,
                progress_id=progress.progress_id
            )
            session.add(child_progress)
            session.commit()
            session.refresh(child_progress)

        # Update child progress if letter mastered
        if performance["passed"] and activity.activity_type in ["meet_letter", "mini_quest"]:
            # Extract letter from activity content
            if activity.activity_content:
                content = json.loads(activity.activity_content) if isinstance(activity.activity_content, str) else activity.activity_content
                letter = content.get("letter", "")

                if letter:
                    # Update mastered letters
                    mastered_letters = json.loads(child_progress.letters_mastered) if child_progress.letters_mastered else []
                    if letter not in mastered_letters:
                        mastered_letters.append(letter)
                        child_progress.letters_mastered = json.dumps(mastered_letters)

                    # Update current group
                    child_progress.current_letter_group = activity.activity_group

        # 🚀 BOSS LEVEL / EVALUATION LOGIC - AI DRIVEN
        if activity.is_boss_level and performance["passed"]:
            # Check if all activities in this group are completed
            all_group_activities = session.exec(
                select(Activity).where(
                    Activity.Child_ID == activity.Child_ID,
                    Activity.activity_group == activity.activity_group
                )
            ).all()

            activity_ids = [a.Activity_ID for a in all_group_activities]

            completed_progress = session.exec(
                select(ActivityProgress).where(
                    ActivityProgress.progress_id == progress.progress_id,
                    ActivityProgress.activity_id.in_(activity_ids),
                    ActivityProgress.completion_status == "completed"
                )
            ).all()

            # If all activities in the group are completed, use AI to decide next steps
            if len(completed_progress) >= len(activity_ids):
                current_group = activity.activity_group

                try:
                    # Get child information for AI analysis
                    child = session.get(Child, activity.Child_ID)
                    if not child:
                        print(f"Child {activity.Child_ID} not found for boss level analysis")
                        raise Exception("Child not found")

                    # Prepare performance data for AI analysis
                    boss_performance_data = {
                        "accuracy_percentage": performance.get("mastery_level", 0),
                        "stars_earned": performance.get("stars_earned", 0),
                        "passed": performance.get("passed", False),
                        "total_activities": len(activity_ids),
                        "completed_activities": len(completed_progress),
                        "activity_group": current_group,
                        "time_performance": "appropriate"  # Could be enhanced with actual timing data
                    }

                    print(f"🤖 AI analyzing boss level performance for child {activity.Child_ID}...")

                    # 🧠 AI DECISION: Should child advance to next level?
                    ai_decision = ai_service.analyze_boss_level_performance(
                        child_name=child.name,
                        child_age=child.age or 7,
                        current_level=int(child.current_level or 1),
                        boss_level_performance=boss_performance_data,
                        completed_group=current_group,
                    )

                    print(f"🤖 AI Decision: {ai_decision.get('ready_for_next_level')}")
                    print(f"🤖 AI Rationale: {ai_decision.get('decision_rationale')}")

                    # Process AI decision
                    if ai_decision.get("ready_for_next_level"):
                        # Child is ready for next level - advance and generate new activities
                        current_level = int(child.current_level or 1)
                        ai_suggested_level = ai_decision.get("next_level_suggestion")

                        # Use AI suggestion, or advance one level if not provided
                        if ai_suggested_level and ai_suggested_level > current_level:
                            next_level = ai_suggested_level
                        else:
                            next_level = current_level + 1

                        # Only update if AI explicitly recommends advancement
                        if next_level > current_level:
                            child.current_level = str(next_level)

                            # Update letter group based on new level
                            if "_" in current_group:
                                prefix, num_str = current_group.rsplit("_", 1)
                                if num_str.isdigit():
                                    child_progress.current_letter_group = f"{prefix}_{next_level}"

                            print(f"🎉 Child {activity.Child_ID} advanced to level {next_level} based on AI analysis")

                            # Create parent notification for level up
                            try:
                                from app.services.notification_service import create_parent_notification
                                from app.models.enums import NotificationType

                                msg = f"🎉 Great news! {child.name} has advanced to Level {next_level}!"
                                create_parent_notification(
                                    session=session,
                                    parent_id=child.Parent_ID,
                                    notification_type=NotificationType.level_up,
                                    message=msg,
                                    notification_data={"child_id": child.Child_ID, "old_level": current_level, "new_level": next_level}
                                )
                            except Exception as notif_err:
                                print(f"Error creating level-up notification: {notif_err}")

                            # 🎯 Generate next level activities using AI
                            try:
                                print(f"🤖 Generating level {next_level} activities for child {activity.Child_ID}...")

                                # Get completed activities to avoid repetition
                                all_child_activities = session.exec(
                                    select(Activity).where(Activity.Child_ID == activity.Child_ID)
                                ).all()

                                completed_activities_data = []
                                for completed_act in all_child_activities:
                                    completed_activities_data.append({
                                        "activity_type": completed_act.activity_type,
                                        "activity_content": completed_act.activity_content,
                                        "activity_group": completed_act.activity_group
                                    })

                                next_level_activities = ai_service.generate_activities_for_child(
                                    child_id=activity.Child_ID,
                                    child_name=child.name,
                                    child_age=child.age or 7,
                                    literacy_level=next_level,
                                    weak_areas=ai_decision.get("areas_needing_work", []),
                                    native_language=child.native_language or "English",
                                    completed_activities=completed_activities_data
                                )

                                # Create new activities in database
                                created_count = 0
                                for activity_data in next_level_activities:
                                    try:
                                        from app.models.enums import ActivityType, DifficultyLevel

                                        activity_type_str = activity_data.get("activity_type", "meet_letter")
                                        activity_type = ActivityType(activity_type_str)

                                        difficulty_str = activity_data.get("difficulty_level", "beginner")
                                        difficulty_level = DifficultyLevel(difficulty_str)

                                        new_activity = Activity(
                                            activity_name=activity_data["activity_name"],
                                            activity_type=activity_type,
                                            difficulty_level=difficulty_level,
                                            language=activity_data.get("language", "English"),
                                            activity_content=activity_data.get("activity_content", {}),
                                            estimated_duration_minutes=activity_data.get("estimated_duration_minutes", 10),
                                            Child_ID=activity.Child_ID,
                                            activity_group=activity_data.get("activity_group", f"group_{next_level}"),
                                            mascot_character=activity_data.get("mascot_character", "Learning Friend"),
                                            is_boss_level=activity_data.get("is_boss_level", False)
                                        )
                                        session.add(new_activity)
                                        session.commit()
                                        session.refresh(new_activity)
                                        created_count += 1

                                    except Exception as e:
                                        print(f"Error creating activity {activity_data.get('activity_name')}: {e}")
                                        continue

                                # Initialize progress records for new activities
                                if created_count > 0:
                                    all_new_activities = session.exec(
                                        select(Activity).where(Activity.Child_ID == activity.Child_ID)
                                    ).all()

                                    for new_activity in all_new_activities:
                                        existing_progress = session.exec(
                                            select(ActivityProgress).where(
                                                ActivityProgress.progress_id == progress.progress_id,
                                                ActivityProgress.activity_id == new_activity.Activity_ID
                                            )
                                        ).first()

                                        if not existing_progress:
                                            new_progress = ActivityProgress(
                                                progress_id=progress.progress_id,
                                                activity_id=new_activity.Activity_ID,
                                                completion_status='not_started',
                                                stars_earned=0,
                                                mastery_level=0,
                                                total_time_spent_minutes=0,
                                                total_activities_completed=0
                                            )
                                            session.add(new_progress)

                                    session.commit()

                                print(f"✅ Generated {created_count} level {next_level} activities for child {activity.Child_ID}")

                            except Exception as e:
                                print(f"❌ Error generating next level activities: {e}")
                                import traceback
                                print(traceback.format_exc())

                    else:
                        # Child needs more practice - stay at current level and generate targeted practice
                        print(f"📚 Child {activity.Child_ID} needs more practice at current level")

                        # 🎯 Generate targeted practice activities using AI
                        try:
                            practice_areas = ai_decision.get("areas_needing_work", [])
                            practice_types = ai_decision.get("practice_needed", ["meet_letter", "hear_sound"])

                            print(f"🤖 Generating targeted practice activities for: {practice_areas}")

                            # Get completed activities to avoid repetition
                            all_child_activities = session.exec(
                                select(Activity).where(Activity.Child_ID == activity.Child_ID)
                            ).all()

                            completed_activities_data = []
                            for completed_act in all_child_activities:
                                completed_activities_data.append({
                                    "activity_type": completed_act.activity_type,
                                    "activity_content": completed_act.activity_content,
                                    "activity_group": completed_act.activity_group
                                })

                            # Generate practice activities for current level
                            practice_activities = ai_service.generate_activities_for_child(
                                child_id=activity.Child_ID,
                                child_name=child.name,
                                child_age=child.age or 7,
                                literacy_level=int(child.current_level or 1),
                                weak_areas=practice_areas,
                                native_language=child.native_language or "English",
                                completed_activities=completed_activities_data
                            )

                            # Create practice activities in database
                            created_count = 0
                            for activity_data in practice_activities[:10]:  # Limit to 10 practice activities
                                try:
                                    from app.models.enums import ActivityType, DifficultyLevel

                                    activity_type_str = activity_data.get("activity_type", "meet_letter")
                                    activity_type = ActivityType(activity_type_str)

                                    difficulty_str = activity_data.get("difficulty_level", "beginner")
                                    difficulty_level = DifficultyLevel(difficulty_str)

                                    new_activity = Activity(
                                        activity_name=f"Practice: {activity_data['activity_name']}",
                                        activity_type=activity_type,
                                        difficulty_level=difficulty_level,
                                        language=activity_data.get("language", "English"),
                                        activity_content=activity_data.get("activity_content", {}),
                                        estimated_duration_minutes=activity_data.get("estimated_duration_minutes", 10),
                                        Child_ID=activity.Child_ID,
                                        activity_group=activity_data.get("activity_group", current_group),
                                        mascot_character=activity_data.get("mascot_character", "Practice Friend"),
                                        is_boss_level=False  # Practice activities are not boss levels
                                    )
                                    session.add(new_activity)
                                    session.commit()
                                    session.refresh(new_activity)
                                    created_count += 1

                                except Exception as e:
                                    print(f"Error creating practice activity: {e}")
                                    continue

                            # Initialize progress records for practice activities
                            if created_count > 0:
                                all_practice_activities = session.exec(
                                    select(Activity).where(
                                        Activity.Child_ID == activity.Child_ID,
                                        Activity.activity_group.contains("practice")
                                    )
                                ).all()

                                for practice_activity in all_practice_activities:
                                    existing_progress = session.exec(
                                        select(ActivityProgress).where(
                                            ActivityProgress.progress_id == progress.progress_id,
                                            ActivityProgress.activity_id == practice_activity.Activity_ID
                                        )
                                    ).first()

                                    if not existing_progress:
                                        new_progress = ActivityProgress(
                                            progress_id=progress.progress_id,
                                            activity_id=practice_activity.Activity_ID,
                                            completion_status='not_started',
                                            stars_earned=0,
                                            mastery_level=0,
                                            total_time_spent_minutes=0,
                                            total_activities_completed=0
                                        )
                                        session.add(new_progress)

                                session.commit()

                            print(f"✅ Generated {created_count} practice activities for child {activity.Child_ID}")

                        except Exception as e:
                            print(f"❌ Error generating practice activities: {e}")
                            import traceback
                            print(traceback.format_exc())

                    # Store AI decision for parent reference
                    performance["ai_level_decision"] = ai_decision

                    session.add(child)
                    session.add(child_progress)

                except Exception as e:
                    print(f"❌ Error in AI-driven level progression: {e}")
                    import traceback
                    print(traceback.format_exc())
                    # NO FALLBACK - Let AI analysis stand, don't mechanically override
                    print(f"⚠️ AI analysis failed, preserving current level for child {activity.Child_ID}")

        session.add(activity_progress)
        session.commit()

        # Check and award achievements
        new_achievements = check_and_award_achievements(session, activity.Child_ID)

        response_data = {
            "message": "Activity completed successfully",
            "stars_earned": performance["stars_earned"],
            "mastery_level": performance["mastery_level"],
            "passed": performance["passed"],
            "ai_feedback": performance.get("ai_feedback", ""),
            "new_achievements": new_achievements
        }

        return response_data

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error completing activity: {error_trace}")
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to complete activity: {str(e)}\n{error_trace}")


def check_and_award_achievements(session: Session, child_id: int):
    from app.models.models import Achievement

    # Get current achievements
    current_achievements = session.exec(
        select(Achievement).where(Achievement.Child_ID == child_id)
    ).all()
    current_names = [a.achievement_name for a in current_achievements]

    # Get progress stats
    progress = session.exec(select(Progress).where(Progress.Child_ID == child_id)).first()
    if not progress:
        return []

    activities = session.exec(
        select(ActivityProgress).where(
            ActivityProgress.progress_id == progress.progress_id,
            ActivityProgress.completion_status == "completed"
        )
    ).all()

    total_completed = len(activities)
    total_stars = sum([a.stars_earned for a in activities])

    child_progress = session.exec(select(ChildProgress).where(ChildProgress.Child_ID == child_id)).first()
    mastered_letters = json.loads(child_progress.letters_mastered) if child_progress and child_progress.letters_mastered else []
    streak_days = child_progress.streak_days if child_progress else 0

    # Get child's current level
    child = session.get(Child, child_id)
    current_level = int(child.current_level or 1) if child else 1

    new_achievements = []

    # ═══════════════════════════════════════════════════════════════════════
    # ACHIEVEMENT BADGES (5) - Based on completing stages/levels
    # ═══════════════════════════════════════════════════════════════════════

    # 🌱 First Steps: Complete Level 1
    if "First Steps" not in current_names and current_level >= 2:
        ach = Achievement(achievement_name="First Steps", description="Complete Level 1", badge_icon="🌱", Child_ID=child_id)
        session.add(ach)
        new_achievements.append(ach)

    # 🔤 Letter Hero: Complete Stage 1 (master first group of letters)
    if "Letter Hero" not in current_names and len(mastered_letters) >= 6:
        ach = Achievement(achievement_name="Letter Hero", description="Complete Stage 1", badge_icon="🔤", Child_ID=child_id)
        session.add(ach)
        new_achievements.append(ach)

    # 🔊 Sound Detective: Complete Stage 2 (master second group of letters)
    if "Sound Detective" not in current_names and len(mastered_letters) >= 13:
        ach = Achievement(achievement_name="Sound Detective", description="Complete Stage 2", badge_icon="🔊", Child_ID=child_id)
        session.add(ach)
        new_achievements.append(ach)

    # 🧱 Word Builder: Complete Stage 3 (master third group of letters)
    if "Word Builder" not in current_names and len(mastered_letters) >= 19:
        ach = Achievement(achievement_name="Word Builder", description="Complete Stage 3", badge_icon="🧱", Child_ID=child_id)
        session.add(ach)
        new_achievements.append(ach)

    # ⭐ Reading Star: Complete Stage 4 (master all letters)
    if "Reading Star" not in current_names and len(mastered_letters) >= 25:
        ach = Achievement(achievement_name="Reading Star", description="Complete Stage 4 (finish app)", badge_icon="⭐", Child_ID=child_id)
        session.add(ach)
        new_achievements.append(ach)

    # ═══════════════════════════════════════════════════════════════════════
    # PERFORMANCE BADGES (4) - Based on performance quality
    # ═══════════════════════════════════════════════════════════════════════

    # ⚡ Speed Reader: 3 levels with fastest tier (3 stars + quick completion)
    three_star_activities = [a for a in activities if a.stars_earned >= 3]
    if "Speed Reader" not in current_names and len(three_star_activities) >= 3:
        ach = Achievement(achievement_name="Speed Reader", description="3 levels with fastest tier", badge_icon="⚡", Child_ID=child_id)
        session.add(ach)
        new_achievements.append(ach)

    # 💯 Perfect Score: 5 levels with ⭐⭐⭐
    if "Perfect Score" not in current_names and len(three_star_activities) >= 5:
        ach = Achievement(achievement_name="Perfect Score", description="5 levels with ⭐⭐⭐", badge_icon="💯", Child_ID=child_id)
        session.add(ach)
        new_achievements.append(ach)

    # 🎯 Sharp Shooter: 10 questions correct in a row
    # This would need additional tracking - for now we'll use high stars earned as proxy
    if "Sharp Shooter" not in current_names and total_stars >= 30:
        ach = Achievement(achievement_name="Sharp Shooter", description="10 questions correct in a row", badge_icon="🎯", Child_ID=child_id)
        session.add(ach)
        new_achievements.append(ach)

    # 🦉 Wise Owl: 3-star rating on a stage evaluation
    # This would need boss level tracking - for now we'll use total completion
    if "Wise Owl" not in current_names and total_completed >= 10:
        ach = Achievement(achievement_name="Wise Owl", description="3-star rating on stage evaluation", badge_icon="🦉", Child_ID=child_id)
        session.add(ach)
        new_achievements.append(ach)

    # ═══════════════════════════════════════════════════════════════════════
    # HABIT BADGES (3) - Based on consistency
    # ═══════════════════════════════════════════════════════════════════════

    # 🔥 3-Day Streak: Play 3 days in a row
    if "3-Day Streak" not in current_names and streak_days >= 3:
        ach = Achievement(achievement_name="3-Day Streak", description="Play 3 days in a row", badge_icon="🔥", Child_ID=child_id)
        session.add(ach)
        new_achievements.append(ach)

    # 📅 Weekly Warrior: Play 7 days in a row
    if "Weekly Warrior" not in current_names and streak_days >= 7:
        ach = Achievement(achievement_name="Weekly Warrior", description="Play 7 days in a row", badge_icon="📅", Child_ID=child_id)
        session.add(ach)
        new_achievements.append(ach)

    # 💎 Dedicated Learner: Play 20 total days
    # For now, we'll use total activities completed as a proxy
    if "Dedicated Learner" not in current_names and total_completed >= 20:
        ach = Achievement(achievement_name="Dedicated Learner", description="Play 20 total days", badge_icon="💎", Child_ID=child_id)
        session.add(ach)
        new_achievements.append(ach)

    if new_achievements:
        session.commit()
        try:
            from app.services.notification_service import create_parent_notification
            from app.models.enums import NotificationType

            child = session.get(Child, child_id)
            if child:
                for ach in new_achievements:
                    msg = f"🏆 Amazing! {child.name} has unlocked the '{ach.achievement_name}' achievement!"
                    create_parent_notification(
                        session=session,
                        parent_id=child.Parent_ID,
                        notification_type=NotificationType.achievement_earned,
                        message=msg,
                        notification_data={"child_id": child_id, "achievement_name": ach.achievement_name}
                    )
        except Exception as notif_err:
            print(f"Error creating achievement notifications: {notif_err}")

    return [{"name": a.achievement_name, "icon": a.badge_icon} for a in new_achievements]


@router.get("/achievements/{child_id}")
def get_child_achievements(
    child_id: int,
    session: Session = Depends(get_session),
):
    from app.models.models import Achievement
    achievements = session.exec(
        select(Achievement).where(Achievement.Child_ID == child_id)
    ).all()
    
    return [
        {
            "name": a.achievement_name,
            "description": a.description,
            "icon": a.badge_icon
        }
        for a in achievements
    ]


@router.get("/progress/{child_id}")
def get_child_learning_progress(
    child_id: int,
    parent = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    """Get detailed learning progress for a child"""
    # Verify child belongs to parent
    child = session.get(Child, child_id)
    if not child or child.Parent_ID != parent.Parent_ID:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get child progress
    child_progress = session.exec(
        select(ChildProgress).where(ChildProgress.Child_ID == child_id)
    ).first()

    if not child_progress:
        return {
            "current_letter_group": None,
            "letters_mastered": [],
            "total_activities_completed": 0,
            "average_mastery": 0,
            "streak_days": 0,
            "activity_progress": {}
        }

    # Get activity progress data
    progress = session.get(Progress, child_progress.progress_id)
    if progress:
        activity_progress_list = session.exec(
            select(ActivityProgress).where(ActivityProgress.progress_id == progress.progress_id)
        ).all()

        completed_activities = [ap for ap in activity_progress_list if ap.completion_status == "completed"]
        total_mastery = sum([ap.mastery_level for ap in completed_activities])
        average_mastery = total_mastery / len(completed_activities) if completed_activities else 0
    else:
        completed_activities = []
        average_mastery = 0
        activity_progress_list = []

    # Build activity_progress dictionary for frontend
    activity_progress_dict = {}
    for ap in activity_progress_list:
        activity_progress_dict[ap.activity_id] = {
            "completion_status": ap.completion_status,
            "stars_earned": ap.stars_earned,
            "mastery_level": ap.mastery_level
        }

    return {
        "current_letter_group": child_progress.current_letter_group,
        "letters_mastered": json.loads(child_progress.letters_mastered) if child_progress.letters_mastered else [],
        "total_activities_completed": len(completed_activities),
        "average_mastery": round(average_mastery, 1),
        "streak_days": child_progress.streak_days,
        "activity_progress": activity_progress_dict
    }


@router.get("/groups/available")
def get_available_letter_groups(
    parent = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    """Get all available letter groups with activities"""
    groups = session.exec(
        select(Activity.activity_group).distinct().where(
            Activity.activity_group != None
        )
    ).all()

    group_info = {}
    for group in groups:
        group_name = group[0]
        activities = session.exec(
            select(Activity).where(Activity.activity_group == group_name)
        ).all()

        # Count activities by type
        activity_counts = {}
        for activity in activities:
            activity_type = activity.activity_type
            activity_counts[activity_type] = activity_counts.get(activity_type, 0) + 1

        group_info[group_name] = {
            "total_activities": len(activities),
            "activity_types": activity_counts,
            "mascot_family": get_mascot_family(group_name)
        }

    return group_info


def get_mascot_family(group_name: str) -> str:
    """Get mascot family name for a group"""
    mascot_families = {
        "group_1": "Letter Heroes - Group 1",
        "group_1_words": "Word Wizards - Group 1",
        "group_2": "Letter Heroes - Group 2",
        "arabic_group_1": "أبطال الحروف - المجموعة الأولى"
    }
    return mascot_families.get(group_name, "Learning Adventures")


@router.get("/letters/{child_id}/mastered")
def get_mastered_letters(
    child_id: int,
    parent = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    """Get list of mastered letters for a child"""
    # Verify child belongs to parent
    child = session.get(Child, child_id)
    if not child or child.Parent_ID != parent.Parent_ID:
        raise HTTPException(status_code=403, detail="Not authorized")

    child_progress = session.exec(
        select(ChildProgress).where(ChildProgress.Child_ID == child_id)
    ).first()

    if not child_progress:
        return {"mastered_letters": [], "current_group": None}

    return {
        "mastered_letters": json.loads(child_progress.letters_mastered) if child_progress.letters_mastered else [],
        "current_group": child_progress.current_letter_group
    }


@router.post("/letters/{child_id}/check-unlock")
def check_word_activities_unlock(
    child_id: int,
    parent = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    """Check if word activities should be unlocked for a child"""
    # Verify child belongs to parent
    child = session.get(Child, child_id)
    if not child or child.Parent_ID != parent.Parent_ID:
        raise HTTPException(status_code=403, detail="Not authorized")

    child_progress = session.exec(
        select(ChildProgress).where(ChildProgress.Child_ID == child_id)
    ).first()

    if not child_progress:
        return {"unlocked": False, "reason": "No progress yet"}

    mastered_letters = json.loads(child_progress.letters_mastered) if child_progress.letters_mastered else []

    # Check if Group 1 letters are mastered (s, a, t, i, p, n)
    group_1_letters = {'s', 'a', 't', 'i', 'p', 'n'}

    if group_1_letters.issubset(set(mastered_letters)):
        return {
            "unlocked": True,
            "unlocked_groups": ["group_1_words"],
            "message": "Great job! You've mastered all Group 1 letters! Word activities unlocked!"
        }
    else:
        remaining = group_1_letters - set(mastered_letters)
        return {
            "unlocked": False,
            "remaining_letters": list(remaining),
            "message": f"Master {len(remaining)} more letter(s) to unlock word activities!"
        }


@router.get("/progress-report/{child_id}")
def generate_progress_report(
    child_id: int,
    parent: Parents = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    """Generate AI-powered progress report for child"""
    try:
        # Validate child access
        child = session.get(Child, child_id)
        if not child or child.Parent_ID != parent.Parent_ID:
            raise HTTPException(status_code=403, detail="Not authorized to access this child's data")

        # Get child's activities with error handling
        try:
            activities = session.exec(
                select(Activity).where(Activity.Child_ID == child_id)
            ).all() or []
        except Exception as e:
            print(f"Error fetching activities: {e}")
            activities = []

        # Get assessment history with error handling
        try:
            assessments = session.exec(
                select(Assessment).where(Assessment.Child_ID == child_id)
                .order_by(Assessment.assessment_date.desc())
            ).all() or []
        except Exception as e:
            print(f"Error fetching assessments: {e}")
            assessments = []

        # Get achievements with error handling
        try:
            achievements = session.exec(
                select(Achievement).where(Achievement.Child_ID == child_id)
            ).all() or []
        except Exception as e:
            print(f"Error fetching achievements: {e}")
            achievements = []

        # Get progress data with error handling
        try:
            child_prog = session.exec(
                select(ChildProgress).where(ChildProgress.Child_ID == child_id)
            ).first()
        except Exception as e:
            print(f"Error fetching child progress: {e}")
            child_prog = None

        # Get activity progress for engagement analysis with better error handling
        activity_progress = []
        if child_prog and child_prog.progress_id:
            try:
                from sqlmodel import false
                activity_progress = session.exec(
                    select(ActivityProgress).where(
                        ActivityProgress.progress_id == child_prog.progress_id
                    )
                ).all() or []
            except Exception as e:
                print(f"Error fetching activity progress: {e}")
                activity_progress = []

        # Calculate engagement data safely
        try:
            # Debug: Print individual activity times to understand the data
            activity_times = [(ap.activity_id, ap.total_time_spent_minutes or 0) for ap in activity_progress]
            print(f"DEBUG: Individual activity times: {activity_times}")

            total_time_minutes = sum([ap.total_time_spent_minutes or 0 for ap in activity_progress])

            print(f"DEBUG: Total raw time: {total_time_minutes} minutes")

            # Validate time data - check for unrealistic individual activity times
            max_reasonable_activity_time = 120  # 2 hours per activity max
            reasonable_activities = [ap for ap in activity_progress if (ap.total_time_spent_minutes or 0) <= max_reasonable_activity_time]

            if len(reasonable_activities) < len(activity_progress):
                print(f"DEBUG: Filtered out {len(activity_progress) - len(reasonable_activities)} activities with unrealistic times (> 2 hours)")
                # Recalculate with only reasonable times
                total_time_minutes = sum([ap.total_time_spent_minutes or 0 for ap in reasonable_activities])

            # Cap the total time at a reasonable maximum (8 hours max for reporting)
            if total_time_minutes > 480:  # 8 hours in minutes
                print(f"DEBUG: Time capped from {total_time_minutes} to 480 minutes (8 hours)")
                total_time_minutes = 480

            completed_activities_count = len([ap for ap in activity_progress if ap.completion_status == 'completed'])

            print(f"DEBUG: Final time: {total_time_minutes} minutes, {completed_activities_count} completed activities")

        except Exception as e:
            print(f"Error calculating engagement data: {e}")
            total_time_minutes = 0
            completed_activities_count = 0

        # Analyze favorite activities safely
        try:
            activity_type_counts = {}
            for act in activities:
                act_type = act.activity_type or "unknown"
                if act_type not in activity_type_counts:
                    activity_type_counts[act_type] = 0
                activity_type_counts[act_type] += 1

            favorite_activities = sorted(
                activity_type_counts.keys(),
                key=lambda x: activity_type_counts[x],
                reverse=True
            )[:3] if activity_type_counts else []
        except Exception as e:
            print(f"Error analyzing favorite activities: {e}")
            favorite_activities = []

        # Prepare data for AI report safely
        try:
            activities_completed = [
                {
                    "activity_name": act.activity_name or "Unknown Activity",
                    "activity_type": act.activity_type or "unknown",
                    "activity_group": act.activity_group or "general",
                    "difficulty_level": act.difficulty_level or "beginner",
                    "is_completed": any(
                        ap.activity_id == act.Activity_ID and ap.completion_status == 'completed'
                        for ap in activity_progress
                    ) if activity_progress else False
                }
                for act in activities
            ]
        except Exception as e:
            print(f"Error preparing activities data: {e}")
            activities_completed = []

        # Prepare assessment history safely
        try:
            assessment_history = []
            for a in assessments:
                try:
                    assessment_history.append({
                        "date": str(a.assessment_date) if hasattr(a, 'assessment_date') and a.assessment_date else "Unknown date",
                        "accuracy_percentage": float(a.accuracy_percentage) if hasattr(a, 'accuracy_percentage') and a.accuracy_percentage is not None else 0.0,
                        "literacy_level": a.ai_analysis.get("dyslexia_level") if a.ai_analysis and isinstance(a.ai_analysis, dict) else None,
                        "weak_areas": a.ai_analysis.get("weak_areas", []) if a.ai_analysis and isinstance(a.ai_analysis, dict) else []
                    })
                except Exception as inner_e:
                    print(f"Error processing individual assessment: {inner_e}")
                    continue
        except Exception as e:
            print(f"Error preparing assessment history: {e}")
            assessment_history = []

        # Prepare engagement data safely
        try:
            from datetime import date
            engagement_data = {
                "streak_days": int(child_prog.streak_days) if child_prog and hasattr(child_prog, 'streak_days') and child_prog.streak_days is not None else 0,
                "total_time_minutes": int(total_time_minutes),
                "favorite_activities": favorite_activities if favorite_activities else [],
                "report_date": str(date.today())
            }
        except Exception as e:
            print(f"Error preparing engagement data: {e}")
            from datetime import date
            engagement_data = {
                "streak_days": 0,
                "total_time_minutes": 0,
                "favorite_activities": [],
                "report_date": str(date.today())
            }

        # Prepare achievements data safely
        try:
            achievements_data = [
                {
                    "name": a.achievement_name or "Achievement",
                    "icon": a.badge_icon or "🏆",
                    "description": a.description or "Great accomplishment!"
                }
                for a in achievements
            ]
        except Exception as e:
            print(f"Error preparing achievements data: {e}")
            achievements_data = []

        # Generate AI progress report with comprehensive error handling
        try:
            print(f"Generating progress report for child: {child.name}, age: {child.age or 7}, level: {child.current_level or 1}")
            print(f"Data: {len(activities_completed)} activities, {len(assessment_history)} assessments, {len(achievements_data)} achievements")

            report = ai_service.generate_child_progress_report(
                child_name=child.name or "Child",
                child_age=int(child.age) if child.age is not None else 7,
                literacy_level=int(child.current_level) if child.current_level is not None else 1,
                activities_completed=activities_completed,
                assessment_history=assessment_history,
                engagement_data=engagement_data,
                achievements=achievements_data
            )
            print("Progress report generated successfully")
            return report

        except Exception as ai_error:
            print(f"AI Report Generation Error: {ai_error}")
            import traceback
            print(f"AI Error Traceback: {traceback.format_exc()}")

            # Return a fallback basic report if AI fails
            from datetime import date

            # Format time nicely
            def format_time(minutes):
                if minutes < 60:
                    return f"{minutes} minutes"
                elif minutes < 120:
                    return "1 hour"
                else:
                    hours = minutes // 60
                    mins = minutes % 60
                    if mins == 0:
                        return f"{hours} hours"
                    else:
                        return f"{hours} hours {mins} minutes"

            formatted_time = format_time(engagement_data.get('total_time_minutes', 0))

            return {
                "child_name": child.name or "Child",
                "child_age": child.age or 7,
                "literacy_level": child.current_level or 1,
                "report_date": str(date.today()),
                "total_activities": len(activities_completed),
                "total_assessments": len(assessment_history),
                "achievements_count": len(achievements_data),
                "academic_progress": {
                    "current_level": f"Level {child.current_level or 1}",
                    "skills_mastered": ["Letter recognition", "Basic phonics"],
                    "skills_in_progress": ["Word formation", "Reading comprehension"],
                    "activities_summary": f"Your child has completed {len(activities_completed)} learning activities.",
                    "performance_trend": "developing",
                    "next_academic_milestones": ["Complete current level activities", "Practice daily reading"]
                },
                "engagement_insights": {
                    "learning_consistency": f"Building learning habits",
                    "total_learning_time": formatted_time,
                    "activity_preferences": favorite_activities if favorite_activities else ["Various activities"],
                    "motivation_patterns": "Developing consistent learning routines"
                },
                "ai_recommendations": [
                    "Continue daily reading practice for 15-20 minutes",
                    "Practice letter sounds during daily routines",
                    "Celebrate small wins to build confidence",
                    "Explore different types of books to find interests",
                    "Create a cozy reading space at home"
                ],
                "parent_encouragement": f"Every child learns at their own pace. {child.name or 'Your child'} is making progress and with continued support will develop strong literacy skills.",
                "celebration_points": [
                    f"Completed {len(activities_completed)} learning activities",
                    f"Showing consistent effort in learning",
                    "Building foundation for reading success"
                ]
            }

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        print(f"Progress Report Generation Error: {e}")
        import traceback
        print(f"Full Error Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error generating progress report: {str(e)}")


# ═══════════════════════════════════════════════════════════════════════
# LEVEL UP LOGIC
# ═══════════════════════════════════════════════════════════════════════


# ═══════════════════════════════════════════════════════════════════════
# AI PRONUNCIATION ANALYSIS
# ═══════════════════════════════════════════════════════════════════════

@router.post("/pronunciation/analyze")
async def analyze_pronunciation(
    audio: UploadFile = File(...),
    target_word: str = Form(...),
    target_letter: str = Form(...),
    child_age: int = Form(default=7),
    language: str = Form(default="English"),
):
    """
    Analyze a child's spoken pronunciation using Gemini multimodal AI.
    Accepts an audio file (webm) and returns pronunciation score + feedback.
    """
    try:
        audio_bytes = await audio.read()
        if not audio_bytes:
            raise HTTPException(status_code=400, detail="Empty audio file")

        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

        result = ai_service.analyze_pronunciation(
            audio_base64=audio_b64,
            target_word=target_word,
            target_letter=target_letter,
            child_age=child_age,
            language=language,
        )
        return result

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Pronunciation analysis endpoint error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Pronunciation analysis failed: {str(e)}")


# ═══════════════════════════════════════════════════════════════════════
# AI HANDWRITING ANALYSIS
# ═══════════════════════════════════════════════════════════════════════

@router.post("/handwriting/analyze")
async def analyze_handwriting(
    image: UploadFile = File(...),
    target_letter: str = Form(...),
    child_age: int = Form(default=7),
    language: str = Form(default="English"),
):
    """
    Analyze a child's handwritten letter image using Gemini Vision AI.
    Accepts a PNG image and returns handwriting quality score + feedback.
    """
    try:
        img_bytes = await image.read()
        if not img_bytes:
            raise HTTPException(status_code=400, detail="Empty image file")

        img_b64 = base64.b64encode(img_bytes).decode("utf-8")

        result = ai_service.analyze_handwriting(
            image_base64=img_b64,
            target_letter=target_letter,
            child_age=child_age,
            language=language,
        )
        return result

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Handwriting analysis endpoint error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Handwriting analysis failed: {str(e)}")

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from app.config.database import get_session
from app.middleware.auth_middleware import get_current_parent
from app.models.models import Parents, Child, Progress, ChildProgress, Subscription, ActivityProgress, Activity
from app.models.enums import PlanType, SubscriptionStatus
from app.models.schemas import ChildCreate, ChildUpdate, ChildRead, MessageResponse

router = APIRouter(prefix="/api/children", tags=["children"])


@router.post("/", response_model=ChildRead, status_code=201)
def create_child(
    data: ChildCreate,
    parent: Parents = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    # Enforce subscription limits
    current_children = session.exec(select(Child).where(Child.Parent_ID == parent.Parent_ID)).all()
    num_children = len(current_children)

    subscription = session.exec(
        select(Subscription).where(
            Subscription.Parent_ID == parent.Parent_ID,
            Subscription.subscription_status == SubscriptionStatus.active
        )
    ).first()

    plan_type = subscription.planType if subscription else PlanType.basic

    if plan_type == PlanType.basic and num_children >= 1:
        raise HTTPException(status_code=403, detail="Basic plan allows only 1 child. Please upgrade to Family plan.")
    elif plan_type in [PlanType.family, PlanType.annual] and num_children >= 3:
        raise HTTPException(status_code=403, detail="Family plan allows up to 3 children.")

    # Calculate age from date_of_birth if not provided
    age = data.age
    if age is None and data.date_of_birth:
        from datetime import date
        today = date.today()
        age = today.year - data.date_of_birth.year - (
            (today.month, today.day) < (data.date_of_birth.month, data.date_of_birth.day)
        )

    if age is None or age < 3 or age > 8:
        raise HTTPException(status_code=400, detail="Child age must be between 3 and 8 years old.")

    child = Child(
        name=data.name,
        date_of_birth=data.date_of_birth,
        age=age,
        native_language=data.native_language,
        current_level="1",
        Parent_ID=parent.Parent_ID,
    )
    session.add(child)
    session.commit()
    session.refresh(child)

    # Initialize Progress + ChildProgress records
    prog = Progress(total_score=0, Child_ID=child.Child_ID)
    session.add(prog)
    session.commit()
    session.refresh(prog)

    child_prog = ChildProgress(
        progress_id=prog.progress_id,
        streak_days=0,
        Child_ID=child.Child_ID,
    )
    session.add(child_prog)
    session.commit()

    return child


@router.get("/", response_model=List[ChildRead])
def list_children(
    parent: Parents = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    return session.exec(select(Child).where(Child.Parent_ID == parent.Parent_ID)).all()


@router.get("/{child_id}", response_model=ChildRead)
def get_child(
    child_id: int,
    parent: Parents = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    child = session.get(Child, child_id)
    if not child or child.Parent_ID != parent.Parent_ID:
        raise HTTPException(status_code=404, detail="Child not found")
    return child


@router.put("/{child_id}", response_model=ChildRead)
def update_child(
    child_id: int,
    data: ChildUpdate,
    parent: Parents = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    child = session.get(Child, child_id)
    if not child or child.Parent_ID != parent.Parent_ID:
        raise HTTPException(status_code=404, detail="Child not found")

    # Validate age requirements if date_of_birth or age are updated
    temp_dob = data.date_of_birth if data.date_of_birth is not None else child.date_of_birth
    if temp_dob:
        from datetime import date
        today = date.today()
        calculated_age = today.year - temp_dob.year - (
            (today.month, today.day) < (temp_dob.month, temp_dob.day)
        )
        if calculated_age < 3 or calculated_age > 8:
            raise HTTPException(status_code=400, detail="Child age must be between 3 and 8 years old.")
        child.age = calculated_age
    elif data.age is not None:
        if data.age < 3 or data.age > 8:
            raise HTTPException(status_code=400, detail="Child age must be between 3 and 8 years old.")
        child.age = data.age

    for field, value in data.model_dump(exclude_unset=True).items():
        if field in ("age", "date_of_birth"):
            continue
        setattr(child, field, value)

    if data.date_of_birth is not None:
        child.date_of_birth = data.date_of_birth

    session.add(child)
    session.commit()
    session.refresh(child)
    return child


@router.delete("/{child_id}", response_model=MessageResponse)
def delete_child(
    child_id: int,
    parent: Parents = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    child = session.get(Child, child_id)
    if not child or child.Parent_ID != parent.Parent_ID:
        raise HTTPException(status_code=404, detail="Child not found")

    try:
        # Delete all related records first to avoid foreign key constraint issues
        # Get progress record
        progress = session.exec(select(Progress).where(Progress.Child_ID == child_id)).first()
        if progress:
            # Delete activity progress records
            activity_progress_list = session.exec(
                select(ActivityProgress).where(ActivityProgress.progress_id == progress.progress_id)
            ).all()
            for ap in activity_progress_list:
                session.delete(ap)

            # Delete child progress record
            child_progress = session.exec(
                select(ChildProgress).where(ChildProgress.progress_id == progress.progress_id)
            ).first()
            if child_progress:
                session.delete(child_progress)

            # Delete progress record
            session.delete(progress)

        # Delete activities
        activities = session.exec(select(Activity).where(Activity.Child_ID == child_id)).all()
        for activity in activities:
            session.delete(activity)

        # Finally delete the child
        session.delete(child)
        session.commit()

        return {"message": "Child profile deleted"}
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete child: {str(e)}")

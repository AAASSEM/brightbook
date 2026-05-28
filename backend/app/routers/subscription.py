from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from datetime import date, timedelta
from app.config.database import get_session
from app.middleware.auth_middleware import get_current_parent
from app.models.models import Parents, Subscription
from app.models.schemas import SubscriptionCreate, SubscriptionRead, MessageResponse
from app.models.enums import PlanType, SubscriptionStatus

router = APIRouter(prefix="/api/subscription", tags=["subscription"])

PLAN_PRICES = {
    PlanType.basic: 9.99,
    PlanType.family: 14.99,
    PlanType.annual: 99.99,
}
PLAN_DAYS = {
    PlanType.basic: 30,
    PlanType.family: 30,
    PlanType.annual: 365,
}


@router.get("/plans")
def get_plans():
    """Return available subscription plans."""
    return [
        {
            "id": "basic",
            "name": "Basic",
            "price": 9.99,
            "currency": "USD",
            "period": "month",
            "features": ["1 child profile", "All activity types", "Progress tracking", "Email support"],
        },
        {
            "id": "family",
            "name": "Family",
            "price": 14.99,
            "currency": "USD",
            "period": "month",
            "features": ["Up to 4 children", "All activity types", "Advanced progress charts", "AI recommendations", "Priority support"],
        },
        {
            "id": "annual",
            "name": "Annual",
            "price": 99.99,
            "currency": "USD",
            "period": "year",
            "features": ["Up to 4 children", "All features", "PDF progress reports", "Save 44% vs monthly", "Priority support"],
        },
    ]


@router.post("/subscribe", response_model=SubscriptionRead)
def subscribe(
    data: SubscriptionCreate,
    parent: Parents = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    """
    Activate a subscription. In production, this is triggered after payment confirmation.
    Currently creates the subscription record directly (gateway-agnostic).
    """
    existing = session.exec(
        select(Subscription).where(Subscription.Parent_ID == parent.Parent_ID)
    ).first()

    today = date.today()
    end = today + timedelta(days=PLAN_DAYS[data.plan_type])

    if existing:
        existing.planType = data.plan_type
        existing.subscription_status = SubscriptionStatus.active
        existing.startDate = today
        existing.endDate = end
        existing.price = PLAN_PRICES[data.plan_type]
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing

    sub = Subscription(
        planType=data.plan_type,
        subscription_status=SubscriptionStatus.active,
        startDate=today,
        endDate=end,
        price=PLAN_PRICES[data.plan_type],
        autoRenewal=True,
        Parent_ID=parent.Parent_ID,
    )
    session.add(sub)
    session.commit()
    session.refresh(sub)
    return sub


@router.get("/status", response_model=SubscriptionRead)
def get_subscription_status(
    parent: Parents = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    sub = session.exec(
        select(Subscription).where(Subscription.Parent_ID == parent.Parent_ID)
    ).first()
    if not sub:
        # Return default free subscription instead of 404
        return Subscription(
            subscription_id=0, # Fixed: Provide dummy ID for schema validation
            Parent_ID=parent.Parent_ID,
            planType=PlanType.basic,
            subscription_status=SubscriptionStatus.inactive, # Changed to inactive to match reality
            startDate=date.today(),
            endDate=None
        )
    return sub


@router.delete("/cancel", response_model=MessageResponse)
def cancel_subscription(
    parent: Parents = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    sub = session.exec(
        select(Subscription).where(Subscription.Parent_ID == parent.Parent_ID)
    ).first()
    if not sub:
        raise HTTPException(status_code=404, detail="No subscription found")
    sub.subscription_status = SubscriptionStatus.cancelled
    sub.autoRenewal = False
    session.add(sub)
    session.commit()
    return {"message": "Subscription cancelled"}


@router.put("/reactivate", response_model=SubscriptionRead)
def reactivate_subscription(
    parent: Parents = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    sub = session.exec(
        select(Subscription).where(Subscription.Parent_ID == parent.Parent_ID)
    ).first()
    if not sub:
        raise HTTPException(status_code=404, detail="No subscription found")
    
    sub.subscription_status = SubscriptionStatus.active
    sub.autoRenewal = True
    session.add(sub)
    session.commit()
    session.refresh(sub)
    return sub

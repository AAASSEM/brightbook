from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from datetime import datetime
from app.config.database import get_session
from app.middleware.auth_middleware import get_current_parent
from app.models.models import Parents, Complaint
from app.models.schemas import ComplaintCreate, ComplaintRead, MessageResponse, ComplaintFeedback
from app.models.enums import ComplaintStatus

router = APIRouter(prefix="/api/support", tags=["support"])


@router.post("/tickets", response_model=ComplaintRead, status_code=201)
def create_ticket(
    data: ComplaintCreate,
    parent: Parents = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    complaint = Complaint(
        subject=data.subject,
        description=data.description,
        category=data.category,
        priority=data.priority,
        status=ComplaintStatus.open,
        Parent_ID=parent.Parent_ID,
    )
    session.add(complaint)
    session.commit()
    session.refresh(complaint)
    return complaint


@router.get("/tickets", response_model=List[ComplaintRead])
def list_tickets(
    parent: Parents = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    return session.exec(
        select(Complaint).where(Complaint.Parent_ID == parent.Parent_ID)
    ).all()


@router.get("/tickets/{ticket_id}", response_model=ComplaintRead)
def get_ticket(
    ticket_id: int,
    parent: Parents = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    ticket = session.get(Complaint, ticket_id)
    if not ticket or ticket.Parent_ID != parent.Parent_ID:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.put("/tickets/{ticket_id}/resolve", response_model=MessageResponse)
def resolve_ticket(
    ticket_id: int,
    parent: Parents = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    ticket = session.get(Complaint, ticket_id)
    if not ticket or ticket.Parent_ID != parent.Parent_ID:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket.status = ComplaintStatus.resolved
    ticket.resolved_at = datetime.utcnow()
    session.add(ticket)
    session.commit()
    return {"message": "Ticket marked as resolved"}


@router.post("/tickets/{ticket_id}/feedback", response_model=ComplaintRead)
def submit_ticket_feedback(
    ticket_id: int,
    data: ComplaintFeedback,
    parent: Parents = Depends(get_current_parent),
    session: Session = Depends(get_session),
):
    ticket = session.get(Complaint, ticket_id)
    if not ticket or ticket.Parent_ID != parent.Parent_ID:
        raise HTTPException(status_code=404, detail="Ticket not found")

    ticket.is_satisfied = data.is_satisfied
    ticket.user_feedback = data.user_feedback
    
    if not data.is_satisfied:
        ticket.status = ComplaintStatus.open
    else:
        ticket.status = ComplaintStatus.closed

    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    return ticket

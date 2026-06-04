from datetime import datetime
from sqlmodel import Session
from app.models.models import Notification
from app.models.enums import NotificationType
from app.socket_events.emitters import emit_notification
import asyncio
import logging

def create_parent_notification(
    session: Session,
    parent_id: int,
    notification_type: NotificationType,
    message: str,
    notification_data: dict = None
) -> Notification:
    """
    Creates a notification in the database for the parent, and broadcasts it via WebSocket if active.
    """
    try:
        notif = Notification(
            notification_type=notification_type,
            message=message,
            notification_data=notification_data or {},
            scheduled_time=datetime.utcnow(),
            sent_time=datetime.utcnow(),
            is_read=False,
            Parent_ID=parent_id
        )
        session.add(notif)
        session.commit()
        session.refresh(notif)
        
        # Broadcast over WebSocket (non-blocking)
        try:
            try:
                loop = asyncio.get_running_loop()
                loop.create_task(emit_notification(parent_id, notification_type.value, message))
            except RuntimeError:
                # No running event loop
                pass
        except Exception as ws_err:
            logging.warning(f"Failed to emit WS notification: {ws_err}")
            
        return notif
    except Exception as e:
        logging.error(f"Error creating notification: {e}")
        session.rollback()
        return None

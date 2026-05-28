from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlmodel import Session, select
from app.config.database import get_session
from app.utils.security import decode_access_token
from app.models.enums import UserRole
from app.models.models import Parents, Admin, Child

security = HTTPBearer()


def _get_token_payload(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = decode_access_token(credentials.credentials)
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_parent(
    payload: dict = Depends(_get_token_payload),
    session: Session = Depends(get_session),
) -> Parents:
    if payload.get("role") != UserRole.parent.value:
        raise HTTPException(status_code=403, detail="Parent access required")
    parent = session.get(Parents, int(payload["sub"]))
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")
    return parent


def get_current_admin(
    payload: dict = Depends(_get_token_payload),
    session: Session = Depends(get_session),
) -> Admin:
    if payload.get("role") != UserRole.admin.value:
        raise HTTPException(status_code=403, detail="Admin access required")
    admin = session.get(Admin, int(payload["sub"]))
    if not admin or not admin.is_active:
        raise HTTPException(status_code=403, detail="Admin access denied")
    return admin


def get_current_user_payload(
    payload: dict = Depends(_get_token_payload),
) -> dict:
    """Returns raw payload — for routes accessible by any role."""
    return payload

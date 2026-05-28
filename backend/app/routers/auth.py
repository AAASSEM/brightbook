from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from jose import JWTError
from app.config.database import get_session
from app.models.models import Parents, Admin
from app.models.schemas import (
    ParentRegister, ParentLogin, AdminLogin,
    TokenResponse, RefreshRequest, MessageResponse
)
from app.models.enums import UserRole
from app.utils.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_refresh_token
)
from datetime import datetime

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register_parent(data: ParentRegister, session: Session = Depends(get_session)):
    existing = session.exec(select(Parents).where(Parents.email == data.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    parent = Parents(
        name=data.name,
        email=data.email,
        phone_number=data.phone_number,
        password_hash=hash_password(data.password),
        preferred_language=data.language,
    )
    session.add(parent)
    session.commit()
    session.refresh(parent)

    access = create_access_token(parent.Parent_ID, UserRole.parent)
    refresh = create_refresh_token(parent.Parent_ID, UserRole.parent)
    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        role=UserRole.parent,
        user_id=parent.Parent_ID,
        name=parent.name,
    )


@router.post("/login", response_model=TokenResponse)
def login_parent(data: ParentLogin, session: Session = Depends(get_session)):
    parent = session.exec(select(Parents).where(Parents.email == data.email)).first()
    if not parent or not verify_password(data.password, parent.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access = create_access_token(parent.Parent_ID, UserRole.parent)
    refresh = create_refresh_token(parent.Parent_ID, UserRole.parent)
    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        role=UserRole.parent,
        user_id=parent.Parent_ID,
        name=parent.name,
    )


@router.post("/admin/login", response_model=TokenResponse)
def login_admin(data: AdminLogin, session: Session = Depends(get_session)):
    print(f"Admin login attempt: {data.email}")

    admin = session.exec(select(Admin).where(Admin.email == data.email)).first()

    if not admin:
        print(f"No admin found with email: {data.email}")
        raise HTTPException(status_code=401, detail="Invalid email or password")

    print(f"Admin found: {admin.email}, Active: {admin.is_active}")

    password_valid = verify_password(data.password, admin.password_hash)
    print(f"Password valid: {password_valid}")

    if not password_valid:
        print(f"Invalid password for admin: {data.email}")
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not admin.is_active:
        print(f"Admin account disabled: {data.email}")
        raise HTTPException(status_code=403, detail="Account disabled")

    admin.last_login = datetime.utcnow()
    session.add(admin)
    session.commit()

    access = create_access_token(admin.admin_id, UserRole.admin)
    refresh = create_refresh_token(admin.admin_id, UserRole.admin)
    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        role=UserRole.admin,
        user_id=admin.admin_id,
        name=admin.name,
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(data: RefreshRequest, session: Session = Depends(get_session)):
    try:
        payload = decode_refresh_token(data.refresh_token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = int(payload["sub"])
    role = UserRole(payload["role"])

    if role == UserRole.admin:
        user = session.get(Admin, user_id)
        name = user.name if user else ""
    else:
        user = session.get(Parents, user_id)
        name = user.name if user else ""

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    access = create_access_token(user_id, role)
    new_refresh = create_refresh_token(user_id, role)
    return TokenResponse(
        access_token=access,
        refresh_token=new_refresh,
        role=role,
        user_id=user_id,
        name=name,
    )


# ─────────────────────────────────────────────
# PASSWORD RESET
# ─────────────────────────────────────────────
import uuid
from app.models.schemas import ForgotPasswordRequest, ResetPasswordRequest
from app.utils.email import send_email

# Simple in-memory store for reset tokens (In production, use Redis or a DB table)
reset_tokens = {}

@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(data: ForgotPasswordRequest, session: Session = Depends(get_session)):
    parent = session.exec(select(Parents).where(Parents.email == data.email)).first()
    if not parent:
        # Don't reveal if email exists or not for security
        return {"message": "If this email is registered, you will receive a reset link shortly."}
    
    token = str(uuid.uuid4())
    reset_tokens[token] = {
        "email": data.email,
        "expires": datetime.utcnow().timestamp() + 3600 # 1 hour
    }
    
    reset_link = f"http://localhost:5173/reset-password?token={token}"
    
    # Premium HTML Email template
    html_content = f"""
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e3ebdc; border-radius: 16px; background-color: #fcfdfa;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #006e1c; margin: 0; font-size: 24px; font-weight: 800;">BrightBook</h2>
        <p style="color: #6f7a6b; font-size: 14px; margin: 6px 0 0 0; font-weight: 500;">AI Dyslexia Assessment & Literacy Learning</p>
      </div>
      <hr style="border: 0; border-top: 1px solid #e3ebdc; margin-bottom: 24px;" />
      <p style="color: #171d14; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">Hello {parent.name or 'there'},</p>
      <p style="color: #171d14; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">We received a request to reset the password for your BrightBook account. Click the button below to set a new password:</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="{reset_link}" style="background-color: #006e1c; color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 12px rgba(0, 110, 28, 0.15);">Reset Password</a>
      </div>
      <p style="color: #171d14; font-size: 14px; line-height: 1.6; margin: 0 0 8px 0;">Or copy and paste this link into your browser:</p>
      <p style="color: #006e1c; font-size: 14px; word-break: break-all; margin: 0 0 24px 0;"><a href="{reset_link}" style="color: #006e1c; text-decoration: underline;">{reset_link}</a></p>
      <p style="color: #6f7a6b; font-size: 12px; line-height: 1.6; margin: 24px 0 0 0;">This reset link will expire in 1 hour. If you did not request this password reset, you can safely ignore this email.</p>
    </div>
    """
    
    text_content = f"Hello, reset your password using this link: {reset_link}"
    
    # Send email (uses SMTP if configured, else prints to console)
    send_email(
        to_email=data.email,
        subject="Reset Your BrightBook Password",
        html_content=html_content,
        text_content=text_content
    )
    
    return {"message": "If this email is registered, you will receive a reset link shortly."}


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(data: ResetPasswordRequest, session: Session = Depends(get_session)):
    token_data = reset_tokens.get(data.token)
    
    if not token_data or token_data["expires"] < datetime.utcnow().timestamp():
        if data.token in reset_tokens: del reset_tokens[data.token]
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    parent = session.exec(select(Parents).where(Parents.email == token_data["email"])).first()
    if not parent:
        raise HTTPException(status_code=404, detail="User no longer exists")
    
    # Update password
    parent.password_hash = hash_password(data.new_password)
    session.add(parent)
    session.commit()
    
    # Remove token
    del reset_tokens[data.token]
    
    return {"message": "Password updated successfully. You can now log in."}

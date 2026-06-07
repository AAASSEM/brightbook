from typing import Optional, List, Any, Dict, Union
from datetime import date, datetime
from pydantic import BaseModel, EmailStr, field_validator
import json
from app.models.enums import (
    PlanType, SubscriptionStatus, AssessmentType, ActivityType,
    DifficultyLevel, CompletionStatus, ComplaintStatus,
    ComplaintPriority, NotificationType, UserRole
)


# ─────────────────────────────────────────────
# AUTH / PARENT SCHEMAS
# ─────────────────────────────────────────────
class ParentRegister(BaseModel):
    name: str
    email: EmailStr
    phone_number: Optional[str] = None
    password: str
    language: str = "en"


class ParentUpdate(BaseModel):
    name: Optional[str] = None
    phone_number: Optional[str] = None
    preferred_language: Optional[str] = None
    notification_preferences: Optional[Dict[str, Dict[str, bool]]] = None


class NotificationPreferencesUpdate(BaseModel):
    notification_preferences: Dict[str, Dict[str, bool]]


class NotificationPreferencesRead(BaseModel):
    notification_preferences: Dict[str, Dict[str, bool]]


class ParentLogin(BaseModel):
    email: EmailStr
    password: str


class AdminLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: UserRole
    user_id: int
    name: str


class RefreshRequest(BaseModel):
    refresh_token: str


# ─────────────────────────────────────────────
# CHILD SCHEMAS
# ─────────────────────────────────────────────
class ChildCreate(BaseModel):
    name: str
    date_of_birth: date
    age: Optional[int] = None
    native_language: str = "English"


class ChildUpdate(BaseModel):
    name: Optional[str] = None
    date_of_birth: Optional[date] = None
    age: Optional[int] = None
    native_language: Optional[str] = None


class ChildRead(BaseModel):
    Child_ID: int
    name: str
    age: int
    native_language: str
    current_level: Optional[str]
    Parent_ID: int

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# ASSESSMENT SCHEMAS
# ─────────────────────────────────────────────
class AssessmentStart(BaseModel):
    child_id: int
    assessment_type: AssessmentType = AssessmentType.initial
    level_id: Optional[int] = None


class AnswerSubmit(BaseModel):
    question_id: int
    question_type: Optional[str] = None
    question_content: Optional[str] = None
    correct_answer: Optional[str] = None
    child_answer: str
    is_correct: Optional[bool] = None
    time_spent_seconds: int


class AssessmentComplete(BaseModel):
    assessment_id: int


class AssessmentRead(BaseModel):
    Assessment_ID: int
    assessment_type: AssessmentType
    total_questions: int
    total_correct_answers: int
    accuracy_percentage: float
    assessment_date: date
    ai_analysis: Optional[Dict[str, Any]]
    is_initial: bool
    Child_ID: int

    class Config:
        from_attributes = True


class AssessmentQuestionRead(BaseModel):
    Question_ID: int
    question_type: str
    question_content: str
    correct_answer: str
    child_answer: Optional[str]
    is_correct: Optional[bool]
    time_spent_seconds: Optional[int]

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# ACTIVITY SCHEMAS
# ─────────────────────────────────────────────
class ActivityCreate(BaseModel):
    activity_name: str
    activity_type: ActivityType
    difficulty_level: DifficultyLevel = DifficultyLevel.beginner
    language: str = "English"
    activity_content: Optional[Dict[str, Any]] = None
    estimated_duration_minutes: int = 10
    activity_group: Optional[str] = None
    mascot_character: Optional[str] = None
    is_boss_level: bool = False


class ActivityRead(BaseModel):
    Activity_ID: int
    activity_name: str
    activity_type: ActivityType
    difficulty_level: DifficultyLevel
    language: str
    activity_content: Optional[Dict[str, Any]]
    estimated_duration_minutes: int
    activity_group: Optional[str] = None
    mascot_character: Optional[str] = None
    is_boss_level: bool = False
    Child_ID: Optional[int] = None

    @field_validator('activity_content', mode='before')
    @classmethod
    def parse_activity_content(cls, v):
        """Parse activity content from JSON string or dict"""
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return v
        return v

    class Config:
        from_attributes = True


class ActivityComplete(BaseModel):
    activity_id: int
    child_id: int
    answers: List[str]
    time_per_question: List[int]
    total_time_minutes: int


class ActivityScoreResult(BaseModel):
    score: int
    passed: bool
    stars_earned: int
    weak_areas: List[str]
    next_difficulty_recommendation: DifficultyLevel


# ─────────────────────────────────────────────
# PROGRESS SCHEMAS
# ─────────────────────────────────────────────
class ProgressRead(BaseModel):
    progress_id: int
    total_score: int
    streak_days: int
    activities_completed: int = 0
    Child_ID: int

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# LEVEL SCHEMAS
# ─────────────────────────────────────────────
class LevelCreate(BaseModel):
    level_number: int
    level_name: str
    description: Optional[str] = None
    difficulty: DifficultyLevel = DifficultyLevel.beginner
    num_activities_required: int = 5
    estimated_score_to_next_level: int = 80
    skills_json: Optional[Dict[str, Any]] = None


class LevelRead(BaseModel):
    Level_ID: int
    level_number: int
    level_name: str
    description: Optional[str]
    difficulty: DifficultyLevel
    num_activities_required: int
    estimated_score_to_next_level: int
    skills_json: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# SUBSCRIPTION SCHEMAS
# ─────────────────────────────────────────────
class SubscriptionCreate(BaseModel):
    plan_type: PlanType


class SubscriptionRead(BaseModel):
    subscription_id: int
    planType: PlanType
    subscription_status: SubscriptionStatus
    startDate: Optional[date]
    endDate: Optional[date]
    price: float
    autoRenewal: bool

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# NOTIFICATION SCHEMAS
# ─────────────────────────────────────────────
class NotificationRead(BaseModel):
    notification_id: int
    notification_type: NotificationType
    message: str
    is_read: bool
    sent_time: Optional[datetime]

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# COMPLAINT SCHEMAS
# ─────────────────────────────────────────────
class ComplaintCreate(BaseModel):
    subject: str
    description: str
    category: Optional[str] = None
    priority: ComplaintPriority = ComplaintPriority.medium


class ComplaintReply(BaseModel):
    admin_response: str
    status: ComplaintStatus = ComplaintStatus.in_progress

class ComplaintFeedback(BaseModel):
    is_satisfied: bool
    user_feedback: str


class ComplaintRead(BaseModel):
    complaint_id: int
    subject: str
    description: str
    category: Optional[str]
    status: ComplaintStatus
    priority: ComplaintPriority
    admin_response: Optional[str]
    user_feedback: Optional[str]
    is_satisfied: Optional[bool]
    created_at: datetime
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# PARENT DASHBOARD SCHEMAS
# ─────────────────────────────────────────────
class ParentDashboardRead(BaseModel):
    child: ChildRead
    progress: Optional[ProgressRead]
    recent_achievements: List[dict]
    weekly_scores: List[dict]
    ai_recommendations: List[str]


# ─────────────────────────────────────────────
# ADMIN SCHEMAS
# ─────────────────────────────────────────────
class AdminCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class SystemHealthRead(BaseModel):
    total_parents: int
    total_children: int
    active_subscriptions: int
    open_complaints: int
    total_assessments: int
    total_activities_completed: int


# ─────────────────────────────────────────────
# ACHIEVEMENT SCHEMAS
# ─────────────────────────────────────────────
class AchievementRead(BaseModel):
    achievement_id: int
    achievement_name: str
    description: Optional[str]
    badge_icon: Optional[str]

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# GENERIC RESPONSES
# ─────────────────────────────────────────────
class MessageResponse(BaseModel):
    message: str


class ErrorResponse(BaseModel):
    detail: str


# ─────────────────────────────────────────────
# PASSWORD MANAGEMENT SCHEMAS
# ─────────────────────────────────────────────
class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

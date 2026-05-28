from typing import Optional, List
from datetime import date, datetime
from sqlmodel import Field, SQLModel, Relationship, Column
from sqlalchemy import JSON, Text, ForeignKey, Integer
from app.models.enums import (
    PlanType, SubscriptionStatus, AssessmentType, ActivityType,
    DifficultyLevel, CompletionStatus, ComplaintStatus,
    ComplaintPriority, NotificationType
)


# ─────────────────────────────────────────────
# PARENTS
# ─────────────────────────────────────────────
class Parents(SQLModel, table=True):
    __tablename__ = "parents"

    Parent_ID: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    email: str = Field(unique=True, max_length=255)
    phone_number: Optional[str] = Field(default=None, max_length=20)
    password_hash: str
    preferred_language: str = Field(default="en", max_length=10)
    notification_preferences: dict = Field(
        default={
            "assessment_result": {"enabled": True, "email": True},
            "level_up": {"enabled": True, "email": True},
            "achievement_earned": {"enabled": True, "email": True},
            "streak_milestone": {"enabled": True, "email": True},
            "payment_success": {"enabled": True, "email": True},
            "payment_failed": {"enabled": True, "email": True},
            "support_reply": {"enabled": True, "email": True},
            "weekly_report": {"enabled": True, "email": False}
        },
        sa_column=Column(JSON)
    )

    # Relationships
    children: List["Child"] = Relationship(back_populates="parent", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    subscription: Optional["Subscription"] = Relationship(back_populates="parent", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    notifications: List["Notification"] = Relationship(back_populates="parent", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    complaints: List["Complaint"] = Relationship(back_populates="parent", sa_relationship_kwargs={"cascade": "all, delete-orphan"})


# ─────────────────────────────────────────────
# CHILD
# ─────────────────────────────────────────────
class Child(SQLModel, table=True):
    __tablename__ = "child"

    Child_ID: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    date_of_birth: Optional[date] = None
    age: Optional[int] = None
    native_language: str = Field(default="English", max_length=50)
    current_level: Optional[str] = Field(default="1", max_length=10)
    Parent_ID: int = Field(sa_column=Column(Integer, ForeignKey("parents.Parent_ID", ondelete="CASCADE"), nullable=False))

    # Relationships
    parent: Optional[Parents] = Relationship(back_populates="children")
    assessments: List["Assessment"] = Relationship(back_populates="child", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    achievements: List["Achievement"] = Relationship(back_populates="child", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    activities: List["Activity"] = Relationship(back_populates="child", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    child_progress: Optional["ChildProgress"] = Relationship(back_populates="child", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    progress: Optional["Progress"] = Relationship(back_populates="child", sa_relationship_kwargs={"cascade": "all, delete-orphan"})


# ─────────────────────────────────────────────
# ADMIN
# ─────────────────────────────────────────────
class Admin(SQLModel, table=True):
    __tablename__ = "admin"

    admin_id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    email: str = Field(unique=True, max_length=255)
    password_hash: str
    is_active: bool = Field(default=True)
    last_login: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    complaints: List["Complaint"] = Relationship(back_populates="admin")


# ─────────────────────────────────────────────
# LEVEL
# ─────────────────────────────────────────────
class Level(SQLModel, table=True):
    __tablename__ = "level"

    Level_ID: Optional[int] = Field(default=None, primary_key=True)
    level_number: int = Field(unique=True)
    level_name: str = Field(max_length=100)
    description: Optional[str] = Field(default=None, sa_column=Column(Text))
    difficulty: DifficultyLevel = Field(default=DifficultyLevel.beginner)
    num_activities_required: int = Field(default=5)
    estimated_score_to_next_level: int = Field(default=80)
    skills_json: Optional[dict] = Field(default=None, sa_column=Column(JSON))

    # Relationships
    assessments: List["Assessment"] = Relationship(back_populates="level")
    level_activities: List["LevelActivities"] = Relationship(back_populates="level")


# ─────────────────────────────────────────────
# ACTIVITY
# ─────────────────────────────────────────────
class Activity(SQLModel, table=True):
    __tablename__ = "activity"

    Activity_ID: Optional[int] = Field(default=None, primary_key=True)
    activity_name: str = Field(max_length=200)
    activity_type: ActivityType
    difficulty_level: DifficultyLevel = Field(default=DifficultyLevel.beginner)
    language: str = Field(default="English", max_length=50)
    activity_content: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    estimated_duration_minutes: int = Field(default=10)
    Child_ID: Optional[int] = Field(default=None, sa_column=Column(Integer, ForeignKey("child.Child_ID", ondelete="CASCADE"), nullable=True))

    # Learning system fields
    activity_group: Optional[str] = Field(default=None, max_length=50)  # e.g., "group_1", "group_2"
    mascot_character: Optional[str] = Field(default=None, max_length=100)  # e.g., "Sammy Snake", "Annie Ant"
    is_boss_level: bool = Field(default=False)  # Mark boss level activities

    # Relationships
    child: Optional[Child] = Relationship(back_populates="activities")
    level_activities: List["LevelActivities"] = Relationship(back_populates="activity")
    activity_progress: List["ActivityProgress"] = Relationship(back_populates="activity")


# ─────────────────────────────────────────────
# LEVEL_ACTIVITIES (Junction)
# ─────────────────────────────────────────────
class LevelActivities(SQLModel, table=True):
    __tablename__ = "level_activities"

    Activity_ID: int = Field(foreign_key="activity.Activity_ID", primary_key=True)
    Level_ID: int = Field(foreign_key="level.Level_ID", primary_key=True)

    # Relationships
    level: Optional[Level] = Relationship(back_populates="level_activities")
    activity: Optional[Activity] = Relationship(back_populates="level_activities")


# ─────────────────────────────────────────────
# ASSESSMENT
# ─────────────────────────────────────────────
class Assessment(SQLModel, table=True):
    __tablename__ = "assessment"

    Assessment_ID: Optional[int] = Field(default=None, primary_key=True)
    assessment_type: AssessmentType = Field(default=AssessmentType.initial)
    total_questions: int = Field(default=10)
    total_correct_answers: int = Field(default=0)
    accuracy_percentage: float = Field(default=0.0)
    assessment_date: date = Field(default_factory=date.today)
    ai_analysis: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    is_initial: bool = Field(default=True)
    Child_ID: int = Field(sa_column=Column(Integer, ForeignKey("child.Child_ID", ondelete="CASCADE"), nullable=False))
    Level_ID: Optional[int] = Field(default=None, foreign_key="level.Level_ID")

    # Relationships
    child: Optional[Child] = Relationship(back_populates="assessments")
    level: Optional[Level] = Relationship(back_populates="assessments")
    questions: List["AssessmentQuestion"] = Relationship(back_populates="assessment", sa_relationship_kwargs={"cascade": "all, delete-orphan"})


# ─────────────────────────────────────────────
# ASSESSMENT_QUESTION
# ─────────────────────────────────────────────
class AssessmentQuestion(SQLModel, table=True):
    __tablename__ = "assessment_question"

    Question_ID: int = Field(primary_key=True)
    Assessment_ID: int = Field(sa_column=Column(Integer, ForeignKey("assessment.Assessment_ID", ondelete="CASCADE"), primary_key=True, nullable=False))
    question_type: str = Field(max_length=50)
    question_content: str = Field(sa_column=Column(Text))
    correct_answer: str = Field(max_length=500)
    child_answer: Optional[str] = Field(default=None, max_length=500)
    is_correct: Optional[bool] = None
    time_spent_seconds: Optional[int] = None

    # Relationships
    assessment: Optional[Assessment] = Relationship(back_populates="questions")


# ─────────────────────────────────────────────
# PROGRESS
# ─────────────────────────────────────────────
class Progress(SQLModel, table=True):
    __tablename__ = "progress"

    progress_id: Optional[int] = Field(default=None, primary_key=True)
    Child_ID: int = Field(sa_column=Column(Integer, ForeignKey("child.Child_ID", ondelete="CASCADE"), unique=True, nullable=False))
    total_score: int = Field(default=0)

    # Relationships
    child: Optional[Child] = Relationship(back_populates="progress")
    child_progress: Optional["ChildProgress"] = Relationship(back_populates="progress", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    activity_progress: List["ActivityProgress"] = Relationship(back_populates="progress", sa_relationship_kwargs={"cascade": "all, delete-orphan"})


# ─────────────────────────────────────────────
# CHILD_PROGRESS
# ─────────────────────────────────────────────
class ChildProgress(SQLModel, table=True):
    __tablename__ = "child_progress"

    progress_id: int = Field(sa_column=Column(Integer, ForeignKey("progress.progress_id", ondelete="CASCADE"), primary_key=True))
    streak_days: int = Field(default=0)
    Child_ID: int = Field(sa_column=Column(Integer, ForeignKey("child.Child_ID", ondelete="CASCADE"), unique=True, nullable=False))

    # Learning system fields
    current_letter_group: Optional[str] = Field(default=None, max_length=50)  # e.g., "group_1", "group_2"
    letters_mastered: str = Field(default="[]")  # JSON array of mastered letters

    # Relationships
    progress: Optional[Progress] = Relationship(back_populates="child_progress")
    child: Optional[Child] = Relationship(back_populates="child_progress")


# ─────────────────────────────────────────────
# ACTIVITY_PROGRESS
# ─────────────────────────────────────────────
class ActivityProgress(SQLModel, table=True):
    __tablename__ = "activity_progress"

    activity_id: int = Field(sa_column=Column(Integer, ForeignKey("activity.Activity_ID", ondelete="CASCADE"), primary_key=True))
    progress_id: int = Field(sa_column=Column(Integer, ForeignKey("progress.progress_id", ondelete="CASCADE"), primary_key=True))
    completion_status: CompletionStatus = Field(default=CompletionStatus.not_started)
    total_time_spent_minutes: int = Field(default=0)
    total_activities_completed: int = Field(default=0)

    # Learning system fields
    stars_earned: int = Field(default=0)  # 1-3 stars based on performance
    mastery_level: int = Field(default=0)  # 0-100 mastery calculation

    # Relationships
    activity: Optional[Activity] = Relationship(back_populates="activity_progress")
    progress: Optional[Progress] = Relationship(back_populates="activity_progress")


# ─────────────────────────────────────────────
# ACHIEVEMENT
# ─────────────────────────────────────────────
class Achievement(SQLModel, table=True):
    __tablename__ = "achievement"

    achievement_id: Optional[int] = Field(default=None, primary_key=True)
    achievement_name: str = Field(max_length=100)
    description: Optional[str] = Field(default=None, sa_column=Column(Text))
    badge_icon: Optional[str] = Field(default=None, max_length=255)
    Child_ID: int = Field(sa_column=Column(Integer, ForeignKey("child.Child_ID", ondelete="CASCADE"), nullable=False))

    # Relationships
    child: Optional[Child] = Relationship(back_populates="achievements")


# ─────────────────────────────────────────────
# SUBSCRIPTION
# ─────────────────────────────────────────────
class Subscription(SQLModel, table=True):
    __tablename__ = "subscription"

    subscription_id: Optional[int] = Field(default=None, primary_key=True)
    planType: PlanType = Field(default=PlanType.basic)
    subscription_status: SubscriptionStatus = Field(default=SubscriptionStatus.inactive)
    startDate: Optional[date] = None
    endDate: Optional[date] = None
    price: float = Field(default=0.0)
    autoRenewal: bool = Field(default=True)
    Parent_ID: int = Field(sa_column=Column(Integer, ForeignKey("parents.Parent_ID", ondelete="CASCADE"), unique=True, nullable=False))

    # Relationships
    parent: Optional[Parents] = Relationship(back_populates="subscription")


# ─────────────────────────────────────────────
# NOTIFICATION
# ─────────────────────────────────────────────
class Notification(SQLModel, table=True):
    __tablename__ = "notification"

    notification_id: Optional[int] = Field(default=None, primary_key=True)
    notification_type: NotificationType
    message: str = Field(sa_column=Column(Text))
    notification_data: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    scheduled_time: Optional[datetime] = None
    sent_time: Optional[datetime] = None
    is_read: bool = Field(default=False)
    notification_enable: bool = Field(default=True)
    Parent_ID: int = Field(sa_column=Column(Integer, ForeignKey("parents.Parent_ID", ondelete="CASCADE"), nullable=False))

    # Relationships
    parent: Optional[Parents] = Relationship(back_populates="notifications")


# ─────────────────────────────────────────────
# COMPLAINT
# ─────────────────────────────────────────────
class Complaint(SQLModel, table=True):
    __tablename__ = "complaint"

    complaint_id: Optional[int] = Field(default=None, primary_key=True)
    subject: str = Field(max_length=200)
    description: str = Field(sa_column=Column(Text))
    category: Optional[str] = Field(default=None, max_length=100)
    status: ComplaintStatus = Field(default=ComplaintStatus.open)
    priority: ComplaintPriority = Field(default=ComplaintPriority.medium)
    admin_response: Optional[str] = Field(default=None, sa_column=Column(Text))
    user_feedback: Optional[str] = Field(default=None, sa_column=Column(Text))
    is_satisfied: Optional[bool] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None
    admin_id: Optional[int] = Field(default=None, foreign_key="admin.admin_id")
    Parent_ID: int = Field(sa_column=Column(Integer, ForeignKey("parents.Parent_ID", ondelete="CASCADE"), nullable=False))

    # Relationships
    admin: Optional[Admin] = Relationship(back_populates="complaints")
    parent: Optional[Parents] = Relationship(back_populates="complaints")

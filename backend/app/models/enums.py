from enum import Enum


class PlanType(str, Enum):
    basic = "basic"
    family = "family"
    annual = "annual"


class SubscriptionStatus(str, Enum):
    active = "active"
    inactive = "inactive"
    past_due = "past_due"
    cancelled = "cancelled"
    trialing = "trialing"


class AssessmentType(str, Enum):
    initial = "initial"
    reassessment = "reassessment"


class ActivityType(str, Enum):
    # Original activity types
    letter_hunt = "letter_hunt"
    phonics_match = "phonics_match"
    letter_tracing = "letter_tracing"
    story_time = "story_time"
    word_builder = "word_builder"

    # Learning system activity types (Jolly Phonics inspired)
    meet_letter = "meet_letter"
    hear_sound = "hear_sound"
    say_yourself = "say_yourself"
    action_story = "action_story"
    trace_write = "trace_write"
    mini_quest = "mini_quest"
    sound_blender = "sound_blender"
    read_match = "read_match"
    read_aloud = "read_aloud"


class DifficultyLevel(str, Enum):
    beginner = "beginner"
    easy = "easy"
    medium = "medium"
    intermediate = "intermediate"  # legacy value — kept for compatibility
    hard = "hard"
    advanced = "advanced"
    expert = "expert"


class CompletionStatus(str, Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    completed = "completed"
    failed = "failed"
    skipped = "skipped"


class ComplaintStatus(str, Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"


class ComplaintPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"

class NotificationType(str, Enum):
    assessment_result = "assessment_result"
    level_up = "level_up"
    achievement_earned = "achievement_earned"
    streak_milestone = "streak_milestone"
    payment_success = "payment_success"
    payment_failed = "payment_failed"
    support_reply = "support_reply"
    weekly_report = "weekly_report"


class UserRole(str, Enum):
    parent = "parent"
    child = "child"
    admin = "admin"

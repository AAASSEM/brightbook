"""
seed_assessment_questions.py
────────────────────────────
Loads literacy_questions_seed.json and inserts rows into
AssessmentQuestion for a given Assessment_ID.

Usage
─────
    python seed_assessment_questions.py

Or call seed_questions(session, assessment_id) from your own setup script.

Mapping
───────
    JSON field                        → DB column
    ─────────────────────────────────────────────
    type                              → question_type
    correct_answer_en (or fallback)   → correct_answer
    {everything else}                 → question_content  (JSON string)
    time_spent_seconds                → filled at answer time, not seeded
    child_answer / is_correct         → filled at answer time, not seeded
"""

import json
import os
from pathlib import Path
from typing import Optional

from sqlmodel import Session, create_engine, select
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from app.models.models import Assessment, AssessmentQuestion
from app.config.settings import settings

SEED_FILE = Path(__file__).parent / "literacy_questions_seed.json"
DATABASE_URL = settings.DATABASE_URL


# ── helpers ─────────────────────────────────────────────────────────────────

def _pick_correct_answer(q: dict) -> str:
    """
    Pull the canonical correct_answer string from the seed object.
    Priority:
      1. correct_answer        (Q1, Q2, Q7, Q8, Q19, Q20)
      2. correct_answer_en     (most questions)
      3. correct_answers_en[0] (multi-select: Q9, Q18 — store the list as JSON)
    """
    if q.get("correct_answer") is not None:
        return str(q["correct_answer"])
    if q.get("correct_answer_en") is not None:
        return str(q["correct_answer_en"])
    if q.get("correct_answers_en"):
        # Multi-select: store as JSON array string so your validator can parse it
        return json.dumps(q["correct_answers_en"], ensure_ascii=False)
    # Timed reading passages have no correct answer
    return ""


def _build_content(q: dict) -> str:
    """
    Serialize every field the frontend needs into question_content.
    Excludes DB-level fields (id, correct_answer_*, Assessment_ID).
    """
    frontend_payload = {
        # Bilingual display
        "title_en":       q.get("title_en"),
        "title_ar":       q.get("title_ar"),
        "instruction_en": q.get("instruction_en"),
        "instruction_ar": q.get("instruction_ar"),

        # What the user sees / hears
        "stimulus": q.get("stimulus"),

        # Answer choices (present for most question types)
        "options": q.get("options"),

        # Arabic correct answer (for display/feedback)
        "correct_answer_ar":  q.get("correct_answer_ar"),
        "correct_answers_ar": q.get("correct_answers_ar"),

        # Multi-select metadata
        "correct_answers_count": q.get("correct_answers_count"),

        # Sequencing
        "depends_on": q.get("depends_on"),
        "group":      q.get("group"),
        "order":      q.get("order"),

        # What extra data to record (e.g. reading_time_seconds)
        "measures": q.get("measures"),

        # Developer notes (optional, safe to strip in production)
        "note": q.get("note"),
    }
    # Drop None values to keep the payload lean
    payload = {k: v for k, v in frontend_payload.items() if v is not None}
    return json.dumps(payload, ensure_ascii=False)


# ── main seeder ──────────────────────────────────────────────────────────────

def seed_questions(session: Session, assessment_id: int) -> list[AssessmentQuestion]:
    """
    Insert all 25 assessment questions for the given assessment_id.
    Returns the list of created AssessmentQuestion objects.

    Raises ValueError if assessment_id does not exist in the DB.
    """
    # Validate the assessment exists
    assessment = session.get(Assessment, assessment_id)
    if not assessment:
        raise ValueError(f"Assessment with id={assessment_id} not found.")

    # Load seed data
    raw: list[dict] = json.loads(SEED_FILE.read_text(encoding="utf-8"))

    rows: list[AssessmentQuestion] = []
    for q in raw:
        row = AssessmentQuestion(
            question_type    = q["type"],
            question_content = _build_content(q),
            correct_answer   = _pick_correct_answer(q),
            # child_answer, is_correct, time_spent_seconds → filled at answer time
            Assessment_ID    = assessment_id,
        )
        session.add(row)
        rows.append(row)

    session.commit()
    for row in rows:
        session.refresh(row)

    print(f"✓  Seeded {len(rows)} questions for Assessment_ID={assessment_id}")
    return rows


# ── standalone runner ────────────────────────────────────────────────────────

def main():
    """
    Quick standalone seed: creates a dummy Assessment and seeds all questions.
    Replace with your real Assessment_ID in production.
    """
    engine = create_engine(DATABASE_URL, echo=False)

    with Session(engine) as session:
        # ── Replace this block with your real assessment lookup ──────────────
        # Example: find the latest initial assessment for child 1
        #   assessment = session.exec(
        #       select(Assessment).where(Assessment.Child_ID == 1).order_by(Assessment.Assessment_ID.desc())
        #   ).first()
        #
        # For this demo we create a minimal one:
        assessment = Assessment(
            assessment_type       = "initial",
            total_questions       = 25,
            total_correct_answers = 0,
            accuracy_percentage   = 0.0,
            is_initial            = True,
            Child_ID              = 2,      # ← changed to a real Child_ID (2)
        )
        session.add(assessment)
        session.commit()
        session.refresh(assessment)
        # ────────────────────────────────────────────────────────────────────

        seed_questions(session, assessment.Assessment_ID)


if __name__ == "__main__":
    main()

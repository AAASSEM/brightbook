from fastapi.testclient import TestClient
from app.main import app
from app.middleware.auth_middleware import get_current_parent
from app.models.models import Parents
from sqlmodel import Session, select
from app.config.database import engine

client = TestClient(app)

with Session(engine) as session:
    parent = session.exec(select(Parents)).first()
    parent_id = parent.Parent_ID

def override_get_current_parent():
    return parent

app.dependency_overrides[get_current_parent] = override_get_current_parent

with Session(engine) as session:
    from app.models.models import Child
    child = session.exec(select(Child).where(Child.Parent_ID == parent_id)).first()
    child_id = child.Child_ID

start_res = client.post("/api/assessments/start", json={
    "child_id": child_id,
    "assessment_type": "initial"
})
assessment_id = start_res.json()["Assessment_ID"]

# Test 1: time_spent_seconds is None
payload = {
    "question_id": 1,
    "question_type": "capital_to_lowercase_match",
    "question_content": "{}",
    "correct_answer": "a",
    "child_answer": "a",
    "is_correct": True,
    "time_spent_seconds": None
}
res = client.post(f"/api/assessments/{assessment_id}/answer", json=payload)
print("Test 1 (time_spent_seconds=None) Status:", res.status_code)
print("Response:", res.json())

# Test 2: time_spent_seconds is missing
payload = {
    "question_id": 1,
    "question_type": "capital_to_lowercase_match",
    "question_content": "{}",
    "correct_answer": "a",
    "child_answer": "a",
    "is_correct": True
}
res = client.post(f"/api/assessments/{assessment_id}/answer", json=payload)
print("Test 2 (time_spent_seconds missing) Status:", res.status_code)
print("Response:", res.json())

# Test 3: child_answer is None
payload = {
    "question_id": 1,
    "question_type": "capital_to_lowercase_match",
    "question_content": "{}",
    "correct_answer": "a",
    "child_answer": None,
    "is_correct": True,
    "time_spent_seconds": 5
}
res = client.post(f"/api/assessments/{assessment_id}/answer", json=payload)
print("Test 3 (child_answer=None) Status:", res.status_code)
print("Response:", res.json())

# Test 4: child_answer is missing
payload = {
    "question_id": 1,
    "question_type": "capital_to_lowercase_match",
    "question_content": "{}",
    "correct_answer": "a",
    "is_correct": True,
    "time_spent_seconds": 5
}
res = client.post(f"/api/assessments/{assessment_id}/answer", json=payload)
print("Test 4 (child_answer missing) Status:", res.status_code)
print("Response:", res.json())

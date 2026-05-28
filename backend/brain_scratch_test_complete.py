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

# Start assessment
start_res = client.post("/api/assessments/start", json={
    "child_id": child_id,
    "assessment_type": "initial"
})
assessment_id = start_res.json()["Assessment_ID"]

# Don't submit any answers to simulate 422 failing
# Complete assessment
complete_res = client.post(f"/api/assessments/{assessment_id}/complete")
print("Complete Status:", complete_res.status_code)
print("Complete Response:", complete_res.text)

"""
Create a test child account for testing the level-up system.
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlmodel import Session, select
from app.config.database import engine, create_db_and_tables
from app.models.models import Child, Parents

def create_test_child():
    """Create a test child named Sara"""
    create_db_and_tables()
    with Session(engine) as session:
        # Check if parent exists first (required for child)
        parent = session.exec(select(Parents).limit(1)).first()
        if not parent:
            # Create a test parent
            parent = Parents(
                name="Test Parent",
                email="test@example.com",
                phone_number="1234567890",
                password_hash="test_hash",
                preferred_language="en",
                notification_preferences={}
            )
            session.add(parent)
            session.commit()
            session.refresh(parent)
            print(f"Created test parent with ID: {parent.Parent_ID}")

        # Check if Sara already exists
        existing_sara = session.exec(
            select(Child).where(Child.name == "Sara")
        ).first()

        if existing_sara:
            print(f"Sara already exists with ID: {existing_sara.Child_ID}")
            return existing_sara

        # Create Sara
        sara = Child(
            name="Sara",
            age=5,
            native_language="en",
            current_level=1,
            Parent_ID=parent.Parent_ID
        )
        session.add(sara)
        session.commit()
        session.refresh(sara)

        print(f"✅ Created Sara with ID: {sara.Child_ID}")
        print(f"   Parent ID: {sara.Parent_ID}")
        print(f"   Current Level: {sara.current_level}")

        return sara

if __name__ == "__main__":
    print("👶 Creating test child account...")
    create_test_child()
    print("✅ Test child creation complete!")

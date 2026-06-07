import asyncio
import sys
import os
from sqlalchemy import create_engine
from sqlmodel import Session
from app.routers.admin import get_ai_status
from app.models.models import Admin

def check_status():
    from app.config.settings import settings
    # Create engine and session
    engine = create_engine(settings.DATABASE_URL)
    with Session(engine) as session:
        # Mock admin
        admin = Admin(email="test@admin.com", Admin_ID=1)
        res = get_ai_status(admin=admin, session=session)
        print("\n=== AI STATUS ===")
        print(res)
        print("=================\n")

if __name__ == "__main__":
    check_status()

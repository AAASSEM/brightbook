from sqlmodel import Session, select
from app.config.database import engine
from app.models.models import Parents
from app.utils.security import hash_password

with Session(engine) as session:
    parent = session.exec(select(Parents).where(Parents.email == "wutunum@mailinator.com")).first()
    if not parent:
        # Let's try native search or search for any parent
        parent = session.exec(select(Parents)).first()
    
    if parent:
        parent.password_hash = hash_password("Password123!")
        session.add(parent)
        session.commit()
        print(f"Successfully set password for {parent.email} to Password123!")
    else:
        print("No parent found in DB")

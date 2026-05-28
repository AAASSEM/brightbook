import logging
logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)

from sqlmodel import Session, select
from app.config.database import engine
from app.models.models import Parents, Child, Assessment

with Session(engine) as session:
    parents = session.exec(select(Parents)).all()
    print("PARENTS:")
    for p in parents:
        print(f"ID: {p.Parent_ID}, Name: {p.name}, Email: {p.email}")
    
    children = session.exec(select(Child)).all()
    print("\nCHILDREN:")
    for c in children:
        print(f"ID: {c.Child_ID}, Name: {c.name}, Parent_ID: {c.Parent_ID}")

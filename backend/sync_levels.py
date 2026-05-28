from sqlmodel import Session, create_engine, select
from app.models.models import Child, ChildProgress
engine = create_engine('sqlite:///brightbook.db')
session = Session(engine)
children = session.exec(select(Child)).all()
for c in children:
    p = session.exec(select(ChildProgress).where(ChildProgress.Child_ID == c.Child_ID)).first()
    if p and p.current_letter_group:
        try:
            prefix, num = p.current_letter_group.rsplit('_', 1)
            c.current_level = num
            session.add(c)
        except Exception:
            pass
session.commit()
print('Done fixing child levels')

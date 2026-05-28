from app.config.database import engine, SQLModel
from scripts.seed_data import seed_all

def reinit_db():
    print("Dropping all tables...")
    SQLModel.metadata.drop_all(engine)
    print("Recreating tables with new schema...")
    SQLModel.metadata.create_all(engine)
    print("Seeding demo data...")
    seed_all()
    print("Done!")

if __name__ == "__main__":
    reinit_db()

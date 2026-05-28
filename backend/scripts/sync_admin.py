from sqlmodel import Session, create_engine, text
import os

# Root DB path
db_path = r"C:\Users\20100\bookv2\brightbook\brightbook.db"
engine = create_engine(f"sqlite:///{db_path}")

admin_data = {
    "name": "System Administrator",
    "email": "admin@brightbook.app",
    "password_hash": "$2b$12$02U.AyiXFEkMBiY/nkWvae5LLi9dRzSHT1G5PqKK7FRgbug.tvWde",
    "is_active": 1
}

with Session(engine) as session:
    # Check if exists
    check = session.execute(text("SELECT email FROM admin WHERE email = :email"), {"email": admin_data["email"]}).first()
    if not check:
        session.execute(text("""
            INSERT INTO admin (name, email, password_hash, is_active, created_at) 
            VALUES (:name, :email, :password_hash, :is_active, CURRENT_TIMESTAMP)
        """), admin_data)
        session.commit()
        print("Admin user added to root database.")
    else:
        print("Admin user already exists in root database.")

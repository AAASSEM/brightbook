# BrightBook — AI Phonics Learning Platform

BrightBook is a premium, AI-powered literacy platform designed for children, featuring dyslexia assessments, adaptive learning maps, and game-based phonics learning.

## Project Structure

- `/backend` — FastAPI web server, SQLModel database models, SQLite storage, and Gemini AI integration.
- `/frontend` — React web app built with Vite, Vanilla CSS styling, Framer Motion animations, and Zustand state management.

---

## Prerequisites

Before starting, ensure you have the following installed:
1. **Python 3.10+** (verify with `python --version`)
2. **Node.js 18+** & **npm** (verify with `node -v` and `npm -v`)

---

## 🛠️ Step-by-Step Setup Guide

### 1. Clone the Repository
```bash
git clone <repository-url>
cd brightbook
```

---

### 2. Backend Setup

#### A. Navigate to backend directory and create virtual environment:
```bash
cd backend
python -m venv venv
```

#### B. Activate virtual environment:
*   **Windows (PowerShell):**
    ```powershell
    venv\Scripts\Activate.ps1
    ```
*   **Windows (Command Prompt):**
    ```cmd
    venv\Scripts\activate.bat
    ```
*   **macOS / Linux:**
    ```bash
    source venv/bin/activate
    ```

#### C. Install dependencies:
```bash
pip install -r requirements.txt
```

#### D. Configure Environment Variables (`.env`)
Create a `.env` file inside the `backend/` directory:
```env
# Server environment (development / production)
ENVIRONMENT=development

# Database connection URL (SQLite is the default)
DATABASE_URL=sqlite:///../brightbook.db

# Gemini AI configuration
GEMINI_API_KEY=your_gemini_api_key_here

# JWT authentication security token
JWT_SECRET_KEY=generate_a_random_jwt_secret_key_here

# SMTP configuration for real email delivery (e.g. Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_gmail_app_password
EMAIL_FROM=noreply@brightbook.app
```

#### E. Initialize and Seed the Database
Since the learning maps, activities, levels, and dyslexia assessments depend on initial database records, you **must** run the seeding scripts to populate the database tables:
```bash
# Seed literacy levels
python app/utils/seed_levels.py

# Seed dyslexia assessment questions
python app/utils/seed_assessment_questions.py

# Seed activities
python app/utils/seed_activities.py

# (Optional) Clean/reset databases and create default admin
python cleanup_and_reset.py
```

#### F. Run the Backend API
Start the FastAPI server using Uvicorn:
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The API documentation will be available at `http://127.0.0.1:8000/docs`.

---

### 3. Frontend Setup

#### A. Navigate to frontend directory:
Open a new terminal session, navigate to the frontend directory:
```bash
cd frontend
```

#### B. Install packages:
```bash
npm install
```

#### C. Run the React Web App
Start the Vite development server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173/` (or the local URL printed in the terminal).

---

## 🔑 Default Credentials for Testing

*   **Administrator Account:**
    *   **Email:** `admin@brightbook.app`
    *   **Password:** `admin123`
    *   *Note:* Press `Ctrl + Shift + D` on any public page to access the hidden Admin Login portal.
*   **Parent Accounts:**
    *   Create a fresh account by clicking **Sign Up** on the login page.

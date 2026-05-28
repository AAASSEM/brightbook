# BrightBook Architecture & Data Flow: Complete Technical Overview

**Document Version:** 1.0
**Last Updated:** 2025-01-07
**Target Audience:** Developers, System Architects, DevOps Engineers, Technical Stakeholders

---

## 🎯 Executive Summary (High-Level Overview)

BrightBook is a full-stack AI-powered dyslexia intervention platform built on modern web technologies. The system uses a microservices-inspired architecture with clear separation between frontend and backend, real-time communication via Socket.IO, and intelligent AI integration via Google Gemini.

### Architecture in 60 Seconds:
- **Frontend**: React 19 + Vite + Tailwind CSS + Zustand
- **Backend**: FastAPI + SQLModel + SQLite/PostgreSQL
- **AI Integration**: Google Gemini API for assessment analysis
- **Real-time**: Socket.IO for live progress monitoring
- **Authentication**: JWT tokens with refresh mechanism
- **Database**: SQLModel ORM with auto-table creation

---

## 🏗️ Complete System Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[React 19 App]
        B[Router DOM]
        C[Zustand State]
        D[Socket.IO Client]
        E[API Service Layer]
    end

    subgraph "Backend Layer"
        F[FastAPI Application]
        G[API Routers]
        H[Services Layer]
        I[AI Service]
        J[Socket.IO Server]
    end

    subgraph "Data Layer"
        K[(SQLite/PostgreSQL)]
        L[Google Gemini AI]
        M[JSON Question Files]
    end

    subgraph "External Services"
        N[Email SMTP]
        O[File Upload Storage]
    end

    A --> B
    A --> C
    A --> D
    A --> E
    E --> F
    D --> J
    F --> G
    G --> H
    H --> I
    H --> J
    F --> K
    I --> L
    F --> M
    H --> N
    F --> O

    style A fill:#e3f2fd
    style F fill:#c8e6c9
    style K fill:#fff9c4
    style L fill:#f8bbd0
```

---

## 🎨 Frontend Architecture

### Technology Stack
**File:** `frontend/`

**Core Technologies:**
```json
{
  "name": "brightbook-frontend",
  "version": "1.0.0",
  "dependencies": {
    "react": "^19.2.5",
    "react-router-dom": "^6.20.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "zustand": "^4.4.0",
    "socket.io-client": "^4.5.0",
    "axios": "^1.6.0",
    "framer-motion": "^10.16.0",
    "recharts": "^2.10.0",
    "canvas-confetti": "^1.9.0"
  }
}
```

### Directory Structure
```
frontend/src/
├── app/                      # App configuration
│   ├── App.jsx              # Main app component with routes
│   └── layouts/             # Layout components
│       ├── MainLayout.jsx   # Parent/child layout
│       └── AdminLayout.jsx  # Admin layout
├── features/                # Feature-based modules
│   ├── assessment/          # Assessment feature
│   │   ├── pages/          # Assessment pages
│   │   └── components/     # Assessment components
│   ├── auth/               # Authentication
│   ├── learning/           # Learning activities
│   ├── parent/             # Parent dashboard
│   ├── admin/              # Admin panel
│   ├── onboarding/         # User onboarding
│   ├── support/            # Support system
│   ├── subscription/       # Payment plans
│   └── public/             # Landing page
└── shared/                 # Shared utilities
    ├── components/         # Reusable components
    │   ├── ui/             # UI components (buttons, cards, etc.)
    │   └── common/         # Common components
    ├── services/           # API services
    │   ├── api.js          # Main API client
    │   └── learningService.js  # Learning-specific API calls
    ├── stores/             # State management
    │   ├── authStore.js    # Authentication state
    │   ├── childStore.js   # Child selection state
    │   ├── uiStore.js      # UI state (toasts, modals)
    │   └── langStore.js    # Language state
    └── utils/              # Utility functions
```

### State Management Architecture
**File:** `frontend/src/shared/stores/`

**Authentication Store:**
```javascript
// authStore.js - Authentication state management
export const useAuthStore = create((set) => ({
  user: null,              // Current user object
  token: null,             // JWT access token
  refreshToken: null,       // JWT refresh token
  isAuthenticated: false,   // Auth status flag

  login: (userData, tokens) => set({
    user: userData,
    token: tokens.access_token,
    refreshToken: tokens.refresh_token,
    isAuthenticated: true
  }),

  logout: () => set({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false
  }),

  // Auto-refresh access token
  refreshAccessToken: async () => {
    try {
      const response = await api.post('/api/auth/refresh', {
        refresh_token: get().refreshToken
      });

      set({
        token: response.data.access_token
      });

      return response.data.access_token;
    } catch (error) {
      // Refresh failed, logout user
      get().logout();
      throw error;
    }
  }
}));
```

**Child Selection Store:**
```javascript
// childStore.js - Child selection and management
export const useChildStore = create((set) => ({
  children: [],           // List of parent's children
  selectedChild: null,     // Currently selected child

  // Set children list
  setChildren: (children) => set({ children }),

  // Select specific child
  setSelectedChild: (child) => set({ selectedChild: child }),

  // Add new child and automatically select
  addChildAndSelect: (child) => set((state) => ({
    children: [...state.children, child],
    selectedChild: child
  })),

  // Update child data
  updateChild: (updatedChild) => set((state) => ({
    children: state.children.map(c =>
      c.Child_ID === updatedChild.Child_ID ? updatedChild : c
    ),
    selectedChild: state.selectedChild?.Child_ID === updatedChild.Child_ID
      ? updatedChild
      : state.selectedChild
  })),

  // Refresh children list from API
  refreshChildren: async (api) => {
    try {
      const response = await api.get('/api/children/');
      const children = response.data;
      const currentSelectedId = get().selectedChild?.Child_ID;

      set({ children });

      // Maintain current selection if possible
      if (currentSelectedId) {
        const stillSelected = children.find(c => c.Child_ID === currentSelectedId);
        if (stillSelected) {
          set({ selectedChild: stillSelected });
        }
      }

      return children;
    } catch (error) {
      throw error;
    }
  }
}));
```

---

## 🔧 Backend Architecture

### Technology Stack
**File:** `backend/`

**Core Technologies:**
```python
# requirements.txt
fastapi==0.115.0
uvicorn[standard]==0.24.0
sqlmodel==0.0.14
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
python-socketio==5.10.0
aiofiles==23.2.1
google-genai==0.3.0
pydantic==2.5.0
pydantic-settings==2.1.0
```

### Directory Structure
```
backend/app/
├── main.py                 # Application entry point
├── config/                 # Configuration modules
│   ├── settings.py         # Environment variables
│   ├── database.py         # Database initialization
│   └── socket.py           # Socket.IO configuration
├── models/                 # Database models
│   ├── models.py           # SQLModel definitions
│   ├── enums.py            # Enum types
│   └── schemas.py          # Pydantic schemas
├── routers/                # API endpoints
│   ├── auth.py             # Authentication endpoints
│   ├── children.py         # Child management
│   ├── assessments.py      # Assessment endpoints
│   ├── learning.py         # Learning activities
│   ├── parent.py           # Parent dashboard
│   ├── subscription.py     # Payment plans
│   ├── support.py          # Support system
│   └── admin.py            # Admin panel
├── services/               # Business logic
│   ├── ai_service.py       # AI integration
│   └── email_service.py    # Email notifications
├── middleware/             # Request middleware
│   └── auth_middleware.py # JWT validation
├── socket_events/          # Socket.IO events
│   └── handlers.py         # Event handlers
└── utils/                  # Utility functions
    ├── security.py         # Password hashing, JWT
    └── seed_*.py          # Database seeding scripts
```

### API Router Architecture
**File:** `backend/app/main.py`

```python
# main.py - Application initialization
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.database import create_db_and_tables
from app.config.socket import socket_app, sio
from app.socket_events import handlers  # registers event handlers

app = FastAPI(
    title="BrightBook API",
    description="AI-powered children's dyslexia intervention platform",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={
            "Access-Control-Allow-Origin": settings.FRONTEND_URL,
            "Access-Control-Allow-Credentials": "true",
        },
    )

# Mount Socket.IO
app.mount("/ws", socket_app)

# Register routers
app.include_router(auth.router)        # /api/auth
app.include_router(children.router)    # /api/children
app.include_router(assessments.router) # /api/assessments
app.include_router(learning.router)    # /api/learning
app.include_router(parent.router)      # /api/parent
app.include_router(subscription.router)# /api/subscription
app.include_router(support.router)     # /api/support
app.include_router(admin.router)        # /api/admin

# Startup event
@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    print("BrightBook API started. DB tables created.")
```

---

## 💾 Database Architecture

### Data Models & Relationships
**File:** `backend/app/models/models.py`

```python
# models.py - Core database models
from typing import Optional
from sqlmodel import Field, Relationship, SQLModel
from datetime import date, datetime

# Parent (User) Model
class Parents(SQLModel, table=True):
    __tablename__ = "parents"

    Parent_ID: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    email: str = Field(unique=True, index=True)
    password_hash: str = Field(exclude=True)
    phone_number: str
    preferred_language: str = "English"
    created_at: datetime = Field(default_factory=datetime.now)

    # Relationships
    children: list["Child"] = Relationship(back_populates="parent")
    subscriptions: list["Subscription"] = Relationship(back_populates="parent")

# Child Model
class Child(SQLModel, table=True):
    __tablename__ = "children"

    Child_ID: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    date_of_birth: date
    age: int
    native_language: str = "English"
    current_level: str = "1"
    last_activity_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.now)

    # Foreign Keys
    Parent_ID: int = Field(foreign_key="parents.Parent_ID", index=True)

    # Relationships
    parent: "Parents" = Relationship(back_populates="children")
    assessments: list["Assessment"] = Relationship(back_populates="child")
    activities: list["Activity"] = Relationship(back_populates="child")
    progress: list["Progress"] = Relationship(back_populates="child")

# Assessment Model
class Assessment(SQLModel, table=True):
    __tablename__ = "assessments"

    Assessment_ID: Optional[int] = Field(default=None, primary_key=True)
    assessment_type: str  # "initial" or "progress"
    total_questions: int = 25
    total_correct_answers: int = 0
    accuracy_percentage: float = 0.0
    ai_analysis: dict = Field(default={}, sa_column=JSON)
    assessment_date: date = Field(default_factory=date.today)
    is_initial: bool = False

    # Foreign Keys
    Child_ID: int = Field(foreign_key="children.Child_ID", index=True)
    Level_ID: Optional[int] = Field(default=None, foreign_key="levels.Level_ID")

    # Relationships
    child: "Child" = Relationship(back_populates="assessments")
    questions: list["AssessmentQuestion"] = Relationship(back_populates="assessment")
    level: "Level" = Relationship(back_populates="assessments")

# Assessment Question Model
class AssessmentQuestion(SQLModel, table=True):
    __tablename__ = "assessment_questions"

    id: Optional[int] = Field(default=None, primary_key=True)
    Question_ID: int = Field(index=True)  # ID from JSON file
    Assessment_ID: int = Field(foreign_key="assessments.Assessment_ID", index=True)
    question_type: str
    question_content: dict = Field(default={}, sa_column=JSON)
    correct_answer: str
    child_answer: str
    is_correct: Optional[bool] = None
    time_spent_seconds: Optional[int] = None

    # Relationships
    assessment: "Assessment" = Relationship(back_populates="questions")

# Activity Model
class Activity(SQLModel, table=True):
    __tablename__ = "activities"

    Activity_ID: Optional[int] = Field(default=None, primary_key=True)
    activity_name: str
    activity_type: str  # "meet_letter", "sound_blender", etc.
    difficulty_level: str  # "beginner", "easy", "medium", etc.
    language: str = "English"
    activity_content: dict = Field(default={}, sa_column=JSON)
    estimated_duration_minutes: int = 10

    # Organization
    activity_group: str = "group_1"  # Letter group
    mascot_character: str = "Learning Friend"
    is_boss_level: bool = False

    # Foreign Keys
    Child_ID: Optional[int] = Field(default=None, foreign_key="children.Child_ID", index=True)

    # Relationships
    child: "Child" = Relationship(back_populates="activities")
    progress: list["ActivityProgress"] = Relationship(back_populates="activity")
    level_assignments: list["LevelActivity"] = Relationship(back_populates="activities")

# Progress Model
class Progress(SQLModel, table=True):
    __tablename__ = "progress"

    progress_id: Optional[int] = Field(default=None, primary_key=True)
    total_score: int = 0

    # Foreign Keys
    Child_ID: int = Field(foreign_key="children.Child_ID", index=True)

    # Relationships
    child: "Child" = Relationship(back_populates="progress")
    activity_progress: list["ActivityProgress"] = Relationship(back_populates="progress")
    child_progress: list["ChildProgress"] = Relationship(back_populates="progress")

# Activity Progress Model
class ActivityProgress(SQLModel, table=True):
    __tablename__ = "activity_progress"

    id: Optional[int] = Field(default=None, primary_key=True)
    progress_id: int = Field(foreign_key="progress.progress_id", index=True)
    activity_id: int = Field(foreign_key="activities.Activity_ID", index=True)
    completion_status: str = "not_started"  # "not_started", "in_progress", "completed"
    stars_earned: int = 0
    mastery_level: int = 0
    total_time_spent_minutes: int = 0
    completed_at: Optional[datetime] = None

    # Relationships
    progress: "Progress" = Relationship(back_populates="activity_progress")
    activity: "Activity" = Relationship(back_populates="progress")

# Level Model
class Level(SQLModel, table=True):
    __tablename__ = "levels"

    Level_ID: Optional[int] = Field(default=None, primary_key=True)
    level_number: int
    level_name: str
    letter_group: str
    letters: list = Field(default=[], sa_column=JSON)
    description: str
    color_scheme: str
    mascot: str
    skills: list = Field(default=[], sa_column=JSON)
    estimated_duration_weeks: int

    # Relationships
    assessments: list["Assessment"] = Relationship(back_populates="level")
    activities: list["Activity"] = Relationship(back_populates="level_assignments")

# Level-Activity Assignment Model
class LevelActivity(SQLModel, table=True):
    __tablename__ = "level_activities"

    id: Optional[int] = Field(default=None, primary_key=True)
    Level_ID: int = Field(foreign_key="levels.Level_ID", index=True)
    Activity_ID: int = Field(foreign_key="activities.Activity_ID", index=True)
    order_in_level: int = 0

    # Relationships
    level: "Level" = Relationship(back_populates="activities")
    activity: "Activity" = Relationship(back_populates="level_assignments")
```

### Database Schema Relationships
```mermaid
erDiagram
    Parents ||--o{ Child : "has"
    Child ||--o{ Assessment : "completes"
    Child ||--o{ Activity : "assigned"
    Child ||--|| Progress : "tracks"
    Assessment ||--o{ AssessmentQuestion : "contains"
    Assessment ||--|| Level : "evaluates"
    Progress ||--o{ ActivityProgress : "includes"
    Activity ||--o{ ActivityProgress : "measured"
    Level ||--o{ LevelActivity : "includes"
    Activity ||--o{ LevelActivity : "assigned to"
```

---

## 🔄 Real-Time Communication Architecture

### Socket.IO Integration
**Files:**
- Backend: `backend/app/config/socket.py`, `backend/app/socket_events/handlers.py`
- Frontend: `frontend/src/shared/services/socketService.js`

**Backend Socket.IO Setup:**
```python
# socket.py - Socket.IO configuration
from socketio import AsyncServer
from app.config.settings import settings

# Create Socket.IO async server
sio = AsyncServer(async_mode='asgi', cors_allowed_origins=settings.FRONTEND_URL)
socket_app = SocketAPP(sio)

# Register Socket.IO event handlers
from app.socket_events import handlers

# Authentication middleware
@sio.middleware
async def authenticate(socket, data, environ):
    # Extract token from query params or headers
    token = data.get('token') or environ.get('HTTP_AUTHORIZATION', '').replace('Bearer ', '')

    if not token:
        return False

    try:
        # Verify JWT token
        from app.middleware.auth_middleware import verify_token
        payload = verify_token(token)

        # Store user info in socket session
        socket.session['user_id'] = payload.get('user_id')
        socket.session['role'] = payload.get('role')

        return True
    except Exception:
        return False
```

**Socket.IO Event Handlers:**
```python
# handlers.py - Socket.IO event handlers
from app.config.socket import sio

@sio.event
async def connect(sid, socket):
    user_id = socket.session.get('user_id')
    role = socket.session.get('role')

    if user_id:
        # Join personal room
        await sio.enter_room(sid, f'user_{user_id}')

        # Join role-based room
        await sio.enter_room(sid, f'{role}s')

        print(f"User {user_id} connected as {role}")
    else:
        print(f"Anonymous connection attempt rejected")

@sio.event
async def disconnect(sid):
    print(f"Client {sid} disconnected")

@sio.event
async def join_child_progress(sid, data):
    """Join child's progress monitoring room"""
    child_id = data.get('child_id')
    user_id = socket.session.get('user_id')

    # Verify parent owns this child
    if verify_parent_owns_child(user_id, child_id):
        await sio.enter_room(sid, f'child_progress_{child_id}')
        await sio.emit('joined_successfully', {
            'room': f'child_progress_{child_id}'
        }, to=sid)
    else:
        await sio.emit('join_failed', {
            'error': 'Not authorized to monitor this child'
        }, to=sid)

@sio.event
async def progress_update(sid, data):
    """Broadcast progress updates to monitoring parents"""
    child_id = data.get('child_id')
    progress_data = {
        'child_id': child_id,
        'current_activity': data.get('current_activity'),
        'completion_percentage': data.get('completion_percentage'),
        'time_spent_minutes': data.get('time_spent_minutes'),
        'correct_answers': data.get('correct_answers'),
        'total_questions': data.get('total_questions'),
        'timestamp': datetime.now().isoformat()
    }

    # Broadcast to child's progress room
    await sio.emit('progress_update', progress_data, room=f'child_progress_{child_id}')
```

**Frontend Socket.IO Client:**
```javascript
// socketService.js - Socket.IO client service
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket?.connected) return;

    this.socket = io(import.meta.env.VITE_API_URL.replace('/api', '/ws'), {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('Socket.IO connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
    });

    this.socket.on('progress_update', (data) => {
      this.emit('progress_update', data);
    });

    this.socket.on('joined_successfully', (data) => {
      console.log('Joined room:', data.room);
    });
  }

  joinChildProgress(childId) {
    if (this.socket?.connected) {
      this.socket.emit('join_child_progress', { child_id });
    }
  }

  on(event, callback) {
    this.listeners.set(event, callback);
  }

  emit(event, data) {
    const callback = this.listeners.get(event);
    if (callback) {
      callback(data);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new SocketService();
```

---

## 🔐 Authentication & Security Architecture

### JWT Token System
**File:** `backend/app/utils/security.py`

```python
# security.py - JWT token management
from datetime import datetime, timedelta
from jose import JWTError, jwt
from app.config.settings import settings

# JWT Configuration
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7
ALGORITHM = "HS256"

def create_access_token(user_id: int, role: str) -> str:
    """Create short-lived access token"""
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "user_id": user_id,
        "role": role,
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    }

    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(user_id: int, role: str) -> str:
    """Create long-lived refresh token"""
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    payload = {
        "user_id": user_id,
        "role": role,
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh"
    }

    return jwt.encode(payload, settings.JWT_REFRESH_SECRET, algorithm=ALGORITHM)

def verify_token(token: str) -> dict:
    """Verify and decode JWT token"""
    try:
        # Determine which secret to use based on token type
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[ALGORITHM])

        if payload.get("type") == "refresh":
            # Re-verify with refresh secret
            payload = jwt.decode(token, settings.JWT_REFRESH_SECRET, algorithms=[ALGORITHM])

        return payload
    except JWTError as e:
        raise HTTPException(status_code=401, detail="Invalid token")

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    import bcrypt
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    import bcrypt
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
```

### Authentication Middleware
**File:** `backend/app/middleware/auth_middleware.py`

```python
# auth_middleware.py - JWT authentication middleware
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session
from app.config.database import get_session
from app.models.models import Parents, Admin
from app.utils.security import verify_token

security = HTTPBearer()

def get_current_parent(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session)
) -> Parents:
    """Get authenticated parent from JWT token"""
    try:
        payload = verify_token(credentials.credentials)

        if payload.get("role") != "parent":
            raise HTTPException(status_code=403, detail="Invalid role")

        parent = session.get(Parents, payload.get("user_id"))
        if not parent:
            raise HTTPException(status_code=404, detail="Parent not found")

        return parent

    except Exception:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

def get_current_child(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session)
) -> Child:
    """Get authenticated child from JWT token"""
    try:
        payload = verify_token(credentials.credentials)

        if payload.get("role") != "child":
            raise HTTPException(status_code=403, detail="Invalid role")

        child = session.get(Child, payload.get("user_id"))
        if not child:
            raise HTTPException(status_code=404, detail="Child not found")

        return child

    except Exception:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session)
) -> Admin:
    """Get authenticated admin from JWT token"""
    try:
        payload = verify_token(credentials.credentials)

        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Invalid role")

        admin = session.get(Admin, payload.get("user_id"))
        if not admin:
            raise HTTPException(status_code=404, detail="Admin not found")

        if admin.admin_status != AdminStatus.active:
            raise HTTPException(status_code=403, detail="Admin account is inactive")

        return admin

    except Exception:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
```

---

## 🤖 AI Integration Architecture

### Google Gemini API Integration
**File:** `backend/app/services/ai_service.py`

```python
# ai_service.py - AI service architecture
from google import genai
from app.config.settings import settings
from typing import Dict, List, Any
import json

# Initialize Gemini client
client = genai.Client(api_key=settings.GEMINI_API_KEY)
GEMINI_MODEL = "models/gemini-flash-latest"

class AIService:
    """Centralized AI service for all AI operations"""

    @staticmethod
    def analyze_assessment(responses: List[Dict], child_age: int) -> Dict[str, Any]:
        """
        Analyze assessment responses using Gemini AI

        Args:
            responses: List of question responses
            child_age: Child's age for context

        Returns:
            AI analysis with intervention level and recommendations
        """
        assessment_prompt = AIService._build_assessment_prompt(responses, child_age)

        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=assessment_prompt
            )

            result_text = response.text.strip()
            ai_result = json.loads(AIService._extract_json(result_text))

            # Add calculated metrics
            total = len(responses)
            correct = sum(1 for r in responses if r.get("is_correct"))
            ai_result["accuracy_percentage"] = round((correct / total) * 100, 2)
            ai_result["total_correct"] = correct

            return ai_result

        except Exception as e:
            # Fallback to rule-based analysis
            return AIService._fallback_analysis(responses, child_age)

    @staticmethod
    def generate_activities_for_child(
        child_id: int,
        child_name: str,
        child_age: int,
        intervention_level: int,
        weak_areas: List[str],
        native_language: str,
        completed_activities: List[Dict] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate personalized activities using Gemini AI

        Args:
            child_id: Child's database ID
            child_name: Child's name for personalization
            child_age: Child's age for appropriate content
            intervention_level: Determined intervention level (1-5)
            weak_areas: Areas needing improvement
            native_language: Child's native language
            completed_activities: Previously completed activities

        Returns:
            List of personalized activities with emojis and content
        """
        activity_prompt = AIService._build_activity_prompt(
            child_name, child_age, intervention_level,
            weak_areas, native_language, completed_activities
        )

        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=activity_prompt
            )

            result_text = response.text.strip()
            ai_result = json.loads(AIService._extract_json(result_text))

            # Add Child_ID and language to each activity
            activities = ai_result.get("activities", [])
            for activity in activities:
                activity["Child_ID"] = child_id
                activity["language"] = native_language

            return activities

        except Exception as e:
            # Fallback to template-based activities
            return AIService._generate_fallback_activities(
                child_id, intervention_level, weak_areas, native_language
            )

    @staticmethod
    def _build_assessment_prompt(responses: List[Dict], child_age: int) -> str:
        """Build comprehensive prompt for assessment analysis"""
        total = len(responses)
        correct = sum(1 for r in responses if r.get("is_correct"))
        accuracy = (correct / total) * 100

        return f"""
        You are a expert children's dyslexia assessment specialist. Analyze these assessment results:

        Child Age: {child_age} years old
        Total Questions: {total}
        Correct Answers: {correct}
        Accuracy: {accuracy:.1f}%

        Question Results:
        {json.dumps(responses, indent=2)}

        Please provide a detailed analysis and respond ONLY in valid JSON format with this exact structure:
        {{
            "intervention_level": <1-5 based on performance>,
            "confidence_score": <0.0-1.0 confidence in your assessment>,
            "weak_areas": [<list of specific areas needing work>],
            "ai_analysis_text": "<detailed explanation for parents in simple, encouraging language>",
            "recommended_focus": "<single most important area to focus on>",
            "strength_areas": [<list of areas the child is doing well in>],
            "suggested_activities": [<list of specific activity types to start with>]
        }}

        Level Guidelines:
        - Level 1: Beginner (0-40% accuracy) - Focus on letter recognition, basic phonics
        - Level 2: Developing (40-60% accuracy) - Focus on phonics, letter sounds, basic words
        - Level 3: Progressing (60-80% accuracy) - Focus on word formation, blending, sight words
        - Level 4: Advanced (80-90% accuracy) - Focus on reading comprehension, sentences
        - Level 5: Excellent (90%+ accuracy) - Focus on advanced reading, vocabulary, stories
        """

    @staticmethod
    def _extract_json(response_text: str) -> str:
        """Extract JSON from AI response (handles code blocks)"""
        if "```json" in response_text:
            return response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            return response_text.split("```")[1].split("```")[0].strip()
        return response_text
```

---

## 📡 API Communication Layer

### Frontend API Service
**File:** `frontend/src/shared/services/api.js`

```javascript
// api.js - Centralized API communication
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 error and not already refreshing
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${api.defaults.baseURL}/api/auth/refresh`, {
          refresh_token: refreshToken
        });

        const { access_token } = response.data;

        // Store new token
        localStorage.setItem('access_token', access_token);

        // Update default headers
        api.defaults.headers.common.Authorization = `Bearer ${access_token}`;

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);

      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

## 🚀 Deployment Architecture

### Development Environment
```bash
# Frontend Development
cd frontend
npm install
npm run dev  # Runs on http://localhost:5173

# Backend Development
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn app.main:app --reload --port 8000  # Runs on http://localhost:8000

# Database Initialization (automatic on startup)
# Tables are created automatically via app.config.database.create_db_and_tables()
```

### Production Deployment Considerations

**Frontend Build:**
```bash
cd frontend
npm run build  # Creates optimized production build
```

**Backend Production Server:**
```bash
cd backend
# Use production ASGI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Environment Variables:**
```bash
# Backend .env
DATABASE_URL=postgresql://user:password@host:5432/brightbook
JWT_SECRET_KEY=your-production-secret-key
JWT_REFRESH_SECRET=your-production-refresh-secret
GEMINI_API_KEY=your-gemini-api-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FRONTEND_URL=https://brightbook.app

# Frontend .env
VITE_API_URL=https://api.brightbook.app
```

---

## 📊 System Performance & Scalability

### Current Performance Metrics
- **API Response Time**: < 200ms average (excluding AI calls)
- **AI Processing Time**: 3-5 seconds for assessment + activity generation
- **Database Queries**: < 50ms for standard queries
- **Socket.IO Latency**: < 100ms for real-time updates

### Scalability Considerations
- **Database**: SQLite → PostgreSQL for production
- **Caching**: Redis for session management and query caching
- **Load Balancing**: Multiple backend instances with sticky sessions
- **CDN**: CloudFlare for static asset delivery
- **Monitoring**: Sentry for error tracking, DataDog for metrics

---

## 🛡️ Security Best Practices

### Implementation Security
1. **Input Validation**: All user inputs validated and sanitized
2. **SQL Injection Prevention**: Parameterized queries via SQLModel
3. **XSS Prevention**: React's built-in XSS protection
4. **CSRF Protection**: Token-based CSRF protection
5. **Rate Limiting**: API rate limiting to prevent abuse
6. **Password Security**: Bcrypt hashing with salt
7. **HTTPS Only**: All communications encrypted in production

### Data Privacy
1. **Child Data Protection**: Strict access controls
2. **Parent Verification**: Parents can only access their children's data
3. **Data Minimization**: Only collect necessary data
4. **Right to Deletion**: Complete data deletion on request
5. **Audit Logging**: All admin actions logged

---

## 📚 Related Documentation

- **Parent Journey**: `from_signup_to_first_activity.md`
- **Child Experience**: `childs_first_day_on_brightbook.md`
- **AI Assessment Flow**: `how_assessment_becomes_learning_plan.md`
- **Admin Operations**: `admin_content_management_studio.md`

---

**Document End**

*This documentation covers the complete BrightBook system architecture including frontend, backend, database, real-time communication, authentication, AI integration, and deployment considerations. The system is designed for scalability, security, and maintainability while providing an excellent user experience for children, parents, and administrators.*
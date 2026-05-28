# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BrightBook is an AI-powered children's dyslexia assessment and intervention platform for ages 3-8. It's a full-stack web application with real-time features, multi-language support (English & Arabic), and role-based access control for children, parents, and administrators.

## Architecture

### Backend (Python/FastAPI)
- **FastAPI 0.115.0** with async support
- **SQLModel** for database ORM with Pydantic integration
- **SQLite** (development) / PostgreSQL (production ready)
- **Socket.IO** for real-time bidirectional communication
- **JWT** authentication with refresh tokens
- **Modular structure**: routers, models, services, middleware, socket events

### Frontend (React/Vite)
- **React 19.2.5** with Vite build system
- **React Router DOM** for client-side routing
- **Tailwind CSS** for styling with custom children's theme
- **Zustand** for state management
- **Socket.IO Client** for real-time features
- **Feature-based architecture** with shared components

### Key Directories
- `backend/app/` - Main application code
  - `routers/` - API endpoints (auth, children, assessments, learning, etc.)
  - `models/` - SQLModel database models
  - `services/` - Business logic layer
  - `socket_events/` - Real-time event handlers
  - `config/` - Settings, database, Socket.IO configuration
- `frontend/src/` - Frontend application
  - `features/` - Feature-based components (auth, learning, assessment, etc.)
  - `shared/` - Reusable UI components and utilities
  - `app/` - Main app layout and routing

## Development Commands

### Backend Development
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn app.main:app --reload --port 8000
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev  # Runs on http://localhost:5173
```

### Build & Lint
```bash
# Frontend build
cd frontend
npm run build
npm run lint

# Backend tests (when implemented)
cd backend
pytest
```

## Key Design Patterns

### Assessment Engine
- 25 dyslexia screening questions organized in 6 groups with dependencies
- Questions support multiple mechanics: timed reading, comprehension, visual discrimination
- Some questions depend on others (e.g., Q12-14 depend on Q11)
- See `literacy_questions_seed.md` for complete assessment structure

### Real-time Features
- Socket.IO integrated at `/ws` endpoint
- Used for live progress updates and parent monitoring
- Event handlers in `backend/app/socket_events/`

### Authentication & Authorization
- JWT-based auth with access tokens (15min) and refresh tokens (7 days)
- Role-based access control: child, parent, admin
- Protected routes via `ProtectedRoute` component in frontend
- Admin routes require special key sequence: Ctrl+Shift+D

### Multi-language Support
- English and Arabic (RTL support)
- Noto Sans Arabic font for Arabic text
- Language-specific content in assessment questions

## Database & Models

- **SQLModel** with auto-table creation on startup
- Main entities: users, children, assessments, progress, subscriptions
- Database initialization in `backend/app/config/database.py`
- SQLite file: `brightbook.db` in project root

## Environment Configuration

Backend requires `.env` file in `backend/` directory:
```
DATABASE_URL=sqlite:///./brightbook.db
JWT_SECRET_KEY=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
ANTHROPIC_API_KEY=your-key  # For AI features
SMTP_HOST=smtp.gmail.com     # For emails
```

Frontend requires `.env` file in `frontend/` directory:
```
VITE_API_URL=http://localhost:8000
```

## Testing

- **Backend**: pytest with pytest-asyncio (test structure in place, tests to be implemented)
- **Frontend**: ESLint configured, test framework not yet implemented
- Test directories: `backend/tests/unit/` and `backend/tests/integration/`

## Special Features

- **Assessment timing**: Records reading time for comprehension questions
- **Multi-select questions**: Some questions require multiple correct answers
- **Grid randomization**: Visual discrimination questions shuffle grids per session
- **Parent monitoring**: Real-time progress tracking via Socket.IO
- **Responsive design**: Optimized for children's touch interactions

## API Documentation

Auto-generated FastAPI docs available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Common Development Tasks

When working with assessments, always check `literacy_questions_seed.md` for:
- Question dependencies (must respect order)
- Required measures (e.g., reading_time_seconds)
- Multi-select requirements (correct_answers_count)
- Stimulus references between questions

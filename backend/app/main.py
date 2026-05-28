from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os
from app.config.settings import settings
from app.config.database import create_db_and_tables
from app.config.socket import socket_app, sio
from app.routers import auth, children, assessments, learning, parent, subscription, support, admin, chatbot
from app.socket_events import handlers  # registers event handlers

app = FastAPI(
    title="BrightBook API",
    description="AI-powered children's literacy platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",  # React frontend
        "http://localhost:3000",  # Vanilla JS frontend
        "http://127.0.0.1:3000",  # Vanilla JS frontend (alternate)
        "http://localhost:3001",  # Vanilla JS frontend (alternate port)
        "http://127.0.0.1:3001",  # Vanilla JS frontend (alternate port)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler — ensures CORS headers survive 500 errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Determine origin from request
    origin = request.headers.get("origin", "")
    allow_origin = "http://localhost:5173"  # Default

    if "localhost:3000" in origin or "127.0.0.1:3000" in origin:
        allow_origin = origin
    elif "localhost:3001" in origin or "127.0.0.1:3001" in origin:
        allow_origin = origin
    elif "localhost:5173" in origin:
        allow_origin = origin

    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={
            "Access-Control-Allow-Origin": allow_origin,
            "Access-Control-Allow-Credentials": "true",
        },
    )

# Mount Socket.IO
app.mount("/ws", socket_app)

# Mount Uploads
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Register routers
app.include_router(auth.router)
app.include_router(children.router)
app.include_router(assessments.router)
app.include_router(learning.router)
app.include_router(parent.router)
app.include_router(subscription.router)
app.include_router(support.router)
app.include_router(admin.router)
app.include_router(chatbot.router)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    print("BrightBook API started. DB tables created.")


@app.get("/health")
def health_check():
    return {"status": "ok", "version": "1.0.0"}

# Trigger reload to pick up new .env config

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.core.config import settings
from app.api.routes import router as api_router
from app.core.events import startup_event_handler, shutdown_event_handler

# Create FastAPI app
app = FastAPI(
    title="Pagey AI API",
    description="API for Pagey AI - PDF Chat Application",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register startup and shutdown events
app.add_event_handler("startup", startup_event_handler)
app.add_event_handler("shutdown", shutdown_event_handler)

# Include API router
app.include_router(api_router, prefix="/api")

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# Mount uploads directory for static file serving
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True,
    ) 
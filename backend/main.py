"""
AI Assessment Tool - FastAPI Backend
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.settings import ALLOWED_ORIGINS
from routes.health import router as health_router
from routes.test_generation import router as test_generation_router
from routes.test_submission import router as test_submission_router
from routes.candidate import router as candidate_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Assessment Tool API",
    description="Backend for AI-powered interview assessment platform",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health_router, tags=["Health"])
app.include_router(test_generation_router, tags=["Test Generation"])
app.include_router(test_submission_router, tags=["Test Submission"])
app.include_router(candidate_router, tags=["Candidates"])


@app.on_event("startup")
async def startup_event():
    logger.info("Starting AI Assessment Backend...")
    try:
        from config.database import init_db
        init_db()
        logger.info("Database initialised successfully.")
    except Exception as exc:
        logger.warning("Could not initialise database (not critical for startup): %s", exc)


@app.get("/")
async def root():
    return {
        "message": "AI Assessment Tool API",
        "docs": "/docs",
        "health": "/health",
    }

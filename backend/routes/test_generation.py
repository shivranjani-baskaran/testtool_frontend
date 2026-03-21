import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from config.database import get_db
from database.schemas import (
    GenerateTestRequest,
    GenerateTestLinkRequest,
    GenerateTestLinkResponse,
)
from database.schemas import CandidateCreate
from services.candidate_service import get_or_create_candidate
from services.test_service import create_test_session
from services.email_service import send_test_link_email

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/generate-test")
async def generate_test(request: GenerateTestRequest):
    """
    Generate interview questions from a job description.
    Delegates to the agents/generate_langgraph workflow.
    """
    try:
        from agents.generate_langgraph import run_generate_workflow
        result = run_generate_workflow(request.job_description)
        return result
    except ImportError:
        logger.warning("generate_langgraph not available, returning placeholder.")
        raise HTTPException(
            status_code=503,
            detail="Question generation workflow not configured. Please set up agents.",
        )
    except Exception as exc:
        logger.error("Test generation failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/generate-test-link", response_model=GenerateTestLinkResponse)
async def generate_test_link(
    request: GenerateTestLinkRequest,
    db: Session = Depends(get_db),
):
    """
    Create a test session and send the test link via email.
    Returns session_id and test_link.
    """
    # Get or create candidate
    candidate = get_or_create_candidate(
        db,
        CandidateCreate(
            email=request.email,
            name=request.name,
            candidate_id=request.candidate_id,
        ),
    )

    # Create the test session
    session = create_test_session(
        db,
        candidate=candidate,
        questions=request.questions,
        role=request.role,
        skills=request.skills,
        weights=request.weights,
    )

    # Send email
    email_sent = send_test_link_email(
        recipient_email=request.email,
        candidate_name=request.name,
        test_link=session.test_link,
        temp_password=session.temp_password,
        session_id=session.id,
    )

    if not email_sent:
        logger.warning("Email not sent for session %s", session.id)

    return GenerateTestLinkResponse(
        session_id=session.id,
        test_link=session.test_link,
        message=(
            "Test link sent via email."
            if email_sent
            else "Session created. Email service not configured — share the link manually."
        ),
    )

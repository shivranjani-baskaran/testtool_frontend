import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from config.database import get_db
from database.schemas import (
    GenerateTestRequest,
    GenerateTestLinkRequest,
    GenerateTestLinkResponse,
    BulkSendTestRequest,
)
from database.schemas import CandidateCreate
from database.models import JobDescription
from services.candidate_service import get_or_create_candidate
from services.test_service import create_test_session
from services.email_service import send_test_link_email

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/generate-test")
async def generate_test(request: GenerateTestRequest, db: Session = Depends(get_db)):
    """
    Generate interview questions from a job description.
    Delegates to the agents/generate_langgraph workflow and persists the JD.
    """
    try:
        from agents.generate_langgraph import run_generate_workflow
        result = run_generate_workflow(request.job_description)

        # Persist the job description
        jd = JobDescription(
            raw_text=request.job_description,
            role=result.get("role"),
            skills=result.get("skills"),
            weights=result.get("weights"),
            questions=result.get("questions"),
        )
        db.add(jd)
        db.commit()
        db.refresh(jd)

        result["jd_id"] = jd.id
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


@router.post("/send-test-bulk")
async def send_test_bulk(
    request: BulkSendTestRequest,
    db: Session = Depends(get_db),
):
    """
    Send a test link to multiple candidates at once.
    """
    sent = 0
    results = []
    names = request.names or []

    for i, email in enumerate(request.emails):
        name = names[i] if i < len(names) else None
        try:
            candidate = get_or_create_candidate(
                db,
                CandidateCreate(email=email, name=name),
            )
            session = create_test_session(
                db,
                candidate=candidate,
                questions=request.questions,
                role=request.role,
                skills=request.skills,
                weights=request.weights,
            )

            # Link session to the job description if provided
            if request.jd_id:
                session.jd_id = request.jd_id
                db.commit()

            email_sent = send_test_link_email(
                recipient_email=email,
                candidate_name=name,
                test_link=session.test_link,
                temp_password=session.temp_password,
                session_id=session.id,
            )
            sent += 1
            results.append(
                {
                    "email": email,
                    "session_id": session.id,
                    "email_sent": email_sent,
                    "status": "success",
                }
            )
        except Exception as exc:
            logger.error("Bulk send failed for %s: %s", email, exc)
            results.append({"email": email, "status": "error", "detail": str(exc)})

    return {"sent": sent, "results": results}

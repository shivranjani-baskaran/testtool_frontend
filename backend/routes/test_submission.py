import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from config.database import get_db
from database.schemas import SubmitTestRequest, ValidateSessionRequest, ValidateSessionResponse
from services.test_service import get_session_by_id, validate_session, save_responses, save_test_result

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/validate-session", response_model=ValidateSessionResponse)
async def validate_session_endpoint(
    request: ValidateSessionRequest,
    db: Session = Depends(get_db),
):
    session = validate_session(db, request.session_id, request.password)
    if not session:
        return ValidateSessionResponse(
            valid=False,
            message="Invalid session ID or password.",
        )
    return ValidateSessionResponse(
        valid=True,
        session_id=session.id,
        candidate_id=session.candidate.candidate_id if session.candidate else None,
        message="Session valid.",
    )


@router.get("/test-session/{session_id}")
async def get_test_session(
    session_id: str,
    db: Session = Depends(get_db),
):
    session = get_session_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    return {
        "session_id": session.id,
        "candidate_id": session.candidate.candidate_id if session.candidate else None,
        "questions": session.questions,
        "role": session.role,
        "status": session.status,
    }


@router.post("/submit-test")
async def submit_test(
    request: SubmitTestRequest,
    db: Session = Depends(get_db),
):
    """
    Store candidate responses in the database and process through evaluation agents.
    """
    # Find or use existing session
    session = None
    if request.session_id:
        session = get_session_by_id(db, request.session_id)

    if session is None:
        raise HTTPException(status_code=404, detail="Test session not found. Please validate the session first.")

    # Save responses to database
    responses_data = [r.dict() for r in request.responses]
    save_responses(db, session, responses_data)

    # Run evaluation through agents
    report = {}
    try:
        from agents.evaluate_langgraph import run_evaluate_workflow
        report = run_evaluate_workflow(
            questions=request.questions,
            responses=responses_data,
            candidate_id=request.candidate_id,
            email=request.email,
            test_metadata=request.test_metadata or {},
        )
    except ImportError:
        logger.warning("evaluate_langgraph not available, returning empty report.")
        report = _build_placeholder_report(request.questions, responses_data)
    except Exception as exc:
        logger.error("Evaluation failed: %s", exc)
        report = _build_placeholder_report(request.questions, responses_data)

    # Persist the result
    save_test_result(db, session, report)

    return {
        "report": report,
        "candidate_id": request.candidate_id,
        "session_id": session.id,
        "submitted_at": session.completed_at.isoformat() if session.completed_at else None,
    }


def _build_placeholder_report(questions, responses):
    """Build a minimal report when evaluation agents are not available."""
    answered = sum(1 for r in responses if r.get("answer", "").strip())
    total = len(questions)
    pct = round((answered / total) * 100, 1) if total > 0 else 0
    return {
        "total_score": answered * 10,
        "max_score": total * 10,
        "percentage": pct,
        "grade": "N/A",
        "category_scores": {},
        "evaluated_responses": [],
        "metacognitive_analysis": {
            "confidence_accuracy": 0,
            "overconfidence_count": 0,
            "underconfidence_count": 0,
            "calibration_score": 0,
        },
        "proctoring_summary": {"tab_switches": 0, "no_face_count": 0, "total_events": 0},
        "recommendations": [],
        "strengths": [],
        "weaknesses": [],
        "note": "Full evaluation requires agents to be configured.",
    }

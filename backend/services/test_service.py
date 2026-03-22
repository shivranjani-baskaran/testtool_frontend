import uuid
import string
import random
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from database.models import TestSession, CandidateResponse, TestResult, Candidate
from config.settings import FRONTEND_URL, TEMP_PASSWORD_LENGTH

logger = logging.getLogger(__name__)


def generate_temp_password(length: int = TEMP_PASSWORD_LENGTH) -> str:
    chars = string.ascii_letters + string.digits
    return "".join(random.choices(chars, k=length))


def create_test_session(
    db: Session,
    candidate: Candidate,
    questions: List[Dict[str, Any]],
    role: Optional[str] = None,
    skills: Optional[List[str]] = None,
    weights: Optional[Dict[str, float]] = None,
) -> TestSession:
    session_id = str(uuid.uuid4())
    temp_password = generate_temp_password()
    test_link = f"{FRONTEND_URL}/test?session_id={session_id}&pwd={temp_password}"

    session = TestSession(
        id=session_id,
        candidate_id=candidate.id,
        questions=questions,
        status="pending",
        test_link=test_link,
        temp_password=temp_password,
        role=role,
        skills=skills,
        weights=weights,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    logger.info("Created test session: %s for candidate: %s", session_id, candidate.candidate_id)
    return session


def get_session_by_id(db: Session, session_id: str) -> Optional[TestSession]:
    return db.query(TestSession).filter(TestSession.id == session_id).first()


def validate_session(db: Session, session_id: str, password: str) -> Optional[TestSession]:
    session = get_session_by_id(db, session_id)
    if session and session.temp_password == password:
        return session
    return None


def mark_session_started(db: Session, session: TestSession) -> TestSession:
    session.status = "started"
    session.started_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return session


def save_responses(
    db: Session,
    session: TestSession,
    responses: List[Dict[str, Any]],
) -> List[CandidateResponse]:
    saved = []
    for r in responses:
        resp = CandidateResponse(
            id=str(uuid.uuid4()),
            session_id=session.id,
            question_id=r.get("question_id", ""),
            answer=r.get("answer", ""),
            confidence=r.get("confidence", "medium"),
            time_taken=r.get("time_taken", 0),
        )
        db.add(resp)
        saved.append(resp)
    session.status = "completed"
    session.completed_at = datetime.utcnow()
    db.commit()
    return saved


def save_test_result(
    db: Session,
    session: TestSession,
    report: Dict[str, Any],
) -> TestResult:
    result = db.query(TestResult).filter(TestResult.session_id == session.id).first()
    if not result:
        result = TestResult(
            id=str(uuid.uuid4()),
            session_id=session.id,
        )
        db.add(result)

    result.technical_score = _safe_float(report.get("total_score"))
    result.final_score = _safe_float(report.get("final_score") or report.get("percentage"))
    result.hire_decision = bool(report.get("percentage", 0) >= 60)
    result.risk_level = report.get("risk_level")
    result.hire_decision_label = report.get("hire_decision") if isinstance(report.get("hire_decision"), str) else None
    result.strengths = report.get("strengths")
    result.weaknesses = report.get("weaknesses")
    result.summary = report.get("summary")
    result.metacognitive_score = _safe_float(
        report.get("metacognitive_analysis", {}).get("calibration_score")
    )
    result.proctoring_score = _safe_float(
        report.get("proctoring_summary", {}).get("integrity_score")
    )
    result.report_data = report
    db.commit()
    db.refresh(result)
    return result


def _safe_float(val) -> Optional[float]:
    try:
        return float(val) if val is not None else None
    except (TypeError, ValueError):
        return None

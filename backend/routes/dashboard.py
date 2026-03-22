"""
Dashboard Routes
Provides metrics, job-description history, and candidate report summaries.
"""
import logging
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from config.database import get_db
from database.models import Candidate, TestSession, TestResult, JobDescription
from database.schemas import (
    DashboardMetricsResponse,
    JobDescriptionOut,
    CandidateReportSummary,
)
from typing import List

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/dashboard/metrics", response_model=DashboardMetricsResponse)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    """Return aggregate hiring metrics."""
    total_candidates = db.query(func.count(Candidate.id)).scalar() or 0
    tests_sent = db.query(func.count(TestSession.id)).scalar() or 0
    tests_completed = (
        db.query(func.count(TestSession.id))
        .filter(TestSession.status == "completed")
        .scalar()
        or 0
    )
    average_score = (
        db.query(func.avg(TestResult.final_score))
        .filter(TestResult.final_score.isnot(None))
        .scalar()
        or 0.0
    )

    # Score distribution bucketed into 0-20, 21-40, 41-60, 61-80, 81-100
    buckets = [
        {"range": "0-20", "min": 0, "max": 20},
        {"range": "21-40", "min": 21, "max": 40},
        {"range": "41-60", "min": 41, "max": 60},
        {"range": "61-80", "min": 61, "max": 80},
        {"range": "81-100", "min": 81, "max": 100},
    ]
    score_distribution = []
    for bucket in buckets:
        count = (
            db.query(func.count(TestResult.id))
            .filter(
                TestResult.final_score >= bucket["min"],
                TestResult.final_score <= bucket["max"],
            )
            .scalar()
            or 0
        )
        score_distribution.append({"range": bucket["range"], "count": count})

    return DashboardMetricsResponse(
        total_candidates=total_candidates,
        tests_sent=tests_sent,
        tests_completed=tests_completed,
        average_score=round(float(average_score), 1),
        score_distribution=score_distribution,
    )


@router.get("/dashboard/job-descriptions", response_model=List[JobDescriptionOut])
def get_job_descriptions(db: Session = Depends(get_db)):
    """Return all persisted job descriptions, newest first."""
    jds = (
        db.query(JobDescription)
        .order_by(JobDescription.created_at.desc())
        .all()
    )
    return jds


@router.get("/dashboard/reports", response_model=List[CandidateReportSummary])
def get_all_reports(db: Session = Depends(get_db)):
    """Return report summaries for all completed sessions, newest first."""
    rows = (
        db.query(TestSession, TestResult, Candidate)
        .join(TestResult, TestResult.session_id == TestSession.id, isouter=True)
        .join(Candidate, Candidate.id == TestSession.candidate_id)
        .filter(TestSession.status == "completed")
        .order_by(TestSession.completed_at.desc())
        .all()
    )

    summaries = []
    for session, result, candidate in rows:
        completed_at = (
            session.completed_at.isoformat() if session.completed_at else None
        )
        summaries.append(
            CandidateReportSummary(
                candidate_id=candidate.candidate_id,
                name=candidate.name,
                email=candidate.email,
                session_id=session.id,
                role=session.role,
                final_score=result.final_score if result else None,
                hire_decision=result.hire_decision_label if result else None,
                risk_level=result.risk_level if result else None,
                completed_at=completed_at,
            )
        )
    return summaries

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from config.database import get_db
from services.candidate_service import get_candidate_by_id

router = APIRouter()


@router.get("/candidate/{candidate_id}")
async def get_candidate(candidate_id: str, db: Session = Depends(get_db)):
    candidate = get_candidate_by_id(db, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    return {
        "candidate_id": candidate.candidate_id,
        "email": candidate.email,
        "name": candidate.name,
        "created_at": candidate.created_at.isoformat(),
        "sessions": [
            {
                "session_id": s.id,
                "status": s.status,
                "role": s.role,
                "created_at": s.created_at.isoformat(),
            }
            for s in candidate.sessions
        ],
    }


@router.get("/candidate/{candidate_id}/report")
async def get_candidate_report(candidate_id: str, db: Session = Depends(get_db)):
    candidate = get_candidate_by_id(db, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    reports = []
    for session in candidate.sessions:
        if session.result and session.result.report_data:
            reports.append({
                "session_id": session.id,
                "role": session.role,
                "completed_at": session.completed_at.isoformat() if session.completed_at else None,
                "report": session.result.report_data,
            })

    if not reports:
        raise HTTPException(status_code=404, detail="No completed reports found for this candidate.")

    return {
        "candidate_id": candidate.candidate_id,
        "email": candidate.email,
        "name": candidate.name,
        "reports": reports,
    }

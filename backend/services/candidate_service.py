import uuid
import logging
from typing import Optional
from sqlalchemy.orm import Session
from database.models import Candidate
from database.schemas import CandidateCreate

logger = logging.getLogger(__name__)


def get_or_create_candidate(db: Session, data: CandidateCreate) -> Candidate:
    """Get existing candidate by email or create a new one."""
    candidate = db.query(Candidate).filter(Candidate.email == data.email).first()
    if candidate:
        return candidate

    candidate_id = data.candidate_id or f"CAND_{uuid.uuid4().hex[:8].upper()}"
    candidate = Candidate(
        id=str(uuid.uuid4()),
        candidate_id=candidate_id,
        email=data.email,
        name=data.name,
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    logger.info("Created candidate: %s (%s)", candidate.candidate_id, candidate.email)
    return candidate


def get_candidate_by_id(db: Session, candidate_id: str) -> Optional[Candidate]:
    return (
        db.query(Candidate)
        .filter(Candidate.candidate_id == candidate_id)
        .first()
    )

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, JSON, Boolean, Text
from sqlalchemy.orm import relationship
from config.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(String, primary_key=True, default=generate_uuid)
    candidate_id = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, nullable=False, index=True)
    name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    sessions = relationship("TestSession", back_populates="candidate")


class TestSession(Base):
    __tablename__ = "test_sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    candidate_id = Column(String, ForeignKey("candidates.id"), nullable=False)
    questions = Column(JSON, nullable=False)
    status = Column(String, default="pending")  # pending, started, completed
    test_link = Column(String, nullable=True)
    temp_password = Column(String, nullable=True)
    role = Column(String, nullable=True)
    skills = Column(JSON, nullable=True)
    weights = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    candidate = relationship("Candidate", back_populates="sessions")
    responses = relationship("CandidateResponse", back_populates="session")
    result = relationship("TestResult", back_populates="session", uselist=False)


class CandidateResponse(Base):
    __tablename__ = "candidate_responses"

    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("test_sessions.id"), nullable=False)
    question_id = Column(String, nullable=False)
    answer = Column(Text, nullable=False, default="")
    confidence = Column(String, nullable=True)  # low, medium, high
    time_taken = Column(Integer, nullable=True)  # seconds
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("TestSession", back_populates="responses")


class TestResult(Base):
    __tablename__ = "test_results"

    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("test_sessions.id"), nullable=False, unique=True)
    technical_score = Column(Float, nullable=True)
    metacognitive_score = Column(Float, nullable=True)
    proctoring_score = Column(Float, nullable=True)
    final_score = Column(Float, nullable=True)
    hire_decision = Column(Boolean, nullable=True)
    report_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("TestSession", back_populates="result")

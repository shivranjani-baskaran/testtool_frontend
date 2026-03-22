from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime


class CandidateCreate(BaseModel):
    email: str
    name: Optional[str] = None
    candidate_id: Optional[str] = None


class CandidateOut(BaseModel):
    id: str
    candidate_id: str
    email: str
    name: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class TestSessionCreate(BaseModel):
    candidate_id: str
    questions: List[Dict[str, Any]]
    role: Optional[str] = None
    skills: Optional[List[str]] = None
    weights: Optional[Dict[str, float]] = None


class TestSessionOut(BaseModel):
    id: str
    candidate_id: str
    questions: List[Dict[str, Any]]
    status: str
    test_link: Optional[str]
    role: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ResponseItem(BaseModel):
    question_id: str
    answer: str
    confidence: Optional[str] = "medium"
    time_taken: Optional[int] = 0


class GenerateTestRequest(BaseModel):
    job_description: str


class GenerateTestLinkRequest(BaseModel):
    candidate_id: str
    email: str
    name: Optional[str] = None
    questions: List[Dict[str, Any]]
    role: Optional[str] = None
    skills: Optional[List[str]] = None
    weights: Optional[Dict[str, float]] = None
    session_id: Optional[str] = None


class GenerateTestLinkResponse(BaseModel):
    session_id: str
    test_link: str
    message: str


class SubmitTestRequest(BaseModel):
    candidate_id: str
    email: str
    session_id: Optional[str] = None
    questions: List[Dict[str, Any]]
    responses: List[ResponseItem]
    total_time: Optional[int] = 0
    test_metadata: Optional[Dict[str, Any]] = None


class ValidateSessionRequest(BaseModel):
    session_id: str
    password: str


class ValidateSessionResponse(BaseModel):
    valid: bool
    session_id: Optional[str] = None
    candidate_id: Optional[str] = None
    message: str


class JobDescriptionOut(BaseModel):
    id: str
    raw_text: str
    role: Optional[str]
    skills: Optional[List[str]]
    weights: Optional[Dict[str, float]]
    seniority_level: Optional[str]
    questions: Optional[List[Dict[str, Any]]]
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardMetricsResponse(BaseModel):
    total_candidates: int
    tests_sent: int
    tests_completed: int
    average_score: float
    score_distribution: List[Dict[str, Any]]


class CandidateReportSummary(BaseModel):
    candidate_id: str
    name: Optional[str]
    email: str
    session_id: str
    role: Optional[str]
    final_score: Optional[float]
    hire_decision: Optional[str]
    risk_level: Optional[str]
    completed_at: Optional[str]


class BulkSendTestRequest(BaseModel):
    emails: List[str]
    names: Optional[List[Optional[str]]] = None
    questions: List[Dict[str, Any]]
    role: Optional[str] = None
    skills: Optional[List[str]] = None
    weights: Optional[Dict[str, float]] = None
    jd_id: Optional[str] = None

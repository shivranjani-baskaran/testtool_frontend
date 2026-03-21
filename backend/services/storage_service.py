"""
Convenience module that re-exports database operations for backward compatibility.
"""
from services.candidate_service import get_or_create_candidate, get_candidate_by_id
from services.test_service import (
    create_test_session,
    get_session_by_id,
    validate_session,
    save_responses,
    save_test_result,
)

__all__ = [
    "get_or_create_candidate",
    "get_candidate_by_id",
    "create_test_session",
    "get_session_by_id",
    "validate_session",
    "save_responses",
    "save_test_result",
]

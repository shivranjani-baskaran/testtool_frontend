"""Tests for Report Agent."""
import pytest
from agents.report_agent import generate_report, _compute_grade


def test_compute_grade():
    assert _compute_grade(95) == "A"
    assert _compute_grade(85) == "B"
    assert _compute_grade(75) == "C"
    assert _compute_grade(65) == "D"
    assert _compute_grade(50) == "F"


def test_generate_report_structure():
    judge = {"total_score": 70, "max_score": 100, "percentage": 70, "category_scores": {"Python": 80}, "evaluated_responses": []}
    meta = {"confidence_accuracy": 60, "overconfidence_count": 1, "underconfidence_count": 0, "calibration_score": 60, "total_assessed": 5}
    proc = {"tab_switches": 0, "copy_paste_attempts": 0, "no_face_count": 0, "total_events": 0, "integrity_score": 100, "flagged": False}
    report = generate_report("CAND_001", judge, meta, proc)
    assert report["grade"] == "C"
    assert report["hire_decision"] is True
    assert "recommendations" in report

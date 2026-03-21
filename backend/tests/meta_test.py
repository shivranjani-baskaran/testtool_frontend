"""Tests for Metacognitive Agent."""
import pytest
from agents.metacognitive_agent import analyze_metacognition


def test_metacognition_overconfident():
    responses = [{"question_id": "1", "confidence": "high"}]
    evaluated = [{"question_id": "1", "score": 1, "max_score": 10}]
    result = analyze_metacognition(responses, evaluated)
    assert result["overconfidence_count"] >= 1


def test_metacognition_accurate():
    responses = [{"question_id": "1", "confidence": "high"}]
    evaluated = [{"question_id": "1", "score": 9, "max_score": 10}]
    result = analyze_metacognition(responses, evaluated)
    assert result["calibration_score"] > 0


def test_metacognition_empty():
    result = analyze_metacognition([], [])
    assert result["total_assessed"] == 0

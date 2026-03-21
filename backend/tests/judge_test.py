"""Tests for Judge Agent."""
import pytest
from agents.judge_agent import _basic_evaluation


def test_basic_evaluation_all_answered():
    questions = [{"id": "1", "text": "Q1", "category": "Technical"}]
    responses = [{"question_id": "1", "answer": "My answer"}]
    result = _basic_evaluation(questions, responses)
    assert result["total_score"] > 0
    assert result["percentage"] > 0


def test_basic_evaluation_no_answers():
    questions = [{"id": "1", "text": "Q1", "category": "Technical"}]
    responses = [{"question_id": "1", "answer": ""}]
    result = _basic_evaluation(questions, responses)
    assert result["total_score"] == 0

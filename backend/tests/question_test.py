"""Tests for Question Generator agent."""
import pytest
from unittest.mock import patch, MagicMock
import json


def test_generate_questions_returns_list():
    mock_data = {
        "questions": [
            {"id": "1", "text": "Q1?", "type": "single_choice",
             "options": {"A": "opt1", "B": "opt2"}, "category": "Technical",
             "difficulty": "medium", "time_limit": 60},
        ]
    }
    with patch("agents.question_generator.AzureOpenAI") as mock_cls:
        mock_client = MagicMock()
        mock_cls.return_value = mock_client
        mock_comp = MagicMock()
        mock_comp.choices[0].message.content = json.dumps(mock_data)
        mock_client.chat.completions.create.return_value = mock_comp

        from agents.question_generator import generate_questions
        result = generate_questions("Python Dev", ["Python"], {"Python": 100})

    assert isinstance(result, list)
    assert len(result) >= 1
    assert "text" in result[0]


def test_normalise_options_from_dict():
    from agents.question_generator import _normalise_options
    opts = {"A": "Option A text", "B": "Option B text"}
    result = _normalise_options(opts)
    assert len(result) == 2
    assert result[0]["id"] == "A"
    assert result[0]["text"] == "Option A text"

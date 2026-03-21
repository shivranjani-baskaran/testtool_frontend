"""Tests for JD Analyzer agent."""
import pytest
from unittest.mock import patch, MagicMock


def test_analyze_job_description_returns_expected_keys():
    """JD analyzer should return a dict with role, skills, requirements."""
    mock_response = {
        "role": "Python Developer",
        "skills": ["Python", "FastAPI"],
        "requirements": ["3+ years experience"],
        "seniority_level": "mid",
    }
    with patch("agents.jd_analyzer.AzureOpenAI") as mock_client_cls:
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client
        mock_completion = MagicMock()
        mock_completion.choices[0].message.content = '{"role":"Python Developer","skills":["Python","FastAPI"],"requirements":["3+ years experience"],"seniority_level":"mid"}'
        mock_client.chat.completions.create.return_value = mock_completion

        from agents.jd_analyzer import analyze_job_description
        result = analyze_job_description("We need a Python developer with FastAPI experience.")

    assert "role" in result
    assert "skills" in result


def test_analyze_job_description_fallback_on_error():
    """JD analyzer should return defaults on error."""
    with patch("agents.jd_analyzer.AzureOpenAI", side_effect=Exception("API Error")):
        from agents.jd_analyzer import analyze_job_description
        result = analyze_job_description("Some JD text")

    assert result["role"] == "Software Engineer"
    assert isinstance(result["skills"], list)

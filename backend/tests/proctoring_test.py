"""Tests for Proctoring Agent."""
import pytest
from agents.proctoring_agent import analyze_proctoring


def test_proctoring_clean_session():
    result = analyze_proctoring(events=[], test_metadata={})
    assert result["integrity_score"] == 100.0
    assert result["flagged"] is False


def test_proctoring_tab_switches():
    events = [{"type": "tab_switch"}, {"type": "tab_switch"}]
    result = analyze_proctoring(events=events)
    assert result["tab_switches"] == 2
    assert result["integrity_score"] < 100


def test_proctoring_flagged():
    events = [{"type": "copy_paste"} for _ in range(4)]
    result = analyze_proctoring(events=events)
    assert result["flagged"] is True

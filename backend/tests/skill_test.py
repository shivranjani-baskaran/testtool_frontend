"""Tests for Skill Weight agent."""
import pytest
from agents.skill_weight import compute_skill_weights


def test_compute_skill_weights_returns_dict():
    weights = compute_skill_weights(["Python", "SQL", "Docker"], "Backend Engineer")
    assert isinstance(weights, dict)
    assert len(weights) == 3


def test_compute_skill_weights_sums_to_100():
    weights = compute_skill_weights(["Python", "SQL"], "Engineer")
    total = sum(weights.values())
    assert abs(total - 100.0) < 0.5


def test_compute_skill_weights_empty_skills():
    weights = compute_skill_weights([], "Engineer")
    assert isinstance(weights, dict)
    assert len(weights) > 0

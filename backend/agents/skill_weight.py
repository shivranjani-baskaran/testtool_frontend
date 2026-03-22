"""
Skill Weight Agent
Determines the relative importance/weights of skills for question generation.
"""
import json
import logging
from typing import Dict, List

logger = logging.getLogger(__name__)


def compute_skill_weights(skills: List[str], role: str) -> Dict[str, float]:
    """
    Compute weights for each skill category based on role and skills.

    Attempts to use Azure OpenAI for intelligent weighting; falls back to
    equal distribution if the AI call fails or is not configured.

    Returns:
        dict mapping category name to weight percentage (values sum to 100).
    """
    if not skills:
        return {"Technical": 70.0, "Problem Solving": 20.0, "Communication": 10.0}

    # Try AI-powered weighting first
    try:
        weights = _ai_skill_weights(skills, role)
        if weights:
            return weights
    except Exception as exc:
        logger.warning("AI skill weighting failed, falling back to equal distribution: %s", exc)

    # Fallback: equal distribution normalised to 100
    return _equal_weights(skills)


def _ai_skill_weights(skills: List[str], role: str) -> Dict[str, float]:
    """
    Call Azure OpenAI to assign importance weights that sum to 100.
    Returns an empty dict if the call is unavailable or fails.
    """
    from agents.config import (
        AZURE_OPENAI_API_KEY,
        AZURE_OPENAI_ENDPOINT,
        AZURE_OPENAI_DEPLOYMENT,
        AZURE_OPENAI_API_VERSION,
    )

    if not AZURE_OPENAI_API_KEY or not AZURE_OPENAI_ENDPOINT:
        return {}

    from openai import AzureOpenAI

    client = AzureOpenAI(
        api_key=AZURE_OPENAI_API_KEY,
        azure_endpoint=AZURE_OPENAI_ENDPOINT,
        api_version=AZURE_OPENAI_API_VERSION,
    )

    skill_list = ", ".join(skills)
    prompt = (
        f"You are a technical hiring expert. For the role '{role}', assign importance weights "
        f"(as percentages that sum to exactly 100) to the following skills: {skill_list}. "
        "Return ONLY a valid JSON object mapping each skill name to its numeric weight, "
        "e.g. {\"Python\": 40.0, \"SQL\": 35.0, \"Docker\": 25.0}."
    )

    response = client.chat.completions.create(
        model=AZURE_OPENAI_DEPLOYMENT,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=256,
    )

    content = response.choices[0].message.content or ""
    # Extract JSON from the response
    start = content.find("{")
    end = content.rfind("}") + 1
    if start == -1 or end == 0:
        return {}

    raw = json.loads(content[start:end])
    weights: Dict[str, float] = {}
    for skill in skills:
        # Match case-insensitively
        matched = next((v for k, v in raw.items() if k.lower() == skill.lower()), None)
        weights[skill] = float(matched) if matched is not None else 0.0

    # Normalise to exactly 100
    total = sum(weights.values())
    if total > 0:
        weights = {k: round(v / total * 100, 1) for k, v in weights.items()}
    return weights


def _equal_weights(skills: List[str]) -> Dict[str, float]:
    """Return equal weights for each skill, normalised to 100."""
    per_skill = round(100.0 / len(skills), 1)
    weights: Dict[str, float] = {skill: per_skill for skill in skills}
    # Correct rounding drift on the last item
    total = sum(weights.values())
    if total != 100.0 and skills:
        last = skills[-1]
        weights[last] = round(weights[last] + (100.0 - total), 1)
    return weights

"""
Skill Weight Agent
Determines the relative importance/weights of skills for question generation.
"""
import logging
from typing import Dict, List

logger = logging.getLogger(__name__)


def compute_skill_weights(skills: List[str], role: str) -> Dict[str, float]:
    """
    Compute weights for each skill category based on role and skills.
    
    Returns:
        dict mapping category name to weight percentage (values sum to 100).
    """
    if not skills:
        return {"Technical": 70.0, "Problem Solving": 20.0, "Communication": 10.0}

    # Default distribution: technical skills get highest weight
    weights: Dict[str, float] = {}
    per_skill = round(80.0 / len(skills), 1)
    for skill in skills:
        weights[skill] = per_skill

    # Normalise to 100
    total = sum(weights.values())
    if total > 0:
        weights = {k: round(v / total * 100, 1) for k, v in weights.items()}

    return weights

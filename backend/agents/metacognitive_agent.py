"""
Metacognitive Agent
Analyses the relationship between candidate confidence levels and actual performance.
"""
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


def analyze_metacognition(
    responses: List[Dict[str, Any]],
    evaluated_responses: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Compute metacognitive metrics by comparing confidence levels to scores.
    
    Returns:
        dict with confidence_accuracy, overconfidence_count, underconfidence_count,
        calibration_score, and per-question breakdown.
    """
    overconfident = 0
    underconfident = 0
    accurate = 0
    total = 0

    for resp in responses:
        qid = str(resp.get("question_id", ""))
        confidence = (resp.get("confidence") or "medium").lower()
        eval_resp = next(
            (e for e in evaluated_responses if str(e.get("question_id", "")) == qid),
            None,
        )
        if eval_resp is None:
            continue

        max_score = eval_resp.get("max_score", 10) or 10
        score_pct = eval_resp.get("score", 0) / max_score

        conf_level = {"low": 0.33, "medium": 0.66, "high": 1.0}.get(confidence, 0.66)

        total += 1
        diff = conf_level - score_pct
        if diff > 0.33:
            overconfident += 1
        elif diff < -0.33:
            underconfident += 1
        else:
            accurate += 1

    calibration_score = round((accurate / total * 100), 1) if total > 0 else 0

    return {
        "confidence_accuracy": calibration_score,
        "overconfidence_count": overconfident,
        "underconfidence_count": underconfident,
        "calibration_score": calibration_score,
        "total_assessed": total,
    }

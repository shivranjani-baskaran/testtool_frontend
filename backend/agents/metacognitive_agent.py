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
        calibration_score, guessing_count, struggle_count, meta_score,
        behavioral_insights, and per-question breakdown.
    """
    overconfident = 0
    underconfident = 0
    accurate = 0
    total = 0
    guessing_count = 0
    struggle_count = 0
    behavioral_insights: List[str] = []

    for resp in responses:
        qid = str(resp.get("question_id", ""))
        confidence = (resp.get("confidence") or "medium").lower()
        time_taken = resp.get("time_taken") or 0
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

        # Guessing detection: answered very fast with low score
        if time_taken < 15 and score_pct < 0.4:
            guessing_count += 1

        # Struggle detection: took a long time but still scored poorly
        if time_taken > 120 and score_pct < 0.5:
            struggle_count += 1

    calibration_score = round((accurate / total * 100), 1) if total > 0 else 0

    # Compute meta_score (0-100)
    meta_score = calibration_score * 0.6
    if guessing_count == 0:
        meta_score += 20
    if struggle_count <= 1:
        meta_score += 20
    meta_score = round(min(meta_score, 100), 1)

    # Build behavioural insights
    if overconfident > 2:
        behavioral_insights.append(
            f"High overconfidence detected in {overconfident} question(s): candidate rates "
            "themselves higher than their actual performance."
        )
    if underconfident > 2:
        behavioral_insights.append(
            f"Underconfidence detected in {underconfident} question(s): candidate may be "
            "underselling their abilities."
        )
    if guessing_count > 0:
        behavioral_insights.append(
            f"Possible guessing detected in {guessing_count} question(s) (answered very quickly "
            "with low score)."
        )
    if struggle_count > 1:
        behavioral_insights.append(
            f"Struggle pattern detected in {struggle_count} question(s) (long time taken "
            "with below-average score)."
        )
    # Filter out any None values that may slip in
    behavioral_insights = [i for i in behavioral_insights if i]

    return {
        "confidence_accuracy": calibration_score,
        "overconfidence_count": overconfident,
        "underconfidence_count": underconfident,
        "calibration_score": calibration_score,
        "total_assessed": total,
        "guessing_count": guessing_count,
        "struggle_count": struggle_count,
        "meta_score": meta_score,
        "behavioral_insights": behavioral_insights,
    }

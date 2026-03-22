"""
Report Agent
Compiles all evaluation data into a comprehensive candidate report.
"""
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)


def generate_report(
    candidate_id: str,
    judge_result: Dict[str, Any],
    metacognitive_result: Dict[str, Any],
    proctoring_result: Dict[str, Any],
    questions: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Combine outputs from judge, metacognitive, and proctoring agents into a final report.
    """
    total_score = judge_result.get("total_score", 0)
    max_score = judge_result.get("max_score", 100)
    percentage = judge_result.get("percentage", 0)

    # Compute grade
    grade = _compute_grade(percentage)

    # Compute risk level
    if proctoring_result.get("flagged"):
        risk_level = "high"
    elif metacognitive_result.get("overconfidence_count", 0) > 2:
        risk_level = "medium"
    else:
        risk_level = "low"

    # Compute hire decision (string label)
    if percentage >= 70 and risk_level == "low":
        hire_decision = "Hire"
    elif percentage >= 50:
        hire_decision = "Review"
    else:
        hire_decision = "Reject"

    # Strengths / weaknesses from category scores
    category_scores = judge_result.get("category_scores", {})
    strengths = [cat for cat, score in category_scores.items() if score >= 70]
    weaknesses = [cat for cat, score in category_scores.items() if score < 50]

    recommendations = []
    if weaknesses:
        recommendations.append(f"Candidate should improve on: {', '.join(weaknesses)}.")
    if proctoring_result.get("flagged"):
        recommendations.append("Integrity concerns detected — recommend a follow-up interview.")
    if metacognitive_result.get("overconfidence_count", 0) > 2:
        recommendations.append("Candidate shows signs of overconfidence in self-assessment.")

    # Generate summary text
    summary = (
        f"Candidate scored {percentage:.1f}% overall (grade {grade}). "
        f"Hire decision: {hire_decision}. Risk level: {risk_level}. "
        f"Strengths: {', '.join(strengths) if strengths else 'None identified'}. "
        f"Areas for improvement: {', '.join(weaknesses) if weaknesses else 'None identified'}."
    )

    return {
        "candidate_id": candidate_id,
        "total_score": total_score,
        "max_score": max_score,
        "percentage": percentage,
        "final_score": percentage,
        "grade": grade,
        "hire_decision": hire_decision,
        "risk_level": risk_level,
        "summary": summary,
        "category_scores": category_scores,
        "evaluated_responses": judge_result.get("evaluated_responses", []),
        "metacognitive_analysis": metacognitive_result,
        "proctoring_summary": proctoring_result,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "recommendations": recommendations,
    }


def _compute_grade(percentage: float) -> str:
    if percentage >= 90:
        return "A"
    if percentage >= 80:
        return "B"
    if percentage >= 70:
        return "C"
    if percentage >= 60:
        return "D"
    return "F"

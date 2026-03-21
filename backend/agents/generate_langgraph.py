"""
Question Generation LangGraph Workflow
Orchestrates JD analysis → skill weighting → question generation.
"""
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)


def run_generate_workflow(job_description: str) -> Dict[str, Any]:
    """
    Run the full question generation workflow.
    
    1. Analyze the job description
    2. Compute skill weights
    3. Generate questions
    
    Returns the complete test payload (role, skills, weights, questions).
    """
    from agents.jd_analyzer import analyze_job_description
    from agents.skill_weight import compute_skill_weights
    from agents.question_generator import generate_questions

    logger.info("Starting question generation workflow.")

    # Step 1: Analyze JD
    jd_analysis = analyze_job_description(job_description)
    role = jd_analysis.get("role", "Software Engineer")
    skills = jd_analysis.get("skills", [])
    logger.info("JD analysis complete: role=%s, skills=%s", role, skills)

    # Step 2: Compute weights
    weights = compute_skill_weights(skills, role)
    logger.info("Skill weights computed: %s", weights)

    # Step 3: Generate questions
    questions = generate_questions(role=role, skills=skills, weights=weights)
    logger.info("Generated %d questions.", len(questions))

    return {
        "role": role,
        "skills": skills,
        "weights": weights,
        "questions": questions,
    }

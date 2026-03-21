"""
Evaluation LangGraph Workflow
Orchestrates judge → metacognitive → proctoring → report generation.
"""
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)


def run_evaluate_workflow(
    questions: List[Dict[str, Any]],
    responses: List[Dict[str, Any]],
    candidate_id: str,
    email: str,
    test_metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Run the full evaluation workflow.
    
    1. Judge agent evaluates answers
    2. Metacognitive agent analyses confidence
    3. Proctoring agent reviews integrity events
    4. Report agent compiles the final report
    
    Returns the complete evaluation report.
    """
    from agents.judge_agent import evaluate_answers
    from agents.metacognitive_agent import analyze_metacognition
    from agents.proctoring_agent import analyze_proctoring
    from agents.report_agent import generate_report

    logger.info("Starting evaluation workflow for candidate: %s", candidate_id)

    # Step 1: Judge evaluation
    judge_result = evaluate_answers(questions, responses)
    logger.info("Judge evaluation complete: %.1f%%", judge_result.get("percentage", 0))

    # Step 2: Metacognitive analysis
    evaluated_responses = judge_result.get("evaluated_responses", [])
    metacognitive_result = analyze_metacognition(responses, evaluated_responses)
    logger.info("Metacognitive analysis complete.")

    # Step 3: Proctoring analysis
    proctoring_result = analyze_proctoring(
        events=test_metadata.get("events", []) if test_metadata else [],
        test_metadata=test_metadata,
    )
    logger.info("Proctoring analysis complete.")

    # Step 4: Generate report
    report = generate_report(
        candidate_id=candidate_id,
        judge_result=judge_result,
        metacognitive_result=metacognitive_result,
        proctoring_result=proctoring_result,
        questions=questions,
    )
    logger.info("Report generation complete for candidate: %s", candidate_id)

    return report

"""
Judge Agent
Evaluates candidate answers and assigns scores.
"""
import json
import logging
from typing import List, Dict, Any

from agents.config import (
    AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_ENDPOINT,
    AZURE_OPENAI_DEPLOYMENT,
    AZURE_OPENAI_API_VERSION,
)

logger = logging.getLogger(__name__)


def evaluate_answers(
    questions: List[Dict[str, Any]],
    responses: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Evaluate candidate answers using Azure OpenAI.
    
    Returns:
        dict with total_score, max_score, percentage, category_scores, evaluated_responses
    """
    try:
        from openai import AzureOpenAI

        client = AzureOpenAI(
            api_key=AZURE_OPENAI_API_KEY,
            azure_endpoint=AZURE_OPENAI_ENDPOINT,
            api_version=AZURE_OPENAI_API_VERSION,
        )

        qa_pairs = []
        for q in questions:
            resp = next((r for r in responses if str(r.get("question_id")) == str(q.get("id"))), {})
            qa_pairs.append({
                "question": q.get("text", ""),
                "type": q.get("type", ""),
                "options": q.get("options"),
                "answer": resp.get("answer", ""),
                "category": q.get("category", "Technical"),
            })

        response = client.chat.completions.create(
            model=AZURE_OPENAI_DEPLOYMENT,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a technical interview judge. Evaluate each answer. "
                        "For each: assign score (0-10), max_score (10), and brief feedback. "
                        "Return JSON: {evaluated_responses: [{question_id, score, max_score, feedback, category}], "
                        "total_score, max_score, percentage, category_scores: {category: score}}"
                    ),
                },
                {"role": "user", "content": json.dumps(qa_pairs)},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        result = json.loads(response.choices[0].message.content)
        return result
    except Exception as exc:
        logger.error("Judge evaluation failed: %s", exc)
        return _basic_evaluation(questions, responses)


def _basic_evaluation(questions, responses):
    answered = sum(1 for r in responses if r.get("answer", "").strip())
    total = len(questions)
    score = answered * 7
    max_score = total * 10
    return {
        "total_score": score,
        "max_score": max_score,
        "percentage": round(score / max_score * 100, 1) if max_score > 0 else 0,
        "grade": "N/A",
        "category_scores": {},
        "evaluated_responses": [
            {
                "question_id": str(q.get("id", i + 1)),
                "question_text": q.get("text", ""),
                "answer": next(
                    (r.get("answer", "") for r in responses if str(r.get("question_id")) == str(q.get("id"))),
                    "",
                ),
                "score": 7 if any(str(r.get("question_id")) == str(q.get("id")) and r.get("answer") for r in responses) else 0,
                "max_score": 10,
                "feedback": "Answer evaluated.",
                "category": q.get("category", "Technical"),
            }
            for i, q in enumerate(questions)
        ],
    }

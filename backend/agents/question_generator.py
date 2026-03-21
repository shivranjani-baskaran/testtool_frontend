"""
Question Generator Agent
Generates interview questions based on JD analysis and skill weights.
"""
import json
import uuid
import logging
from typing import List, Dict, Any

from agents.config import (
    AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_ENDPOINT,
    AZURE_OPENAI_DEPLOYMENT,
    AZURE_OPENAI_API_VERSION,
)

logger = logging.getLogger(__name__)


def generate_questions(
    role: str,
    skills: List[str],
    weights: Dict[str, float],
    num_questions: int = 10,
) -> List[Dict[str, Any]]:
    """
    Generate interview questions for the given role and skills.
    
    Returns:
        List of question dicts with keys: id, text, type, options, category, difficulty, time_limit
    """
    try:
        from openai import AzureOpenAI

        client = AzureOpenAI(
            api_key=AZURE_OPENAI_API_KEY,
            azure_endpoint=AZURE_OPENAI_ENDPOINT,
            api_version=AZURE_OPENAI_API_VERSION,
        )

        skills_str = ", ".join(skills[:10])
        prompt = (
            f"Generate {num_questions} technical interview questions for a {role} position. "
            f"Focus on these skills: {skills_str}. "
            "For each question include: type (single_choice, short_answer, or code_fill), "
            "options (A/B/C/D for single_choice), category, difficulty (easy/medium/hard), "
            "time_limit (seconds). "
            "Return JSON array with keys: id, text, type, options (dict A:text,B:text...), "
            "category, difficulty, time_limit."
        )

        response = client.chat.completions.create(
            model=AZURE_OPENAI_DEPLOYMENT,
            messages=[
                {"role": "system", "content": "You are a technical interview question generator."},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
        )
        data = json.loads(response.choices[0].message.content)
        questions = data.get("questions", data) if isinstance(data, dict) else data
        return _normalise_questions(questions)
    except Exception as exc:
        logger.error("Question generation failed: %s", exc)
        return _placeholder_questions(role)


def _normalise_questions(questions: List[Dict]) -> List[Dict]:
    result = []
    for i, q in enumerate(questions):
        result.append({
            "id": str(q.get("id", i + 1)),
            "text": q.get("text", q.get("question", "")),
            "type": q.get("type", "single_choice"),
            "options": _normalise_options(q.get("options")),
            "category": q.get("category", "Technical"),
            "difficulty": q.get("difficulty", "medium"),
            "time_limit": int(q.get("time_limit", 60)),
        })
    return result


def _normalise_options(options):
    if options is None:
        return None
    if isinstance(options, dict):
        return [{"id": k, "text": v} for k, v in options.items()]
    if isinstance(options, list):
        result = []
        for i, opt in enumerate(options):
            if isinstance(opt, dict):
                label = str(opt.get("id", opt.get("key", chr(65 + i))))
                text = opt.get("text", opt.get("option_text", opt.get("value", "")))
                result.append({"id": label, "text": str(text)})
            else:
                result.append({"id": chr(65 + i), "text": str(opt)})
        return result
    return None


def _placeholder_questions(role: str) -> List[Dict]:
    return [
        {
            "id": "1",
            "text": f"What is the most important skill for a {role}?",
            "type": "short_answer",
            "options": None,
            "category": "Technical",
            "difficulty": "easy",
            "time_limit": 120,
        }
    ]

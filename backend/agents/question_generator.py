"""
Question Generator Agent
Generates interview questions based on JD analysis and skill weights.

This module is designed to be frontend-friendly (React types) and stable:
- Always returns a list of 10 questions
- Enforces type distribution: 4 single_choice, 3 multiple_choice, 3 code_fill
- Deduplicates similar questions and regenerates once if needed
- Does NOT include answers or correct options
"""

import json
import logging
import re
from difflib import SequenceMatcher
from typing import Any, Dict, List, Optional

from agents.config import (
    AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_ENDPOINT,
    AZURE_OPENAI_DEPLOYMENT,
    AZURE_OPENAI_API_VERSION,
)

logger = logging.getLogger(__name__)

# Option A distribution
DISTRIBUTION: Dict[str, int] = {
    "single_choice": 4,
    "multiple_choice": 3,
    "code_fill": 3,
}

MODEL_TEMPERATURE_PRIMARY = 0.6
MODEL_TEMPERATURE_REGEN = 0.7


def _is_similar(q1: str, q2: str, threshold: float = 0.8) -> bool:
    return SequenceMatcher(None, q1.lower(), q2.lower()).ratio() > threshold


def _safe_json_load(content: str) -> List[Dict[str, Any]]:
    """
    Attempts to parse a JSON array from the model response.
    The model is instructed to return ONLY a JSON array, but we still harden parsing.
    """
    try:
        data = json.loads(content)
        return data if isinstance(data, list) else []
    except Exception:
        try:
            match = re.search(r"\[.*\]", content, re.DOTALL)
            if not match:
                return []
            json_str = match.group()
            data = json.loads(json_str)
            return data if isinstance(data, list) else []
        except Exception:
            return []


def _validate_questions(questions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    validated: List[Dict[str, Any]] = []

    for q in questions:
        if not isinstance(q, dict):
            continue

        if "question" not in q and "text" not in q:
            continue

        # Support both keys; normalize to internal 'question' for dedup stage
        if "question" not in q and "text" in q:
            q["question"] = q.get("text", "")

        q.setdefault("type", "single_choice")
        q.setdefault("options", [])
        q.setdefault("difficulty", "medium")

        validated.append(q)

    return validated


def _remove_duplicates(questions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    unique: List[Dict[str, Any]] = []

    for q in questions:
        q_text = str(q.get("question", "") or "")
        if not q_text:
            continue

        if not any(_is_similar(q_text, str(u.get("question", ""))) for u in unique):
            unique.append(q)

    return unique


def _normalize_to_frontend_schema(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Convert internal question dicts to the frontend's expected structure.

    Frontend expects:
      - id: string
      - text: string
      - type: single_choice | multiple_choice | code_fill | short_answer
      - options?: [{id, text}] (for choice types)
      - code_snippet?/placeholder? for code_fill
      - time_limit?: number
      - category?/difficulty?
    """

    normalized: List[Dict[str, Any]] = []
    for i, q in enumerate(items):
        qtype = str(q.get("type", "single_choice")).strip().lower()
        if qtype == "multi_select":
            qtype = "multiple_choice"

        # text
        text = str(q.get("question") or q.get("text") or "").strip()
        if not text:
            continue

        out: Dict[str, Any] = {
            "id": str(i + 1),
            "text": text,
            "type": qtype,
            "difficulty": str(q.get("difficulty", "medium")),
            "category": str(q.get("category", "Technical")),
            "time_limit": int(q.get("time_limit", 60) or 60),
        }

        # options
        if qtype in {"single_choice", "multiple_choice"}:
            opts = q.get("options", [])
            if isinstance(opts, dict):
                # {"A": "...", ...}
                out["options"] = [{"id": k, "text": str(v)} for k, v in opts.items()]
            elif isinstance(opts, list):
                # ["...", ...] or [{id,text}, ...]
                norm_opts: List[Dict[str, str]] = []
                for j, opt in enumerate(opts):
                    if isinstance(opt, dict):
                        oid = str(opt.get("id") or opt.get("key") or chr(65 + j))
                        otext = str(opt.get("text") or opt.get("option_text") or opt.get("value") or "")
                        norm_opts.append({"id": oid, "text": otext})
                    else:
                        norm_opts.append({"id": chr(65 + j), "text": str(opt)})
                out["options"] = norm_opts

        # code_fill extras
        if qtype == "code_fill":
            code = q.get("code_template") or q.get("code_snippet") or q.get("code")
            if code is not None:
                out["code_snippet"] = str(code)
            out["placeholder"] = str(q.get("placeholder") or "Type your code here...")

        normalized.append(out)

    return normalized


def _pick_by_distribution(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    buckets: Dict[str, List[Dict[str, Any]]] = {k: [] for k in DISTRIBUTION.keys()}
    for q in items:
        t = str(q.get("type", "")).lower().strip()
        if t == "multi_select":
            t = "multiple_choice"
        if t in buckets:
            buckets[t].append(q)

    final: List[Dict[str, Any]] = []
    for t, count in DISTRIBUTION.items():
        final.extend(buckets.get(t, [])[:count])

    # If model didn't respect types, fill remaining from anything else
    if len(final) < 10:
        for q in items:
            if len(final) >= 10:
                break
            if q not in final:
                final.append(q)

    return final[:10]


def generate_questions(
    role: str,
    skills: List[str],
    weights: Dict[str, float],
    num_questions: int = 10,
    candidate_level: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Repo entrypoint used by agents/generate_langgraph.py.

    NOTE: num_questions is kept for compatibility, but this agent enforces 10 questions
    following Option A distribution (4/3/3).
    """

    # Sanitize inputs
    role = (role or "").replace("\x00", "")
    skills = [(s or "").replace("\x00", "") for s in skills]

    try:
        from openai import AzureOpenAI

        client = AzureOpenAI(
            api_key=AZURE_OPENAI_API_KEY,
            azure_endpoint=AZURE_OPENAI_ENDPOINT,
            api_version=AZURE_OPENAI_API_VERSION,
        )

        skills_str = ", ".join(skills[:10])

        prompt = f"""
Generate 10 UNIQUE technical interview questions for a {role} position.

Skills/weights to focus on (prioritize higher weights):
{weights}

Focus skills: {skills_str}

Types distribution (MUST FOLLOW EXACTLY):
- 4 single_choice
- 3 multiple_choice
- 3 code_fill

STRICT RULES:
- DO NOT include answers
- DO NOT include correct options
- Only generate questions
- Ensure no duplicates
- Keep questions clear and concise

Return ONLY JSON array (no markdown, no extra keys, no explanations):
[
  {{
    "type": "single_choice",
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "difficulty": "easy",
    "category": "Technical",
    "time_limit": 60
  }},
  {{
    "type": "multiple_choice",
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "difficulty": "medium",
    "category": "Technical",
    "time_limit": 60
  }},
  {{
    "type": "code_fill",
    "question": "Fill missing code...",
    "code_template": "def add(a, b):\\n    return ___",
    "difficulty": "easy",
    "category": "Technical",
    "time_limit": 180
  }}
]
"""

        response = client.chat.completions.create(
            model=AZURE_OPENAI_DEPLOYMENT,
            messages=[
                {"role": "system", "content": "You are a strict technical interviewer. Ensure NO duplicates."},
                {"role": "user", "content": prompt},
            ],
            temperature=MODEL_TEMPERATURE_PRIMARY,
        )

        content = response.choices[0].message.content or ""
        questions = _safe_json_load(content)
        questions = _validate_questions(questions)
        unique = _remove_duplicates(questions)

        # One-time regeneration if insufficient uniques
        if len(unique) < 10:
            extra_response = client.chat.completions.create(
                model=AZURE_OPENAI_DEPLOYMENT,
                messages=[
                    {"role": "system", "content": "Generate DIFFERENT questions than before. No duplicates."},
                    {"role": "user", "content": prompt},
                ],
                temperature=MODEL_TEMPERATURE_REGEN,
            )

            extra_content = extra_response.choices[0].message.content or ""
            extra_questions = _safe_json_load(extra_content)
            extra_questions = _validate_questions(extra_questions)

            for q in extra_questions:
                if len(unique) >= 10:
                    break
                if not any(_is_similar(str(q.get("question", "")), str(u.get("question", ""))) for u in unique):
                    unique.append(q)

        # Enforce distribution then normalize for frontend
        picked = _pick_by_distribution(unique)
        final_questions = _normalize_to_frontend_schema(picked)

        # Ensure exactly 10
        final_questions = final_questions[:10]
        for i, q in enumerate(final_questions):
            q["id"] = str(i + 1)

        logger.info("Final Questions Count: %d", len(final_questions))
        return final_questions

    except Exception as exc:
        logger.error("Question generation failed: %s", exc)
        return _placeholder_questions(role)


def _placeholder_questions(role: str) -> List[Dict[str, Any]]:
    return [
        {
            "id": "1",
            "text": f"What is the most important skill for a {role}?",
            "type": "short_answer",
            "options": None,
            "category": "Technical",
            "difficulty": "easy",
            "time_limit": 120,
            "placeholder": "Type your answer here...",
        }
    ]

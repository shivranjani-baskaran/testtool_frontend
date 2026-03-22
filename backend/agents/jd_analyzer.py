"""
JD Analyzer Agent
Analyzes job descriptions to extract skills, requirements, and role information.
"""
import logging
from typing import Dict, Any
from agents.config import (
    AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_ENDPOINT,
    AZURE_OPENAI_DEPLOYMENT,
    AZURE_OPENAI_API_VERSION,
)

logger = logging.getLogger(__name__)


def _sanitize_text(text: str) -> str:
    """
    Detect and handle binary content (e.g. raw .docx bytes read as text).
    If the text starts with 'PK' (ZIP/DOCX magic bytes) or contains NUL bytes,
    attempt to parse it with python-docx; otherwise strip non-printable characters.
    """
    if "\x00" not in text and not text.startswith("PK"):
        return text

    # Try to parse as a .docx document
    try:
        import io
        import docx

        raw_bytes = text.encode("latin-1", errors="replace")
        doc = docx.Document(io.BytesIO(raw_bytes))
        extracted = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
        if extracted.strip():
            return extracted
    except Exception:
        pass

    # Fallback: strip NUL and other non-printable characters
    return "".join(ch for ch in text if ch >= " " or ch in "\n\r\t")


def analyze_job_description(job_description: str) -> Dict[str, Any]:
    """
    Analyze a job description and return extracted skills, role, and requirements.
    
    Returns:
        dict with keys: role, skills, requirements, seniority_level
    """
    job_description = _sanitize_text(job_description)

    try:
        from openai import AzureOpenAI

        client = AzureOpenAI(
            api_key=AZURE_OPENAI_API_KEY,
            azure_endpoint=AZURE_OPENAI_ENDPOINT,
            api_version=AZURE_OPENAI_API_VERSION,
        )

        response = client.chat.completions.create(
            model=AZURE_OPENAI_DEPLOYMENT,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a technical recruiter. Analyze the job description and extract: "
                        "role title, required skills (as a list), key requirements, and seniority level. "
                        "Return JSON with keys: role, skills (list), requirements (list), seniority_level."
                    ),
                },
                {"role": "user", "content": job_description},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
        )
        import json
        return json.loads(response.choices[0].message.content)
    except Exception as exc:
        logger.error("JD analysis failed: %s", exc)
        return {
            "role": "Software Engineer",
            "skills": ["Python", "Problem Solving"],
            "requirements": [],
            "seniority_level": "mid",
        }

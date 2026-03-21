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


def analyze_job_description(job_description: str) -> Dict[str, Any]:
    """
    Analyze a job description and return extracted skills, role, and requirements.
    
    Returns:
        dict with keys: role, skills, requirements, seniority_level
    """
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

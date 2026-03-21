"""
Proctoring Agent
Analyses proctoring events and computes an integrity score.
"""
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)


def analyze_proctoring(
    events: Optional[List[Dict[str, Any]]] = None,
    test_metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Analyse proctoring data and return a summary with an integrity score.
    """
    events = events or []
    metadata = test_metadata or {}

    tab_switches = metadata.get("tab_switches", 0) + sum(
        1 for e in events if e.get("type") == "tab_switch"
    )
    copy_paste = metadata.get("copy_paste_attempts", 0) + sum(
        1 for e in events if e.get("type") == "copy_paste"
    )
    no_face = sum(1 for e in events if e.get("type") == "no_face")
    total_events = len(events)

    # Simple scoring: start at 100, deduct for violations
    score = 100.0
    score -= min(tab_switches * 5, 25)
    score -= min(copy_paste * 10, 30)
    score -= min(no_face * 3, 15)
    score = max(score, 0.0)

    return {
        "tab_switches": tab_switches,
        "copy_paste_attempts": copy_paste,
        "no_face_count": no_face,
        "total_events": total_events,
        "integrity_score": round(score, 1),
        "flagged": score < 70,
    }

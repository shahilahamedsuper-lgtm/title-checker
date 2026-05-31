import json

from app.models.schemas import AIServiceError, AITimeoutError, AnalysisResult
from app.services.anthropic_client import call_anthropic


async def analyze_text(title: str, text: str) -> AnalysisResult:
    """
    Sends a structured prompt to Claude and returns a parsed AnalysisResult.
    Raises AITimeoutError on timeout, AIServiceError on provider error.
    """
    system = (
        "You are a content analysis assistant. "
        "When given a title and body text, you return a JSON object with exactly these fields:\n"
        '- "meaning": a concise summary of the content\'s meaning (string)\n'
        '- "tone": the overall tone classification (string, e.g. "formal", "casual", "persuasive")\n'
        '- "clarity_score": an integer from 0 to 100 indicating clarity\n'
        '- "suggestions": a list of 1 to 5 strings with improvement suggestions\n\n'
        "Return ONLY valid JSON — no markdown fences, no extra text."
    )

    user_message = f"Title: {title}\n\nContent:\n{text}"

    raw = await call_anthropic(
        messages=[{"role": "user", "content": user_message}],
        system=system,
        temperature=0.3,
    )

    try:
        # Strip markdown code fences if Claude wraps the JSON
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
            cleaned = cleaned.strip()
        result_dict = json.loads(cleaned)
        return AnalysisResult(**result_dict)
    except Exception as exc:
        raise AIServiceError(f"Failed to parse AI response as AnalysisResult: {exc}") from exc

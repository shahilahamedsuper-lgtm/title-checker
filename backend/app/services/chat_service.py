from __future__ import annotations

from app.models.schemas import ChatMessage
from app.services.anthropic_client import call_anthropic

MAX_CONTEXT_CHARS = 12_000


def build_prompt(
    message: str,
    file_context: str,
    conversation_history: list[ChatMessage],
) -> tuple[str, list[dict]]:
    """
    Build the system prompt and messages array for the Anthropic API.
    Truncates file_context to MAX_CONTEXT_CHARS characters.

    Returns:
        (system_prompt, messages_list)
    """
    truncated = file_context[:MAX_CONTEXT_CHARS]
    system = (
        "You are a helpful assistant. Answer questions based only on the following document. "
        "If the answer is not in the document, say so clearly.\n\n"
        "DOCUMENT:\n" + truncated
    )

    messages: list[dict] = []
    for turn in conversation_history:
        messages.append({"role": turn.role, "content": turn.content})
    messages.append({"role": "user", "content": message})

    return system, messages


async def chat(
    message: str,
    file_context: str,
    conversation_history: list[ChatMessage],
) -> str:
    """
    Call Claude and return the answer string.
    Raises AITimeoutError on timeout, AIServiceError on provider error.
    """
    system, messages = build_prompt(message, file_context, conversation_history)
    return await call_anthropic(messages=messages, system=system, temperature=0.5)

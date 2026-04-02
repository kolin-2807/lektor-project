import json
import os
from contextlib import contextmanager

from django.conf import settings
from google import genai


BROKEN_LOCAL_PROXY_MARKERS = ("127.0.0.1:9", "localhost:9")


@contextmanager
def _bypass_broken_local_proxy():
    removed_values = {}

    for key in ("HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"):
        value = os.environ.get(key)
        if value and any(marker in value for marker in BROKEN_LOCAL_PROXY_MARKERS):
            removed_values[key] = value
            os.environ.pop(key, None)

    try:
        yield
    finally:
        for key, value in removed_values.items():
            os.environ[key] = value


def generate_test_from_text(text: str, language: str = "kaz", question_count: int = 5) -> list:
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY tabylmady")

    is_russian = language == "rus"
    safe_question_count = max(3, min(int(question_count or 5), 25))
    target_language = "Russian" if is_russian else "Kazakh"

    prompt = f"""
You generate multiple-choice tests for a university teacher.

Create exactly {safe_question_count} questions based only on the material below.
Return only valid JSON. Do not add markdown, explanations, or extra text.

Required JSON format:
[
  {{
    "question": "Question text",
    "options": ["A", "B", "C", "D"],
    "answer": "A"
  }}
]

Rules:
- Exactly {safe_question_count} questions
- Exactly 4 answer options per question
- All questions and options must be in {target_language}
- Questions must stay tightly connected to the provided material
- The correct answer must match one of the 4 options through the answer letter
- Return a JSON array only

Material:
{text}
"""

    with _bypass_broken_local_proxy():
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

    cleaned_text = (response.text or "").strip()

    if cleaned_text.startswith("```json"):
        cleaned_text = cleaned_text.replace("```json", "", 1).strip()

    if cleaned_text.startswith("```"):
        cleaned_text = cleaned_text.replace("```", "", 1).strip()

    if cleaned_text.endswith("```"):
        cleaned_text = cleaned_text[:-3].strip()

    return json.loads(cleaned_text)

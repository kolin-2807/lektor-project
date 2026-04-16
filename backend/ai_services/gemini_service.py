import json
import logging
import os
import random
import re
import time
from contextlib import contextmanager

from django.conf import settings
import requests

try:
    from google import genai
except ImportError:  # pragma: no cover - optional dependency in some environments
    genai = None


BROKEN_LOCAL_PROXY_MARKERS = ("127.0.0.1:9", "localhost:9")
ANSWER_LETTERS = ("A", "B", "C", "D")
GEMINI_MODEL_NAME = (os.getenv("GEMINI_MODEL_NAME", "gemini-2.5-flash") or "gemini-2.5-flash").strip()
GEMINI_FALLBACK_MODELS = tuple(
    item.strip()
    for item in os.getenv("GEMINI_FALLBACK_MODELS", "").split(",")
    if item.strip()
)
GEMINI_RETRY_DELAYS = (2, 4, 8, 12)
GEMINI_QUOTA_ERROR_MARKERS = (
    "quota",
    "resource_exhausted",
    "quota exceeded",
    "insufficient quota",
    "billing",
)
GEMINI_RATE_LIMIT_MARKERS = (
    "429",
    "rate limit",
    "too many requests",
)
GEMINI_SERVICE_BUSY_MARKERS = (
    "500",
    "503",
    "unavailable",
    "high demand",
    "overloaded",
    "temporarily unavailable",
    "internal error",
)
GEMINI_TIMEOUT_MARKERS = (
    "timed out",
    "timeout",
    "deadline exceeded",
    "connection aborted",
    "connection reset",
)
GEMINI_AUTH_ERROR_MARKERS = (
    "401",
    "403",
    "api key not valid",
    "invalid api key",
    "permission denied",
    "forbidden",
    "unauthorized",
    "authentication",
    "credentials",
)
GEMINI_MODEL_ERROR_MARKERS = (
    "404",
    "model not found",
    "not found for api version",
    "unsupported model",
    "unknown model",
)
GEMINI_TRANSIENT_ERROR_MARKERS = (
    *GEMINI_RATE_LIMIT_MARKERS,
    *GEMINI_SERVICE_BUSY_MARKERS,
    *GEMINI_TIMEOUT_MARKERS,
)
logger = logging.getLogger(__name__)


class GeminiServiceError(RuntimeError):
    def __init__(
        self,
        message: str,
        *,
        code: str = "gemini_error",
        http_status: int = 503,
        retryable: bool = False,
        retry_after_seconds: int | None = None,
        raw_message: str = "",
        model_name: str = "",
    ):
        super().__init__(message)
        self.code = code
        self.http_status = http_status
        self.retryable = retryable
        self.retry_after_seconds = retry_after_seconds
        self.raw_message = raw_message or message
        self.model_name = model_name


def _extract_gemini_error_text(exc: Exception) -> str:
    chunks = []

    def _append(value):
        normalized = " ".join(str(value or "").split()).strip()
        if normalized and normalized not in chunks:
            chunks.append(normalized)

    _append(exc)
    _append(getattr(exc, "message", ""))
    _append(getattr(exc, "details", ""))

    response = getattr(exc, "response", None)
    if response is not None:
        try:
            payload = response.json()
        except Exception:
            payload = None

        if isinstance(payload, dict):
            error_payload = payload.get("error") or {}
            _append(error_payload.get("message"))
            _append(error_payload.get("status"))
            for item in error_payload.get("details") or []:
                if isinstance(item, dict):
                    _append(item.get("reason"))
                    _append(item.get("message"))
        _append(getattr(response, "text", ""))

    return " | ".join(chunks).strip()


def _extract_gemini_status_code(exc: Exception) -> int | None:
    candidates = (
        getattr(exc, "status_code", None),
        getattr(exc, "code", None),
        getattr(getattr(exc, "response", None), "status_code", None),
    )

    for candidate in candidates:
        try:
            parsed = int(candidate)
        except (TypeError, ValueError):
            continue
        if parsed > 0:
            return parsed

    return None


def _build_gemini_service_error(exc: Exception, model_name: str = "") -> GeminiServiceError:
    status_code = _extract_gemini_status_code(exc)
    raw_message = _extract_gemini_error_text(exc) or "Gemini response failed."
    error_text = raw_message.lower()

    if status_code in {401, 403} or any(marker in error_text for marker in GEMINI_AUTH_ERROR_MARKERS):
        return GeminiServiceError(
            "Gemini API authorization failed. Check GEMINI_API_KEY and project access.",
            code="gemini_auth_error",
            http_status=503,
            raw_message=raw_message,
            model_name=model_name,
        )

    if status_code == 404 or any(marker in error_text for marker in GEMINI_MODEL_ERROR_MARKERS):
        model_hint = f' Model "{model_name}" is unavailable.' if model_name else ""
        return GeminiServiceError(
            f"Gemini model configuration failed.{model_hint} Check GEMINI_MODEL_NAME or fallback models.",
            code="gemini_model_error",
            http_status=503,
            raw_message=raw_message,
            model_name=model_name,
        )

    if any(marker in error_text for marker in GEMINI_QUOTA_ERROR_MARKERS):
        return GeminiServiceError(
            "Gemini API quota is exhausted right now. Please retry in a few minutes or increase the API quota/billing limit.",
            code="gemini_quota_exceeded",
            http_status=429,
            retry_after_seconds=120,
            raw_message=raw_message,
            model_name=model_name,
        )

    if status_code == 429 or any(marker in error_text for marker in GEMINI_RATE_LIMIT_MARKERS):
        return GeminiServiceError(
            "Gemini rate limit was reached. Please retry in about 20-40 seconds.",
            code="gemini_rate_limited",
            http_status=429,
            retryable=True,
            retry_after_seconds=30,
            raw_message=raw_message,
            model_name=model_name,
        )

    if isinstance(exc, (requests.Timeout, requests.ConnectionError)) or any(
        marker in error_text for marker in GEMINI_TIMEOUT_MARKERS
    ):
        return GeminiServiceError(
            "Gemini request timed out. Please retry in about 20-40 seconds.",
            code="gemini_timeout",
            http_status=503,
            retryable=True,
            retry_after_seconds=30,
            raw_message=raw_message,
            model_name=model_name,
        )

    if status_code in {500, 503} or any(marker in error_text for marker in GEMINI_SERVICE_BUSY_MARKERS):
        return GeminiServiceError(
            "Gemini service is temporarily busy. Please retry in about 20-40 seconds.",
            code="gemini_service_busy",
            http_status=503,
            retryable=True,
            retry_after_seconds=30,
            raw_message=raw_message,
            model_name=model_name,
        )

    return GeminiServiceError(
        raw_message,
        code="gemini_error",
        http_status=503,
        raw_message=raw_message,
        model_name=model_name,
    )


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


def _generate_json_response(prompt: str):
    cleaned_text = get_gemini_text_response(prompt)

    if cleaned_text.startswith("```json"):
        cleaned_text = cleaned_text.replace("```json", "", 1).strip()

    if cleaned_text.startswith("```"):
        cleaned_text = cleaned_text.replace("```", "", 1).strip()

    if cleaned_text.endswith("```"):
        cleaned_text = cleaned_text[:-3].strip()

    return json.loads(cleaned_text)


def _is_transient_gemini_error(exc: Exception) -> bool:
    if isinstance(exc, GeminiServiceError):
        return exc.retryable

    status_code = _extract_gemini_status_code(exc)
    if status_code in {429, 500, 503}:
        return True

    error_text = _extract_gemini_error_text(exc).lower()
    return any(marker in error_text for marker in GEMINI_TRANSIENT_ERROR_MARKERS)


def _iter_gemini_models(preferred_model: str) -> tuple[str, ...]:
    ordered_models = [preferred_model, *GEMINI_FALLBACK_MODELS]
    unique_models = []

    for model_name in ordered_models:
        normalized_name = str(model_name or "").strip()
        if normalized_name and normalized_name not in unique_models:
            unique_models.append(normalized_name)

    return tuple(unique_models or (GEMINI_MODEL_NAME,))


def _request_gemini_text(prompt: str, model: str = GEMINI_MODEL_NAME) -> str:
    if not settings.GEMINI_API_KEY:
        raise GeminiServiceError(
            "Gemini API key is missing. Check GEMINI_API_KEY in the backend environment.",
            code="gemini_config_error",
            http_status=503,
        )

    with _bypass_broken_local_proxy():
        last_exc = None

        for model_name in _iter_gemini_models(model):
            for attempt_index in range(len(GEMINI_RETRY_DELAYS) + 1):
                try:
                    if genai is not None:
                        client = genai.Client(api_key=settings.GEMINI_API_KEY)
                        response = client.models.generate_content(
                            model=model_name,
                            contents=prompt,
                        )
                        return (response.text or "").strip()

                    response = requests.post(
                        f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent",
                        headers={
                            "x-goog-api-key": settings.GEMINI_API_KEY,
                            "Content-Type": "application/json",
                        },
                        json={
                            "contents": [
                                {
                                    "parts": [
                                        {
                                            "text": prompt,
                                        }
                                    ]
                                }
                            ]
                        },
                        timeout=60,
                    )
                    if not response.ok:
                        try:
                            payload = response.json()
                            error_payload = payload.get("error") or {}
                            error_message = error_payload.get("message") or response.text or f"Gemini HTTP {response.status_code}"
                        except ValueError:
                            error_message = response.text or f"Gemini HTTP {response.status_code}"

                        http_error = requests.HTTPError(error_message, response=response)
                        setattr(http_error, "status_code", response.status_code)
                        raise http_error

                    payload = response.json()
                    candidates = payload.get("candidates") or []
                    if not candidates:
                        raise RuntimeError("Gemini returned no candidates.")

                    parts = ((candidates[0].get("content") or {}).get("parts") or [])
                    text_chunks = [str(part.get("text") or "").strip() for part in parts if str(part.get("text") or "").strip()]
                    cleaned_text = "\n".join(text_chunks).strip()
                    if not cleaned_text:
                        raise RuntimeError("Gemini returned an empty response.")
                    return cleaned_text
                except Exception as exc:
                    normalized_exc = exc if isinstance(exc, GeminiServiceError) else _build_gemini_service_error(exc, model_name)
                    last_exc = normalized_exc

                    logger.warning(
                        "Gemini request failed for model %s (attempt %s/%s): %s",
                        model_name,
                        attempt_index + 1,
                        len(GEMINI_RETRY_DELAYS) + 1,
                        normalized_exc.raw_message,
                    )

                    if normalized_exc.code == "gemini_model_error":
                        break

                    if not normalized_exc.retryable:
                        raise normalized_exc from exc

                    if attempt_index >= len(GEMINI_RETRY_DELAYS):
                        break

                    time.sleep(GEMINI_RETRY_DELAYS[attempt_index])

    if isinstance(last_exc, GeminiServiceError):
        raise last_exc

    raise last_exc or GeminiServiceError("Gemini response failed")


def generate_gemini_text_response(prompt: str, model: str = GEMINI_MODEL_NAME) -> str:
    return _request_gemini_text(prompt, model)


def get_gemini_text_response(prompt: str, model: str = GEMINI_MODEL_NAME) -> str:
    return _request_gemini_text(prompt, model)


def _strip_option_prefix(value: str) -> str:
    return re.sub(r"^\s*[A-D]\s*[\)\.\:\-]\s*", "", str(value or "").strip(), flags=re.IGNORECASE)


def _normalize_option_text(raw_option) -> str:
    normalized_option = " ".join(str(raw_option or "").split())[:300]
    if not normalized_option:
        return ""

    stripped_option = _strip_option_prefix(normalized_option)
    return stripped_option or normalized_option


def _is_predictable_answer_pattern(answer_slots: list[int], option_count: int) -> bool:
    if len(answer_slots) < 3 or option_count <= 1:
        return False

    if len(set(answer_slots)) == 1:
        return True

    deltas = [
        (answer_slots[index] - answer_slots[index - 1]) % option_count
        for index in range(1, len(answer_slots))
    ]
    return all(delta == 1 for delta in deltas) or all(delta == option_count - 1 for delta in deltas)


def _build_random_answer_slots(question_count: int, option_count: int = 4, rng=None) -> list[int]:
    if question_count <= 0 or option_count <= 0:
        return []

    rng = rng or random.SystemRandom()
    full_cycles, remainder = divmod(question_count, option_count)
    answer_slots = []

    for _ in range(full_cycles):
        answer_slots.extend(range(option_count))

    if remainder:
        remainder_slots = list(range(option_count))
        rng.shuffle(remainder_slots)
        answer_slots.extend(remainder_slots[:remainder])

    for _ in range(12):
        rng.shuffle(answer_slots)
        if not _is_predictable_answer_pattern(answer_slots, option_count):
            return answer_slots

    return answer_slots


def _rebalance_question_options(
    options: list[str],
    correct_index: int,
    target_index: int,
    rng=None,
) -> tuple[list[str], str]:
    if not options or correct_index < 0 or correct_index >= len(options):
        return options, ""

    target_index = target_index % len(options)
    rng = rng or random.SystemRandom()
    correct_option = options[correct_index]
    distractors = [option for index, option in enumerate(options) if index != correct_index]
    rng.shuffle(distractors)

    balanced_options = []
    distractor_index = 0

    for index in range(len(options)):
        if index == target_index:
            balanced_options.append(correct_option)
            continue

        balanced_options.append(distractors[distractor_index])
        distractor_index += 1

    return balanced_options, ANSWER_LETTERS[target_index]


def _normalize_answer_letter(raw_answer, options: list[str]) -> str:
    normalized_answer = str(raw_answer or "").strip()
    if not normalized_answer:
        return ""

    if len(normalized_answer) == 1 and normalized_answer.upper() in ANSWER_LETTERS:
        return normalized_answer.upper()

    leading_match = re.match(r"^\s*([A-D])(?:[\)\.\:\-\s]|$)", normalized_answer, flags=re.IGNORECASE)
    if leading_match:
        return leading_match.group(1).upper()

    try:
        numeric_answer = int(normalized_answer)
        if 0 <= numeric_answer < len(ANSWER_LETTERS):
            return ANSWER_LETTERS[numeric_answer]
        if 1 <= numeric_answer <= len(ANSWER_LETTERS):
            return ANSWER_LETTERS[numeric_answer - 1]
    except (TypeError, ValueError):
        pass

    lowered_answer = normalized_answer.casefold()
    cleaned_answer = _strip_option_prefix(normalized_answer).casefold()

    for index, option in enumerate(options):
        option_text = str(option or "").strip()
        if not option_text:
            continue
        if option_text.casefold() == lowered_answer:
            return ANSWER_LETTERS[index]
        if _strip_option_prefix(option_text).casefold() == cleaned_answer:
            return ANSWER_LETTERS[index]

    return ""


def _normalize_test_items(raw_items, question_count: int) -> list[dict]:
    if not isinstance(raw_items, list):
        raise ValueError("AI test response must be a JSON array.")

    normalized_items = []
    safe_question_count = max(3, min(int(question_count or 5), 25))
    answer_slots = _build_random_answer_slots(safe_question_count, len(ANSWER_LETTERS))

    for position, item in enumerate(raw_items[:safe_question_count]):
        question_text = " ".join(str((item or {}).get("question") or "").split())
        raw_options = (item or {}).get("options") or []
        options = [_normalize_option_text(option) for option in raw_options if str(option or "").strip()]

        if len(options) != 4:
            raise ValueError("Each AI test question must contain exactly 4 options.")

        if len({option.casefold() for option in options}) != 4:
            raise ValueError("AI test question options must be unique.")

        answer_letter = _normalize_answer_letter((item or {}).get("answer"), options)

        if not question_text or not answer_letter:
            raise ValueError("AI test response contains an invalid question or answer.")

        correct_index = ANSWER_LETTERS.index(answer_letter)
        balanced_options, balanced_answer_letter = _rebalance_question_options(
            options,
            correct_index,
            answer_slots[position],
        )

        normalized_items.append({
            "question": question_text[:500],
            "options": balanced_options,
            "answer": balanced_answer_letter,
        })

    if len(normalized_items) != safe_question_count:
        raise ValueError("AI test generator returned incomplete questions.")

    return normalized_items


def _normalize_slide_outline(raw_outline, slide_count: int) -> dict:
    if not isinstance(raw_outline, dict):
        raise ValueError("AI slide response must be a JSON object.")

    safe_slide_count = max(2, min(int(slide_count or 5), 10))
    raw_slides = raw_outline.get("slides") or []
    normalized_slides = []

    for item in raw_slides[:safe_slide_count]:
        title = " ".join(str((item or {}).get("title") or "").split())
        bullets = [
            " ".join(str(bullet or "").split())[:240]
            for bullet in ((item or {}).get("bullets") or [])
            if str(bullet or "").strip()
        ]

        if not title or len(bullets) < 3:
            raise ValueError("Each generated slide must have a title and at least 3 bullets.")

        normalized_slides.append({
            "title": title[:160],
            "bullets": bullets[:5],
        })

    if len(normalized_slides) != safe_slide_count:
        raise ValueError("AI slide generator returned incomplete slides.")

    presentation_title = " ".join(str(raw_outline.get("presentation_title") or "").split()) or "Lecture Presentation"
    presentation_subtitle = " ".join(str(raw_outline.get("presentation_subtitle") or "").split()) or presentation_title

    return {
        "presentation_title": presentation_title[:180],
        "presentation_subtitle": presentation_subtitle[:220],
        "slides": normalized_slides,
    }


def generate_test_from_text(text: str, language: str = "kaz", question_count: int = 5) -> list:
    safe_question_count = max(3, min(int(question_count or 5), 25))
    target_language = {"rus": "Russian", "eng": "English"}.get(language, "Kazakh")

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
- Use ONLY facts, terminology, and explanations grounded in the material
- Never invent facts, examples, technologies, definitions, dates, or names that are not supported by the material
- Each question must have exactly one clearly correct answer and 3 plausible but incorrect distractors
- Do not use "all of the above", "none of the above", or duplicate answer options
- Prefer precise wording over tricky wording
- The correct answer must match one of the 4 options through a single uppercase answer letter: A, B, C, or D
- Before finalizing, internally verify that the chosen answer is truly supported by the material and the other options are not
- Return a JSON array only

Material:
{text}
"""
    return _normalize_test_items(_generate_json_response(prompt), safe_question_count)


def generate_slide_outline_from_text(text: str, language: str = "kaz", slide_count: int = 7) -> dict:
    safe_slide_count = max(2, min(int(slide_count or 5), 10))
    target_language = {"rus": "Russian", "eng": "English"}.get(language, "Kazakh")

    prompt = f"""
You generate a university lecture presentation plan for a teacher.

Build a presentation based only on the source material below.
Return only valid JSON. Do not add markdown, explanations, or extra text.
The system will automatically add a title slide and a final "Thank you" slide,
so the JSON must contain only the content slides.

Required JSON format:
{{
  "presentation_title": "Presentation title",
  "presentation_subtitle": "Short subtitle",
  "slides": [
    {{
      "title": "Slide title",
      "bullets": [
        "Bullet 1",
        "Bullet 2",
        "Bullet 3"
      ]
    }}
  ]
}}

Rules:
- Create exactly {safe_slide_count} content slides inside the "slides" array
- Use only facts grounded in the provided material
- Do not create a title slide, agenda slide, or thank-you slide inside the JSON
- All titles and bullets must be in {target_language}
- Each slide must have 3 to 5 concise but meaningful bullets
- Avoid generic filler, vague phrases, and repeated wording
- Organize slides from concept introduction to key takeaways
- Make each slide cover a distinct idea or section from the material
- Keep bullets informative, concrete, and presentation-ready
- Return a JSON object only

Material:
{text}
"""

    return _normalize_slide_outline(_generate_json_response(prompt), safe_slide_count)

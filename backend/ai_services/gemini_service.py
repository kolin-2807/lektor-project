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

try:
    import google.auth as google_auth
    from google.auth.transport.requests import Request as GoogleAuthRequest
except ImportError:  # pragma: no cover - optional dependency in some environments
    google_auth = None
    GoogleAuthRequest = None


BROKEN_LOCAL_PROXY_MARKERS = ("127.0.0.1:9", "localhost:9")
ANSWER_LETTERS = ("A", "B", "C", "D")
GEMINI_MODEL_NAME = (
    os.getenv("GOOGLE_GENAI_MODEL_NAME")
    or os.getenv("VERTEX_AI_MODEL_NAME")
    or os.getenv("GEMINI_MODEL_NAME")
    or "gemini-2.5-flash"
).strip()
GEMINI_FALLBACK_MODELS = tuple(
    item.strip()
    for item in (
        os.getenv("GOOGLE_GENAI_FALLBACK_MODELS")
        or os.getenv("VERTEX_AI_FALLBACK_MODELS")
        or os.getenv("GEMINI_FALLBACK_MODELS", "")
    ).split(",")
    if item.strip()
)
VERTEX_AI_SCOPE = "https://www.googleapis.com/auth/cloud-platform"
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


def _use_vertex_ai() -> bool:
    return bool(getattr(settings, "GOOGLE_GENAI_USE_VERTEXAI", False))


def _provider_label() -> str:
    return "Vertex AI" if _use_vertex_ai() else "Gemini API"


def _configured_model_name() -> str:
    configured_model = (
        getattr(settings, "GOOGLE_GENAI_MODEL_NAME", "")
        or os.getenv("GOOGLE_GENAI_MODEL_NAME")
        or os.getenv("VERTEX_AI_MODEL_NAME")
        or os.getenv("GEMINI_MODEL_NAME")
        or GEMINI_MODEL_NAME
    )
    return str(configured_model or GEMINI_MODEL_NAME).strip() or GEMINI_MODEL_NAME


def _configured_fallback_models() -> tuple[str, ...]:
    settings_fallbacks = getattr(settings, "GOOGLE_GENAI_FALLBACK_MODELS", None)
    if settings_fallbacks:
        return tuple(str(item).strip() for item in settings_fallbacks if str(item).strip())
    return GEMINI_FALLBACK_MODELS


def _vertex_project() -> str:
    return str(getattr(settings, "GOOGLE_CLOUD_PROJECT", "") or os.getenv("GOOGLE_CLOUD_PROJECT", "")).strip()


def _vertex_location() -> str:
    location = getattr(settings, "GOOGLE_CLOUD_LOCATION", "") or os.getenv("GOOGLE_CLOUD_LOCATION", "")
    return str(location or "us-central1").strip()


def is_google_genai_configured() -> bool:
    if _use_vertex_ai():
        return bool(_vertex_project() and _vertex_location())
    return bool(getattr(settings, "GEMINI_API_KEY", ""))


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


def _build_gemini_service_error(
    exc: Exception,
    model_name: str = "",
    provider_label: str | None = None,
) -> GeminiServiceError:
    provider = provider_label or _provider_label()
    status_code = _extract_gemini_status_code(exc)
    raw_message = _extract_gemini_error_text(exc) or f"{provider} response failed."
    error_text = raw_message.lower()

    if status_code in {401, 403} or any(marker in error_text for marker in GEMINI_AUTH_ERROR_MARKERS):
        auth_hint = (
            "Check GOOGLE_APPLICATION_CREDENTIALS, GOOGLE_CLOUD_PROJECT, Vertex AI API, and IAM permissions."
            if provider == "Vertex AI"
            else "Check GEMINI_API_KEY and project access."
        )
        return GeminiServiceError(
            f"{provider} authorization failed. {auth_hint}",
            code="gemini_auth_error",
            http_status=503,
            raw_message=raw_message,
            model_name=model_name,
        )

    if status_code == 404 or any(marker in error_text for marker in GEMINI_MODEL_ERROR_MARKERS):
        model_hint = f' Model "{model_name}" is unavailable.' if model_name else ""
        config_hint = (
            "Check GOOGLE_GENAI_MODEL_NAME and GOOGLE_CLOUD_LOCATION."
            if provider == "Vertex AI"
            else "Check GEMINI_MODEL_NAME or fallback models."
        )
        return GeminiServiceError(
            f"{provider} model configuration failed.{model_hint} {config_hint}",
            code="gemini_model_error",
            http_status=503,
            raw_message=raw_message,
            model_name=model_name,
        )

    if any(marker in error_text for marker in GEMINI_QUOTA_ERROR_MARKERS):
        return GeminiServiceError(
            f"{provider} quota or billing is exhausted right now. Please retry in a few minutes or check the quota/billing limit.",
            code="gemini_quota_exceeded",
            http_status=429,
            retry_after_seconds=120,
            raw_message=raw_message,
            model_name=model_name,
        )

    if status_code == 429 or any(marker in error_text for marker in GEMINI_RATE_LIMIT_MARKERS):
        return GeminiServiceError(
            f"{provider} rate limit was reached. Please retry in about 20-40 seconds.",
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
            f"{provider} request timed out. Please retry in about 20-40 seconds.",
            code="gemini_timeout",
            http_status=503,
            retryable=True,
            retry_after_seconds=30,
            raw_message=raw_message,
            model_name=model_name,
        )

    if status_code in {500, 503} or any(marker in error_text for marker in GEMINI_SERVICE_BUSY_MARKERS):
        return GeminiServiceError(
            f"{provider} service is temporarily busy. Please retry in about 20-40 seconds.",
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
    ordered_models = [preferred_model or _configured_model_name(), *_configured_fallback_models()]
    unique_models = []

    for model_name in ordered_models:
        normalized_name = str(model_name or "").strip()
        if normalized_name and normalized_name not in unique_models:
            unique_models.append(normalized_name)

    return tuple(unique_models or (GEMINI_MODEL_NAME,))


def _validate_generation_config():
    if _use_vertex_ai():
        missing = []
        if not _vertex_project():
            missing.append("GOOGLE_CLOUD_PROJECT")
        if not _vertex_location():
            missing.append("GOOGLE_CLOUD_LOCATION")
        if missing:
            raise GeminiServiceError(
                f"Vertex AI configuration is missing: {', '.join(missing)}.",
                code="vertex_config_error",
                http_status=503,
            )
        if genai is None and google_auth is None:
            raise GeminiServiceError(
                "Vertex AI dependencies are missing. Install google-genai or google-auth.",
                code="vertex_dependency_error",
                http_status=503,
            )
        return

    if not settings.GEMINI_API_KEY:
        raise GeminiServiceError(
            "Gemini API key is missing. Check GEMINI_API_KEY in the backend environment.",
            code="gemini_config_error",
            http_status=503,
        )


def _build_genai_client():
    if genai is None:
        return None

    if _use_vertex_ai():
        return genai.Client(
            vertexai=True,
            project=_vertex_project(),
            location=_vertex_location(),
        )

    return genai.Client(api_key=settings.GEMINI_API_KEY)


def _vertex_endpoint(model_name: str) -> str:
    location = _vertex_location()
    host = "aiplatform.googleapis.com" if location == "global" else f"{location}-aiplatform.googleapis.com"
    return (
        f"https://{host}/v1/projects/{_vertex_project()}/locations/{location}"
        f"/publishers/google/models/{model_name}:generateContent"
    )


def _get_vertex_access_token() -> str:
    if google_auth is None or GoogleAuthRequest is None:
        raise GeminiServiceError(
            "Vertex AI auth dependency is missing. Install google-auth.",
            code="vertex_dependency_error",
            http_status=503,
        )

    credentials, _ = google_auth.default(scopes=[VERTEX_AI_SCOPE])
    if not credentials.valid:
        credentials.refresh(GoogleAuthRequest())
    return str(credentials.token or "")


def _raise_http_error(response, provider_label: str):
    try:
        payload = response.json()
        error_payload = payload.get("error") or {}
        error_message = error_payload.get("message") or response.text or f"{provider_label} HTTP {response.status_code}"
    except ValueError:
        error_message = response.text or f"{provider_label} HTTP {response.status_code}"

    http_error = requests.HTTPError(error_message, response=response)
    setattr(http_error, "status_code", response.status_code)
    raise http_error


def _extract_text_from_payload(payload: dict, provider_label: str) -> str:
    candidates = payload.get("candidates") or []
    if not candidates:
        raise RuntimeError(f"{provider_label} returned no candidates.")

    parts = ((candidates[0].get("content") or {}).get("parts") or [])
    text_chunks = [
        str(part.get("text") or "").strip()
        for part in parts
        if str(part.get("text") or "").strip()
    ]
    cleaned_text = "\n".join(text_chunks).strip()
    if not cleaned_text:
        raise RuntimeError(f"{provider_label} returned an empty response.")
    return cleaned_text


def _request_vertex_text_rest(prompt: str, model_name: str, provider_label: str) -> str:
    response = requests.post(
        _vertex_endpoint(model_name),
        headers={
            "Authorization": f"Bearer {_get_vertex_access_token()}",
            "Content-Type": "application/json",
        },
        json={
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": prompt,
                        }
                    ],
                }
            ]
        },
        timeout=60,
    )
    if not response.ok:
        _raise_http_error(response, provider_label)

    return _extract_text_from_payload(response.json(), provider_label)


def _request_gemini_text_rest(prompt: str, model_name: str, provider_label: str) -> str:
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
        _raise_http_error(response, provider_label)

    return _extract_text_from_payload(response.json(), provider_label)


def _request_model_text_rest(prompt: str, model_name: str, provider_label: str) -> str:
    if _use_vertex_ai():
        return _request_vertex_text_rest(prompt, model_name, provider_label)
    return _request_gemini_text_rest(prompt, model_name, provider_label)


def _request_gemini_text(prompt: str, model: str = "") -> str:
    _validate_generation_config()
    provider_label = _provider_label()

    with _bypass_broken_local_proxy():
        last_exc = None

        for model_name in _iter_gemini_models(model):
            for attempt_index in range(len(GEMINI_RETRY_DELAYS) + 1):
                try:
                    client = _build_genai_client()
                    if client is not None:
                        response = client.models.generate_content(
                            model=model_name,
                            contents=prompt,
                        )
                        cleaned_text = (response.text or "").strip()
                        if not cleaned_text:
                            raise RuntimeError(f"{provider_label} returned an empty response.")
                        return cleaned_text

                    return _request_model_text_rest(prompt, model_name, provider_label)
                except Exception as exc:
                    normalized_exc = (
                        exc
                        if isinstance(exc, GeminiServiceError)
                        else _build_gemini_service_error(exc, model_name, provider_label)
                    )
                    last_exc = normalized_exc

                    logger.warning(
                        "%s request failed for model %s (attempt %s/%s): %s",
                        provider_label,
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

    raise last_exc or GeminiServiceError(f"{provider_label} response failed")


def generate_gemini_text_response(prompt: str, model: str = "") -> str:
    return _request_gemini_text(prompt, model)


def get_gemini_text_response(prompt: str, model: str = "") -> str:
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
        raw_item = item or {}
        title = " ".join(str(raw_item.get("title") or "").split())
        bullets = [
            " ".join(str(bullet or "").split())[:240]
            for bullet in (raw_item.get("bullets") or [])
            if str(bullet or "").strip()
        ]
        layout_type = str(raw_item.get("layout_type") or "numbered_list").strip().lower()
        if layout_type not in {"numbered_list", "roadmap", "table"}:
            layout_type = "numbered_list"

        table = raw_item.get("table") if isinstance(raw_item.get("table"), dict) else {}
        table_columns = [
            " ".join(str(column or "").split())[:80]
            for column in (table.get("columns") or [])
            if str(column or "").strip()
        ][:4]
        table_rows = []
        for row in (table.get("rows") or [])[:5]:
            if not isinstance(row, list):
                continue
            cells = [
                " ".join(str(cell or "").split())[:120]
                for cell in row
                if str(cell or "").strip()
            ][:4]
            if cells:
                table_rows.append(cells)

        roadmap_items = [
            " ".join(str(item_text or "").split())[:140]
            for item_text in (raw_item.get("roadmap_items") or [])
            if str(item_text or "").strip()
        ][:4]

        if not title or len(bullets) < 3:
            raise ValueError("Each generated slide must have a title and at least 3 bullets.")

        normalized_slide = {
            "title": title[:160],
            "bullets": bullets[:5],
            "layout_type": layout_type,
        }

        if layout_type == "table" and len(table_columns) >= 2 and table_rows:
            normalized_slide["table"] = {
                "columns": table_columns,
                "rows": table_rows,
            }

        if layout_type == "roadmap" and len(roadmap_items) >= 3:
            normalized_slide["roadmap_items"] = roadmap_items

        normalized_slides.append(normalized_slide)

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
      "layout_type": "numbered_list",
      "bullets": [
        "Bullet 1",
        "Bullet 2",
        "Bullet 3"
      ],
      "roadmap_items": ["Phase 1", "Phase 2", "Phase 3", "Phase 4"],
      "table": {{
        "columns": ["Feature", "Option A", "Option B"],
        "rows": [
          ["Criterion 1", "Value", "Value"]
        ]
      }}
    }}
  ]
}}

Rules:
- Create exactly {safe_slide_count} content slides inside the "slides" array
- Use only facts grounded in the provided material
- Do not create a title slide, agenda slide, or thank-you slide inside the JSON
- All titles and bullets must be in {target_language}
- Each slide must have 3 to 5 concise but meaningful bullets
- Choose one layout_type for every slide:
  - "numbered_list" for definitions, problems, reasons, steps, or key points
  - "roadmap" only when the material clearly describes phases, sequence, stages, workflow, timeline, or process
  - "table" only when the material clearly compares categories, options, features, pros/cons, or metrics
- For roadmap slides, include 3 to 4 roadmap_items. Also keep bullets.
- For table slides, include 2 to 4 columns and 2 to 5 rows. Also keep bullets.
- Do not force roadmap or table when the material does not clearly need them
- Avoid generic filler, vague phrases, and repeated wording
- Organize slides from concept introduction to key takeaways
- Make each slide cover a distinct idea or section from the material
- Keep bullets informative, concrete, and presentation-ready
- Return a JSON object only

Material:
{text}
"""

    return _normalize_slide_outline(_generate_json_response(prompt), safe_slide_count)

from __future__ import annotations

import json
import re
import unicodedata
from dataclasses import dataclass, field, replace
from difflib import SequenceMatcher
from typing import Any

from django.conf import settings

from .gemini_service import get_gemini_text_response


ALLOWED_ACTIONS = {
    "open_course",
    "open_subject",
    "open_materials",
    "open_test",
    "open_results",
    "open_slides",
    "generate_test",
    "generate_slides",
    "select_material",
    "open_qr",
    "start_test",
    "go_back",
    "go_home",
    "show_help",
    "unknown",
}

MATERIAL_TYPES = {"lecture", "practice", "lab", "siw", "syllabus"}

KK_ORDINAL_COURSES = {
    "бірінші": 1,
    "екінші": 2,
    "үшінші": 3,
    "төртінші": 4,
}

RU_ORDINAL_COURSES = {
    "первый": 1,
    "второй": 2,
    "третий": 3,
    "четвертый": 4,
}

COURSE_PATTERNS = (
    re.compile(r"\b(\d{1,2})\s*(?:курс|курса|курсты|курске|курска|course)\b"),
    re.compile(r"\b(?:курс|курса|курсты|курске|курска|course)\s*(\d{1,2})\b"),
)

STT_REPLACEMENTS = {
    "курсқаа": "курсқа",
    "курскаа": "курска",
    "материял": "материал",
    "материялдар": "материалдар",
    "материялдарды": "материалдарды",
    "матерял": "материал",
    "матерялдар": "материалдар",
    "матриал": "материал",
    "матреал": "материал",
    "лексиа": "лекция",
    "слайдтард": "слайдтарды",
}

MATERIAL_TYPE_ALIASES = {
    "дәріс": "lecture",
    "лекция": "lecture",
    "lecture": "lecture",
    "практика": "practice",
    "practice": "practice",
    "зертхана": "lab",
    "зертханалық": "lab",
    "лаборатория": "lab",
    "lab": "lab",
    "сөж": "siw",
    "срс": "siw",
    "siw": "siw",
    "sowj": "siw",
    "syllabus": "syllabus",
    "силлабус": "syllabus",
}

HELP_PHRASES = (
    "көмек",
    "команда",
    "командалар",
    "не істей аласың",
    "что ты умеешь",
    "help",
)

GREETING_PHRASES = (
    "сәлем",
    "салам",
    "салем",
    "қайырлы күн",
    "қайырлы таң",
    "ассалаумағалейкум",
    "привет",
    "здравствуй",
    "hello",
    "hi",
)

THANKS_PHRASES = (
    "рақмет",
    "рахмет",
    "рахмет саған",
    "thank you",
    "thanks",
    "спасибо",
)

WHO_ARE_YOU_PHRASES = (
    "сен кімсің",
    "өзің кімсің",
    "кімсің",
    "кто ты",
    "ты кто",
    "who are you",
)

HOW_ARE_YOU_PHRASES = (
    "қалайсың",
    "жағдайың қалай",
    "халың қалай",
    "как дела",
    "how are you",
)

QUESTION_WORDS = (
    "қалай",
    "қайда",
    "қашан",
    "неге",
    "не үшін",
    "не",
    "кім",
    "қандай",
    "сколько",
    "как",
    "где",
    "когда",
    "почему",
    "что",
    "кто",
    "which",
    "what",
    "how",
    "why",
)

HOME_PHRASES = (
    "басты бет",
    "главная",
    "главную",
    "домой",
    "үйге",
    "home",
)

BACK_PHRASES = (
    "артқа",
    "қайт",
    "назад",
    "go back",
)

MATERIALS_PHRASES = (
    "материал",
    "материалдар",
    "материалы",
    "материалды",
    "материалды аш",
    "материалдарды аш",
    "лекция",
    "дәріс",
    "конспект",
)

TEST_PANEL_PHRASES = (
    "тест аш",
    "тестке өт",
    "тест бөлімі",
    "тест",
    "открой тест",
    "перейди в тест",
)

RESULTS_PHRASES = (
    "нәтиже",
    "нәтижелер",
    "результат",
    "результаты",
    "балл",
    "оценка",
    "results",
)

SLIDES_PHRASES = (
    "слайд",
    "слайдтар",
    "презентация",
    "слайды",
    "slides",
)

GENERATE_TEST_PHRASES = (
    "тест жаса",
    "тест құрастыр",
    "тест дайында",
    "сұрақ құрастыр",
    "создай тест",
    "сгенерируй тест",
    "generate test",
)

GENERATE_SLIDES_PHRASES = (
    "слайд жаса",
    "слайд дайында",
    "презентация жаса",
    "создай слайды",
    "создай презентацию",
    "generate slides",
)

OPEN_QR_PHRASES = (
    "qr",
    "qr код",
    "куар",
    "кьюар",
)

START_TEST_PHRASES = (
    "тестті баста",
    "тест бастау",
    "начни тест",
    "запусти тест",
    "start test",
)

OPEN_WORDS = (
    "аш",
    "көрсет",
    "перейди",
    "открой",
    "покажи",
    "open",
    "show",
)

KAZAKH_SPECIFIC_CHARS_PATTERN = re.compile(r"[әіңғүұқөһі]", re.IGNORECASE)
KAZAKH_HINT_PHRASES = (
    "сәлем",
    "көмек",
    "материалдарды",
    "материалды",
    "нәтижелерді",
    "тестті",
    "слайдтарды",
    "аш",
    "қалай",
    "қайда",
    "неге",
    "кім",
    "қандай",
    "өт",
    "қайтар",
    "берші",
)
RUSSIAN_HINT_PHRASES = (
    "привет",
    "здравствуй",
    "открой",
    "покажи",
    "материалы",
    "результаты",
    "тест",
    "слайды",
    "как",
    "где",
    "почему",
    "кто",
    "что",
    "перейди",
)

STOP_TOKENS = {
    "аш",
    "ашып",
    "көрсет",
    "көрсету",
    "покажи",
    "открой",
    "перейди",
    "материал",
    "материалы",
    "материалдар",
    "тест",
    "слайд",
    "слайды",
    "презентация",
    "пән",
    "дисциплина",
    "course",
    "курс",
    "курса",
}


@dataclass(slots=True)
class AssistantContext:
    selected_role: str = "kaz"
    current_view: str = "home"
    active_panel: str = "materials"
    selected_course_number: int | None = None
    selected_subject: dict[str, Any] = field(default_factory=dict)
    selected_material: dict[str, Any] = field(default_factory=dict)
    available_subjects: list[dict[str, Any]] = field(default_factory=list)
    available_materials: list[dict[str, Any]] = field(default_factory=list)
    has_generated_test: bool = False
    has_results: bool = False


def normalize_assistant_text(text: str) -> str:
    normalized = unicodedata.normalize("NFKC", str(text or "")).strip().lower()
    normalized = normalized.replace("ё", "е")

    for source, target in STT_REPLACEMENTS.items():
        normalized = normalized.replace(source, target)

    normalized = re.sub(r"[_/\\|]+", " ", normalized)
    normalized = re.sub(r"[^\w\s\-]", " ", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return normalized


def _safe_int(value: Any) -> int | None:
    try:
        if value in (None, ""):
            return None
        return int(value)
    except (TypeError, ValueError):
        return None


def _reply(context: AssistantContext, kazakh: str, russian: str | None = None) -> str:
    if context.selected_role == "rus":
        return russian or kazakh
    return kazakh


def _resolve_reply_role(raw_text: str, current_role: str = "kaz") -> str:
    text = str(raw_text or "").strip().lower()
    normalized_text = normalize_assistant_text(text)
    kazakh_score = 0
    russian_score = 0

    if KAZAKH_SPECIFIC_CHARS_PATTERN.search(text):
        kazakh_score += 2

    kazakh_score += sum(1 for phrase in KAZAKH_HINT_PHRASES if phrase in normalized_text)
    russian_score += sum(1 for phrase in RUSSIAN_HINT_PHRASES if phrase in normalized_text)

    if kazakh_score > russian_score and kazakh_score > 0:
        return "kaz"

    if russian_score > kazakh_score and russian_score > 0:
        return "rus"

    return current_role if current_role in {"kaz", "rus"} else "kaz"


def _normalize_entity_list(items: Any, kind: str) -> list[dict[str, Any]]:
    if not isinstance(items, list):
        return []

    normalized_items: list[dict[str, Any]] = []
    for item in items[:100]:
        if not isinstance(item, dict):
            continue

        title = " ".join(str(item.get("title") or "").split()).strip()
        if not title:
            continue

        normalized_items.append(
            {
                "id": _safe_int(item.get("id")),
                "title": title,
                "normalized_title": normalize_assistant_text(title),
                "course_number": _safe_int(item.get("course_number")),
                "subject_id": _safe_int(item.get("subject_id")),
                "type": str(item.get("type") or "").strip().lower(),
                "kind": kind,
            }
        )

    return normalized_items


def _build_context(raw_context: Any) -> AssistantContext:
    context = raw_context if isinstance(raw_context, dict) else {}
    selected_subject = context.get("selected_subject") if isinstance(context.get("selected_subject"), dict) else {}
    selected_material = context.get("selected_material") if isinstance(context.get("selected_material"), dict) else {}

    return AssistantContext(
        selected_role=str(context.get("selected_role") or "kaz").strip().lower() or "kaz",
        current_view=str(context.get("current_view") or "home").strip().lower() or "home",
        active_panel=str(context.get("active_panel") or "materials").strip().lower() or "materials",
        selected_course_number=_safe_int(context.get("selected_course_number")),
        selected_subject={
            "id": _safe_int(selected_subject.get("id")),
            "title": " ".join(str(selected_subject.get("title") or "").split()).strip(),
            "course_number": _safe_int(selected_subject.get("course_number")),
            "normalized_title": normalize_assistant_text(selected_subject.get("title") or ""),
        },
        selected_material={
            "id": _safe_int(selected_material.get("id")),
            "title": " ".join(str(selected_material.get("title") or "").split()).strip(),
            "type": str(selected_material.get("type") or "").strip().lower(),
            "subject_id": _safe_int(selected_material.get("subject_id")),
            "course_number": _safe_int(selected_material.get("course_number")),
            "normalized_title": normalize_assistant_text(selected_material.get("title") or ""),
        },
        available_subjects=_normalize_entity_list(context.get("available_subjects"), kind="subject"),
        available_materials=_normalize_entity_list(context.get("available_materials"), kind="material"),
        has_generated_test=bool(context.get("has_generated_test")),
        has_results=bool(context.get("has_results")),
    )


def _contains_any(text: str, phrases: tuple[str, ...] | list[str]) -> bool:
    return any(normalize_assistant_text(phrase) in text for phrase in phrases)


def _extract_course_number(text: str) -> int | None:
    for pattern in COURSE_PATTERNS:
        match = pattern.search(text)
        if match:
            return _safe_int(match.group(1))

    for label, number in {**KK_ORDINAL_COURSES, **RU_ORDINAL_COURSES}.items():
        if f"{label} курс" in text or f"{label} курса" in text:
            return number

    return None


def _extract_material_type(text: str) -> str:
    for alias, material_type in MATERIAL_TYPE_ALIASES.items():
        if normalize_assistant_text(alias) in text:
            return material_type
    return ""


def _looks_like_help_request(text: str) -> bool:
    return _contains_any(text, HELP_PHRASES)


def _looks_like_greeting(text: str) -> bool:
    return _contains_any(text, GREETING_PHRASES)


def _looks_like_thanks(text: str) -> bool:
    return _contains_any(text, THANKS_PHRASES)


def _looks_like_who_are_you(text: str) -> bool:
    return _contains_any(text, WHO_ARE_YOU_PHRASES)


def _looks_like_how_are_you(text: str) -> bool:
    return _contains_any(text, HOW_ARE_YOU_PHRASES)


def _looks_like_home_request(text: str) -> bool:
    return _contains_any(text, HOME_PHRASES)


def _looks_like_back_request(text: str) -> bool:
    return _contains_any(text, BACK_PHRASES)


def _looks_like_generate_test_request(text: str) -> bool:
    return _contains_any(text, GENERATE_TEST_PHRASES)


def _looks_like_generate_slides_request(text: str) -> bool:
    return _contains_any(text, GENERATE_SLIDES_PHRASES)


def _looks_like_open_qr_request(text: str) -> bool:
    return _contains_any(text, OPEN_QR_PHRASES)


def _looks_like_start_test_request(text: str, context: AssistantContext) -> bool:
    return _contains_any(text, START_TEST_PHRASES) or (
        text == "баста" and (context.active_panel == "test" or context.has_generated_test)
    )


def _looks_like_results_request(text: str) -> bool:
    return _contains_any(text, RESULTS_PHRASES)


def _looks_like_slides_request(text: str) -> bool:
    return _contains_any(text, SLIDES_PHRASES)


def _looks_like_materials_request(text: str) -> bool:
    return _contains_any(text, MATERIALS_PHRASES)


def _looks_like_test_panel_request(text: str) -> bool:
    if _looks_like_generate_test_request(text) or _looks_like_start_test_request(text, AssistantContext()):
        return False
    return _contains_any(text, TEST_PANEL_PHRASES)


def _looks_like_general_question(text: str) -> bool:
    return any(re.search(rf"\b{re.escape(word)}\b", text) for word in QUESTION_WORDS)


def _tokenize_title(value: str) -> list[str]:
    return [
        token
        for token in normalize_assistant_text(value).split()
        if len(token) > 2 and token not in STOP_TOKENS
    ]


def _score_entity_match(text: str, item: dict[str, Any]) -> float:
    normalized_title = item.get("normalized_title") or ""
    if not normalized_title:
        return 0.0

    if normalized_title in text:
        return 1.0

    title_tokens = _tokenize_title(normalized_title)
    if title_tokens:
        matched_tokens = sum(1 for token in title_tokens if re.search(rf"\b{re.escape(token)}\b", text))
        token_ratio = matched_tokens / len(title_tokens)
        if token_ratio >= 0.66:
            return 0.75 + (token_ratio * 0.2)

    similarity = SequenceMatcher(None, normalized_title, text).ratio()
    if len(normalized_title) >= 8 and similarity >= 0.78:
        return similarity

    return 0.0


def _find_best_entity_match(text: str, items: list[dict[str, Any]]) -> dict[str, Any] | None:
    best_item = None
    best_score = 0.0

    for item in items:
        score = _score_entity_match(text, item)
        if score > best_score:
            best_score = score
            best_item = item

    if best_score < 0.75:
        return None

    return {**best_item, "score": round(best_score, 2)}


def _pick_first_material_by_type(context: AssistantContext, material_type: str) -> dict[str, Any] | None:
    if not material_type:
        return None

    for item in context.available_materials:
        if item.get("type") == material_type:
            return item

    current_material = context.selected_material
    if current_material.get("type") == material_type:
        return current_material

    return None


def _pick_selected_subject(context: AssistantContext) -> dict[str, Any] | None:
    if context.selected_subject.get("id") or context.selected_subject.get("title"):
        return context.selected_subject
    return None


def _pick_selected_material(context: AssistantContext) -> dict[str, Any] | None:
    if context.selected_material.get("id") or context.selected_material.get("title"):
        return context.selected_material
    return None


def _build_response(action: str, reply: str, confidence: float = 0.9, **payload: Any) -> dict[str, Any]:
    clean_payload = {
        key: value
        for key, value in payload.items()
        if value not in (None, "", [], {})
    }

    return {
        "action": action if action in ALLOWED_ACTIONS else "unknown",
        "reply": str(reply or "").strip(),
        "confidence": round(max(0.0, min(float(confidence), 1.0)), 2),
        "metadata": clean_payload,
        **clean_payload,
    }


def _build_subject_response(
    action: str,
    context: AssistantContext,
    subject: dict[str, Any] | None,
    course_number: int | None = None,
    reply: str = "",
    confidence: float = 0.9,
) -> dict[str, Any]:
    resolved_course_number = course_number or _safe_int(subject.get("course_number") if subject else None) or context.selected_course_number
    return _build_response(
        action=action,
        reply=reply,
        confidence=confidence,
        subject_id=_safe_int(subject.get("id") if subject else None),
        subject_title=(subject or {}).get("title", ""),
        course_number=resolved_course_number,
    )


def _build_material_response(
    action: str,
    context: AssistantContext,
    material: dict[str, Any] | None,
    subject: dict[str, Any] | None = None,
    reply: str = "",
    confidence: float = 0.9,
) -> dict[str, Any]:
    resolved_subject_id = _safe_int((material or {}).get("subject_id")) or _safe_int((subject or {}).get("id"))
    resolved_course_number = (
        _safe_int((material or {}).get("course_number"))
        or _safe_int((subject or {}).get("course_number"))
        or context.selected_course_number
    )
    return _build_response(
        action=action,
        reply=reply,
        confidence=confidence,
        material_id=_safe_int((material or {}).get("id")),
        material_title=(material or {}).get("title", ""),
        material_type=(material or {}).get("type", ""),
        subject_id=resolved_subject_id,
        subject_title=(subject or {}).get("title", ""),
        course_number=resolved_course_number,
    )


def _build_smalltalk_response(text: str, context: AssistantContext) -> dict[str, Any] | None:
    if _looks_like_greeting(text):
        return _build_response(
            action="unknown",
            reply=_reply(
                context,
                "Сәлем! Мен сізге материал, тест, слайд және нәтижелер бойынша көмектесе аламын.",
                "Здравствуйте! Я могу помочь с материалами, тестами, слайдами и результатами.",
            ),
            confidence=0.99,
        )

    if _looks_like_thanks(text):
        return _build_response(
            action="unknown",
            reply=_reply(
                context,
                "Әрқашан көмектесемін.",
                "Всегда рад помочь.",
            ),
            confidence=0.98,
        )

    if _looks_like_how_are_you(text):
        return _build_response(
            action="unknown",
            reply=_reply(
                context,
                "Жақсымын. Қандай бөлімді ашу керек екенін айта беріңіз.",
                "Все хорошо. Скажите, какой раздел нужно открыть.",
            ),
            confidence=0.97,
        )

    if _looks_like_who_are_you(text):
        return _build_response(
            action="unknown",
            reply=_reply(
                context,
                "Мен осы жүйедегі дауыстық көмекшімін. Материалдарды, тесттерді, слайдтарды және нәтижелерді ашуға көмектесемін.",
                "Я голосовой помощник этой системы. Помогаю открывать материалы, тесты, слайды и результаты.",
            ),
            confidence=0.98,
        )

    return None


def _build_local_question_response(text: str, context: AssistantContext) -> dict[str, Any] | None:
    if _looks_like_help_request(text):
        return _build_response(
            action="show_help",
            reply=_reply(
                context,
                "Мен материалдарды, тесттерді, слайдтарды және нәтижелерді ашып бере аламын.",
                "Я могу открывать материалы, тесты, слайды и результаты.",
            ),
            confidence=0.95,
        )

    if not _looks_like_general_question(text):
        return None

    if _looks_like_materials_request(text):
        return _build_response(
            action="unknown",
            reply=_reply(
                context,
                "Материалдарды ашу үшін пәнді таңдаңыз немесе жай ғана «материалдарды аш» деп айтыңыз.",
                "Чтобы открыть материалы, выберите дисциплину или просто скажите «открой материалы».",
            ),
            confidence=0.82,
        )

    if _looks_like_test_panel_request(text) or _looks_like_generate_test_request(text):
        return _build_response(
            action="unknown",
            reply=_reply(
                context,
                "Тест бөліміне өту үшін «тестті аш» деңіз. Ал жаңа тест керек болса «тест жасап бер» деп айтыңыз.",
                "Чтобы перейти в раздел тестов, скажите «открой тест». Если нужен новый тест, скажите «создай тест».",
            ),
            confidence=0.82,
        )

    if _looks_like_results_request(text):
        return _build_response(
            action="unknown",
            reply=_reply(
                context,
                "Нәтижелерді көру үшін «нәтижелерді аш» деп айтыңыз.",
                "Чтобы посмотреть результаты, скажите «открой результаты».",
            ),
            confidence=0.82,
        )

    if _looks_like_slides_request(text) or _looks_like_generate_slides_request(text):
        return _build_response(
            action="unknown",
            reply=_reply(
                context,
                "Слайдтарды ашу үшін «слайдтарды аш» деңіз. Ал жаңа слайд керек болса «слайд жасап бер» деп айтыңыз.",
                "Чтобы открыть слайды, скажите «открой слайды». Если нужны новые слайды, скажите «создай слайды».",
            ),
            confidence=0.82,
        )

    return None


def _clean_gemini_json_response(raw_text: str) -> dict[str, Any]:
    cleaned_text = str(raw_text or "").strip()

    if cleaned_text.startswith("```json"):
        cleaned_text = cleaned_text.replace("```json", "", 1).strip()
    if cleaned_text.startswith("```"):
        cleaned_text = cleaned_text.replace("```", "", 1).strip()
    if cleaned_text.endswith("```"):
        cleaned_text = cleaned_text[:-3].strip()

    parsed = json.loads(cleaned_text)
    if not isinstance(parsed, dict):
        raise ValueError("Assistant fallback must return a JSON object.")
    return parsed


def _gemini_fallback(user_text: str, context: AssistantContext) -> dict[str, Any]:
    if not settings.GEMINI_API_KEY:
        return _build_response(
            action="unknown",
            reply=_reply(
                context,
                "Мен қазір негізінен жүйені басқаруға көмектесемін. Мысалы: «материалдарды аш», «тестті аш», «нәтижелерді аш».",
                "Сейчас я в основном помогаю управлять системой. Например: «открой материалы», «открой тест», «открой результаты».",
            ),
            confidence=0.2,
        )

    prompt = f"""
You are a voice assistant for a university teacher dashboard.
Understand the user command and return only valid JSON.

Allowed actions:
{sorted(ALLOWED_ACTIONS)}

Allowed material types:
{sorted(MATERIAL_TYPES)}

Current UI context:
{json.dumps({
    "selected_role": context.selected_role,
    "current_view": context.current_view,
    "active_panel": context.active_panel,
    "selected_course_number": context.selected_course_number,
    "selected_subject": context.selected_subject,
    "selected_material": context.selected_material,
    "available_subjects": context.available_subjects,
    "available_materials": context.available_materials,
    "has_generated_test": context.has_generated_test,
    "has_results": context.has_results,
}, ensure_ascii=False)}

Rules:
- Use only the allowed actions.
- If the request is ambiguous, return action="unknown" and ask a short clarifying question.
- If the user is greeting you or asking a general question, return action="unknown" and answer naturally.
- If the user asks a short conversational question, prefer a direct answer in reply instead of asking for clarification.
- Use subject_id and material_id only if they exist in the context.
- reply must be short, natural, and in the user's UI language.
- confidence must be between 0 and 1.
- Return JSON only without markdown.

Response JSON shape:
{{
  "action": "open_subject",
  "reply": "Желілік қауіпсіздік пәнін ашамын.",
  "subject_id": 12,
  "subject_title": "Желілік қауіпсіздік",
  "course_number": 3,
  "material_id": 55,
  "material_title": "15 апта дәрісі",
  "material_type": "lecture",
  "confidence": 0.76
}}

User command:
{user_text}
"""

    try:
        parsed = _clean_gemini_json_response(get_gemini_text_response(prompt))
    except Exception:
        return _build_response(
            action="unknown",
            reply=_reply(
                context,
                "Қазір толық жауап бере алмадым. Бірақ материалдар, тесттер, слайдтар және нәтижелер бойынша көмектесе аламын.",
                "Сейчас не удалось дать полный ответ. Но я могу помочь с материалами, тестами, слайдами и результатами.",
            ),
            confidence=0.24,
        )
    action = str(parsed.get("action") or "unknown").strip()
    if action not in ALLOWED_ACTIONS:
        action = "unknown"

    result = _build_response(
        action=action,
        reply=str(parsed.get("reply") or "").strip(),
        confidence=float(parsed.get("confidence") or 0.55),
        subject_id=_safe_int(parsed.get("subject_id")),
        subject_title=str(parsed.get("subject_title") or "").strip(),
        course_number=_safe_int(parsed.get("course_number")),
        material_id=_safe_int(parsed.get("material_id")),
        material_title=str(parsed.get("material_title") or "").strip(),
        material_type=str(parsed.get("material_type") or "").strip().lower(),
    )

    if result.get("material_type") not in MATERIAL_TYPES:
        result["metadata"].pop("material_type", None)
        result.pop("material_type", None)

    return result


def detect_assistant_intent(user_text: str, context: dict[str, Any] | None = None) -> dict[str, Any]:
    text = normalize_assistant_text(user_text)
    parsed_context = _build_context(context)
    parsed_context = replace(
        parsed_context,
        selected_role=_resolve_reply_role(user_text, parsed_context.selected_role),
    )

    if not text:
        return _build_response(
            action="unknown",
            reply=_reply(
                parsed_context,
                "Команданы қайта айтып жіберіңіз.",
                "Повторите команду, пожалуйста.",
            ),
            confidence=0.1,
        )

    smalltalk_response = _build_smalltalk_response(text, parsed_context)
    if smalltalk_response:
        return smalltalk_response

    local_question_response = _build_local_question_response(text, parsed_context)
    if local_question_response:
        return local_question_response

    matched_subject = _find_best_entity_match(text, parsed_context.available_subjects)
    matched_material = _find_best_entity_match(text, parsed_context.available_materials)
    selected_subject = _pick_selected_subject(parsed_context)
    selected_material = _pick_selected_material(parsed_context)
    course_number = _extract_course_number(text)
    material_type = _extract_material_type(text)

    if _looks_like_help_request(text):
        return _build_response(
            action="show_help",
            reply=_reply(
                parsed_context,
                "Көмек панелін ашамын.",
                "Открываю панель помощи.",
            ),
            confidence=0.98,
        )

    if _looks_like_home_request(text):
        return _build_response(
            action="go_home",
            reply=_reply(
                parsed_context,
                "Басты бетке өтемін.",
                "Перехожу на главную страницу.",
            ),
            confidence=0.98,
        )

    if _looks_like_back_request(text):
        return _build_response(
            action="go_back",
            reply=_reply(
                parsed_context,
                "Алдыңғы бетке қайтарамын.",
                "Возвращаю на предыдущий экран.",
            ),
            confidence=0.97,
        )

    if _looks_like_generate_slides_request(text):
        target_material = matched_material or _pick_first_material_by_type(parsed_context, material_type or "lecture") or selected_material
        if target_material and target_material.get("type") == "lecture":
            return _build_material_response(
                action="generate_slides",
                context=parsed_context,
                material=target_material,
                subject=matched_subject or selected_subject,
                reply=_reply(
                    parsed_context,
                    f'"{target_material.get("title")}" материалы бойынша слайд жасаймын.',
                    f'Соберу слайды по материалу "{target_material.get("title")}".',
                ),
                confidence=0.96,
            )
        return _build_response(
            action="unknown",
            reply=_reply(
                parsed_context,
                "Слайд жасау үшін дәріс материалын таңдаңыз.",
                "Для создания слайдов выберите лекционный материал.",
            ),
            confidence=0.4,
        )

    if _looks_like_generate_test_request(text):
        target_material = matched_material or _pick_first_material_by_type(parsed_context, material_type or "lecture") or selected_material
        if target_material and target_material.get("type") == "lecture":
            return _build_material_response(
                action="generate_test",
                context=parsed_context,
                material=target_material,
                subject=matched_subject or selected_subject,
                reply=_reply(
                    parsed_context,
                    f'"{target_material.get("title")}" материалы бойынша тест жасаймын.',
                    f'Создам тест по материалу "{target_material.get("title")}".',
                ),
                confidence=0.97,
            )
        return _build_response(
            action="unknown",
            reply=_reply(
                parsed_context,
                "Тест жасау үшін дәріс материалын таңдаңыз.",
                "Для создания теста выберите лекционный материал.",
            ),
            confidence=0.42,
        )

    if _looks_like_open_qr_request(text):
        target_material = matched_material or _pick_first_material_by_type(parsed_context, material_type or "lecture") or selected_material
        if target_material and target_material.get("type") == "lecture":
            return _build_material_response(
                action="open_qr",
                context=parsed_context,
                material=target_material,
                subject=matched_subject or selected_subject,
                reply=_reply(
                    parsed_context,
                    "Тесттің QR кодын ашамын.",
                    "Открываю QR-код теста.",
                ),
                confidence=0.95,
            )
        return _build_response(
            action="unknown",
            reply=_reply(
                parsed_context,
                "QR ашу үшін алдымен дәріс материалы бойынша тест дайындау керек.",
                "Чтобы открыть QR, сначала нужен тест по лекционному материалу.",
            ),
            confidence=0.4,
        )

    if _looks_like_start_test_request(text, parsed_context):
        target_material = matched_material or _pick_first_material_by_type(parsed_context, material_type or "lecture") or selected_material
        if target_material and target_material.get("type") == "lecture":
            return _build_material_response(
                action="start_test",
                context=parsed_context,
                material=target_material,
                subject=matched_subject or selected_subject,
                reply=_reply(
                    parsed_context,
                    "Тестті іске қосамын.",
                    "Запускаю тест.",
                ),
                confidence=0.94,
            )

    if _looks_like_results_request(text):
        target_material = matched_material or selected_material
        if target_material:
            return _build_material_response(
                action="open_results",
                context=parsed_context,
                material=target_material,
                subject=matched_subject or selected_subject,
                reply=_reply(
                    parsed_context,
                    "Нәтижелер бөлімін ашамын.",
                    "Открываю раздел результатов.",
                ),
                confidence=0.95,
            )
        return _build_subject_response(
            action="open_results",
            context=parsed_context,
            subject=matched_subject or selected_subject,
            course_number=course_number,
            reply=_reply(
                parsed_context,
                "Нәтижелер бөлімін ашамын.",
                "Открываю раздел результатов.",
            ),
            confidence=0.84,
        )

    if _looks_like_slides_request(text):
        target_material = matched_material or _pick_first_material_by_type(parsed_context, material_type or "lecture") or selected_material
        if target_material:
            return _build_material_response(
                action="open_slides",
                context=parsed_context,
                material=target_material,
                subject=matched_subject or selected_subject,
                reply=_reply(
                    parsed_context,
                    "Слайд бөлімін ашамын.",
                    "Открываю раздел слайдов.",
                ),
                confidence=0.92,
            )
        return _build_subject_response(
            action="open_slides",
            context=parsed_context,
            subject=matched_subject or selected_subject,
            course_number=course_number,
            reply=_reply(
                parsed_context,
                "Слайд бөлімін ашамын.",
                "Открываю раздел слайдов.",
            ),
            confidence=0.82,
        )

    if matched_material:
        return _build_material_response(
            action="select_material",
            context=parsed_context,
            material=matched_material,
            subject=matched_subject or selected_subject,
            reply=_reply(
                parsed_context,
                f'"{matched_material.get("title")}" материалын ашамын.',
                f'Открываю материал "{matched_material.get("title")}".',
            ),
            confidence=0.94,
        )

    if matched_subject:
        next_action = "open_materials" if _looks_like_materials_request(text) else "open_subject"
        reply = (
            f'"{matched_subject.get("title")}" пәнін ашамын.'
            if next_action == "open_subject"
            else _reply(
                parsed_context,
                "Материалдар бөлімін ашамын.",
                "Открываю раздел материалов.",
            )
        )
        if parsed_context.selected_role == "rus" and next_action == "open_subject":
            reply = f'Открываю дисциплину "{matched_subject.get("title")}".'

        return _build_subject_response(
            action=next_action,
            context=parsed_context,
            subject=matched_subject,
            course_number=course_number,
            reply=reply,
            confidence=0.93,
        )

    if course_number:
        return _build_subject_response(
            action="open_course",
            context=parsed_context,
            subject=None,
            course_number=course_number,
            reply=_reply(
                parsed_context,
                f"{course_number}-курсты ашамын.",
                f"Открываю {course_number} курс.",
            ),
            confidence=0.96,
        )

    if _looks_like_materials_request(text):
        return _build_subject_response(
            action="open_materials",
            context=parsed_context,
            subject=selected_subject,
            course_number=parsed_context.selected_course_number,
            reply=_reply(
                parsed_context,
                "Материалдар бөлімін ашамын.",
                "Открываю раздел материалов.",
            ),
            confidence=0.88,
        )

    if _looks_like_test_panel_request(text):
        return _build_material_response(
            action="open_test",
            context=parsed_context,
            material=selected_material,
            subject=selected_subject,
            reply=_reply(
                parsed_context,
                "Тест бөлімін ашамын.",
                "Открываю раздел тестов.",
            ),
            confidence=0.86,
        )

    return _gemini_fallback(user_text, parsed_context)

from __future__ import annotations

import json
import mimetypes
from pathlib import Path

import requests
from django.conf import settings


AZURE_FAST_TRANSCRIPTION_PATH = "/speechtotext/transcriptions:transcribe"
DEFAULT_AZURE_STT_API_VERSION = "2025-10-15"
DEFAULT_AZURE_STT_LOCALES = ("kk-KZ",)
ROLE_TO_LOCALE = {
    "kaz": "kk-KZ",
    "kk": "kk-KZ",
    "rus": "ru-RU",
    "ru": "ru-RU",
    "eng": "en-US",
    "en": "en-US",
}


class STTServiceError(RuntimeError):
    def __init__(
        self,
        message: str,
        *,
        code: str = "stt_error",
        http_status: int = 503,
        retryable: bool = False,
        provider: str = "azure",
    ):
        super().__init__(message)
        self.code = code
        self.http_status = http_status
        self.retryable = retryable
        self.provider = provider


def _has_azure_stt_config() -> bool:
    return bool(settings.AZURE_SPEECH_KEY and settings.AZURE_SPEECH_REGION)


def _resolve_locale(locale: str | None = None) -> str:
    normalized = (locale or "").strip()
    if not normalized:
        configured_locales = tuple(getattr(settings, "AZURE_SPEECH_STT_LOCALES", ()) or ())
        return (configured_locales or DEFAULT_AZURE_STT_LOCALES)[0]

    return ROLE_TO_LOCALE.get(normalized.lower(), normalized)


def _build_transcription_endpoint() -> str:
    api_version = (
        getattr(settings, "AZURE_SPEECH_STT_API_VERSION", DEFAULT_AZURE_STT_API_VERSION)
        or DEFAULT_AZURE_STT_API_VERSION
    ).strip()
    region = settings.AZURE_SPEECH_REGION.strip()
    return (
        f"https://{region}.api.cognitive.microsoft.com"
        f"{AZURE_FAST_TRANSCRIPTION_PATH}?api-version={api_version}"
    )


def _extract_transcript(payload: dict) -> str:
    combined_phrases = payload.get("combinedPhrases") or []
    combined_text = " ".join(
        str(phrase.get("text") or "").strip()
        for phrase in combined_phrases
        if isinstance(phrase, dict) and str(phrase.get("text") or "").strip()
    ).strip()
    if combined_text:
        return combined_text

    phrases = payload.get("phrases") or []
    return " ".join(
        str(phrase.get("text") or "").strip()
        for phrase in phrases
        if isinstance(phrase, dict) and str(phrase.get("text") or "").strip()
    ).strip()


def _build_error_message(response: requests.Response) -> str:
    try:
        payload = response.json()
    except ValueError:
        payload = {}

    if isinstance(payload, dict):
        for key in ("message", "error", "detail"):
            value = payload.get(key)
            if isinstance(value, dict):
                nested_message = value.get("message") or value.get("code")
                if nested_message:
                    return str(nested_message)
            if value:
                return str(value)

    return " ".join(str(response.text or "").split()).strip()


def transcribe_audio(
    file_path: str,
    *,
    filename: str | None = None,
    content_type: str | None = None,
    locale: str | None = None,
) -> str:
    if not _has_azure_stt_config():
        raise STTServiceError(
            "Azure Speech transcription is not configured.",
            code="azure_stt_not_configured",
            provider="azure",
        )

    audio_path = Path(file_path)
    upload_name = Path(filename or audio_path.name or "voice.webm").name
    upload_content_type = (
        content_type
        or mimetypes.guess_type(upload_name)[0]
        or "application/octet-stream"
    )
    definition = {
        "locales": [_resolve_locale(locale)],
    }

    try:
        with audio_path.open("rb") as audio_file:
            response = requests.post(
                _build_transcription_endpoint(),
                headers={
                    "Ocp-Apim-Subscription-Key": settings.AZURE_SPEECH_KEY,
                },
                files={
                    "audio": (upload_name, audio_file, upload_content_type),
                },
                data={
                    "definition": json.dumps(definition),
                },
                timeout=getattr(settings, "AZURE_SPEECH_STT_TIMEOUT_SECONDS", 60),
            )
    except requests.Timeout as exc:
        raise STTServiceError(
            "Azure speech recognition timed out. Please try again.",
            code="azure_stt_timeout",
            retryable=True,
            provider="azure",
        ) from exc
    except requests.RequestException as exc:
        raise STTServiceError(
            "Azure speech recognition is temporarily unavailable.",
            code="azure_stt_unavailable",
            retryable=True,
            provider="azure",
        ) from exc

    if not response.ok:
        status_code = response.status_code
        detail = _build_error_message(response)

        if status_code in {401, 403}:
            raise STTServiceError(
                "Azure Speech authorization failed. Check the subscription key and region.",
                code="azure_stt_auth_error",
                provider="azure",
            )
        if status_code == 400:
            raise STTServiceError(
                detail or "Azure Speech could not transcribe this audio format or locale.",
                code="azure_stt_bad_request",
                http_status=400,
                provider="azure",
            )
        if status_code == 404:
            raise STTServiceError(
                "Azure Speech transcription endpoint was not found. Check the region and API version.",
                code="azure_stt_endpoint_error",
                provider="azure",
            )
        if status_code == 429:
            raise STTServiceError(
                "Azure Speech rate limit was reached. Please try again shortly.",
                code="azure_stt_rate_limited",
                http_status=429,
                retryable=True,
                provider="azure",
            )
        if status_code in {500, 502, 503, 504}:
            raise STTServiceError(
                "Azure Speech is temporarily busy. Please try again.",
                code="azure_stt_busy",
                retryable=True,
                provider="azure",
            )

        raise STTServiceError(
            detail or "Azure speech transcription failed.",
            code="azure_stt_error",
            provider="azure",
        )

    try:
        payload = response.json()
    except ValueError as exc:
        raise STTServiceError(
            "Azure Speech returned an invalid transcription response.",
            code="azure_stt_invalid_response",
            retryable=True,
            provider="azure",
        ) from exc

    return _extract_transcript(payload)

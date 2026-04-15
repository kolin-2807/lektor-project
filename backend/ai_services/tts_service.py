from __future__ import annotations

import logging
import subprocess
import tempfile
from pathlib import Path
from xml.sax.saxutils import escape as xml_escape

import requests
from django.conf import settings


logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
PIPER_MODEL_PATH = BASE_DIR / "piper_models" / "kk_KZ-raya-x_low.onnx"
PIPER_CONFIG_PATH = BASE_DIR / "piper_models" / "kk_KZ-raya-x_low.onnx.json"
DEFAULT_AZURE_OUTPUT_FORMAT = "audio-24khz-48kbitrate-mono-mp3"


class TTSServiceError(RuntimeError):
    def __init__(
        self,
        message: str,
        *,
        code: str = "tts_error",
        http_status: int = 503,
        retryable: bool = False,
        provider: str = "unknown",
    ):
        super().__init__(message)
        self.code = code
        self.http_status = http_status
        self.retryable = retryable
        self.provider = provider


def _resolve_voice_profile(language: str = "kaz") -> dict[str, str]:
    normalized = (language or "kaz").strip().lower()

    if normalized == "rus":
        return {
            "locale": "ru-RU",
            "voice": settings.AZURE_SPEECH_TTS_VOICE_RU,
        }

    if normalized == "eng":
        return {
            "locale": "en-US",
            "voice": settings.AZURE_SPEECH_TTS_VOICE_EN,
        }

    return {
        "locale": "kk-KZ",
        "voice": settings.AZURE_SPEECH_TTS_VOICE_KK,
    }


def _has_azure_tts_config() -> bool:
    return bool(settings.AZURE_SPEECH_KEY and settings.AZURE_SPEECH_REGION)


def _build_ssml(text: str, locale: str, voice: str) -> str:
    escaped_text = xml_escape((text or "").strip())
    return (
        f"<speak version='1.0' xml:lang='{locale}'>"
        f"<voice name='{voice}'>"
        f"<prosody rate='0%' pitch='0%'>{escaped_text}</prosody>"
        f"</voice>"
        f"</speak>"
    )


def _synthesize_with_azure(text: str, language: str) -> tuple[bytes, str, str]:
    if not _has_azure_tts_config():
        raise TTSServiceError(
            "Azure Speech voice is not configured.",
            code="azure_tts_not_configured",
            http_status=503,
            provider="azure",
        )

    profile = _resolve_voice_profile(language)
    endpoint = (
        f"https://{settings.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1"
    )
    ssml_body = _build_ssml(text, profile["locale"], profile["voice"])

    try:
        response = requests.post(
            endpoint,
            headers={
                "Ocp-Apim-Subscription-Key": settings.AZURE_SPEECH_KEY,
                "Content-Type": "application/ssml+xml",
                "X-Microsoft-OutputFormat": settings.AZURE_SPEECH_TTS_OUTPUT_FORMAT,
                "User-Agent": "lektor-ai-assistant",
            },
            data=ssml_body.encode("utf-8"),
            timeout=45,
        )
    except requests.Timeout as exc:
        raise TTSServiceError(
            "Azure voice synthesis timed out. Please try again.",
            code="azure_tts_timeout",
            http_status=503,
            retryable=True,
            provider="azure",
        ) from exc
    except requests.RequestException as exc:
        raise TTSServiceError(
            "Azure voice service is temporarily unavailable.",
            code="azure_tts_unavailable",
            http_status=503,
            retryable=True,
            provider="azure",
        ) from exc

    if response.ok:
        return response.content, "audio/mpeg", "azure"

    error_text = " ".join(str(response.text or "").split()).strip().lower()
    if response.status_code == 429:
        raise TTSServiceError(
            "Azure Speech rate limit was reached. Please try again shortly.",
            code="azure_tts_rate_limited",
            http_status=429,
            retryable=True,
            provider="azure",
        )
    if response.status_code in {401, 403}:
        raise TTSServiceError(
            "Azure Speech authorization failed. Check the subscription key and region.",
            code="azure_tts_auth_error",
            http_status=503,
            provider="azure",
        )
    if response.status_code == 404:
        raise TTSServiceError(
            "Azure Speech voice or region configuration is invalid.",
            code="azure_tts_config_error",
            http_status=503,
            provider="azure",
        )
    if response.status_code in {500, 502, 503, 504} or any(
        marker in error_text for marker in ("timeout", "unavailable", "overloaded", "busy")
    ):
        raise TTSServiceError(
            "Azure voice service is temporarily busy. Please try again.",
            code="azure_tts_busy",
            http_status=503,
            retryable=True,
            provider="azure",
        )

    raise TTSServiceError(
        response.text or "Azure voice synthesis failed.",
        code="azure_tts_error",
        http_status=503,
        provider="azure",
    )


def _synthesize_with_piper(text: str) -> tuple[bytes, str, str]:
    if not PIPER_MODEL_PATH.exists():
        raise TTSServiceError(
            f"Piper model not found: {PIPER_MODEL_PATH}",
            code="piper_model_missing",
            http_status=503,
            provider="piper",
        )

    if not PIPER_CONFIG_PATH.exists():
        raise TTSServiceError(
            f"Piper config not found: {PIPER_CONFIG_PATH}",
            code="piper_config_missing",
            http_status=503,
            provider="piper",
        )

    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
        output_path = Path(temp_file.name)

    command = [
        "piper",
        "--model",
        str(PIPER_MODEL_PATH),
        "--config",
        str(PIPER_CONFIG_PATH),
        "--output_file",
        str(output_path),
    ]

    try:
        subprocess.run(
            command,
            input=(text or "").strip().encode("utf-8"),
            check=True,
            capture_output=True,
        )
        audio_bytes = output_path.read_bytes()
        return audio_bytes, "audio/wav", "piper"
    except subprocess.CalledProcessError as exc:
        logger.warning(
            "Piper synthesis failed: %s",
            exc.stderr.decode("utf-8", errors="ignore") or exc.stdout.decode("utf-8", errors="ignore"),
        )
        raise TTSServiceError(
            "Local voice synthesis failed.",
            code="piper_failed",
            http_status=503,
            provider="piper",
        ) from exc
    finally:
        try:
            output_path.unlink(missing_ok=True)
        except Exception:
            pass


def synthesize_assistant_speech(text: str, language: str = "kaz") -> tuple[bytes, str, str]:
    clean_text = (text or "").strip()
    if not clean_text:
        raise TTSServiceError("Text is required for speech synthesis.", code="tts_text_missing", http_status=400)

    if _has_azure_tts_config():
        return _synthesize_with_azure(clean_text, language)

    if (language or "kaz").strip().lower() == "kaz":
        return _synthesize_with_piper(clean_text)

    raise TTSServiceError(
        "No speech provider is configured for this language.",
        code="tts_not_configured",
        http_status=503,
    )


def synthesize_kazakh_speech(text: str) -> str:
    audio_bytes, _, _ = _synthesize_with_piper(text)

    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
        temp_file.write(audio_bytes)
        return temp_file.name

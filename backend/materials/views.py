import os
import json
import re
import tempfile
from pathlib import Path
from urllib.parse import quote

from django.conf import settings
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.views.decorators.clickjacking import xframe_options_exempt
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

try:
    from googleapiclient.errors import HttpError
except ImportError:  # pragma: no cover - optional dependency in some environments
    class HttpError(Exception):
        pass

from academics.models import Discipline
from ai_services.assistant_service import detect_assistant_intent
from ai_services.gemini_service import (
    GeminiServiceError,
    generate_slide_outline_from_text,
    generate_test_from_text,
)
from ai_services.stt_service import STTServiceError, transcribe_audio
from ai_services.tts_service import TTSServiceError, synthesize_assistant_speech
from users.models import get_active_google_drive_connection, resolve_google_drive_connection

from .models import Material
from .serializers import MaterialSerializer

MAX_ASSISTANT_COMMAND_CHARS = 500
MAX_ASSISTANT_AUDIO_BYTES = 15 * 1024 * 1024
SUPPORTED_MATERIAL_LANGUAGES = {"kaz", "rus", "eng"}


def _require_google_session(request, owner_email: str = ""):
    connection = (
        resolve_google_drive_connection(request, owner_email=owner_email)
        if owner_email
        else get_active_google_drive_connection(request)
    )

    if connection:
        return connection, None

    return None, Response(
        {"detail": "Google login required."},
        status=status.HTTP_401_UNAUTHORIZED,
    )


def _resolve_material_language(request, material):
    requested_language = str(request.data.get("language") or "").strip().lower()
    discipline_language = str(getattr(material.discipline, "language", "kaz") or "kaz").strip().lower()
    if requested_language in SUPPORTED_MATERIAL_LANGUAGES:
        return requested_language
    if discipline_language in SUPPORTED_MATERIAL_LANGUAGES:
        return discipline_language
    return "kaz"


def _build_material_source_text(material, language: str, connection=None) -> str:
    extracted_text = ""

    if connection and material.drive_file_id:
        from .google_drive_service import download_material_bytes, extract_material_text

        try:
            file_bytes = download_material_bytes(connection, material.drive_file_id, material.mime_type)
            extracted_text = extract_material_text(
                file_bytes,
                material.mime_type,
                material.original_filename,
            ).strip()
        except Exception:
            extracted_text = ""

    content_excerpt = (extracted_text or material.description or material.title)[:20000]

    if language == "rus":
        return f"""
        Discipline: {material.discipline.title}
        Material title: {material.title}
        Description: {material.description}
        Category: {material.category}
        Material text:
        {content_excerpt}
        """

    if language == "eng":
        return f"""
        Discipline: {material.discipline.title}
        Material title: {material.title}
        Description: {material.description}
        Category: {material.category}
        Material text:
        {content_excerpt}
        """

    return f"""
    Pan: {material.discipline.title}
    Material atauy: {material.title}
    Sipattamasy: {material.description}
    Kategoriyasy: {material.category}
    Material matini:
    {content_excerpt}
    """


def _has_sufficient_material_text(material, source_text: str) -> bool:
    normalized_source = " ".join(str(source_text or "").split())
    normalized_title = " ".join(str(material.title or "").split())
    normalized_description = " ".join(str(material.description or "").split())
    normalized_category = " ".join(str(material.category or "").split())
    normalized_discipline = " ".join(str(material.discipline.title or "").split())

    wrappers = [
        "Pan:",
        "Material atauy:",
        "Sipattamasy:",
        "Kategoriyasy:",
        "Material matini:",
        "Discipline:",
        "Material title:",
        "Description:",
        "Category:",
        "Material text:",
        normalized_title,
        normalized_description,
        normalized_category,
        normalized_discipline,
    ]

    cleaned = normalized_source
    for fragment in wrappers:
        if fragment:
            cleaned = cleaned.replace(fragment, " ")

    cleaned = " ".join(cleaned.split())
    return len(cleaned) >= 180


def _parse_total_slide_count(raw_value, default: int = 7) -> int:
    try:
        parsed = int(raw_value or default)
    except (TypeError, ValueError):
        parsed = default
    return max(4, min(parsed, 12))


def _content_slide_count_from_total(total_slide_count: int) -> int:
    return max(2, min(int(total_slide_count or 7) - 2, 10))


def _clear_material_slides(material):
    material.slides_presentation_id = ""
    material.slides_url = ""
    material.slides_embed_url = ""
    material.slides_download_url = ""
    material.slides_count = 0
    material.slides_template_id = "ilector-academic"


def _is_not_found_drive_error(exc) -> bool:
    response = getattr(exc, "resp", None)
    status_code = getattr(response, "status", None)
    return status_code == 404 or "File not found" in str(exc)


def _format_google_api_error(exc, fallback_message: str) -> str:
    if not isinstance(exc, HttpError):
        return str(exc) or fallback_message

    error_text = str(exc)

    if "slides.googleapis.com" in error_text and "SERVICE_DISABLED" in error_text:
        activation_match = re.search(r"https://console\.developers\.google\.com/[^\s\"']+", error_text)
        activation_url = activation_match.group(0) if activation_match else ""
        suffix = f" API-ды мына сілтемемен қосыңыз: {activation_url}" if activation_url else " Google Cloud Console ішінде Google Slides API-ды қосыңыз."
        return (
            "Google Slides API бұл жоба үшін әлі қосылмаған."
            f"{suffix} Қосқаннан кейін 2-5 минут күтіп, қайта байқап көріңіз."
        )

    if "ACCESS_TOKEN_SCOPE_INSUFFICIENT" in error_text or "insufficient authentication scopes" in error_text.lower():
        return "Google рұқсаттары жеткіліксіз. Google Drive-ты қайта қосып, барлық жаңа рұқсаттарды беріңіз."

    return error_text or fallback_message


def _build_gemini_error_response(exc: GeminiServiceError, fallback_message: str):
    payload = {
        "detail": str(exc) or fallback_message,
        "code": exc.code,
        "retryable": bool(exc.retryable),
    }

    if exc.retry_after_seconds:
        payload["retry_after_seconds"] = exc.retry_after_seconds

    response = Response(payload, status=exc.http_status)

    if exc.retry_after_seconds:
        response["Retry-After"] = str(exc.retry_after_seconds)

    return response


def _get_material_preview_kind(material) -> str:
    suffix = Path(material.original_filename or material.title or "").suffix.lower()
    normalized_mime = (material.mime_type or "").lower()

    if normalized_mime.startswith("image/") or suffix in {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg"}:
        return "image"
    if normalized_mime == "application/pdf" or suffix == ".pdf":
        return "pdf"
    if normalized_mime.startswith("video/") or suffix in {".mp4", ".webm", ".ogg", ".mov"}:
        return "video"
    if normalized_mime.startswith("audio/") or suffix in {".mp3", ".wav", ".oga", ".m4a"}:
        return "audio"
    if normalized_mime.startswith("text/") or suffix in {".txt", ".md", ".csv", ".json", ".xml", ".html"}:
        return "text"

    return "external"


def _parse_assistant_context(raw_context) -> dict:
    if isinstance(raw_context, dict):
        return raw_context

    if isinstance(raw_context, str) and raw_context.strip():
        try:
            parsed = json.loads(raw_context)
            return parsed if isinstance(parsed, dict) else {}
        except json.JSONDecodeError:
            return {}

    return {}


@api_view(["GET"])
def material_list(request):
    connection, auth_error = _require_google_session(request)
    if auth_error:
        return auth_error

    queryset = Material.objects.filter(
        owner_email__iexact=connection.google_email
    ).order_by("title")

    discipline_id = request.GET.get("discipline_id")
    if discipline_id:
        queryset = queryset.filter(discipline_id=discipline_id)

    serializer = MaterialSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(["POST"])
def upload_material(request):
    connection, auth_error = _require_google_session(request)
    if auth_error:
        return auth_error

    discipline_id = request.data.get("discipline")
    category = (request.data.get("category") or "").strip().lower()
    description = (request.data.get("description") or "").strip()
    uploaded_files = request.FILES.getlist("files")

    if not uploaded_files:
        single_file = request.FILES.get("file")
        if single_file:
            uploaded_files = [single_file]

    if not discipline_id or not uploaded_files:
        return Response({"detail": "Discipline and file are required."}, status=400)

    allowed_categories = {choice[0] for choice in Material.CATEGORY_CHOICES}
    if category not in allowed_categories:
        return Response({"detail": "Material category is invalid."}, status=400)

    discipline = get_object_or_404(
        Discipline,
        id=discipline_id,
        owner_email__iexact=connection.google_email,
    )
    created_materials = []
    errors = []
    max_upload_bytes = int(getattr(settings, "MAX_MATERIAL_UPLOAD_BYTES", 50 * 1024 * 1024))

    for uploaded_file in uploaded_files:
        if max_upload_bytes > 0 and getattr(uploaded_file, "size", 0) > max_upload_bytes:
            errors.append(
                {
                    "filename": Path(getattr(uploaded_file, "name", "material")).name,
                    "detail": f"File is too large. Maximum allowed size is {max_upload_bytes // (1024 * 1024)} MB.",
                }
            )
            continue

        try:
            from .google_drive_service import upload_material_file

            drive_meta = upload_material_file(connection, discipline, category, uploaded_file)

            material = Material.objects.create(
                discipline=discipline,
                title=drive_meta["title"] or Path(uploaded_file.name).stem,
                category=category,
                cloud_url=drive_meta["cloud_url"],
                description=description,
                drive_file_id=drive_meta["file_id"],
                drive_folder_id=drive_meta["folder_id"],
                mime_type=drive_meta["mime_type"],
                original_filename=drive_meta["original_filename"],
                owner_email=connection.google_email,
            )
            created_materials.append(material)
        except Exception as error:
            errors.append(
                {
                    "filename": Path(getattr(uploaded_file, "name", "material")).name,
                    "detail": _format_google_api_error(error, "Material upload failed."),
                }
            )

    if not created_materials:
        first_error_detail = errors[0]["detail"] if errors else "Material upload failed."
        return Response(
            {
                "detail": first_error_detail,
                "errors": errors,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    serializer = MaterialSerializer(created_materials, many=True)
    response_status = status.HTTP_201_CREATED if not errors else 207
    return Response(
        {
            "created": serializer.data,
            "uploaded_count": len(created_materials),
            "errors": errors,
        },
        status=response_status,
    )


@xframe_options_exempt
@api_view(["GET"])
def preview_material(request, material_id):
    material = get_object_or_404(Material, id=material_id)
    connection, auth_error = _require_google_session(request, owner_email=material.owner_email)
    if auth_error:
        return auth_error

    if not material.drive_file_id:
        if material.cloud_url:
            return HttpResponseRedirect(material.cloud_url)
        return Response({"detail": "Material preview is unavailable."}, status=status.HTTP_404_NOT_FOUND)

    preview_kind = _get_material_preview_kind(material)
    if preview_kind == "external":
        if material.cloud_url:
            return HttpResponseRedirect(material.cloud_url)
        return Response({"detail": "Material preview is unavailable."}, status=status.HTTP_404_NOT_FOUND)

    try:
        from .google_drive_service import download_material_bytes

        file_bytes = download_material_bytes(connection, material.drive_file_id, material.mime_type)
    except Exception as exc:
        return Response(
            {"detail": _format_google_api_error(exc, "Material preview failed")},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    filename = Path(material.original_filename or material.title or "material").name
    response = HttpResponse(file_bytes, content_type=material.mime_type or "application/octet-stream")
    response["Content-Disposition"] = f"inline; filename*=UTF-8''{quote(filename)}"
    return response


@api_view(["DELETE"])
def delete_material(request, material_id):
    material = get_object_or_404(Material, id=material_id)
    connection, auth_error = _require_google_session(request, owner_email=material.owner_email)
    if auth_error:
        return auth_error

    if connection and material.slides_presentation_id:
        try:
            from .google_drive_service import delete_material_file

            delete_material_file(connection, material.slides_presentation_id)
        except Exception:
            pass

    if connection and material.drive_file_id:
        try:
            from .google_drive_service import delete_material_file

            delete_material_file(connection, material.drive_file_id)
        except Exception:
            pass

    material.delete()
    return Response({"success": True})


@api_view(["POST"])
def generate_material_test(request, material_id):
    material = get_object_or_404(Material, id=material_id)
    language = _resolve_material_language(request, material)

    try:
        question_count = int(request.data.get("question_count") or 5)
    except (TypeError, ValueError):
        question_count = 5
    question_count = max(3, min(question_count, 25))

    connection, auth_error = _require_google_session(request, owner_email=material.owner_email)
    if auth_error:
        return auth_error
    source_text = _build_material_source_text(material, language, connection=connection)

    if not _has_sufficient_material_text(material, source_text):
        return Response(
            {
                "detail": (
                    "Материал мәтіні толық оқылмады. Тест сұрақтары сапалы шығуы үшін файлдың ішкі мәтінін "
                    "ашуға болатын DOCX, PPTX, PDF немесе мәтіндік форматты жүктеп, қайта көріңіз."
                )
            },
            status=400,
        )

    try:
        result = generate_test_from_text(source_text, language=language, question_count=question_count)
        return Response({"test": result})
    except GeminiServiceError as exc:
        return _build_gemini_error_response(exc, "AI test generation failed")
    except (json.JSONDecodeError, ValueError) as exc:
        return Response(
            {
                "detail": str(exc) or "AI returned an invalid test format. Please try again.",
                "code": "ai_invalid_test_response",
                "retryable": True,
            },
            status=503,
        )
    except Exception as exc:
        return Response(
            {"detail": str(exc) or "AI test generation failed"},
            status=503,
        )


@api_view(["POST"])
def generate_material_slides(request, material_id):
    material = get_object_or_404(Material, id=material_id)

    connection, auth_error = _require_google_session(request, owner_email=material.owner_email)
    if auth_error:
        return auth_error

    if material.category != "lecture":
        return Response({"detail": "Slides are available only for lecture materials."}, status=400)

    requested_total_slide_count = _parse_total_slide_count(request.data.get("slide_count"), default=7)
    requested_template_id = str(request.data.get("template_id") or "ilector-academic").strip()
    if requested_template_id not in {"ilector-academic", "ilector-minimal", "ilector-focus"}:
        requested_template_id = "ilector-academic"

    has_existing_slides = bool(material.slides_presentation_id and material.slides_url and material.slides_embed_url)
    if has_existing_slides and material.slides_count == requested_total_slide_count:
        should_update_template = (
            material.slides_template_id != requested_template_id
            or requested_template_id in {"ilector-academic", "ilector-focus", "ilector-minimal"}
        )
        if should_update_template:
            try:
                from .google_slides_service import update_presentation_template

                language = _resolve_material_language(request, material)
                update_presentation_template(
                    connection=connection,
                    presentation_id=material.slides_presentation_id,
                    total_slide_count=requested_total_slide_count,
                    template_id=requested_template_id,
                    language=language,
                )
                material.slides_template_id = requested_template_id
                material.save(update_fields=["slides_template_id"])
            except Exception as exc:
                return Response(
                    {"detail": _format_google_api_error(exc, "Slide template update failed")},
                    status=503,
                )

        return Response(MaterialSerializer(material).data)

    if has_existing_slides:
        if not material.slides_count:
            material.slides_count = requested_total_slide_count
            material.slides_template_id = requested_template_id
            material.save(update_fields=["slides_count", "slides_template_id"])
        return Response(MaterialSerializer(material).data)

    language = _resolve_material_language(request, material)
    source_text = _build_material_source_text(material, language, connection=connection)

    if not _has_sufficient_material_text(material, source_text):
        return Response(
            {
                "detail": (
                    "Материал мәтіні толық оқылмады. Слайд сапалы шығуы үшін DOCX, PPTX, PDF немесе мәтіндік форматтағы "
                    "файлды жүктеп, қайта көріңіз."
                )
            },
            status=400,
        )

    try:
        from .google_slides_service import create_presentation_from_outline
        from .google_drive_service import ensure_slide_output_folder

        _, slides_folder_id = ensure_slide_output_folder(connection, material.discipline)
        outline = generate_slide_outline_from_text(
            source_text,
            language=language,
            slide_count=_content_slide_count_from_total(requested_total_slide_count),
        )
        presentation_title = (outline.get("presentation_title") or material.title or "AI Slides").strip()
        presentation_subtitle = (
            outline.get("presentation_subtitle")
            or f"{material.discipline.title} - {material.title}"
        ).strip()
        content_slides = outline.get("slides") or []

        if not content_slides:
            raise ValueError("Slide outline is empty.")

        presentation_meta = create_presentation_from_outline(
            connection=connection,
            title=presentation_title,
            subtitle=presentation_subtitle,
            slides=content_slides,
            folder_id=slides_folder_id,
            language=language,
            template_id=requested_template_id,
        )

        material.slides_presentation_id = presentation_meta.get("presentation_id", "")
        material.slides_url = presentation_meta.get("slides_url", "")
        material.slides_embed_url = presentation_meta.get("slides_embed_url", "")
        material.slides_download_url = presentation_meta.get("slides_download_url", "")
        material.slides_count = requested_total_slide_count
        material.slides_template_id = requested_template_id
        material.save(
            update_fields=[
                "slides_presentation_id",
                "slides_url",
                "slides_embed_url",
                "slides_download_url",
                "slides_count",
                "slides_template_id",
            ]
        )
    except GeminiServiceError as exc:
        return _build_gemini_error_response(exc, "AI slide generation failed")
    except Exception as exc:
        return Response(
            {"detail": _format_google_api_error(exc, "AI slide generation failed")},
            status=503,
        )

    return Response(MaterialSerializer(material).data)


@api_view(["POST"])
def reset_material_slides(request, material_id):
    material = get_object_or_404(Material, id=material_id)

    connection, auth_error = _require_google_session(request, owner_email=material.owner_email)
    if auth_error:
        return auth_error

    if material.slides_presentation_id:
        try:
            from .google_drive_service import delete_material_file

            delete_material_file(connection, material.slides_presentation_id)
        except Exception as exc:
            if not _is_not_found_drive_error(exc):
                return Response(
                    {"detail": _format_google_api_error(exc, "Slide reset failed")},
                    status=503,
                )

    _clear_material_slides(material)
    material.save(
        update_fields=[
            "slides_presentation_id",
            "slides_url",
            "slides_embed_url",
            "slides_download_url",
            "slides_count",
            "slides_template_id",
        ]
    )
    return Response(MaterialSerializer(material).data)


@api_view(["POST"])
def assistant_command(request):
    user_text = str(request.data.get("text") or "").strip()
    assistant_context = _parse_assistant_context(request.data.get("context"))

    if not user_text:
        return Response({"error": "Text is required"}, status=400)

    if len(user_text) > MAX_ASSISTANT_COMMAND_CHARS:
        return Response(
            {"detail": "Assistant command is too long."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        result = detect_assistant_intent(user_text, context=assistant_context)
    except Exception as exc:
        return Response(
            {"detail": str(exc) or "AI assistant is temporarily unavailable."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    return Response(result)


@api_view(["POST"])
def transcribe_voice(request):
    audio_file = request.FILES.get("audio")

    if not audio_file:
        return Response({"error": "Audio file is required"}, status=400)

    if getattr(audio_file, "size", 0) <= 0:
        return Response({"error": "Audio file is empty."}, status=400)

    if getattr(audio_file, "size", 0) > MAX_ASSISTANT_AUDIO_BYTES:
        return Response(
            {"detail": "Audio file is too large."},
            status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
        )

    suffix = Path(audio_file.name or "voice.webm").suffix or ".webm"
    temp_path = ""

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as destination:
        temp_path = destination.name
        for chunk in audio_file.chunks():
            destination.write(chunk)

    try:
        text = transcribe_audio(
            temp_path,
            filename=getattr(audio_file, "name", "voice.webm"),
            content_type=getattr(audio_file, "content_type", "") or None,
            locale=str(request.data.get("language") or "").strip() or None,
        )
        return Response({"text": text})
    except STTServiceError as exc:
        return Response(
            {
                "detail": str(exc),
                "code": exc.code,
                "retryable": bool(exc.retryable),
                "provider": exc.provider,
            },
            status=exc.http_status,
        )
    except Exception as exc:
        return Response(
            {"detail": str(exc) or "Speech-to-text service is temporarily unavailable."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@api_view(["POST"])
def speak_assistant_reply(request):
    text = str(request.data.get("text") or "").strip()
    language = str(request.data.get("language") or "kaz").strip().lower()

    if not text:
        return Response({"detail": "Text is required."}, status=status.HTTP_400_BAD_REQUEST)

    if len(text) > MAX_ASSISTANT_COMMAND_CHARS:
        return Response(
            {"detail": "Speech text is too long."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        audio_bytes, mime_type, provider = synthesize_assistant_speech(text, language=language)
    except TTSServiceError as exc:
        return Response(
            {
                "detail": str(exc),
                "code": exc.code,
                "retryable": bool(exc.retryable),
                "provider": exc.provider,
            },
            status=exc.http_status,
        )

    response = HttpResponse(audio_bytes, content_type=mime_type)
    response["Cache-Control"] = "no-store"
    response["X-TTS-Provider"] = provider
    return response

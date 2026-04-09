import os
import json
import re
import tempfile
from pathlib import Path
from urllib.parse import quote

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
from ai_services.gemini_service import generate_slide_outline_from_text, generate_test_from_text
from ai_services.stt_service import transcribe_audio
from users.models import get_active_google_drive_connection, resolve_google_drive_connection

from .models import Material
from .serializers import MaterialSerializer

MAX_ASSISTANT_COMMAND_CHARS = 500
MAX_ASSISTANT_AUDIO_BYTES = 15 * 1024 * 1024


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
    requested_language = request.data.get("language")
    return requested_language if requested_language in {"kaz", "rus"} else material.discipline.language


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

    return f"""
    Pan: {material.discipline.title}
    Material atauy: {material.title}
    Sipattamasy: {material.description}
    Kategoriyasy: {material.category}
    Material matini:
    {content_excerpt}
    """


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

    for uploaded_file in uploaded_files:
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

    try:
        result = generate_test_from_text(source_text, language=language, question_count=question_count)
        return Response({"test": result})
    except Exception as exc:
        return Response(
            {"detail": str(exc) or "AI test generation failed"},
            status=503,
        )


@api_view(["POST"])
def generate_material_slides(request, material_id):
    material = get_object_or_404(Material, id=material_id)

    if material.category != "lecture":
        return Response({"detail": "Slides are available only for lecture materials."}, status=400)

    connection, auth_error = _require_google_session(request, owner_email=material.owner_email)
    if auth_error:
        return auth_error

    language = _resolve_material_language(request, material)
    source_text = _build_material_source_text(material, language, connection=connection)

    try:
        from .google_slides_service import create_presentation_from_outline

        outline = generate_slide_outline_from_text(source_text, language=language, slide_count=7)
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
            folder_id=material.drive_folder_id,
            language=language,
        )

        material.slides_presentation_id = presentation_meta.get("presentation_id", "")
        material.slides_url = presentation_meta.get("slides_url", "")
        material.slides_embed_url = presentation_meta.get("slides_embed_url", "")
        material.slides_download_url = presentation_meta.get("slides_download_url", "")
        material.save(
            update_fields=[
                "slides_presentation_id",
                "slides_url",
                "slides_embed_url",
                "slides_download_url",
            ]
        )
    except Exception as exc:
        return Response(
            {"detail": _format_google_api_error(exc, "AI slide generation failed")},
            status=503,
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
        text = transcribe_audio(temp_path)
        return Response({"text": text})
    except Exception as exc:
        return Response(
            {"detail": str(exc) or "Speech-to-text service is temporarily unavailable."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

import os
import re
from pathlib import Path

from django.shortcuts import get_object_or_404
from googleapiclient.errors import HttpError
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from academics.models import Discipline
from ai_services.assistant_service import detect_assistant_intent
from ai_services.gemini_service import generate_slide_outline_from_text, generate_test_from_text
from ai_services.stt_service import transcribe_audio
from users.models import get_active_google_drive_connection, resolve_google_drive_connection

from .google_drive_service import (
    delete_material_file,
    download_material_bytes,
    extract_material_text,
    upload_material_file,
)
from .google_slides_service import create_presentation_from_outline
from .models import Material
from .serializers import MaterialSerializer


def _resolve_material_language(request, material):
    requested_language = request.data.get("language")
    return requested_language if requested_language in {"kaz", "rus"} else material.discipline.language


def _build_material_source_text(material, language: str, connection=None) -> str:
    extracted_text = ""

    if connection and material.drive_file_id:
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


@api_view(["GET"])
def material_list(request):
    queryset = Material.objects.all().order_by("title")

    discipline_id = request.GET.get("discipline_id")
    if discipline_id:
        queryset = queryset.filter(discipline_id=discipline_id)

    serializer = MaterialSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(["POST"])
def upload_material(request):
    connection = get_active_google_drive_connection(request)
    if not connection:
        return Response({"detail": "Google Drive is not connected."}, status=401)

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

    discipline = get_object_or_404(Discipline, id=discipline_id)
    created_materials = []
    errors = []

    for uploaded_file in uploaded_files:
        try:
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
                    "detail": str(error),
                }
            )

    if not created_materials:
        return Response(
            {
                "detail": "Material upload failed.",
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


@api_view(["DELETE"])
def delete_material(request, material_id):
    material = get_object_or_404(Material, id=material_id)
    connection = get_active_google_drive_connection(request)

    if connection and material.drive_file_id:
        try:
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

    connection = resolve_google_drive_connection(request, owner_email=material.owner_email)
    if material.drive_file_id and not connection:
        return Response(
            {"detail": "Осы материалды жүктеген Google аккаунтымен қайта қосылыңыз."},
            status=401,
        )
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

    connection = resolve_google_drive_connection(request, owner_email=material.owner_email)
    if not connection:
        return Response(
            {"detail": "Осы материалды жүктеген Google аккаунтымен қайта қосылыңыз."},
            status=401,
        )

    language = _resolve_material_language(request, material)
    source_text = _build_material_source_text(material, language, connection=connection)

    try:
        outline = generate_slide_outline_from_text(source_text, language=language, slide_count=6)
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
    user_text = request.data.get("text", "").strip()

    if not user_text:
        return Response({"error": "Text is required"}, status=400)

    result = detect_assistant_intent(user_text)
    return Response(result)


@api_view(["POST"])
def transcribe_voice(request):
    audio_file = request.FILES.get("audio")

    if not audio_file:
        return Response({"error": "Audio file is required"}, status=400)

    temp_path = f"temp_{audio_file.name}"

    with open(temp_path, "wb+") as destination:
        for chunk in audio_file.chunks():
            destination.write(chunk)

    try:
        text = transcribe_audio(temp_path)
        return Response({"text": text})
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

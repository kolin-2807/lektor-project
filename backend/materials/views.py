import os

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ai_services.assistant_service import detect_assistant_intent
from ai_services.gemini_service import generate_test_from_text
from ai_services.stt_service import transcribe_audio
from .models import Material
from .serializers import MaterialSerializer


@api_view(["GET"])
def material_list(request):
    queryset = Material.objects.all().order_by("title")

    discipline_id = request.GET.get("discipline_id")
    if discipline_id:
        queryset = queryset.filter(discipline_id=discipline_id)

    serializer = MaterialSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(["POST"])
def generate_material_test(request, material_id):
    material = get_object_or_404(Material, id=material_id)
    requested_language = request.data.get("language")
    language = requested_language if requested_language in {"kaz", "rus"} else material.discipline.language

    if language == "rus":
        source_text = f"""
        Дисциплина: {material.discipline.title}
        Название материала: {material.title}
        Описание: {material.description}
        Категория: {material.category}
        """
    else:
        source_text = f"""
        Пән: {material.discipline.title}
        Материал атауы: {material.title}
        Сипаттамасы: {material.description}
        Категориясы: {material.category}
        """

    result = generate_test_from_text(source_text, language=language)
    return Response({"test": result})


@api_view(["POST"])
def assistant_command(request):
    user_text = request.data.get("text", "").strip()

    if not user_text:
        return Response({"error": "Мәтін жіберілмеді"}, status=400)

    result = detect_assistant_intent(user_text)
    return Response(result)


@api_view(["POST"])
def transcribe_voice(request):
    audio_file = request.FILES.get("audio")

    if not audio_file:
        return Response({"error": "Аудио файл жіберілмеді"}, status=400)

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

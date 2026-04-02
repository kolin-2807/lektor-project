from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Course, Discipline
from .serializers import CourseSerializer, DisciplineSerializer


@api_view(["GET"])
def course_list(request):
    courses = Course.objects.all().order_by("number")
    serializer = CourseSerializer(courses, many=True)
    return Response(serializer.data)


@api_view(["GET", "POST"])
def discipline_list(request):
    if request.method == "POST":
        serializer = DisciplineSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    queryset = Discipline.objects.all().order_by("title")

    course_id = request.GET.get("course_id")
    if course_id:
        queryset = queryset.filter(course_id=course_id)

    language = request.GET.get("language")
    if language in {"kaz", "rus"}:
        queryset = queryset.filter(language=language)

    serializer = DisciplineSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(["PATCH", "DELETE"])
def discipline_detail(request, pk):
    discipline = get_object_or_404(Discipline, pk=pk)

    if request.method == "PATCH":
        serializer = DisciplineSerializer(discipline, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    discipline.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

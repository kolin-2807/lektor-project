from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Course, Discipline
from .serializers import CourseSerializer, DisciplineSerializer


@api_view(["GET"])
def course_list(request):
    courses = Course.objects.all().order_by("number")
    serializer = CourseSerializer(courses, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def discipline_list(request):
    queryset = Discipline.objects.all().order_by("title")

    course_id = request.GET.get("course_id")
    if course_id:
        queryset = queryset.filter(course_id=course_id)

    language = request.GET.get("language")
    if language in {"kaz", "rus"}:
        queryset = queryset.filter(language=language)

    serializer = DisciplineSerializer(queryset, many=True)
    return Response(serializer.data)

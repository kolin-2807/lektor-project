from rest_framework import serializers
from .models import Course, Discipline


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ["id", "number"]


class DisciplineSerializer(serializers.ModelSerializer):
    course_number = serializers.IntegerField(source="course.number", read_only=True)

    class Meta:
        model = Discipline
        fields = ["id", "title", "description", "course", "course_number"]
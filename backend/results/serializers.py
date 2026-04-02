from rest_framework import serializers
from .models import Result, TestAttempt, TestSession


class ResultSerializer(serializers.ModelSerializer):
    discipline_title = serializers.CharField(source="discipline.title", read_only=True)

    class Meta:
        model = Result
        fields = [
            "id",
            "title",
            "average_score",
            "participant_count",
            "highest_score",
            "created_at",
            "discipline",
            "discipline_title",
        ]
class TestSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestSession
        fields = "__all__"


class TestAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestAttempt
        fields = "__all__"

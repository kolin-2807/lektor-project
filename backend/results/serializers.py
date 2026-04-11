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
    session_status = serializers.SerializerMethodField()
    remaining_seconds = serializers.SerializerMethodField()

    class Meta:
        model = TestSession
        fields = [
            "id",
            "material",
            "title",
            "access_token",
            "form_id",
            "form_url",
            "results_sheet_url",
            "questions_json",
            "question_count",
            "duration_minutes",
            "public_started_at",
            "public_expires_at",
            "created_at",
            "session_status",
            "remaining_seconds",
        ]

    def get_session_status(self, obj):
        return obj.get_public_status()

    def get_remaining_seconds(self, obj):
        return obj.get_remaining_seconds()


class TestAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestAttempt
        fields = "__all__"

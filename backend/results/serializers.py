from rest_framework import serializers
from .models import Result


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
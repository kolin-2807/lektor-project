from rest_framework import serializers
from .models import Material


class MaterialSerializer(serializers.ModelSerializer):
    discipline_title = serializers.CharField(source="discipline.title", read_only=True)

    class Meta:
        model = Material
        fields = [
            "id",
            "title",
            "category",
            "cloud_url",
            "description",
            "created_at",
            "discipline",
            "discipline_title",
            "form_url",
            "results_sheet_url",
            "slides_presentation_id",
            "slides_url",
            "slides_embed_url",
            "slides_download_url",
            "slides_count",
            "drive_file_id",
            "drive_folder_id",
            "mime_type",
            "original_filename",
            "owner_email",
        ]

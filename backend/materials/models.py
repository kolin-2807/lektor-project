from django.db import models
from academics.models import Discipline


class Material(models.Model):
    CATEGORY_CHOICES = [
        ("lecture", "Дәріс"),
        ("practice", "Практикалық жұмыс"),
        ("lab", "Зертханалық жұмыс"),
    ]

    discipline = models.ForeignKey(
        Discipline,
        on_delete=models.CASCADE,
        related_name="materials"
    )
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    cloud_url = models.URLField()
    description = models.TextField(blank=True)
    form_url = models.URLField(blank=True)
    results_sheet_url = models.URLField(blank=True)
    slides_presentation_id = models.CharField(max_length=255, blank=True)
    slides_url = models.URLField(blank=True)
    slides_embed_url = models.URLField(blank=True)
    slides_download_url = models.URLField(blank=True)
    slides_count = models.PositiveSmallIntegerField(default=0)
    drive_file_id = models.CharField(max_length=255, blank=True)
    drive_folder_id = models.CharField(max_length=255, blank=True)
    mime_type = models.CharField(max_length=255, blank=True)
    original_filename = models.CharField(max_length=255, blank=True)
    owner_email = models.EmailField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

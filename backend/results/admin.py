from django.contrib import admin
from .models import Result


@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "discipline", "average_score", "participant_count", "highest_score", "created_at")
    list_filter = ("discipline", "created_at")
    search_fields = ("title",)
from django.contrib import admin
from .models import Result, TestAttempt, TestSession


@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "discipline", "average_score", "participant_count", "highest_score", "created_at")
    list_filter = ("discipline", "created_at")
    search_fields = ("title",)


@admin.register(TestSession)
class TestSessionAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "material", "question_count", "duration_minutes", "created_at")
    search_fields = ("title",)


@admin.register(TestAttempt)
class TestAttemptAdmin(admin.ModelAdmin):
    list_display = ("id", "session", "student_name", "score", "max_score", "status", "started_at", "submitted_at")
    list_filter = ("status", "started_at", "submitted_at")
    search_fields = ("student_name", "session__title")

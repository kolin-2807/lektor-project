import uuid
from datetime import timedelta

from django.db import models
from django.utils import timezone
from academics.models import Discipline


class Result(models.Model):
    discipline = models.ForeignKey(
        Discipline,
        on_delete=models.CASCADE,
        related_name="results"
    )
    title = models.CharField(max_length=255)
    average_score = models.PositiveSmallIntegerField(default=0)
    participant_count = models.PositiveSmallIntegerField(default=0)
    highest_score = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class TestSession(models.Model):
    material = models.ForeignKey(
        "materials.Material",
        on_delete=models.CASCADE,
        related_name="test_sessions"
    )
    title = models.CharField(max_length=255)
    access_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    form_id = models.CharField(max_length=255, blank=True)
    form_url = models.URLField(blank=True)
    results_sheet_url = models.URLField(blank=True)
    questions_json = models.JSONField(default=list, blank=True)
    question_count = models.PositiveSmallIntegerField(default=5)
    duration_minutes = models.PositiveSmallIntegerField(default=20)
    public_started_at = models.DateTimeField(null=True, blank=True)
    public_expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    def get_remaining_seconds(self, now=None) -> int:
        if not self.public_expires_at:
            return self.duration_minutes * 60

        now = now or timezone.now()
        remaining = int((self.public_expires_at - now).total_seconds())
        return max(0, remaining)

    def get_public_status(self, now=None) -> str:
        if not self.public_started_at or not self.public_expires_at:
            return "ready"
        return "live" if self.get_remaining_seconds(now=now) > 0 else "expired"

    def launch_public_window(self, now=None):
        now = now or timezone.now()
        self.public_started_at = now
        self.public_expires_at = now + timedelta(minutes=self.duration_minutes)
        return self


class TestAttempt(models.Model):
    STATUS_STARTED = "started"
    STATUS_SUBMITTED = "submitted"
    STATUS_EXPIRED = "expired"
    STATUS_CHOICES = [
      (STATUS_STARTED, "Started"),
      (STATUS_SUBMITTED, "Submitted"),
      (STATUS_EXPIRED, "Expired"),
    ]

    session = models.ForeignKey(
        TestSession,
        on_delete=models.CASCADE,
        related_name="attempts"
    )
    student_name = models.CharField(max_length=255)
    student_identifier = models.CharField(max_length=255)
    device_identifier = models.CharField(max_length=255, blank=True, default="")
    attempt_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    answers_json = models.JSONField(default=list, blank=True)
    score = models.PositiveSmallIntegerField(default=0)
    max_score = models.PositiveSmallIntegerField(default=0)
    time_spent_seconds = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_STARTED)
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["session", "student_identifier"],
                name="unique_student_attempt_per_session",
            )
        ]

    def __str__(self):
        return f"{self.student_name} - {self.session.title}"

from django.db import models
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
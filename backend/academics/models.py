from django.db import models


class Course(models.Model):
    number = models.PositiveSmallIntegerField(unique=True)

    def __str__(self):
        return f"{self.number} курс"


class Discipline(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="disciplines"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    language = models.CharField(
        max_length=10,
        choices=[
            ("kaz", "Kazakh"),
            ("rus", "Russian"),
        ],
        default="kaz"
    )

    def __str__(self):
        return self.title
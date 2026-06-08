from django.db import models


DEFAULT_COURSE_NUMBERS = (1, 2, 3, 4)


class Course(models.Model):
    number = models.PositiveSmallIntegerField(unique=True)

    def __str__(self):
        return f"{self.number} курс"


def ensure_default_courses():
    existing_numbers = set(
        Course.objects.filter(number__in=DEFAULT_COURSE_NUMBERS).values_list("number", flat=True)
    )
    missing_courses = [
        Course(number=number)
        for number in DEFAULT_COURSE_NUMBERS
        if number not in existing_numbers
    ]

    if missing_courses:
        Course.objects.bulk_create(missing_courses, ignore_conflicts=True)


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
            ("eng", "English"),
        ],
        default="kaz"
    )
    owner_email = models.EmailField(blank=True, db_index=True)

    def __str__(self):
        return self.title

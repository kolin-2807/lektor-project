from django.db import migrations


DEFAULT_COURSE_NUMBERS = (1, 2, 3, 4)


def seed_default_courses(apps, schema_editor):
    Course = apps.get_model("academics", "Course")
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


class Migration(migrations.Migration):

    dependencies = [
        ("academics", "0005_alter_discipline_language"),
    ]

    operations = [
        migrations.RunPython(seed_default_courses, migrations.RunPython.noop),
    ]

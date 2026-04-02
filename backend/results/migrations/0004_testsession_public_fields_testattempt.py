import uuid

from django.db import migrations, models
import django.db.models.deletion


def seed_access_tokens(apps, schema_editor):
    TestSession = apps.get_model("results", "TestSession")
    for session in TestSession.objects.filter(access_token__isnull=True):
        session.access_token = uuid.uuid4()
        session.save(update_fields=["access_token"])


class Migration(migrations.Migration):

    dependencies = [
        ("results", "0003_testsession_form_id"),
    ]

    operations = [
        migrations.AddField(
            model_name="testsession",
            name="access_token",
            field=models.UUIDField(blank=True, editable=False, null=True),
        ),
        migrations.AddField(
            model_name="testsession",
            name="duration_minutes",
            field=models.PositiveSmallIntegerField(default=20),
        ),
        migrations.AddField(
            model_name="testsession",
            name="question_count",
            field=models.PositiveSmallIntegerField(default=5),
        ),
        migrations.RunPython(seed_access_tokens, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="testsession",
            name="access_token",
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True),
        ),
        migrations.CreateModel(
            name="TestAttempt",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("student_name", models.CharField(max_length=255)),
                ("student_identifier", models.CharField(max_length=255)),
                ("attempt_token", models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ("answers_json", models.JSONField(blank=True, default=list)),
                ("score", models.PositiveSmallIntegerField(default=0)),
                ("max_score", models.PositiveSmallIntegerField(default=0)),
                ("time_spent_seconds", models.PositiveIntegerField(default=0)),
                (
                    "status",
                    models.CharField(
                        choices=[("started", "Started"), ("submitted", "Submitted"), ("expired", "Expired")],
                        default="started",
                        max_length=20,
                    ),
                ),
                ("started_at", models.DateTimeField(auto_now_add=True)),
                ("submitted_at", models.DateTimeField(blank=True, null=True)),
                (
                    "session",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="attempts",
                        to="results.testsession",
                    ),
                ),
            ],
        ),
        migrations.AddConstraint(
            model_name="testattempt",
            constraint=models.UniqueConstraint(
                fields=("session", "student_identifier"),
                name="unique_student_attempt_per_session",
            ),
        ),
    ]

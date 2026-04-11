from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("results", "0004_testsession_public_fields_testattempt"),
    ]

    operations = [
        migrations.AddField(
            model_name="testattempt",
            name="device_identifier",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="testsession",
            name="public_expires_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="testsession",
            name="public_started_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("materials", "0007_material_slides_template_id"),
    ]

    operations = [
        migrations.AddField(
            model_name="material",
            name="slides_outline_json",
            field=models.JSONField(blank=True, default=dict),
        ),
    ]

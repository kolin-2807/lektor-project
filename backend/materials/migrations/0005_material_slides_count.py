from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("materials", "0004_material_slides_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="material",
            name="slides_count",
            field=models.PositiveSmallIntegerField(default=0),
        ),
    ]

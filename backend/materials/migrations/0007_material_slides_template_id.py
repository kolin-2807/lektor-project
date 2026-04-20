from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("materials", "0006_alter_material_category_choices"),
    ]

    operations = [
        migrations.AddField(
            model_name="material",
            name="slides_template_id",
            field=models.CharField(default="ilector-academic", max_length=64),
        ),
    ]

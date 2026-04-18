from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("materials", "0005_material_slides_count"),
    ]

    operations = [
        migrations.AlterField(
            model_name="material",
            name="category",
            field=models.CharField(
                choices=[
                    ("lecture", "Дәріс"),
                    ("practice", "Практикалық жұмыс"),
                    ("lab", "Зертханалық жұмыс"),
                ],
                max_length=20,
            ),
        ),
    ]

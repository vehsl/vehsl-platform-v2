from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0010_productmedia_document_metadata"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="weight_grams",
            field=models.PositiveIntegerField(default=500),
        ),
        migrations.AddField(
            model_name="product",
            name="ship_time_min_days",
            field=models.PositiveIntegerField(default=2),
        ),
        migrations.AddField(
            model_name="product",
            name="ship_time_max_days",
            field=models.PositiveIntegerField(default=3),
        ),
        migrations.AddField(
            model_name="product",
            name="sample_available",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="product",
            name="sample_ship_days",
            field=models.PositiveIntegerField(default=3),
        ),
    ]


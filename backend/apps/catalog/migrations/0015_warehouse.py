from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0014_delete_productreview"),
    ]

    operations = [
        migrations.CreateModel(
            name="Warehouse",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=160)),
                ("code", models.SlugField(blank=True, max_length=180, unique=True)),
                ("country", models.CharField(blank=True, max_length=64)),
                ("region", models.CharField(blank=True, max_length=64)),
                ("city", models.CharField(blank=True, max_length=64)),
                ("street1", models.CharField(blank=True, max_length=128)),
                ("street2", models.CharField(blank=True, max_length=128)),
                ("postal_code", models.CharField(blank=True, max_length=32)),
                ("active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["country", "city", "name"],
            },
        ),
        migrations.AddIndex(
            model_name="warehouse",
            index=models.Index(fields=["active", "country", "city"], name="warehouse_active_country_city"),
        ),
    ]

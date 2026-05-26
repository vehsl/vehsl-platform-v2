from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0012_productreview"),
    ]

    operations = [
        migrations.CreateModel(
            name="ShippingRate",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "method",
                    models.CharField(
                        choices=[("sea", "Sea"), ("air", "Air"), ("express", "Express")],
                        max_length=16,
                    ),
                ),
                ("origin_country", models.CharField(blank=True, max_length=64)),
                ("dest_country", models.CharField(blank=True, max_length=64)),
                ("currency", models.CharField(default="USD", max_length=3)),
                (
                    "base_fee",
                    models.DecimalField(
                        decimal_places=2, default=0, max_digits=12, validators=[django.core.validators.MinValueValidator(0)]
                    ),
                ),
                (
                    "price_per_kg",
                    models.DecimalField(
                        decimal_places=2, default=0, max_digits=12, validators=[django.core.validators.MinValueValidator(0)]
                    ),
                ),
                (
                    "per_unit_fee",
                    models.DecimalField(
                        decimal_places=2, default=0, max_digits=12, validators=[django.core.validators.MinValueValidator(0)]
                    ),
                ),
                ("transit_min_days", models.PositiveIntegerField(default=1)),
                ("transit_max_days", models.PositiveIntegerField(default=1)),
                ("active", models.BooleanField(default=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "indexes": [
                    models.Index(fields=["method", "active", "updated_at"], name="shiprate_method_active_upd"),
                    models.Index(fields=["origin_country", "dest_country"], name="shiprate_origin_dest"),
                ],
            },
        ),
    ]

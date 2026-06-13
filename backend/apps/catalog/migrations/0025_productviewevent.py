from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0024_productfeedback"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ProductViewEvent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("viewer_key", models.CharField(max_length=128)),
                ("client_id", models.CharField(blank=True, max_length=128)),
                ("dedupe_bucket", models.DateTimeField()),
                ("country_code", models.CharField(blank=True, max_length=8)),
                ("source", models.CharField(default="product_detail", max_length=64)),
                ("path", models.CharField(blank=True, max_length=255)),
                ("referrer", models.CharField(blank=True, max_length=512)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "product",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="view_events",
                        to="catalog.product",
                    ),
                ),
                (
                    "seller",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="product_view_events",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "viewer",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="viewed_product_events",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "indexes": [
                    models.Index(fields=["seller", "created_at"], name="catalog_prod_seller__9ddd2d_idx"),
                    models.Index(fields=["product", "created_at"], name="catalog_prod_product_01e854_idx"),
                    models.Index(fields=["product", "dedupe_bucket"], name="catalog_prod_product_402160_idx"),
                    models.Index(fields=["seller", "country_code", "created_at"], name="catalog_prod_seller__642b9d_idx"),
                    models.Index(fields=["viewer_key", "created_at"], name="catalog_prod_viewer__a93513_idx"),
                ],
                "constraints": [
                    models.UniqueConstraint(
                        fields=("product", "viewer_key", "dedupe_bucket", "source"),
                        name="uniq_product_view_event_bucket",
                    ),
                ],
            },
        ),
    ]

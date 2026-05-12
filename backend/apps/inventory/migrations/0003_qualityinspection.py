from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0002_rename_catalog_ca_parent__b564c4_idx_catalog_cat_parent__a3bae0_idx_and_more"),
        ("inventory", "0002_rename_inventory_sa_seller__d243be_idx_inventory_s_seller__cff48c_idx_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="QualityInspection",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("inspector_name", models.CharField(blank=True, max_length=255)),
                (
                    "status",
                    models.CharField(
                        choices=[("in_progress", "In Progress"), ("passed", "Passed"), ("failed", "Failed")],
                        default="in_progress",
                        max_length=16,
                    ),
                ),
                ("score", models.PositiveIntegerField(default=0)),
                ("inspected_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                (
                    "inspector",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="quality_inspections_as_inspector",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "product",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="quality_inspections",
                        to="catalog.product",
                    ),
                ),
                (
                    "seller",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="quality_inspections_as_seller",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "indexes": [
                    models.Index(fields=["status", "created_at"], name="inventory_qu_status_8c4f25_idx"),
                    models.Index(fields=["product", "created_at"], name="inventory_qu_product_a2dc90_idx"),
                    models.Index(fields=["seller", "status"], name="inventory_qu_seller_8d0fd4_idx"),
                ],
            },
        ),
    ]


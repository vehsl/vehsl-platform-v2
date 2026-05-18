from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
from uuid import uuid4


def _upload_to(instance, filename: str) -> str:
    folder = getattr(getattr(instance, "listing_request", None), "folder_uuid", None) or getattr(instance, "folder_uuid", None) or uuid4()
    return f"listing_requests/{folder}/{filename}"


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0003_product_hs_code"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ListingRequest",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("category_label", models.CharField(blank=True, max_length=80)),
                ("product_name", models.CharField(max_length=160)),
                ("company_name", models.CharField(blank=True, max_length=160)),
                ("description", models.TextField(blank=True)),
                ("monthly_capacity", models.CharField(blank=True, max_length=64)),
                ("currency", models.CharField(default="USD", max_length=3)),
                ("unit_price", models.DecimalField(decimal_places=2, max_digits=12)),
                ("moq", models.PositiveIntegerField(default=1)),
                ("pickup_type", models.CharField(blank=True, max_length=16)),
                ("pickup_address", models.CharField(blank=True, max_length=300)),
                ("pickup_contact_name", models.CharField(blank=True, max_length=160)),
                ("pickup_phone", models.CharField(blank=True, max_length=32)),
                (
                    "stage",
                    models.CharField(
                        choices=[("samples", "Samples"), ("inspection", "Inspection"), ("live", "Live"), ("done", "Done")],
                        default="samples",
                        max_length=16,
                    ),
                ),
                ("rating", models.DecimalField(blank=True, decimal_places=2, max_digits=4, null=True)),
                ("folder_uuid", models.UUIDField(default=uuid4, editable=False, unique=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "category",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="listing_requests", to="catalog.category"),
                ),
                (
                    "created_product",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="created_from_listing_requests", to="catalog.product"),
                ),
                (
                    "seller",
                    models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="listing_requests", to=settings.AUTH_USER_MODEL),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="ListingRequestPhoto",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("file", models.FileField(upload_to=_upload_to)),
                ("original_name", models.CharField(blank=True, max_length=255)),
                ("content_type", models.CharField(blank=True, max_length=128)),
                ("size_bytes", models.BigIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "listing_request",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="photos", to="catalog.listingrequest"),
                ),
            ],
            options={
                "ordering": ["id"],
            },
        ),
        migrations.AddIndex(
            model_name="listingrequest",
            index=models.Index(fields=["seller", "stage", "created_at"], name="catalog_list_seller__8c99fd_idx"),
        ),
        migrations.AddIndex(
            model_name="listingrequestphoto",
            index=models.Index(fields=["listing_request", "id"], name="catalog_list_listing__ccfe1a_idx"),
        ),
    ]


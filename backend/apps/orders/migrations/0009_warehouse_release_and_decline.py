from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
from django.core.validators import MinValueValidator


class Migration(migrations.Migration):
    dependencies = [
        ("orders", "0008_order_extension_fee_order_extension_reason"),
        ("catalog", "0016_warehouse_stock"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="release_declined_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="order",
            name="release_declined_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="release_declines",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="release_decline_reason",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.CreateModel(
            name="WarehouseRelease",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("recipient_name", models.CharField(blank=True, default="", max_length=200)),
                ("id_card_number", models.CharField(blank=True, default="", max_length=64)),
                ("vehicle_number", models.CharField(blank=True, default="", max_length=64)),
                ("boxes_released", models.PositiveIntegerField(default=0)),
                ("payment_amount", models.DecimalField(decimal_places=2, default=0, max_digits=14, validators=[MinValueValidator(0)])),
                ("status", models.CharField(choices=[("pending", "Pending"), ("completed", "Completed"), ("declined", "Declined")], default="completed", max_length=16)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                (
                    "order",
                    models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="warehouse_release", to="orders.order"),
                ),
                (
                    "product",
                    models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="warehouse_releases", to="catalog.product"),
                ),
                (
                    "seller",
                    models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="warehouse_releases", to=settings.AUTH_USER_MODEL),
                ),
                (
                    "warehouse",
                    models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="warehouse_releases", to="catalog.warehouse"),
                ),
            ],
            options={
                "indexes": [
                    models.Index(fields=["seller", "created_at"], name="orders_whrel_seller_created_idx"),
                    models.Index(fields=["warehouse", "created_at"], name="orders_whrel_wh_created_idx"),
                    models.Index(fields=["status", "created_at"], name="orders_whrel_status_created_idx"),
                ],
            },
        ),
    ]


from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def seed_warehouse_stock_from_samples(apps, schema_editor):
    Warehouse = apps.get_model("catalog", "Warehouse")
    WarehouseStock = apps.get_model("catalog", "WarehouseStock")
    Sample = apps.get_model("inventory", "Sample")

    warehouse = Warehouse.objects.filter(active=True).order_by("id").first()
    if warehouse is None:
        warehouse = Warehouse.objects.create(
            name="Default Warehouse",
            country="",
            region="",
            city="",
            street1="",
            street2="",
            postal_code="",
            active=True,
        )

    for s in Sample.objects.filter(deleted_at__isnull=True).select_related("product"):
        product = getattr(s, "product", None)
        if product is None:
            continue
        seller_id = getattr(s, "seller_id", None) or getattr(product, "seller_id", None)
        if not seller_id:
            continue

        WarehouseStock.objects.update_or_create(
            warehouse_id=warehouse.id,
            product_id=product.id,
            variation_id=None,
            defaults={
                "seller_id": seller_id,
                "quantity_units": int(getattr(s, "available_quantity", 0) or 0),
                "reserved_units": 0,
                "deleted_at": None,
            },
        )


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0015_warehouse"),
        ("inventory", "0004_rename_inventory_qu_status_8c4f25_idx_inventory_q_status_545a96_idx_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="WarehouseStock",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("quantity_units", models.PositiveIntegerField(default=0)),
                ("reserved_units", models.PositiveIntegerField(default=0)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "product",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="warehouse_stocks", to="catalog.product"),
                ),
                (
                    "seller",
                    models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="warehouse_stocks", to=settings.AUTH_USER_MODEL),
                ),
                (
                    "variation",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="warehouse_stocks",
                        to="catalog.productvariation",
                    ),
                ),
                (
                    "warehouse",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="stocks", to="catalog.warehouse"),
                ),
            ],
            options={
                "indexes": [
                    models.Index(fields=["seller", "warehouse"], name="wh_stock_seller_wh_idx"),
                    models.Index(fields=["product", "warehouse"], name="wh_stock_product_wh_idx"),
                ],
            },
        ),
        migrations.AddConstraint(
            model_name="warehousestock",
            constraint=models.UniqueConstraint(fields=("warehouse", "product", "variation"), name="uniq_warehouse_stock_product_variation"),
        ),
        migrations.RunPython(seed_warehouse_stock_from_samples, migrations.RunPython.noop),
    ]


from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("orders", "0009_warehouse_release_and_decline"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="shipment",
            index=models.Index(fields=["status", "created_at"], name="ord_shp_sc_idx"),
        ),
        migrations.AddIndex(
            model_name="shipment",
            index=models.Index(fields=["deleted_at", "created_at"], name="ord_shp_dc_idx"),
        ),
        migrations.AddIndex(
            model_name="shipment",
            index=models.Index(fields=["estimated_delivery_at"], name="ord_shp_eta_idx"),
        ),
    ]

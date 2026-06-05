from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0011_rename_orders_whrel_seller_created_idx_orders_ware_seller__053c26_idx_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="delivered_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="order",
            name="received_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]


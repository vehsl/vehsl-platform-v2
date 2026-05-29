from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("orders", "0006_rename_orders_order_status_created_idx_orders_orde_status_25e057_idx_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="payment_method",
            field=models.CharField(choices=[("card", "Card"), ("cod", "Cash on Delivery")], default="card", max_length=16),
        ),
        migrations.AddField(
            model_name="order",
            name="payment_status",
            field=models.CharField(
                choices=[("unpaid", "Unpaid"), ("paid", "Paid"), ("cod_pending", "COD Pending")],
                default="unpaid",
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="shipping_address",
            field=models.JSONField(blank=True, default=dict),
        ),
    ]


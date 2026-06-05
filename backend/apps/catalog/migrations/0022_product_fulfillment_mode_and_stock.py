from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0021_listingrequest_product_meta"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="fulfillment_mode",
            field=models.CharField(
                choices=[("made_to_order", "Made to order"), ("seller_stock", "Seller stock")],
                default="made_to_order",
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name="product",
            name="seller_stock_units",
            field=models.PositiveIntegerField(default=0),
        ),
    ]


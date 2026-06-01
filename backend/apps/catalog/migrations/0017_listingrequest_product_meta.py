from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0016_warehouse_stock"),
    ]

    operations = [
        migrations.AddField(
            model_name="listingrequest",
            name="product_meta",
            field=models.JSONField(blank=True, default=dict),
        ),
    ]


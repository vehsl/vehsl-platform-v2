from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0004_listing_requests"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="product",
            index=models.Index(fields=["sku"], name="catalog_product_sku_idx"),
        ),
        migrations.AddIndex(
            model_name="product",
            index=models.Index(fields=["hs_code"], name="catalog_product_hscode_idx"),
        ),
    ]


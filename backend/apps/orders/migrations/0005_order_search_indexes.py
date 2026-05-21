from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("orders", "0004_wishlist_items"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="order",
            index=models.Index(fields=["status", "created_at"], name="orders_order_status_created_idx"),
        ),
    ]


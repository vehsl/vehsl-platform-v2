from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("orders", "0003_release_conditions_and_authorization"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("catalog", "0004_listing_requests"),
    ]

    operations = [
        migrations.CreateModel(
            name="WishlistItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                (
                    "buyer",
                    models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="wishlist_items", to=settings.AUTH_USER_MODEL),
                ),
                (
                    "product",
                    models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="wishlisted_by", to="catalog.product"),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="wishlistitem",
            index=models.Index(fields=["buyer", "created_at"], name="orders_wish_buyer_i_1a3d4a_idx"),
        ),
        migrations.AddIndex(
            model_name="wishlistitem",
            index=models.Index(fields=["product", "created_at"], name="orders_wish_product_08f3d3_idx"),
        ),
        migrations.AddConstraint(
            model_name="wishlistitem",
            constraint=models.UniqueConstraint(fields=("buyer", "product"), name="uniq_wishlist_buyer_product"),
        ),
    ]


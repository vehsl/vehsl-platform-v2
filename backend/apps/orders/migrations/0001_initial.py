from django.conf import settings
from django.db import migrations, models
import django.core.validators
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("catalog", "0001_initial"),
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Cart",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("buyer", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="carts", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="Order",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("status", models.CharField(choices=[("created", "Created"), ("accepted", "Accepted"), ("rejected", "Rejected"), ("shipped", "Shipped"), ("delivered", "Delivered"), ("disputed", "Disputed"), ("completed", "Completed"), ("cancelled", "Cancelled")], default="created", max_length=16)),
                ("currency", models.CharField(default="USD", max_length=3)),
                ("total_amount", models.DecimalField(decimal_places=2, default=0, max_digits=14, validators=[django.core.validators.MinValueValidator(0)])),
                ("deadline_at", models.DateTimeField(blank=True, null=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("buyer", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="orders", to=settings.AUTH_USER_MODEL)),
                ("seller", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="sales", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="Shipment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("carrier_id", models.CharField(blank=True, max_length=64)),
                ("tracking_number", models.CharField(blank=True, max_length=128)),
                ("status", models.CharField(choices=[("label_created", "Label Created"), ("picked_up", "Picked Up"), ("in_transit", "In Transit"), ("customs", "Customs"), ("out_for_delivery", "Out For Delivery"), ("delivered", "Delivered")], default="label_created", max_length=24)),
                ("origin", models.CharField(blank=True, max_length=255)),
                ("destination", models.CharField(blank=True, max_length=255)),
                ("estimated_delivery_at", models.DateTimeField(blank=True, null=True)),
                ("actual_delivery_at", models.DateTimeField(blank=True, null=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("order", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="shipments", to="orders.order")),
            ],
        ),
        migrations.CreateModel(
            name="OrderItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("quantity", models.PositiveIntegerField(validators=[django.core.validators.MinValueValidator(1)])),
                ("unit_price", models.DecimalField(decimal_places=2, max_digits=12, validators=[django.core.validators.MinValueValidator(0)])),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("order", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="items", to="orders.order")),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="order_items", to="catalog.product")),
                ("variation", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="order_items", to="catalog.productvariation")),
            ],
        ),
        migrations.CreateModel(
            name="CartItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("quantity", models.PositiveIntegerField(validators=[django.core.validators.MinValueValidator(1)])),
                ("unit_price_snapshot", models.DecimalField(decimal_places=2, max_digits=12, validators=[django.core.validators.MinValueValidator(0)])),
                ("currency", models.CharField(default="USD", max_length=3)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("cart", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="items", to="orders.cart")),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="cart_items", to="catalog.product")),
                ("variation", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="cart_items", to="catalog.productvariation")),
            ],
        ),
        migrations.CreateModel(
            name="ShipmentEvent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("type", models.CharField(max_length=64)),
                ("location", models.CharField(blank=True, max_length=255)),
                ("occurred_at", models.DateTimeField()),
                ("payload", models.JSONField(blank=True, default=dict)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("shipment", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="events", to="orders.shipment")),
            ],
            options={"ordering": ["occurred_at", "id"]},
        ),
        migrations.CreateModel(
            name="Document",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("owner_type", models.CharField(choices=[("order", "Order"), ("shipment", "Shipment"), ("seller", "Seller")], max_length=16)),
                ("owner_id", models.CharField(max_length=64)),
                ("document_type", models.CharField(choices=[("commercial_invoice", "Commercial Invoice"), ("bill_of_lading", "Bill of Lading"), ("certificate_of_origin", "Certificate of Origin"), ("packing_list", "Packing List"), ("export_license", "Export License"), ("import_license", "Import License")], max_length=32)),
                ("url", models.URLField()),
                ("generated_by_ai", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
            ],
        ),
        migrations.CreateModel(
            name="Dispute",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("reason", models.TextField(blank=True)),
                ("status", models.CharField(choices=[("open", "Open"), ("mediation", "Mediation"), ("resolved", "Resolved"), ("escalated", "Escalated")], default="open", max_length=16)),
                ("resolution", models.TextField(blank=True)),
                ("opened_at", models.DateTimeField(auto_now_add=True)),
                ("resolved_at", models.DateTimeField(blank=True, null=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("opened_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="disputes_opened", to=settings.AUTH_USER_MODEL)),
                ("order", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="disputes", to="orders.order")),
            ],
        ),
        migrations.CreateModel(
            name="Review",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("target_type", models.CharField(choices=[("seller", "Seller"), ("product", "Product")], max_length=16)),
                ("rating", models.DecimalField(decimal_places=2, max_digits=4, validators=[django.core.validators.MinValueValidator(0)])),
                ("text", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("order", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reviews", to="orders.order")),
                ("reviewer", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="reviews_written", to=settings.AUTH_USER_MODEL)),
                ("target_product", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="reviews", to="catalog.product")),
                ("target_seller", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="reviews_as_seller", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddIndex(
            model_name="cart",
            index=models.Index(fields=["buyer", "updated_at"], name="orders_cart_buyer_i_fad3a0_idx"),
        ),
        migrations.AddIndex(
            model_name="order",
            index=models.Index(fields=["seller", "status"], name="orders_order_seller__4b4e55_idx"),
        ),
        migrations.AddIndex(
            model_name="order",
            index=models.Index(fields=["buyer", "status"], name="orders_order_buyer_i_4f5b7b_idx"),
        ),
        migrations.AddIndex(
            model_name="shipment",
            index=models.Index(fields=["order", "status"], name="orders_sh_order_i_20bcc0_idx"),
        ),
        migrations.AddIndex(
            model_name="shipment",
            index=models.Index(fields=["tracking_number"], name="orders_sh_tracking_7c62b1_idx"),
        ),
        migrations.AddConstraint(
            model_name="orderitem",
            constraint=models.UniqueConstraint(fields=("order", "product", "variation"), name="uniq_order_item_product_variation"),
        ),
        migrations.AddIndex(
            model_name="cartitem",
            index=models.Index(fields=["cart"], name="orders_ca_cart_id_e57f0c_idx"),
        ),
        migrations.AddConstraint(
            model_name="cartitem",
            constraint=models.UniqueConstraint(fields=("cart", "product", "variation"), name="uniq_cart_item_product_variation"),
        ),
        migrations.AddIndex(
            model_name="shipmentevent",
            index=models.Index(fields=["shipment", "occurred_at"], name="orders_sh_shipment_77fa17_idx"),
        ),
        migrations.AddIndex(
            model_name="document",
            index=models.Index(fields=["owner_type", "owner_id"], name="orders_do_owner_t_6a7a7b_idx"),
        ),
        migrations.AddIndex(
            model_name="dispute",
            index=models.Index(fields=["order", "status"], name="orders_di_order_i_eb017d_idx"),
        ),
        migrations.AddIndex(
            model_name="review",
            index=models.Index(fields=["target_type", "created_at"], name="orders_re_target__e09a0a_idx"),
        ),
        migrations.AddConstraint(
            model_name="review",
            constraint=models.CheckConstraint(check=(models.Q(target_type="seller", target_seller__isnull=False, target_product__isnull=True) | models.Q(target_type="product", target_product__isnull=False, target_seller__isnull=True)), name="review_target_exactly_one"),
        ),
    ]

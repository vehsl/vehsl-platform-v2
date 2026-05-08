from django.conf import settings
from django.db import migrations, models
import django.core.validators
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Category",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=80, unique=True)),
                ("slug", models.SlugField(blank=True, max_length=96, unique=True)),
                ("accent", models.CharField(blank=True, max_length=16)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("icon", models.CharField(blank=True, max_length=255)),
                ("display_order", models.PositiveIntegerField(default=0)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("parent", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="children", to="catalog.category")),
            ],
            options={"ordering": ["display_order", "sort_order", "name"]},
        ),
        migrations.CreateModel(
            name="Product",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=160)),
                ("title", models.CharField(blank=True, max_length=200)),
                ("sku", models.CharField(blank=True, max_length=64)),
                ("description", models.TextField(blank=True)),
                ("currency", models.CharField(default="USD", max_length=3)),
                ("price", models.DecimalField(decimal_places=2, max_digits=12, validators=[django.core.validators.MinValueValidator(0)])),
                ("status", models.CharField(choices=[("draft", "Draft"), ("pending", "Pending"), ("approved", "Approved"), ("rejected", "Rejected"), ("active", "Active"), ("archived", "Archived")], default="draft", max_length=16)),
                ("origin_location", models.JSONField(blank=True, default=dict)),
                ("lead_time_days", models.PositiveIntegerField(default=0)),
                ("vehsl_rating", models.DecimalField(blank=True, decimal_places=2, max_digits=4, null=True)),
                ("seller_rating", models.DecimalField(blank=True, decimal_places=2, max_digits=4, null=True)),
                ("ip_protection_level", models.CharField(choices=[("low", "Low"), ("medium", "Medium"), ("high", "High")], default="low", max_length=16)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("category", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="products", to="catalog.category")),
                ("seller", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="products", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="ProductVariation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("attributes", models.JSONField(blank=True, default=dict)),
                ("sku", models.CharField(blank=True, max_length=64)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="variations", to="catalog.product")),
            ],
        ),
        migrations.CreateModel(
            name="PricingTier",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("min_quantity", models.PositiveIntegerField(default=1)),
                ("max_quantity", models.PositiveIntegerField(blank=True, null=True)),
                ("unit_price", models.DecimalField(decimal_places=2, max_digits=12, validators=[django.core.validators.MinValueValidator(0)])),
                ("currency", models.CharField(default="USD", max_length=3)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="pricing_tiers", to="catalog.product")),
                ("variation", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="pricing_tiers", to="catalog.productvariation")),
            ],
        ),
        migrations.CreateModel(
            name="ProductMedia",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("media_type", models.CharField(choices=[("image", "Image"), ("video", "Video"), ("360_view", "360 View"), ("document", "Document")], max_length=16)),
                ("url", models.URLField()),
                ("position", models.PositiveIntegerField(default=0)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="media", to="catalog.product")),
            ],
            options={"ordering": ["position", "id"]},
        ),
        migrations.CreateModel(
            name="Trademark",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("registration_number", models.CharField(blank=True, max_length=128)),
                ("status", models.CharField(choices=[("pending", "Pending"), ("verified", "Verified"), ("rejected", "Rejected")], default="pending", max_length=16)),
                ("similar_product_risk_score", models.DecimalField(blank=True, decimal_places=2, max_digits=6, null=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="trademarks", to="catalog.product")),
                ("seller", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="trademarks", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="ComplianceRule",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("rule_type", models.CharField(choices=[("permit", "Permit"), ("label", "Label"), ("logistics", "Logistics"), ("shipping", "Shipping"), ("registration", "Registration")], max_length=24)),
                ("countries", models.JSONField(blank=True, default=list)),
                ("payload", models.JSONField(blank=True, default=dict)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("category", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="compliance_rules", to="catalog.category")),
            ],
        ),
        migrations.AddIndex(
            model_name="category",
            index=models.Index(fields=["parent", "display_order"], name="catalog_ca_parent__b564c4_idx"),
        ),
        migrations.AddIndex(
            model_name="product",
            index=models.Index(fields=["status", "created_at"], name="catalog_pro_status_53e56d_idx"),
        ),
        migrations.AddIndex(
            model_name="product",
            index=models.Index(fields=["category", "created_at"], name="catalog_pro_categor_8a0f27_idx"),
        ),
        migrations.AddIndex(
            model_name="product",
            index=models.Index(fields=["seller", "status"], name="catalog_pro_seller__d9e9b8_idx"),
        ),
        migrations.AddIndex(
            model_name="productvariation",
            index=models.Index(fields=["product"], name="catalog_pr_product__f66685_idx"),
        ),
        migrations.AddIndex(
            model_name="pricingtier",
            index=models.Index(fields=["product"], name="catalog_pr_product__7dc7af_idx"),
        ),
        migrations.AddIndex(
            model_name="productmedia",
            index=models.Index(fields=["product", "position"], name="catalog_pr_product__9c1db4_idx"),
        ),
        migrations.AddIndex(
            model_name="trademark",
            index=models.Index(fields=["seller", "status"], name="catalog_tr_seller__466b03_idx"),
        ),
        migrations.AddIndex(
            model_name="compliancerule",
            index=models.Index(fields=["category", "rule_type"], name="catalog_co_categor_4d3d39_idx"),
        ),
    ]

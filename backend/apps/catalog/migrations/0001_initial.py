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
            ],
            options={"ordering": ["sort_order", "name"]},
        ),
        migrations.CreateModel(
            name="Product",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=160)),
                ("sku", models.CharField(blank=True, max_length=64)),
                ("description", models.TextField(blank=True)),
                ("currency", models.CharField(default="USD", max_length=3)),
                ("price", models.DecimalField(decimal_places=2, max_digits=12, validators=[django.core.validators.MinValueValidator(0)])),
                ("status", models.CharField(choices=[("draft", "Draft"), ("active", "Active"), ("archived", "Archived")], default="draft", max_length=16)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("category", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="products", to="catalog.category")),
                ("seller", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="products", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddIndex(
            model_name="product",
            index=models.Index(fields=["status", "created_at"], name="catalog_pro_status_53e56d_idx"),
        ),
        migrations.AddIndex(
            model_name="product",
            index=models.Index(fields=["category", "created_at"], name="catalog_pro_categor_8a0f27_idx"),
        ),
    ]


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
            name="Sample",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("available_quantity", models.PositiveIntegerField(default=0)),
                ("low_stock_flag", models.BooleanField(default=False)),
                ("last_updated", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="samples", to="catalog.product")),
                ("seller", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="samples", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="SampleRequest",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("status", models.CharField(choices=[("requested", "Requested"), ("shipped", "Shipped"), ("delivered", "Delivered"), ("feedback_received", "Feedback Received")], default="requested", max_length=24)),
                ("feedback_rating", models.DecimalField(blank=True, decimal_places=2, max_digits=4, null=True, validators=[django.core.validators.MinValueValidator(0)])),
                ("feedback_text", models.TextField(blank=True)),
                ("requested_at", models.DateTimeField(auto_now_add=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("buyer", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="sample_requests", to=settings.AUTH_USER_MODEL)),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="sample_requests", to="catalog.product")),
            ],
        ),
        migrations.AddIndex(
            model_name="sample",
            index=models.Index(fields=["seller"], name="inventory_sa_seller__d243be_idx"),
        ),
        migrations.AddIndex(
            model_name="sample",
            index=models.Index(fields=["product"], name="inventory_sa_product_fa0272_idx"),
        ),
        migrations.AddIndex(
            model_name="samplerequest",
            index=models.Index(fields=["buyer", "status"], name="inventory_sa_buyer_i_eb712c_idx"),
        ),
        migrations.AddIndex(
            model_name="samplerequest",
            index=models.Index(fields=["product", "status"], name="inventory_sa_product_4f7662_idx"),
        ),
    ]


from django.db import migrations, models
import django.core.validators
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("orders", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Payment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("method", models.CharField(choices=[("bank_transfer", "Bank Transfer"), ("card", "Card"), ("escrow", "Escrow")], max_length=16)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=14, validators=[django.core.validators.MinValueValidator(0)])),
                ("currency", models.CharField(default="USD", max_length=3)),
                ("status", models.CharField(choices=[("initiated", "Initiated"), ("held", "Held"), ("released", "Released"), ("refunded", "Refunded"), ("failed", "Failed")], default="initiated", max_length=16)),
                ("gateway_reference", models.CharField(blank=True, max_length=128)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("order", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="payments", to="orders.order")),
            ],
        ),
        migrations.AddIndex(
            model_name="payment",
            index=models.Index(fields=["order", "status"], name="payments_pa_order_i_80a8e6_idx"),
        ),
        migrations.AddIndex(
            model_name="payment",
            index=models.Index(fields=["gateway_reference"], name="payments_pa_gateway_4246ab_idx"),
        ),
    ]


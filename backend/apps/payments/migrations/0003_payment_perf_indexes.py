from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("payments", "0002_rename_payments_pa_order_i_80a8e6_idx_payments_pa_order_i_a76289_idx_and_more"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="payment",
            index=models.Index(fields=["status", "created_at"], name="pay_sc_idx"),
        ),
        migrations.AddIndex(
            model_name="payment",
            index=models.Index(fields=["deleted_at", "created_at"], name="pay_dc_idx"),
        ),
    ]

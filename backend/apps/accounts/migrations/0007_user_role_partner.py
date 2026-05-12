from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0006_rename_accounts_ky_user_id_7b8256_idx_accounts_ky_user_id_293486_idx"),
    ]

    operations = [
        migrations.AlterField(
            model_name="user",
            name="role",
            field=models.CharField(
                choices=[("buyer", "Buyer"), ("seller", "Seller"), ("admin", "Admin"), ("partner", "Partner")],
                default="buyer",
                max_length=16,
            ),
        ),
    ]


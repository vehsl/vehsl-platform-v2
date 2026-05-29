from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0014_userprofile_language_preference"),
    ]

    operations = [
        migrations.AddField(
            model_name="sellerprofile",
            name="warehouse_location",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.CreateModel(
            name="BuyerAddress",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("kind", models.CharField(choices=[("primary", "Primary"), ("secondary", "Secondary")], max_length=16)),
                ("contact_name", models.CharField(blank=True, max_length=160)),
                ("phone", models.CharField(blank=True, max_length=32)),
                ("country", models.CharField(blank=True, max_length=64)),
                ("region", models.CharField(blank=True, max_length=64)),
                ("city", models.CharField(blank=True, max_length=64)),
                ("street1", models.CharField(blank=True, max_length=128)),
                ("street2", models.CharField(blank=True, max_length=128)),
                ("postal_code", models.CharField(blank=True, max_length=32)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="buyer_addresses", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "indexes": [models.Index(fields=["user", "kind", "updated_at"], name="accounts_bu_user_kind_upd")],
            },
        ),
        migrations.AddConstraint(
            model_name="buyeraddress",
            constraint=models.UniqueConstraint(fields=("user", "kind"), name="uniq_buyer_address_kind_per_user"),
        ),
    ]

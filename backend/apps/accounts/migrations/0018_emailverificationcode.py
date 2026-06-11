from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0017_sellerprofile_stock_low_threshold"),
    ]

    operations = [
        migrations.CreateModel(
            name="EmailVerificationCode",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("email", models.EmailField(max_length=254)),
                ("purpose", models.CharField(choices=[("signup", "Signup")], default="signup", max_length=32)),
                ("code_hash", models.CharField(max_length=64)),
                ("expires_at", models.DateTimeField()),
                ("sent_at", models.DateTimeField(auto_now=True)),
                ("verified_at", models.DateTimeField(blank=True, null=True)),
                ("attempt_count", models.PositiveSmallIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "indexes": [
                    models.Index(fields=["email", "purpose"], name="accounts_em_email_1d0d0f_idx"),
                    models.Index(fields=["purpose", "expires_at"], name="accounts_em_purpose_51c170_idx"),
                ],
                "constraints": [
                    models.UniqueConstraint(fields=("email", "purpose"), name="uniq_email_verification_email_purpose"),
                ],
            },
        ),
    ]

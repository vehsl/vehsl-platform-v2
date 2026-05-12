from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0007_user_role_partner"),
    ]

    operations = [
        migrations.AddField(
            model_name="kycdocument",
            name="review_status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("under_review", "Under Review"),
                    ("verified", "Verified"),
                    ("rejected", "Rejected"),
                    ("expired", "Expired"),
                ],
                default="pending",
                max_length=24,
            ),
        ),
        migrations.AddField(
            model_name="kycdocument",
            name="reviewed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="kycdocument",
            name="reviewed_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="kyc_documents_reviewed",
                to="accounts.user",
            ),
        ),
        migrations.AddField(
            model_name="kycdocument",
            name="rejection_reason",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="kycdocument",
            name="expires_at",
            field=models.DateField(blank=True, null=True),
        ),
    ]


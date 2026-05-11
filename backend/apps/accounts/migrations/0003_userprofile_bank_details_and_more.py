from uuid import uuid4

from django.conf import settings
from django.db import migrations, models

import apps.accounts.models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_rename_accounts_au_occurre_e2f40b_idx_accounts_au_occurre_5cdd76_idx_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="bank_details",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="employment_statuses",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="pep_status",
            field=models.BooleanField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="work_details",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.CreateModel(
            name="KycDocument",
            fields=[
                ("id", models.UUIDField(default=uuid4, editable=False, primary_key=True, serialize=False)),
                ("kind", models.CharField(choices=[("id_doc_1", "ID Document 1"), ("id_doc_2", "ID Document 2"), ("proof_of_address", "Proof of Address"), ("business_doc_1", "Business Document 1"), ("business_doc_2", "Business Document 2")], max_length=32)),
                ("doc_type", models.CharField(blank=True, max_length=64)),
                ("file", models.FileField(upload_to=apps.accounts.models._kyc_upload_to)),
                ("original_name", models.CharField(blank=True, max_length=255)),
                ("content_type", models.CharField(blank=True, max_length=128)),
                ("size_bytes", models.PositiveIntegerField(default=0)),
                ("uploaded_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="kyc_documents", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "indexes": [
                    models.Index(fields=["user", "kind", "uploaded_at"], name="accounts_ky_user_id_7b8256_idx"),
                ],
            },
        ),
    ]


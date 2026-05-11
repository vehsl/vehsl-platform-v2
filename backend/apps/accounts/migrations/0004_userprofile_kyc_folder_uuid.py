from uuid import uuid4

from django.db import migrations, models


def _backfill_kyc_folder_uuid(apps, schema_editor):
    UserProfile = apps.get_model("accounts", "UserProfile")
    for prof in UserProfile.objects.all().only("id", "kyc_folder_uuid").iterator():
        if prof.kyc_folder_uuid:
            continue
        prof.kyc_folder_uuid = uuid4()
        prof.save(update_fields=["kyc_folder_uuid"])


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0003_userprofile_bank_details_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="kyc_folder_uuid",
            field=models.UUIDField(null=True, editable=False),
        ),
        migrations.RunPython(_backfill_kyc_folder_uuid, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="userprofile",
            name="kyc_folder_uuid",
            field=models.UUIDField(default=uuid4, editable=False, unique=True),
        ),
    ]

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0004_userprofile_kyc_folder_uuid"),
    ]

    operations = [
        migrations.AlterField(
            model_name="adminprofile",
            name="admin_role",
            field=models.CharField(
                choices=[
                    ("super_admin", "Super Admin"),
                    ("compliance", "Compliance"),
                    ("finance", "Finance"),
                    ("support", "Support"),
                    ("logistics", "Logistics"),
                    ("inspector", "Inspector"),
                ],
                max_length=32,
            ),
        ),
    ]

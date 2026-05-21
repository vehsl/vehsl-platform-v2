from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0011_usersettings"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="user",
            index=models.Index(fields=["status", "date_joined"], name="accounts_user_status_joined_idx"),
        ),
        migrations.AddIndex(
            model_name="user",
            index=models.Index(fields=["role", "date_joined"], name="accounts_user_role_joined_idx"),
        ),
    ]


from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0010_adminplatformsettings"),
    ]

    operations = [
        migrations.CreateModel(
            name="UserSettings",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("display", models.JSONField(blank=True, default=dict)),
                ("notifications", models.JSONField(blank=True, default=dict)),
                ("order_settings", models.JSONField(blank=True, default=dict)),
                ("security", models.JSONField(blank=True, default=dict)),
                ("business", models.JSONField(blank=True, default=dict)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="settings", to="accounts.user"),
                ),
            ],
        ),
    ]


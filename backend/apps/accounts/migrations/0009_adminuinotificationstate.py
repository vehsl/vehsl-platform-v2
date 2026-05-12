from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0008_kycdocument_review_fields"),
    ]

    operations = [
        migrations.CreateModel(
            name="AdminUiNotificationState",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("key", models.CharField(max_length=64)),
                ("seen_at", models.DateTimeField(blank=True, null=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="admin_ui_notification_states",
                        to="accounts.user",
                    ),
                ),
            ],
            options={
                "indexes": [
                    models.Index(fields=["user", "key"], name="accounts_adm_user_id_4f6a75_idx"),
                    models.Index(fields=["user", "seen_at"], name="accounts_adm_user_id_3b5d51_idx"),
                ],
            },
        ),
        migrations.AddConstraint(
            model_name="adminuinotificationstate",
            constraint=models.UniqueConstraint(fields=("user", "key"), name="uniq_admin_ui_notification_state_user_key"),
        ),
    ]


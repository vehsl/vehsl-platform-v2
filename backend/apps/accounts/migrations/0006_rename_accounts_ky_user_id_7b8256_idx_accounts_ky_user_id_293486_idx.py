from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0005_adminprofile_add_inspector_role"),
    ]

    operations = [
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "accounts_ky_user_id_7b8256_idx" RENAME TO "accounts_ky_user_id_293486_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "accounts_ky_user_id_293486_idx" RENAME TO "accounts_ky_user_id_7b8256_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="kycdocument",
                    old_name="accounts_ky_user_id_7b8256_idx",
                    new_name="accounts_ky_user_id_293486_idx",
                )
            ],
        )
    ]


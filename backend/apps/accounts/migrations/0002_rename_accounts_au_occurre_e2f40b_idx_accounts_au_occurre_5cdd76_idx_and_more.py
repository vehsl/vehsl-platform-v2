from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "accounts_au_occurre_e2f40b_idx" RENAME TO "accounts_au_occurre_5cdd76_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "accounts_au_occurre_5cdd76_idx" RENAME TO "accounts_au_occurre_e2f40b_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="auditlog",
                    old_name="accounts_au_occurre_e2f40b_idx",
                    new_name="accounts_au_occurre_5cdd76_idx",
                )
            ],
        ),
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "accounts_au_actor_i_d58c38_idx" RENAME TO "accounts_au_actor_i_7ab3a6_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "accounts_au_actor_i_7ab3a6_idx" RENAME TO "accounts_au_actor_i_d58c38_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="auditlog",
                    old_name="accounts_au_actor_i_d58c38_idx",
                    new_name="accounts_au_actor_i_7ab3a6_idx",
                )
            ],
        ),
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "accounts_au_target__51b44c_idx" RENAME TO "accounts_au_target__0c7dca_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "accounts_au_target__0c7dca_idx" RENAME TO "accounts_au_target__51b44c_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="auditlog",
                    old_name="accounts_au_target__51b44c_idx",
                    new_name="accounts_au_target__0c7dca_idx",
                )
            ],
        ),
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "accounts_ch_thread__c81cda_idx" RENAME TO "accounts_ch_thread__7ec2b8_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "accounts_ch_thread__7ec2b8_idx" RENAME TO "accounts_ch_thread__c81cda_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="chatmessage",
                    old_name="accounts_ch_thread__c81cda_idx",
                    new_name="accounts_ch_thread__7ec2b8_idx",
                )
            ],
        ),
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "accounts_ch_type_88498e_idx" RENAME TO "accounts_ch_type_99d10c_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "accounts_ch_type_99d10c_idx" RENAME TO "accounts_ch_type_88498e_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="chatthread",
                    old_name="accounts_ch_type_88498e_idx",
                    new_name="accounts_ch_type_99d10c_idx",
                )
            ],
        ),
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "accounts_no_user_id_0c0c3c_idx" RENAME TO "accounts_no_user_id_6ea281_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "accounts_no_user_id_6ea281_idx" RENAME TO "accounts_no_user_id_0c0c3c_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="notification",
                    old_name="accounts_no_user_id_0c0c3c_idx",
                    new_name="accounts_no_user_id_6ea281_idx",
                )
            ],
        ),
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "accounts_se_verificat_764507_idx" RENAME TO "accounts_se_verific_e9be4e_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "accounts_se_verific_e9be4e_idx" RENAME TO "accounts_se_verificat_764507_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="sellerprofile",
                    old_name="accounts_se_verificat_764507_idx",
                    new_name="accounts_se_verific_e9be4e_idx",
                )
            ],
        ),
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "accounts_su_user_id_8c1f51_idx" RENAME TO "accounts_su_user_id_17dcf3_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "accounts_su_user_id_17dcf3_idx" RENAME TO "accounts_su_user_id_8c1f51_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="subscription",
                    old_name="accounts_su_user_id_8c1f51_idx",
                    new_name="accounts_su_user_id_17dcf3_idx",
                )
            ],
        ),
    ]

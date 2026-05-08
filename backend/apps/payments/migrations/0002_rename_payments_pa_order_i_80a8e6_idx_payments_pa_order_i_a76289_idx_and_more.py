from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("payments", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "payments_pa_order_i_80a8e6_idx" RENAME TO "payments_pa_order_i_a76289_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "payments_pa_order_i_a76289_idx" RENAME TO "payments_pa_order_i_80a8e6_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="payment",
                    old_name="payments_pa_order_i_80a8e6_idx",
                    new_name="payments_pa_order_i_a76289_idx",
                )
            ],
        ),
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "payments_pa_gateway_4246ab_idx" RENAME TO "payments_pa_gateway_785676_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "payments_pa_gateway_785676_idx" RENAME TO "payments_pa_gateway_4246ab_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="payment",
                    old_name="payments_pa_gateway_4246ab_idx",
                    new_name="payments_pa_gateway_785676_idx",
                )
            ],
        ),
    ]

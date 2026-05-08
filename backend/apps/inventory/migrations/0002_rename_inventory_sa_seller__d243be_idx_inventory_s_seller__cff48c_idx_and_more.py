from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("inventory", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "inventory_sa_seller__d243be_idx" RENAME TO "inventory_s_seller__cff48c_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "inventory_s_seller__cff48c_idx" RENAME TO "inventory_sa_seller__d243be_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="sample",
                    old_name="inventory_sa_seller__d243be_idx",
                    new_name="inventory_s_seller__cff48c_idx",
                )
            ],
        ),
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "inventory_sa_product_fa0272_idx" RENAME TO "inventory_s_product_71999a_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "inventory_s_product_71999a_idx" RENAME TO "inventory_sa_product_fa0272_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="sample",
                    old_name="inventory_sa_product_fa0272_idx",
                    new_name="inventory_s_product_71999a_idx",
                )
            ],
        ),
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "inventory_sa_buyer_i_eb712c_idx" RENAME TO "inventory_s_buyer_i_27e877_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "inventory_s_buyer_i_27e877_idx" RENAME TO "inventory_sa_buyer_i_eb712c_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="samplerequest",
                    old_name="inventory_sa_buyer_i_eb712c_idx",
                    new_name="inventory_s_buyer_i_27e877_idx",
                )
            ],
        ),
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "inventory_sa_product_4f7662_idx" RENAME TO "inventory_s_product_80c988_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "inventory_s_product_80c988_idx" RENAME TO "inventory_sa_product_4f7662_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="samplerequest",
                    old_name="inventory_sa_product_4f7662_idx",
                    new_name="inventory_s_product_80c988_idx",
                )
            ],
        ),
    ]

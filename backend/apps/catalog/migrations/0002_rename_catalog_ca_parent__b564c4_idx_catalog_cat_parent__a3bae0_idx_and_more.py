from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "catalog_ca_parent__b564c4_idx" RENAME TO "catalog_cat_parent__a3bae0_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "catalog_cat_parent__a3bae0_idx" RENAME TO "catalog_ca_parent__b564c4_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="category",
                    old_name="catalog_ca_parent__b564c4_idx",
                    new_name="catalog_cat_parent__a3bae0_idx",
                )
            ],
        ),
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "catalog_co_categor_4d3d39_idx" RENAME TO "catalog_com_categor_ff45fb_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "catalog_com_categor_ff45fb_idx" RENAME TO "catalog_co_categor_4d3d39_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="compliancerule",
                    old_name="catalog_co_categor_4d3d39_idx",
                    new_name="catalog_com_categor_ff45fb_idx",
                )
            ],
        ),
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "catalog_pr_product__7dc7af_idx" RENAME TO "catalog_pri_product_76a06d_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "catalog_pri_product_76a06d_idx" RENAME TO "catalog_pr_product__7dc7af_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="pricingtier",
                    old_name="catalog_pr_product__7dc7af_idx",
                    new_name="catalog_pri_product_76a06d_idx",
                )
            ],
        ),
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "catalog_pro_status_53e56d_idx" RENAME TO "catalog_pro_status_f78168_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "catalog_pro_status_f78168_idx" RENAME TO "catalog_pro_status_53e56d_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="product",
                    old_name="catalog_pro_status_53e56d_idx",
                    new_name="catalog_pro_status_f78168_idx",
                )
            ],
        ),
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "catalog_pro_categor_8a0f27_idx" RENAME TO "catalog_pro_categor_9950d8_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "catalog_pro_categor_9950d8_idx" RENAME TO "catalog_pro_categor_8a0f27_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="product",
                    old_name="catalog_pro_categor_8a0f27_idx",
                    new_name="catalog_pro_categor_9950d8_idx",
                )
            ],
        ),
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "catalog_pro_seller__d9e9b8_idx" RENAME TO "catalog_pro_seller__eb5334_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "catalog_pro_seller__eb5334_idx" RENAME TO "catalog_pro_seller__d9e9b8_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="product",
                    old_name="catalog_pro_seller__d9e9b8_idx",
                    new_name="catalog_pro_seller__eb5334_idx",
                )
            ],
        ),
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "catalog_pr_product__9c1db4_idx" RENAME TO "catalog_pro_product_391918_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "catalog_pro_product_391918_idx" RENAME TO "catalog_pr_product__9c1db4_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="productmedia",
                    old_name="catalog_pr_product__9c1db4_idx",
                    new_name="catalog_pro_product_391918_idx",
                )
            ],
        ),
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "catalog_pr_product__f66685_idx" RENAME TO "catalog_pro_product_569b33_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "catalog_pro_product_569b33_idx" RENAME TO "catalog_pr_product__f66685_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="productvariation",
                    old_name="catalog_pr_product__f66685_idx",
                    new_name="catalog_pro_product_569b33_idx",
                )
            ],
        ),
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "catalog_tr_seller__466b03_idx" RENAME TO "catalog_tra_seller__436111_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "catalog_tra_seller__436111_idx" RENAME TO "catalog_tr_seller__466b03_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="trademark",
                    old_name="catalog_tr_seller__466b03_idx",
                    new_name="catalog_tra_seller__436111_idx",
                )
            ],
        ),
    ]

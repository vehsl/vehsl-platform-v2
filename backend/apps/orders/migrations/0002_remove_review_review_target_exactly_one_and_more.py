from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("orders", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(
            sql='ALTER TABLE "orders_review" DROP CONSTRAINT IF EXISTS "review_target_exactly_one";',
            reverse_sql=migrations.RunSQL.noop,
            state_operations=[
                migrations.RemoveConstraint(
                    model_name="review",
                    name="review_target_exactly_one",
                )
            ],
        ),
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "orders_cart_buyer_i_fad3a0_idx" RENAME TO "orders_cart_buyer_i_1e1199_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "orders_cart_buyer_i_1e1199_idx" RENAME TO "orders_cart_buyer_i_fad3a0_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="cart",
                    old_name="orders_cart_buyer_i_fad3a0_idx",
                    new_name="orders_cart_buyer_i_1e1199_idx",
                )
            ],
        ),
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "orders_ca_cart_id_e57f0c_idx" RENAME TO "orders_cart_cart_id_dc9f49_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "orders_cart_cart_id_dc9f49_idx" RENAME TO "orders_ca_cart_id_e57f0c_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="cartitem",
                    old_name="orders_ca_cart_id_e57f0c_idx",
                    new_name="orders_cart_cart_id_dc9f49_idx",
                )
            ],
        ),
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "orders_di_order_i_eb017d_idx" RENAME TO "orders_disp_order_i_687951_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "orders_disp_order_i_687951_idx" RENAME TO "orders_di_order_i_eb017d_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="dispute",
                    old_name="orders_di_order_i_eb017d_idx",
                    new_name="orders_disp_order_i_687951_idx",
                )
            ],
        ),
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "orders_do_owner_t_6a7a7b_idx" RENAME TO "orders_docu_owner_t_e3008b_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "orders_docu_owner_t_e3008b_idx" RENAME TO "orders_do_owner_t_6a7a7b_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="document",
                    old_name="orders_do_owner_t_6a7a7b_idx",
                    new_name="orders_docu_owner_t_e3008b_idx",
                )
            ],
        ),
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "orders_order_seller__4b4e55_idx" RENAME TO "orders_orde_seller__c90b9c_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "orders_orde_seller__c90b9c_idx" RENAME TO "orders_order_seller__4b4e55_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="order",
                    old_name="orders_order_seller__4b4e55_idx",
                    new_name="orders_orde_seller__c90b9c_idx",
                )
            ],
        ),
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "orders_order_buyer_i_4f5b7b_idx" RENAME TO "orders_orde_buyer_i_4389c9_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "orders_orde_buyer_i_4389c9_idx" RENAME TO "orders_order_buyer_i_4f5b7b_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="order",
                    old_name="orders_order_buyer_i_4f5b7b_idx",
                    new_name="orders_orde_buyer_i_4389c9_idx",
                )
            ],
        ),
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "orders_re_target__e09a0a_idx" RENAME TO "orders_revi_target__522a92_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "orders_revi_target__522a92_idx" RENAME TO "orders_re_target__e09a0a_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="review",
                    old_name="orders_re_target__e09a0a_idx",
                    new_name="orders_revi_target__522a92_idx",
                )
            ],
        ),
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "orders_sh_order_i_20bcc0_idx" RENAME TO "orders_ship_order_i_0a899e_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "orders_ship_order_i_0a899e_idx" RENAME TO "orders_sh_order_i_20bcc0_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="shipment",
                    old_name="orders_sh_order_i_20bcc0_idx",
                    new_name="orders_ship_order_i_0a899e_idx",
                )
            ],
        ),
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "orders_sh_tracking_7c62b1_idx" RENAME TO "orders_ship_trackin_6e599a_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "orders_ship_trackin_6e599a_idx" RENAME TO "orders_sh_tracking_7c62b1_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="shipment",
                    old_name="orders_sh_tracking_7c62b1_idx",
                    new_name="orders_ship_trackin_6e599a_idx",
                )
            ],
        ),
        migrations.RunSQL(
            sql='ALTER INDEX IF EXISTS "orders_sh_shipment_77fa17_idx" RENAME TO "orders_ship_shipmen_06fa0c_idx";',
            reverse_sql='ALTER INDEX IF EXISTS "orders_ship_shipmen_06fa0c_idx" RENAME TO "orders_sh_shipment_77fa17_idx";',
            state_operations=[
                migrations.RenameIndex(
                    model_name="shipmentevent",
                    old_name="orders_sh_shipment_77fa17_idx",
                    new_name="orders_ship_shipmen_06fa0c_idx",
                )
            ],
        ),
        migrations.RunSQL(
            sql=(
                'ALTER TABLE "orders_review" ADD CONSTRAINT "review_target_exactly_one" CHECK ('
                "(target_type = 'seller' AND target_seller_id IS NOT NULL AND target_product_id IS NULL) OR "
                "(target_type = 'product' AND target_product_id IS NOT NULL AND target_seller_id IS NULL)"
                ");"
            ),
            reverse_sql='ALTER TABLE "orders_review" DROP CONSTRAINT IF EXISTS "review_target_exactly_one";',
            state_operations=[
                migrations.AddConstraint(
                    model_name="review",
                    constraint=models.CheckConstraint(
                        condition=(
                            models.Q(target_product__isnull=True, target_seller__isnull=False, target_type="seller")
                            | models.Q(target_product__isnull=False, target_seller__isnull=True, target_type="product")
                        ),
                        name="review_target_exactly_one",
                    ),
                )
            ],
        ),
    ]

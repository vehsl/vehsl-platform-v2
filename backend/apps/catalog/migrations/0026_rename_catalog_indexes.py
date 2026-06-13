from django.db import migrations


def _rename_index_if_needed(model_name: str, old_name: str, new_name: str):
    quoted_old = old_name.replace('"', '""')
    quoted_new = new_name.replace('"', '""')
    return migrations.SeparateDatabaseAndState(
        database_operations=[
            migrations.RunSQL(
                sql=f"""
DO $$
BEGIN
    IF to_regclass('{quoted_old}') IS NOT NULL AND to_regclass('{quoted_new}') IS NULL THEN
        EXECUTE 'ALTER INDEX "{quoted_old}" RENAME TO "{quoted_new}"';
    END IF;
END
$$;
""",
                reverse_sql=f"""
DO $$
BEGIN
    IF to_regclass('{quoted_new}') IS NOT NULL AND to_regclass('{quoted_old}') IS NULL THEN
        EXECUTE 'ALTER INDEX "{quoted_new}" RENAME TO "{quoted_old}"';
    END IF;
END
$$;
""",
            )
        ],
        state_operations=[
            migrations.RenameIndex(
                model_name=model_name,
                old_name=old_name,
                new_name=new_name,
            )
        ],
    )


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0025_productviewevent"),
    ]

    operations = [
        _rename_index_if_needed(
            model_name="productfeedback",
            old_name="catalog_prod_seller__d5b5a7_idx",
            new_name="catalog_pro_seller__b04100_idx",
        ),
        _rename_index_if_needed(
            model_name="productfeedback",
            old_name="catalog_prod_product_3e3ae6_idx",
            new_name="catalog_pro_product_35a8e9_idx",
        ),
        _rename_index_if_needed(
            model_name="productfeedback",
            old_name="catalog_prod_seller__7e7dd7_idx",
            new_name="catalog_pro_seller__9bb3a2_idx",
        ),
        _rename_index_if_needed(
            model_name="productviewevent",
            old_name="catalog_prod_seller__9ddd2d_idx",
            new_name="catalog_pro_seller__664bee_idx",
        ),
        _rename_index_if_needed(
            model_name="productviewevent",
            old_name="catalog_prod_product_01e854_idx",
            new_name="catalog_pro_product_9e105e_idx",
        ),
        _rename_index_if_needed(
            model_name="productviewevent",
            old_name="catalog_prod_product_402160_idx",
            new_name="catalog_pro_product_ec4f35_idx",
        ),
        _rename_index_if_needed(
            model_name="productviewevent",
            old_name="catalog_prod_seller__642b9d_idx",
            new_name="catalog_pro_seller__341694_idx",
        ),
        _rename_index_if_needed(
            model_name="productviewevent",
            old_name="catalog_prod_viewer__a93513_idx",
            new_name="catalog_pro_viewer__1f59be_idx",
        ),
    ]

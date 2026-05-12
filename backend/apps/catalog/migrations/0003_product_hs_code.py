from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0002_rename_catalog_ca_parent__b564c4_idx_catalog_cat_parent__a3bae0_idx_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="hs_code",
            field=models.CharField(blank=True, max_length=32),
        ),
    ]


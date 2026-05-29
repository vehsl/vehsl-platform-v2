from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0006_rename_catalog_list_seller__8c99fd_idx_catalog_lis_seller__d8b4b6_idx_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="category",
            name="name",
            field=models.CharField(max_length=80),
        ),
    ]


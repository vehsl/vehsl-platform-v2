from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0016_alter_user_role"),
    ]

    operations = [
        migrations.AddField(
            model_name="sellerprofile",
            name="stock_low_threshold",
            field=models.PositiveIntegerField(default=0),
        ),
    ]


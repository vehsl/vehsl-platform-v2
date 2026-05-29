from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0013_shippingrate"),
    ]

    operations = [
        migrations.DeleteModel(
            name="ProductReview",
        ),
    ]


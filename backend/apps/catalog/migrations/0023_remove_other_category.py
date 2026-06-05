from django.db import migrations


def forwards(apps, schema_editor):
    Category = apps.get_model("catalog", "Category")
    Product = apps.get_model("catalog", "Product")
    ListingRequest = apps.get_model("catalog", "ListingRequest")

    other = Category.objects.filter(slug__iexact="other").first()
    if other is None:
        return

    fallback = Category.objects.filter(slug__iexact="industrial", parent__isnull=True).first()
    if fallback is None:
        fallback = Category.objects.filter(parent__isnull=True).exclude(id=other.id).order_by("display_order", "id").first()
    if fallback is None:
        fallback = Category.objects.exclude(id=other.id).order_by("display_order", "id").first()
    if fallback is None:
        raise RuntimeError("Cannot remove 'Other' category because no fallback category exists.")

    Product.objects.filter(category_id=other.id).update(category_id=fallback.id)
    ListingRequest.objects.filter(category_id=other.id).update(category_id=fallback.id)

    other.delete()


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0022_product_fulfillment_mode_and_stock"),
    ]

    operations = [
        migrations.RunPython(forwards, reverse_code=migrations.RunPython.noop),
    ]


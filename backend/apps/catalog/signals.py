from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.accounts.command_center import invalidate_command_center_caches

from .models import ListingRequest, Product


@receiver(post_save, sender=ListingRequest)
@receiver(post_delete, sender=ListingRequest)
@receiver(post_save, sender=Product)
@receiver(post_delete, sender=Product)
def invalidate_admin_dashboard_cache_on_catalog_changes(**kwargs):
    invalidate_command_center_caches()

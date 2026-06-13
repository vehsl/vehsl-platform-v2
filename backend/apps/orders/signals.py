from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.accounts.command_center import invalidate_command_center_caches
from apps.accounts.seller_trends import invalidate_seller_trends_caches

from .models import Dispute, Order, Review, Shipment


@receiver(post_save, sender=Order)
@receiver(post_delete, sender=Order)
@receiver(post_save, sender=Shipment)
@receiver(post_delete, sender=Shipment)
@receiver(post_save, sender=Dispute)
@receiver(post_delete, sender=Dispute)
@receiver(post_save, sender=Review)
@receiver(post_delete, sender=Review)
def invalidate_admin_dashboard_cache_on_order_changes(**kwargs):
    invalidate_command_center_caches()
    invalidate_seller_trends_caches()

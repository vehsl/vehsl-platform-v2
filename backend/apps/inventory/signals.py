from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.accounts.command_center import invalidate_command_center_caches

from .models import QualityInspection


@receiver(post_save, sender=QualityInspection)
@receiver(post_delete, sender=QualityInspection)
def invalidate_admin_dashboard_cache_on_inventory_changes(**kwargs):
    invalidate_command_center_caches()

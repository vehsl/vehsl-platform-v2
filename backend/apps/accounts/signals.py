from django.db.models.signals import post_save
from django.dispatch import receiver

from .command_center import invalidate_command_center_caches
from .models import BuyerProfile, SellerProfile, User, UserProfile


@receiver(post_save, sender=User)
def ensure_profile(sender, instance: User, created: bool, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)
        if instance.account_type == User.AccountType.BUYER:
            BuyerProfile.objects.get_or_create(user=instance)
        elif instance.account_type == User.AccountType.SELLER:
            SellerProfile.objects.get_or_create(user=instance)
    invalidate_command_center_caches()

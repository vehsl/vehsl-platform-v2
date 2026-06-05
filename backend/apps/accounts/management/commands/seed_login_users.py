import os

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accounts.models import AdminProfile, BuyerProfile, SellerProfile, User, UserProfile


class Command(BaseCommand):
    def handle(self, *args, **options):
        default_password = os.environ.get("SEED_DEFAULT_PASSWORD", "Test123!@#")
        force_password = str(os.environ.get("SEED_FORCE_PASSWORD", "0") or "").strip().lower() in {"1", "true", "yes"}

        users = [
            {
                "email": "admin@vehsl.local",
                "first_name": "Admin",
                "last_name": "Super",
                "role": User.Role.ADMIN,
                "account_type": User.AccountType.BUYER,
                "is_staff": True,
                "is_superuser": True,
                "admin_role": AdminProfile.AdminRole.SUPER_ADMIN,
            },
            {
                "email": "ops.manager@vehsl.local",
                "first_name": "Ops",
                "last_name": "Manager",
                "role": User.Role.ADMIN,
                "account_type": User.AccountType.BUYER,
                "is_staff": True,
                "is_superuser": False,
                "admin_role": AdminProfile.AdminRole.LOGISTICS,
            },
            {
                "email": "legal.manager@vehsl.local",
                "first_name": "Legal",
                "last_name": "Manager",
                "role": User.Role.ADMIN,
                "account_type": User.AccountType.BUYER,
                "is_staff": True,
                "is_superuser": False,
                "admin_role": AdminProfile.AdminRole.COMPLIANCE,
            },
            {
                "email": "support.manager@vehsl.local",
                "first_name": "Support",
                "last_name": "Manager",
                "role": User.Role.ADMIN,
                "account_type": User.AccountType.BUYER,
                "is_staff": True,
                "is_superuser": False,
                "admin_role": AdminProfile.AdminRole.SUPPORT,
            },
            {
                "email": "inspector.manager@vehsl.local",
                "first_name": "Inspector",
                "last_name": "Manager",
                "role": User.Role.ADMIN,
                "account_type": User.AccountType.BUYER,
                "is_staff": True,
                "is_superuser": False,
                "admin_role": AdminProfile.AdminRole.INSPECTOR,
            },
            {
                "email": "buyer@vehsl.local",
                "first_name": "Buyer",
                "last_name": "Test",
                "role": User.Role.BUYER,
                "account_type": User.AccountType.BUYER,
                "is_staff": False,
                "is_superuser": False,
                "admin_role": None,
            },
            {
                "email": "seller@vehsl.local",
                "first_name": "Seller",
                "last_name": "Test",
                "role": User.Role.SELLER,
                "account_type": User.AccountType.SELLER,
                "is_staff": False,
                "is_superuser": False,
                "admin_role": None,
            },
        ]

        created = 0
        updated = 0

        with transaction.atomic():
            for spec in users:
                email = spec["email"]
                u, was_created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        "first_name": spec["first_name"],
                        "last_name": spec["last_name"],
                        "role": spec["role"],
                        "account_type": spec["account_type"],
                        "is_staff": spec["is_staff"],
                        "is_superuser": spec["is_superuser"],
                        "is_active": True,
                    },
                )
                if was_created:
                    created += 1
                else:
                    updated += 1

                u.first_name = spec["first_name"]
                u.last_name = spec["last_name"]
                u.role = spec["role"]
                u.account_type = spec["account_type"]
                u.is_staff = spec["is_staff"]
                u.is_superuser = spec["is_superuser"]
                u.is_active = True
                if was_created or force_password:
                    u.set_password(default_password)
                u.save()

                UserProfile.objects.get_or_create(user=u)

                if u.account_type == User.AccountType.BUYER:
                    BuyerProfile.objects.get_or_create(user=u)
                if u.account_type == User.AccountType.SELLER:
                    SellerProfile.objects.get_or_create(user=u)

                if spec["admin_role"]:
                    ap, _ = AdminProfile.objects.get_or_create(
                        user=u,
                        defaults={"admin_role": spec["admin_role"], "department": ""},
                    )
                    ap.admin_role = spec["admin_role"]
                    ap.save(update_fields=["admin_role"])
                else:
                    AdminProfile.objects.filter(user=u).delete()

        self.stdout.write(self.style.SUCCESS(f"seed_login_users: created={created} updated={updated}"))
        self.stdout.write(self.style.SUCCESS("seed_login_users: done"))

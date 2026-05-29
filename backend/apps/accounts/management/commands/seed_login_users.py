import os
from decimal import Decimal
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import AdminProfile, BuyerProfile, SellerProfile, User, UserProfile


class Command(BaseCommand):
    def handle(self, *args, **options):
        default_password = os.environ.get("SEED_DEFAULT_PASSWORD", "Test123!@#")

        users = [
            {
                "email": os.environ.get("DJANGO_SUPERUSER_EMAIL", "admin@vehsl.local"),
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

            try:
                from apps.catalog.models import Category, Product, Warehouse, WarehouseStock
                from apps.orders.models import Order, OrderItem, Shipment
            except Exception:
                Category = None
                Product = None
                Warehouse = None
                WarehouseStock = None
                Order = None
                OrderItem = None
                Shipment = None

            if Warehouse and WarehouseStock and Product:
                wh = Warehouse.objects.filter(active=True).order_by("id").first()
                if not wh:
                    wh = Warehouse.objects.create(
                        name="Default Warehouse",
                        code="DEFAULT",
                        active=True,
                        country="US",
                        region="TX",
                        city="Austin",
                        street1="100 Warehouse St",
                        street2="",
                        postal_code="78701",
                    )

                seller = User.objects.filter(email="seller@vehsl.local").first()
                if seller:
                    SellerProfile.objects.get_or_create(user=seller)
                    SellerProfile.objects.filter(user=seller).update(verification_status=SellerProfile.VerificationStatus.APPROVED)

                    if Category and Product and Product.objects.filter(seller=seller, deleted_at__isnull=True).count() == 0:
                        root_cat = Category.objects.filter(parent__isnull=True).order_by("id").first()
                        if not root_cat:
                            root_cat = Category.objects.create(name="Electronics")

                        demo_products = [
                            ("Wireless Earbuds Pro", "WEP-4200", Decimal("149.00")),
                            ("Bamboo Cutlery Set", "BCS-7700", Decimal("12.50")),
                            ("Ceramic Coffee Mug", "CCM-1100", Decimal("8.90")),
                        ]
                        for name, sku, price in demo_products:
                            Product.objects.create(
                                seller=seller,
                                category=root_cat,
                                name=name,
                                sku=sku,
                                price=price,
                                currency="USD",
                                status=Product.Status.ACTIVE,
                                sample_available=True,
                            )

                    if WarehouseStock.objects.filter(seller=seller, deleted_at__isnull=True).count() == 0:
                        product_ids: list[int] = []
                        try:
                            base_ids = (
                                Product.objects.filter(seller=seller, deleted_at__isnull=True)
                                .exclude(status=Product.Status.ARCHIVED)
                                .order_by("id")
                                .values_list("id", flat=True)[:20]
                            )
                            product_ids.extend([int(x) for x in list(base_ids)])
                        except Exception:
                            product_ids = []

                        if Order:
                            try:
                                order_product_ids = (
                                    Order.objects.filter(seller=seller, deleted_at__isnull=True)
                                    .prefetch_related("items")
                                    .order_by("-created_at")
                                    .values_list("items__product_id", flat=True)[:20]
                                )
                                product_ids.extend([int(x) for x in list(order_product_ids) if x])
                            except Exception:
                                pass

                        seen = set()
                        deduped: list[int] = []
                        for pid in product_ids:
                            if pid in seen:
                                continue
                            seen.add(pid)
                            deduped.append(pid)
                        product_ids = deduped[:12]

                        for i, pid in enumerate(product_ids):
                            qty = 60 + ((pid * 37 + i * 19) % 240)
                            WarehouseStock.objects.get_or_create(
                                seller=seller,
                                warehouse=wh,
                                product_id=pid,
                                variation=None,
                                defaults={"quantity_units": qty, "reserved_units": 0},
                            )

                    buyer = User.objects.filter(email="buyer@vehsl.local").first()
                    if buyer and Order and OrderItem and Shipment:
                        if Order.objects.filter(buyer=buyer, seller=seller, deleted_at__isnull=True).count() == 0:
                            products = list(
                                Product.objects.filter(seller=seller, deleted_at__isnull=True)
                                .exclude(status=Product.Status.ARCHIVED)
                                .order_by("id")[:3]
                            )
                            if products:
                                now = timezone.now()

                                def _make_order(status_key: str, country_name: str, created_days_ago: int):
                                    created_at = now - timedelta(days=created_days_ago)
                                    o = Order.objects.create(
                                        buyer=buyer,
                                        seller=seller,
                                        status=status_key,
                                        currency="USD",
                                        payment_method=Order.PaymentMethod.CARD,
                                        payment_status=(Order.PaymentStatus.PAID if status_key in {Order.Status.SHIPPED, Order.Status.DELIVERED, Order.Status.COMPLETED} else Order.PaymentStatus.UNPAID),
                                        shipping_address={
                                            "name": f"{buyer.first_name} {buyer.last_name}".strip() or buyer.email,
                                            "city": "Austin",
                                            "country": country_name,
                                        },
                                    )
                                    Order.objects.filter(id=o.id).update(created_at=created_at, updated_at=created_at)
                                    return Order.objects.get(id=o.id)

                                o_created = _make_order(Order.Status.CREATED, "United States", 2)
                                o_shipped = _make_order(Order.Status.SHIPPED, "Canada", 7)
                                o_completed = _make_order(Order.Status.COMPLETED, "United Kingdom", 20)

                                def _add_items(order_obj: Order, product_list: list[Product]):
                                    total = Decimal("0")
                                    for idx, p in enumerate(product_list):
                                        qty = 10 + idx * 3
                                        unit_price = Decimal(str(p.price))
                                        OrderItem.objects.create(order=order_obj, product=p, variation=None, quantity=qty, unit_price=unit_price)
                                        total += unit_price * qty
                                    Order.objects.filter(id=order_obj.id).update(total_amount=total)

                                _add_items(o_created, [products[0]])
                                _add_items(o_shipped, [products[0], products[1] if len(products) > 1 else products[0]])
                                _add_items(o_completed, [products[-1]])

                                Shipment.objects.create(
                                    order=o_shipped,
                                    status=Shipment.Status.IN_TRANSIT,
                                    tracking_number=f"TRK{o_shipped.id}IN",
                                    origin="Austin, US",
                                    destination="Toronto, CA",
                                    estimated_delivery_at=now + timedelta(days=5),
                                )
                                Shipment.objects.create(
                                    order=o_completed,
                                    status=Shipment.Status.DELIVERED,
                                    tracking_number=f"TRK{o_completed.id}DLV",
                                    origin="Austin, US",
                                    destination="London, GB",
                                    estimated_delivery_at=now - timedelta(days=3),
                                    actual_delivery_at=now - timedelta(days=1),
                                )

        self.stdout.write(self.style.SUCCESS(f"seed_login_users: created={created} updated={updated}"))
        self.stdout.write(self.style.SUCCESS(f"seed_login_users password: {default_password}"))

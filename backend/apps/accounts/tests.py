import re
from datetime import timedelta

from django.core import mail
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import BuyerProfile, EmailVerificationCode, SellerProfile, User
from apps.catalog.models import Category, ListingRequest, Product, ProductMedia
from apps.inventory.models import QualityInspection
from apps.orders.models import Dispute, Order, OrderItem, Review, Shipment


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="no-reply@test.local",
)
class EmailVerificationFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def _request_code(self, email: str):
        return self.client.post("/api/v1/auth/email-verification/request", {"email": email}, format="json")

    def _extract_code(self) -> str:
        self.assertEqual(len(mail.outbox), 1)
        match = re.search(r"Code:\s*(\d{6})", mail.outbox[0].body)
        self.assertIsNotNone(match)
        return match.group(1)

    def test_request_email_verification_sends_code(self):
        response = self._request_code("newuser@example.com")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["detail"], "Verification code sent.")
        self.assertTrue(EmailVerificationCode.objects.filter(email="newuser@example.com", purpose="signup").exists())
        self.assertEqual(mail.outbox[0].to, ["newuser@example.com"])

    def test_verify_email_code_returns_token_and_register_requires_it(self):
        self._request_code("verified@example.com")
        code = self._extract_code()

        verify_response = self.client.post(
            "/api/v1/auth/email-verification/verify",
            {"email": "verified@example.com", "code": code},
            format="json",
        )

        self.assertEqual(verify_response.status_code, 200)
        self.assertTrue(verify_response.data["verification_token"])
        self.assertFalse(EmailVerificationCode.objects.filter(email="verified@example.com", purpose="signup").exists())

        missing_token_response = self.client.post(
            "/api/v1/auth/register",
            {
                "email": "verified@example.com",
                "first_name": "Vehsl",
                "last_name": "User",
                "account_type": "buyer",
                "password": "TestPassword123!",
            },
        )
        self.assertEqual(missing_token_response.status_code, 400)
        self.assertIn("email_verification_token", missing_token_response.data)

        register_response = self.client.post(
            "/api/v1/auth/register",
            {
                "email": "verified@example.com",
                "email_verification_token": verify_response.data["verification_token"],
                "first_name": "Vehsl",
                "last_name": "User",
                "account_type": "buyer",
                "password": "TestPassword123!",
            },
        )

        self.assertEqual(register_response.status_code, 201)
        self.assertTrue(User.objects.filter(email="verified@example.com").exists())

    def test_verify_wrong_code_increments_attempts(self):
        self._request_code("wrong@example.com")

        response = self.client.post(
            "/api/v1/auth/email-verification/verify",
            {"email": "wrong@example.com", "code": "000000"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        record = EmailVerificationCode.objects.get(email="wrong@example.com", purpose="signup")
        self.assertEqual(record.attempt_count, 1)


class AdminCommandCenterTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email="admin@example.com",
            password="AdminPassword123!",
            role=User.Role.ADMIN,
            is_staff=True,
        )
        self.client.force_authenticate(self.admin)
        self.category = Category.objects.create(name="Command Center", slug="command-center")

    def _create_product(self, seller: User, name: str, status: str) -> Product:
        return Product.objects.create(
            seller=seller,
            category=self.category,
            name=name,
            currency="USD",
            price="25.00",
            status=status,
        )

    def test_command_center_contract_is_stable(self):
        response = self.client.get("/api/v1/admin/command-center?period=7d")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["meta"]["period"], "7d")
        self.assertIn("generated_at", response.data["meta"])
        self.assertIn("last_updated", response.data["meta"])
        self.assertIn("cache_ttl_seconds", response.data["meta"])
        self.assertEqual(response.data["meta"]["paths"]["orders"], "/admin/management/orders")

        hero = response.data["hero"]
        self.assertEqual(sorted(hero.keys()), ["active_orders", "quality_score", "shipments_in_transit", "users_online"])
        self.assertEqual(sorted(response.data["pipelines"].keys()), ["listings", "orders"])
        self.assertEqual(len(response.data["pipelines"]["listings"]["items"]), 5)
        self.assertEqual(len(response.data["pipelines"]["orders"]["items"]), 5)
        self.assertIn("pass_rate", hero["quality_score"])
        self.assertIn("pending", hero["quality_score"])
        self.assertIn("on_time_rate", hero["shipments_in_transit"])
        self.assertIn("generated_from_cache", response.data["meta"])
        self.assertIn("warnings", response.data["meta"])

    def test_command_center_aggregates_real_domain_data(self):
        now = timezone.now()
        seller = User.objects.create_user(
            email="seller@example.com",
            password="SellerPassword123!",
            role=User.Role.SELLER,
            account_type=User.AccountType.SELLER,
        )
        buyer = User.objects.create_user(
            email="buyer@example.com",
            password="BuyerPassword123!",
            role=User.Role.BUYER,
            account_type=User.AccountType.BUYER,
        )
        business_buyer = User.objects.create_user(
            email="business@example.com",
            password="BuyerPassword123!",
            role=User.Role.BUYER,
            account_type=User.AccountType.BUYER,
        )
        BuyerProfile.objects.filter(user=business_buyer).update(business_type="retailer")
        User.objects.filter(pk__in=[self.admin.pk, seller.pk, buyer.pk, business_buyer.pk]).update(last_login=now)

        active_product = self._create_product(seller, "Active Product", Product.Status.ACTIVE)
        self._create_product(seller, "Rejected Product", Product.Status.REJECTED)

        ListingRequest.objects.create(
            seller=seller,
            category=self.category,
            category_label="Command Center",
            product_name="Samples Listing",
            unit_price="10.00",
            moq=1,
            stage=ListingRequest.Stage.SAMPLES,
        )
        ListingRequest.objects.create(
            seller=seller,
            category=self.category,
            category_label="Command Center",
            product_name="Compliance Listing",
            unit_price="10.00",
            moq=1,
            stage=ListingRequest.Stage.COMPLIANCE,
        )
        ListingRequest.objects.create(
            seller=seller,
            category=self.category,
            category_label="Command Center",
            product_name="Inspection Listing",
            unit_price="10.00",
            moq=1,
            stage=ListingRequest.Stage.INSPECTION,
        )

        Order.objects.create(buyer=buyer, seller=seller, status=Order.Status.CREATED, total_amount="150.00")
        Order.objects.create(buyer=business_buyer, seller=seller, status=Order.Status.ACCEPTED, total_amount="250.00")
        shipped_order = Order.objects.create(buyer=buyer, seller=seller, status=Order.Status.SHIPPED, total_amount="300.00")
        Order.objects.create(buyer=buyer, seller=seller, status=Order.Status.DELIVERED, total_amount="400.00")
        disputed_order = Order.objects.create(buyer=buyer, seller=seller, status=Order.Status.CREATED, total_amount="180.00")
        Dispute.objects.create(order=disputed_order, opened_by=buyer, status=Dispute.Status.OPEN)

        Shipment.objects.create(
            order=shipped_order,
            status=Shipment.Status.IN_TRANSIT,
            destination="Chicago, IL",
            tracking_number="TRACK-123",
        )
        QualityInspection.objects.create(product=active_product, seller=seller, status=QualityInspection.Status.PASSED, score=90)
        QualityInspection.objects.create(product=active_product, seller=seller, status=QualityInspection.Status.FAILED, score=80)
        QualityInspection.objects.create(product=active_product, seller=seller, status=QualityInspection.Status.IN_PROGRESS, score=0)

        response = self.client.get("/api/v1/admin/command-center?period=7d")

        self.assertEqual(response.status_code, 200)
        hero = response.data["hero"]
        self.assertEqual(hero["active_orders"]["snapshot_total"], 4)
        self.assertEqual(hero["active_orders"]["snapshot_b2b"], 1)
        self.assertEqual(hero["users_online"]["snapshot_total"], 4)
        self.assertEqual(hero["users_online"]["snapshot_workers"], 1)
        self.assertEqual(hero["quality_score"]["total"], 85.0)
        self.assertEqual(hero["quality_score"]["pass_rate"], 50.0)
        self.assertEqual(hero["quality_score"]["pending"], 1)
        self.assertEqual(hero["shipments_in_transit"]["total"], 1)
        listing_items = {item["key"]: item["count"] for item in response.data["pipelines"]["listings"]["items"]}
        order_items = {item["key"]: item["count"] for item in response.data["pipelines"]["orders"]["items"]}
        self.assertEqual(listing_items["samples"], 1)
        self.assertEqual(listing_items["compliance"], 1)
        self.assertEqual(listing_items["inspection"], 1)
        self.assertEqual(listing_items["live"], 1)
        self.assertEqual(listing_items["rejected"], 1)
        self.assertEqual(order_items["created"], 2)
        self.assertEqual(order_items["accepted"], 1)
        self.assertEqual(order_items["shipped"], 1)
        self.assertEqual(order_items["delivered"], 1)
        self.assertEqual(order_items["disputed"], 1)

    def test_command_center_cache_is_invalidated_on_domain_writes(self):
        initial = self.client.get("/api/v1/admin/command-center?period=7d")
        self.assertEqual(initial.status_code, 200)
        self.assertEqual(initial.data["hero"]["active_orders"]["snapshot_total"], 0)

        seller = User.objects.create_user(
            email="cache-seller@example.com",
            password="SellerPassword123!",
            role=User.Role.SELLER,
            account_type=User.AccountType.SELLER,
        )
        buyer = User.objects.create_user(
            email="cache-buyer@example.com",
            password="BuyerPassword123!",
            role=User.Role.BUYER,
            account_type=User.AccountType.BUYER,
        )
        Order.objects.create(buyer=buyer, seller=seller, status=Order.Status.CREATED, total_amount="99.00")

        refreshed = self.client.get("/api/v1/admin/command-center?period=7d")
        self.assertEqual(refreshed.status_code, 200)
        self.assertEqual(refreshed.data["hero"]["active_orders"]["snapshot_total"], 1)
        self.assertFalse(refreshed.data["meta"]["generated_from_cache"])

        cached = self.client.get("/api/v1/admin/command-center?period=7d")
        self.assertTrue(cached.data["meta"]["generated_from_cache"])


class AdminSellerTrendsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email="ops-admin@example.com",
            password="AdminPassword123!",
            role=User.Role.ADMIN,
            is_staff=True,
        )
        self.client.force_authenticate(self.admin)
        self.category = Category.objects.create(name="Tea & Wellness", slug="tea-wellness")
        self.second_category = Category.objects.create(name="Lighting", slug="lighting")
        self.seller_one = User.objects.create_user(
            email="seller-one@example.com",
            password="SellerPassword123!",
            role=User.Role.SELLER,
            account_type=User.AccountType.SELLER,
        )
        self.seller_two = User.objects.create_user(
            email="seller-two@example.com",
            password="SellerPassword123!",
            role=User.Role.SELLER,
            account_type=User.AccountType.SELLER,
        )
        SellerProfile.objects.filter(user=self.seller_one).update(
            business_name="GreenLeaf Organics",
            country="Pakistan",
            region="Punjab",
            verification_status=SellerProfile.VerificationStatus.APPROVED,
            vehsl_rating="4.8",
        )
        SellerProfile.objects.filter(user=self.seller_two).update(
            business_name="Meridian Lighting",
            country="United Arab Emirates",
            region="Dubai",
            verification_status=SellerProfile.VerificationStatus.APPROVED,
            vehsl_rating="4.6",
        )
        self.buyer_one = User.objects.create_user(
            email="buyer-one@example.com",
            password="BuyerPassword123!",
            role=User.Role.BUYER,
            account_type=User.AccountType.BUYER,
        )
        self.buyer_two = User.objects.create_user(
            email="buyer-two@example.com",
            password="BuyerPassword123!",
            role=User.Role.BUYER,
            account_type=User.AccountType.BUYER,
        )
        self.product_one = Product.objects.create(
            seller=self.seller_one,
            category=self.category,
            name="Organic Herbal Tea Blend",
            sku="TEA-01",
            currency="USD",
            price="24.99",
            status=Product.Status.ACTIVE,
        )
        self.product_two = Product.objects.create(
            seller=self.seller_two,
            category=self.second_category,
            name="Smart LED Panel Light",
            sku="LED-01",
            currency="USD",
            price="89.90",
            status=Product.Status.ACTIVE,
        )
        ProductMedia.objects.create(
            product=self.product_one,
            media_type=ProductMedia.MediaType.IMAGE,
            url="https://cdn.example.com/tea.png",
            title="Tea image",
        )
        ProductMedia.objects.create(
            product=self.product_one,
            media_type=ProductMedia.MediaType.VIDEO,
            url="https://cdn.example.com/tea-reel.mp4",
            title="Tea reel",
        )
        ProductMedia.objects.create(
            product=self.product_two,
            media_type=ProductMedia.MediaType.IMAGE,
            url="https://cdn.example.com/light.png",
            title="Light image",
        )
        now = timezone.now()
        current_one = Order.objects.create(
            buyer=self.buyer_one,
            seller=self.seller_one,
            status=Order.Status.DELIVERED,
            total_amount="124.95",
            shipping_address={"country": "Pakistan", "city": "Lahore"},
        )
        OrderItem.objects.create(order=current_one, product=self.product_one, quantity=5, unit_price="24.99")
        current_two = Order.objects.create(
            buyer=self.buyer_two,
            seller=self.seller_two,
            status=Order.Status.DELIVERED,
            total_amount="179.80",
            shipping_address={"country": "United Arab Emirates", "city": "Dubai"},
        )
        OrderItem.objects.create(order=current_two, product=self.product_two, quantity=2, unit_price="89.90")
        disputed_current = Order.objects.create(
            buyer=self.buyer_one,
            seller=self.seller_one,
            status=Order.Status.DISPUTED,
            total_amount="49.98",
            shipping_address={"country": "Pakistan", "city": "Karachi"},
        )
        OrderItem.objects.create(order=disputed_current, product=self.product_one, quantity=2, unit_price="24.99")
        Dispute.objects.create(order=disputed_current, opened_by=self.buyer_one, status=Dispute.Status.OPEN)
        previous_order = Order.objects.create(
            buyer=self.buyer_one,
            seller=self.seller_one,
            status=Order.Status.DELIVERED,
            total_amount="24.99",
            shipping_address={"country": "Pakistan", "city": "Lahore"},
        )
        OrderItem.objects.create(order=previous_order, product=self.product_one, quantity=1, unit_price="24.99")
        Order.objects.filter(pk=current_one.pk).update(created_at=now - timedelta(days=1))
        Order.objects.filter(pk=current_two.pk).update(created_at=now - timedelta(days=2))
        Order.objects.filter(pk=disputed_current.pk).update(created_at=now - timedelta(days=3))
        Order.objects.filter(pk=previous_order.pk).update(created_at=now - timedelta(days=10))
        Review.objects.create(
            order=current_one,
            reviewer=self.buyer_one,
            target_type=Review.TargetType.SELLER,
            target_seller=self.seller_one,
            rating="5.0",
            text="Excellent seller",
        )

    def test_admin_seller_trends_endpoints_return_real_aggregates(self):
        summary = self.client.get("/api/v1/admin/seller-trends/summary?period=7d")
        products = self.client.get("/api/v1/admin/seller-trends/products?period=7d&page=1&page_size=10")
        breakout_products = self.client.get("/api/v1/admin/seller-trends/products?period=7d&breakout=1")
        revenue_sorted_products = self.client.get("/api/v1/admin/seller-trends/products?period=7d&sort=revenue")
        sellers = self.client.get("/api/v1/admin/seller-trends/sellers?period=7d&page=1&page_size=10")
        seller_detail = self.client.get(f"/api/v1/admin/seller-trends/sellers/{self.seller_one.id}?period=7d")
        keywords = self.client.get("/api/v1/admin/seller-trends/keywords?period=7d&page=1&page_size=10")
        reels = self.client.get("/api/v1/admin/seller-trends/reels?period=7d&page=1&page_size=10")

        self.assertEqual(summary.status_code, 200)
        self.assertEqual(products.status_code, 200)
        self.assertEqual(breakout_products.status_code, 200)
        self.assertEqual(revenue_sorted_products.status_code, 200)
        self.assertEqual(sellers.status_code, 200)
        self.assertEqual(seller_detail.status_code, 200)
        self.assertEqual(keywords.status_code, 200)
        self.assertEqual(reels.status_code, 200)

        self.assertEqual(summary.data["period"], "7d")
        self.assertEqual(summary.data["metrics"]["total_orders"], 3)
        self.assertEqual(summary.data["metrics"]["units_sold"], 9)
        self.assertEqual(summary.data["metrics"]["total_views"], 0)
        self.assertEqual(summary.data["metrics"]["active_sellers"], 2)
        self.assertGreater(summary.data["metrics"]["total_sales_value"], 350)
        self.assertIsNone(summary.data["metrics"]["buy_rate"])
        self.assertEqual(summary.data["metrics"]["views_source"], "unavailable")
        self.assertTrue(summary.data["filters"]["industry_options"])
        self.assertTrue(summary.data["filters"]["country_options"])

        self.assertEqual(products.data["meta"]["page"], 1)
        self.assertGreaterEqual(products.data["meta"]["count"], 2)
        self.assertEqual(products.data["results"][0]["name"], "Organic Herbal Tea Blend")
        self.assertEqual(products.data["results"][0]["orders7d"], 7)
        self.assertGreater(products.data["results"][0]["revenue7d"], 170)
        self.assertEqual(products.data["results"][0]["topMarkets"][0]["code"], "pk")
        self.assertEqual(products.data["results"][0]["views_source"], "unavailable")
        self.assertEqual(products.data["results"][0]["seller_count"], 1)
        self.assertEqual(products.data["results"][0]["change_pct"], products.data["results"][0]["change"])
        self.assertEqual(revenue_sorted_products.data["results"][0]["name"], "Smart LED Panel Light")
        self.assertTrue(all(row["badge"] == "breakout" or row["change_pct"] >= 25 for row in breakout_products.data["results"]))

        self.assertEqual(sellers.data["results"][0]["name"], "GreenLeaf Organics")
        self.assertEqual(sellers.data["results"][0]["orders"], 7)
        self.assertEqual(sellers.data["results"][0]["repeatBuyerRate"], 100)
        self.assertEqual(sellers.data["results"][0]["metrics_source"]["return_rate"], "derived_dispute_rate")
        self.assertEqual(len(sellers.data["results"][0]["monthlySales"]), 6)
        self.assertEqual(sellers.data["results"][0]["product_count"], 1)
        self.assertEqual(seller_detail.data["seller_id"], str(self.seller_one.id))
        self.assertEqual(len(seller_detail.data["monthly_sales"]), 6)
        self.assertIn("generated", seller_detail.data["summary"])

        self.assertTrue(any(row["keyword"] == "organic" for row in keywords.data["results"]))
        self.assertEqual(keywords.data["results"][0]["source_type"], "derived_order_tokens")
        self.assertEqual(keywords.data["results"][0]["top_product"], keywords.data["results"][0]["product"])
        self.assertEqual(reels.data["results"][0]["seller_name"], "GreenLeaf Organics")
        self.assertEqual(reels.data["results"][0]["product_name"], reels.data["results"][0]["product"])
        self.assertIn(reels.data["results"][0]["stats_source"], {"detail_config", "derived"})

    def test_admin_seller_trends_country_filter_and_cache_invalidation(self):
        cached_before = self.client.get("/api/v1/admin/seller-trends/products?period=7d&country=pk")
        self.assertEqual(cached_before.status_code, 200)
        self.assertEqual(cached_before.data["meta"]["count"], 1)
        self.assertEqual(cached_before.data["results"][0]["name"], "Organic Herbal Tea Blend")

        new_order = Order.objects.create(
            buyer=self.buyer_two,
            seller=self.seller_two,
            status=Order.Status.DELIVERED,
            total_amount="269.70",
            shipping_address={"country": "United Arab Emirates", "city": "Dubai"},
        )
        OrderItem.objects.create(order=new_order, product=self.product_two, quantity=3, unit_price="89.90")

        updated_summary = self.client.get("/api/v1/admin/seller-trends/summary?period=7d")
        self.assertEqual(updated_summary.status_code, 200)
        self.assertEqual(updated_summary.data["metrics"]["total_orders"], 4)
        self.assertEqual(updated_summary.data["metrics"]["units_sold"], 12)

    def test_admin_seller_trends_supports_offset_pagination(self):
        response = self.client.get("/api/v1/admin/seller-trends/keywords?period=7d&page_size=1&offset=1")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["meta"]["page"], 2)
        self.assertEqual(response.data["meta"]["page_size"], 1)
        self.assertTrue(response.data["meta"]["has_previous"])

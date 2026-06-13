import re

from django.core import mail
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import BuyerProfile, EmailVerificationCode, User
from apps.catalog.models import Category, ListingRequest, Product
from apps.inventory.models import QualityInspection
from apps.orders.models import Dispute, Order, Shipment


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

import re

from django.core import mail
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.accounts.models import EmailVerificationCode, User


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
            account_type="buyer",
            is_staff=True,
        )
        self.client.force_authenticate(self.admin)

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

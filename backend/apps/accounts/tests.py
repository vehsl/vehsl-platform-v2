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

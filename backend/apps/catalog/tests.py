from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.catalog.models import Category, InboundRequest, ListingRequest, Product, Warehouse


class ListingRequestFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        User = get_user_model()
        self.admin = User.objects.create_user(email="admin@test.local", password="pass1234", role="admin", is_staff=True)
        self.seller = User.objects.create_user(email="seller@test.local", password="pass1234", role="seller", account_type="seller")
        self.category = Category.objects.create(name="Test Category", slug="test-category")
        self.warehouse = Warehouse.objects.create(name="W1", active=True)

    def _required_meta(self):
        return {
            "sku": "SKU-1",
            "hs_code": "1234.56",
            "origin_location": {"country": "US"},
            "lead_time_days": 10,
            "weight_grams": 1000,
            "ship_time_min_days": 2,
            "ship_time_max_days": 5,
        }

    def test_verify_compliance_moves_to_inspection_and_creates_inbound(self):
        lr = ListingRequest.objects.create(
            seller=self.seller,
            category=self.category,
            category_label="Test Category",
            product_name="P1",
            unit_price="10.00",
            moq=1,
            stage=ListingRequest.Stage.COMPLIANCE,
        )

        self.client.force_authenticate(user=self.admin)
        res = self.client.post(f"/api/v1/admin/listing-requests/{lr.id}/verify_compliance/", {"verified": True, "notes": "ok"}, format="json")
        self.assertEqual(res.status_code, 200)
        lr.refresh_from_db()
        self.assertTrue(lr.compliance_verified)
        self.assertEqual(lr.stage, ListingRequest.Stage.INSPECTION)
        self.assertIsNotNone(getattr(lr, "inbound_request", None))

    def test_approve_requires_required_fields(self):
        lr = ListingRequest.objects.create(
            seller=self.seller,
            category=self.category,
            category_label="Test Category",
            product_name="P2",
            unit_price="10.00",
            moq=1,
            stage=ListingRequest.Stage.INBOUND,
            compliance_verified=True,
            inspected=True,
            product_meta={},
        )
        InboundRequest.objects.create(listing_request=lr, seller=self.seller, warehouse=self.warehouse, status=InboundRequest.Status.RECEIVED)

        self.client.force_authenticate(user=self.admin)
        res = self.client.post(f"/api/v1/admin/listing-requests/{lr.id}/review/", {"decision": "approve"}, format="json")
        self.assertEqual(res.status_code, 400)
        data = res.json()
        self.assertIn("missing", data)
        self.assertIn("sku", data["missing"])

        lr.product_meta = self._required_meta()
        lr.save(update_fields=["product_meta", "updated_at"])
        res2 = self.client.post(f"/api/v1/admin/listing-requests/{lr.id}/review/", {"decision": "approve"}, format="json")
        self.assertEqual(res2.status_code, 200)
        lr.refresh_from_db()
        self.assertEqual(lr.stage, ListingRequest.Stage.LIVE)

    def test_publish_only_from_live_and_creates_product(self):
        lr = ListingRequest.objects.create(
            seller=self.seller,
            category=self.category,
            category_label="Test Category",
            product_name="P3",
            unit_price="10.00",
            moq=1,
            stage=ListingRequest.Stage.INBOUND,
            compliance_verified=True,
            inspected=True,
            product_meta=self._required_meta(),
        )
        InboundRequest.objects.create(listing_request=lr, seller=self.seller, warehouse=self.warehouse, status=InboundRequest.Status.RECEIVED)

        self.client.force_authenticate(user=self.admin)
        res = self.client.post(f"/api/v1/admin/listing-requests/{lr.id}/publish/", {}, format="json")
        self.assertEqual(res.status_code, 400)

        res2 = self.client.post(f"/api/v1/admin/listing-requests/{lr.id}/review/", {"decision": "approve"}, format="json")
        self.assertEqual(res2.status_code, 200)
        lr.refresh_from_db()
        self.assertEqual(lr.stage, ListingRequest.Stage.LIVE)

        res3 = self.client.post(f"/api/v1/admin/listing-requests/{lr.id}/publish/", {}, format="json")
        self.assertEqual(res3.status_code, 200)
        lr.refresh_from_db()
        self.assertEqual(lr.stage, ListingRequest.Stage.DONE)
        self.assertIsNotNone(lr.created_product_id)
        p = Product.objects.get(id=lr.created_product_id)
        self.assertEqual(p.status, Product.Status.ACTIVE)

    def test_needs_changes_resets_flags_and_blocks_verify_until_resubmitted(self):
        lr = ListingRequest.objects.create(
            seller=self.seller,
            category=self.category,
            category_label="Test Category",
            product_name="P4",
            unit_price="10.00",
            moq=1,
            stage=ListingRequest.Stage.COMPLIANCE,
            compliance_verified=True,
            compliance_notes="old",
            inspected=True,
            inspector=self.admin,
            product_meta=self._required_meta(),
        )

        self.client.force_authenticate(user=self.admin)
        res = self.client.post(
            f"/api/v1/admin/listing-requests/{lr.id}/review/",
            {"decision": "needs_changes", "message": "Please update SKU"},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        lr.refresh_from_db()
        self.assertEqual(lr.stage, ListingRequest.Stage.SAMPLES)
        self.assertFalse(lr.compliance_verified)
        self.assertEqual(lr.compliance_notes, "")
        self.assertFalse(lr.inspected)
        self.assertIsNone(lr.inspector)
        self.assertEqual((lr.product_meta or {}).get("review_message"), "Please update SKU")

        res2 = self.client.post(
            f"/api/v1/admin/listing-requests/{lr.id}/verify_compliance/",
            {"verified": True, "notes": "ok"},
            format="json",
        )
        self.assertEqual(res2.status_code, 400)

    def test_seller_sample_address_does_not_advance_stage(self):
        lr = ListingRequest.objects.create(
            seller=self.seller,
            category=self.category,
            category_label="Test Category",
            product_name="P5",
            unit_price="10.00",
            moq=1,
            stage=ListingRequest.Stage.COMPLIANCE,
        )
        self.client.force_authenticate(user=self.seller)
        res = self.client.post(
            f"/api/v1/seller/listing-requests/{lr.id}/sample/",
            {"type": "factory", "address": "123 Street, City", "contact_name": "John", "phone": "123"},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        lr.refresh_from_db()
        self.assertEqual(lr.stage, ListingRequest.Stage.COMPLIANCE)

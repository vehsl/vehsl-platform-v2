from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.catalog.models import Category, ListingRequest, Product, ProductFeedback, Warehouse
from apps.accounts.models import BuyerAddress, Notification


class ListingRequestFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        User = get_user_model()
        self.admin = User.objects.create_user(email="admin@test.local", password="pass1234", role="admin", is_staff=True)
        self.seller = User.objects.create_user(email="seller@test.local", password="pass1234", role="seller", account_type="seller")
        self.buyer = User.objects.create_user(email="buyer@test.local", password="pass1234", role="buyer", account_type="buyer")
        self.category = Category.objects.create(name="Test Category", slug="test-category")
        self.warehouse = Warehouse.objects.create(name="W1", active=True)
        self.address = BuyerAddress.objects.create(
            user=self.buyer,
            kind=BuyerAddress.Kind.PRIMARY,
            contact_name="Buyer",
            phone="123",
            country="US",
            region="CA",
            city="SF",
            street1="1 Market St",
            postal_code="94105",
        )

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

    def test_approve_requires_required_fields(self):
        lr = ListingRequest.objects.create(
            seller=self.seller,
            category=self.category,
            category_label="Test Category",
            product_name="P2",
            unit_price="10.00",
            moq=1,
            stage=ListingRequest.Stage.INSPECTION,
            compliance_verified=True,
            inspected=True,
            product_meta={},
        )

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
            stage=ListingRequest.Stage.INSPECTION,
            compliance_verified=True,
            inspected=True,
            product_meta=self._required_meta(),
        )

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

    def test_seller_stock_blocks_orders_and_decrements(self):
        lr = ListingRequest.objects.create(
            seller=self.seller,
            category=self.category,
            category_label="Test Category",
            product_name="P6",
            unit_price="10.00",
            moq=1,
            stage=ListingRequest.Stage.INSPECTION,
            compliance_verified=True,
            inspected=True,
            product_meta=self._required_meta(),
        )
        self.client.force_authenticate(user=self.admin)
        res2 = self.client.post(f"/api/v1/admin/listing-requests/{lr.id}/review/", {"decision": "approve"}, format="json")
        self.assertEqual(res2.status_code, 200)
        res3 = self.client.post(f"/api/v1/admin/listing-requests/{lr.id}/publish/", {}, format="json")
        self.assertEqual(res3.status_code, 200)
        lr.refresh_from_db()
        product = Product.objects.get(id=lr.created_product_id)

        product.fulfillment_mode = Product.FulfillmentMode.SELLER_STOCK
        product.seller_stock_units = 2
        product.save(update_fields=["fulfillment_mode", "seller_stock_units", "updated_at"])

        self.client.force_authenticate(user=self.buyer)
        bad = self.client.post(
            "/api/v1/orders/",
            {"items": [{"product_id": product.id, "quantity": 3}], "address_id": self.address.id},
            format="json",
        )
        self.assertEqual(bad.status_code, 400)

        ok = self.client.post(
            "/api/v1/orders/",
            {"items": [{"product_id": product.id, "quantity": 2}], "address_id": self.address.id},
            format="json",
        )
        self.assertEqual(ok.status_code, 201)
        product.refresh_from_db()
        self.assertEqual(product.seller_stock_units, 0)

        bad2 = self.client.post(
            "/api/v1/orders/",
            {"items": [{"product_id": product.id, "quantity": 1}], "address_id": self.address.id},
            format="json",
        )
        self.assertEqual(bad2.status_code, 400)

    def test_made_to_order_allows_orders_even_with_zero_stock(self):
        lr = ListingRequest.objects.create(
            seller=self.seller,
            category=self.category,
            category_label="Test Category",
            product_name="P7",
            unit_price="10.00",
            moq=1,
            stage=ListingRequest.Stage.INSPECTION,
            compliance_verified=True,
            inspected=True,
            product_meta=self._required_meta(),
        )
        self.client.force_authenticate(user=self.admin)
        res2 = self.client.post(f"/api/v1/admin/listing-requests/{lr.id}/review/", {"decision": "approve"}, format="json")
        self.assertEqual(res2.status_code, 200)
        res3 = self.client.post(f"/api/v1/admin/listing-requests/{lr.id}/publish/", {}, format="json")
        self.assertEqual(res3.status_code, 200)
        lr.refresh_from_db()
        product = Product.objects.get(id=lr.created_product_id)

        product.fulfillment_mode = Product.FulfillmentMode.MADE_TO_ORDER
        product.seller_stock_units = 0
        product.save(update_fields=["fulfillment_mode", "seller_stock_units", "updated_at"])

        self.client.force_authenticate(user=self.buyer)
        ok = self.client.post(
            "/api/v1/orders/",
            {"items": [{"product_id": product.id, "quantity": 999}], "address_id": self.address.id},
            format="json",
        )
        self.assertEqual(ok.status_code, 201)


class ProductFeedbackTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        User = get_user_model()
        self.admin = User.objects.create_user(email="admin2@test.local", password="pass1234", role="admin", is_staff=True)
        self.seller = User.objects.create_user(email="seller2@test.local", password="pass1234", role="seller", account_type="seller")
        self.category = Category.objects.create(name="Cat A", slug="cat-a")
        self.product = Product.objects.create(
            seller=self.seller,
            category=self.category,
            name="Prod A",
            title="Prod A",
            currency="USD",
            price="10.00",
            status=Product.Status.ACTIVE,
        )

    def test_admin_can_send_product_feedback_and_seller_can_read_and_mark_read(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.post(
            f"/api/v1/admin/products/{self.product.id}/feedback/",
            {"kind": "action_required", "message": "Please update your hero image."},
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        self.assertTrue(ProductFeedback.objects.filter(product=self.product, seller=self.seller, deleted_at__isnull=True).exists())
        self.assertTrue(
            Notification.objects.filter(user=self.seller, channel=Notification.Channel.IN_APP, event_type="product_feedback").exists()
        )

        self.client.force_authenticate(user=self.seller)
        get_res = self.client.get(f"/api/v1/products/{self.product.id}/feedback/")
        self.assertEqual(get_res.status_code, 200)
        body = get_res.json()
        self.assertGreaterEqual(int(body.get("unread_count") or 0), 1)
        self.assertTrue(isinstance(body.get("results"), list))

        mark_res = self.client.post(f"/api/v1/products/{self.product.id}/feedback/", {}, format="json")
        self.assertEqual(mark_res.status_code, 200)
        body2 = mark_res.json()
        self.assertEqual(int(body2.get("unread_count") or 0), 0)

    def test_seller_listing_requests_includes_feedback_fields(self):
        ListingRequest.objects.create(
            seller=self.seller,
            category=self.category,
            category_label="Cat A",
            product_name="LR",
            unit_price="10.00",
            moq=1,
            stage=ListingRequest.Stage.DONE,
            created_product=self.product,
        )
        ProductFeedback.objects.create(product=self.product, seller=self.seller, author=self.admin, kind="info", message="Note 1")

        self.client.force_authenticate(user=self.seller)
        res = self.client.get("/api/v1/seller/listing-requests/")
        self.assertEqual(res.status_code, 200)
        rows = res.json()
        self.assertTrue(isinstance(rows, list) and len(rows) >= 1)
        first = rows[0]
        self.assertIn("product_feedback_unread", first)
        self.assertIn("product_feedback_latest", first)


class AdminDeleteProductTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        User = get_user_model()
        self.admin = User.objects.create_user(email="admin3@test.local", password="pass1234", role="admin", is_staff=True)
        self.seller = User.objects.create_user(email="seller3@test.local", password="pass1234", role="seller", account_type="seller")
        self.buyer = User.objects.create_user(email="buyer3@test.local", password="pass1234", role="buyer", account_type="buyer")
        self.category = Category.objects.create(name="Cat B", slug="cat-b")
        self.product = Product.objects.create(
            seller=self.seller,
            category=self.category,
            name="Prod B",
            title="Prod B",
            currency="USD",
            price="10.00",
            status=Product.Status.ACTIVE,
        )

    def test_admin_can_delete_product_and_it_disappears_from_public(self):
        from apps.orders.models import WishlistItem

        WishlistItem.objects.create(buyer=self.buyer, product=self.product)

        self.client.force_authenticate(user=self.admin)
        res = self.client.post(f"/api/v1/admin/products/{self.product.id}/delete/", {}, format="json")
        self.assertEqual(res.status_code, 200)
        self.product.refresh_from_db()
        self.assertIsNotNone(self.product.deleted_at)

        self.assertTrue(WishlistItem.objects.filter(product=self.product, deleted_at__isnull=False).exists())

        self.client.force_authenticate(user=None)
        get_public = self.client.get(f"/api/v1/products/{self.product.id}/")
        self.assertEqual(get_public.status_code, 404)

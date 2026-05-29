from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from apps.catalog.models import Product, ProductVariation, Warehouse


class Cart(models.Model):
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="carts")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["buyer", "updated_at"]),
        ]

    def __str__(self):
        return f"cart:{self.pk}"


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="cart_items")
    variation = models.ForeignKey(ProductVariation, on_delete=models.PROTECT, null=True, blank=True, related_name="cart_items")
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    unit_price_snapshot = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, default="USD")
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["cart"]),
        ]
        constraints = [
            models.UniqueConstraint(fields=["cart", "product", "variation"], name="uniq_cart_item_product_variation"),
        ]

    def __str__(self):
        return f"cart_item:{self.pk}"


class WishlistItem(models.Model):
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="wishlist_items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="wishlisted_by")
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["buyer", "created_at"]),
            models.Index(fields=["product", "created_at"]),
        ]
        constraints = [
            models.UniqueConstraint(fields=["buyer", "product"], name="uniq_wishlist_buyer_product"),
        ]

    def __str__(self):
        return f"wishlist_item:{self.pk}"


class Order(models.Model):
    class Status(models.TextChoices):
        CREATED = "created", "Created"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"
        SHIPPED = "shipped", "Shipped"
        DELIVERED = "delivered", "Delivered"
        DISPUTED = "disputed", "Disputed"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    class PaymentMethod(models.TextChoices):
        CARD = "card", "Card"
        COD = "cod", "Cash on Delivery"

    class PaymentStatus(models.TextChoices):
        UNPAID = "unpaid", "Unpaid"
        PAID = "paid", "Paid"
        COD_PENDING = "cod_pending", "COD Pending"

    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="orders")
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="sales")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.CREATED)
    currency = models.CharField(max_length=3, default="USD")
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(0)], default=0)
    payment_method = models.CharField(max_length=16, choices=PaymentMethod.choices, default=PaymentMethod.CARD)
    payment_status = models.CharField(max_length=16, choices=PaymentStatus.choices, default=PaymentStatus.UNPAID)
    shipping_address = models.JSONField(default=dict, blank=True)
    deadline_at = models.DateTimeField(null=True, blank=True)
    extension_reason = models.TextField(blank=True, default="")
    extension_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    release_authorized_at = models.DateTimeField(null=True, blank=True)
    release_authorized_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="release_authorizations",
    )
    release_declined_at = models.DateTimeField(null=True, blank=True)
    release_declined_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="release_declines",
    )
    release_decline_reason = models.TextField(blank=True, default="")
    deleted_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["seller", "status"]),
            models.Index(fields=["buyer", "status"]),
            models.Index(fields=["status", "created_at"]),
        ]

    def __str__(self):
        return f"order:{self.pk}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="order_items")
    variation = models.ForeignKey(ProductVariation, on_delete=models.PROTECT, null=True, blank=True, related_name="order_items")
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["order", "product", "variation"], name="uniq_order_item_product_variation"),
        ]

    @property
    def line_total(self):
        return self.unit_price * self.quantity


class Shipment(models.Model):
    class Status(models.TextChoices):
        LABEL_CREATED = "label_created", "Label Created"
        PICKED_UP = "picked_up", "Picked Up"
        IN_TRANSIT = "in_transit", "In Transit"
        CUSTOMS = "customs", "Customs"
        OUT_FOR_DELIVERY = "out_for_delivery", "Out For Delivery"
        DELIVERED = "delivered", "Delivered"

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="shipments")
    carrier_id = models.CharField(max_length=64, blank=True)
    tracking_number = models.CharField(max_length=128, blank=True)
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.LABEL_CREATED)
    origin = models.CharField(max_length=255, blank=True)
    destination = models.CharField(max_length=255, blank=True)
    estimated_delivery_at = models.DateTimeField(null=True, blank=True)
    actual_delivery_at = models.DateTimeField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["order", "status"]),
            models.Index(fields=["tracking_number"]),
        ]

    def __str__(self):
        return f"shipment:{self.pk}"


class ShipmentEvent(models.Model):
    shipment = models.ForeignKey(Shipment, on_delete=models.CASCADE, related_name="events")
    type = models.CharField(max_length=64)
    location = models.CharField(max_length=255, blank=True)
    occurred_at = models.DateTimeField()
    payload = models.JSONField(default=dict, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["occurred_at", "id"]
        indexes = [
            models.Index(fields=["shipment", "occurred_at"]),
        ]

    def __str__(self):
        return f"shipment_event:{self.pk}"


class Document(models.Model):
    class OwnerType(models.TextChoices):
        ORDER = "order", "Order"
        SHIPMENT = "shipment", "Shipment"
        SELLER = "seller", "Seller"

    class DocumentType(models.TextChoices):
        COMMERCIAL_INVOICE = "commercial_invoice", "Commercial Invoice"
        BILL_OF_LADING = "bill_of_lading", "Bill of Lading"
        CERTIFICATE_OF_ORIGIN = "certificate_of_origin", "Certificate of Origin"
        PACKING_LIST = "packing_list", "Packing List"
        EXPORT_LICENSE = "export_license", "Export License"
        IMPORT_LICENSE = "import_license", "Import License"

    owner_type = models.CharField(max_length=16, choices=OwnerType.choices)
    owner_id = models.CharField(max_length=64)
    document_type = models.CharField(max_length=32, choices=DocumentType.choices)
    url = models.URLField()
    generated_by_ai = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["owner_type", "owner_id"]),
        ]

    def __str__(self):
        return f"document:{self.pk}"


class Dispute(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        MEDIATION = "mediation", "Mediation"
        RESOLVED = "resolved", "Resolved"
        ESCALATED = "escalated", "Escalated"

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="disputes")
    opened_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="disputes_opened")
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.OPEN)
    resolution = models.TextField(blank=True)
    opened_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["order", "status"]),
        ]

    def __str__(self):
        return f"dispute:{self.pk}"


class Review(models.Model):
    class TargetType(models.TextChoices):
        SELLER = "seller", "Seller"
        PRODUCT = "product", "Product"

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="reviews")
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="reviews_written")
    target_type = models.CharField(max_length=16, choices=TargetType.choices)
    target_seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, null=True, blank=True, related_name="reviews_as_seller")
    target_product = models.ForeignKey(Product, on_delete=models.PROTECT, null=True, blank=True, related_name="reviews")
    rating = models.DecimalField(max_digits=4, decimal_places=2, validators=[MinValueValidator(0)])
    text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["target_type", "created_at"]),
        ]
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(target_product__isnull=True, target_seller__isnull=False, target_type="seller")
                    | models.Q(target_product__isnull=False, target_seller__isnull=True, target_type="product")
                ),
                name="review_target_exactly_one",
            ),
        ]

    def __str__(self):
        return f"review:{self.pk}"


def _release_proof_upload_to(instance: "ReleaseConditionProof", filename: str) -> str:
    base = filename.replace("\\", "_").replace("/", "_").strip() or "document"
    return f"release_proofs/order_{instance.condition.order_id}/cond_{instance.condition_id}/{base}"


class ReleaseCondition(models.Model):
    class Type(models.TextChoices):
        INSPECTION = "inspection", "Inspection"
        LAB_TEST = "lab_test", "Lab Test"
        CERTIFICATION = "certification", "Certification"
        DOCUMENTATION = "documentation", "Documentation"
        PHOTO_PROOF = "photo_proof", "Photo Proof"
        CUSTOM = "custom", "Custom"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        IN_PROGRESS = "in_progress", "In Progress"
        SATISFIED = "satisfied", "Satisfied"
        WAIVED = "waived", "Waived"
        FAILED = "failed", "Failed"

    class Priority(models.TextChoices):
        CRITICAL = "critical", "Critical"
        REQUIRED = "required", "Required"
        OPTIONAL = "optional", "Optional"

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="release_conditions")
    type = models.CharField(max_length=24, choices=Type.choices, default=Type.CUSTOM)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.PENDING)
    priority = models.CharField(max_length=16, choices=Priority.choices, default=Priority.REQUIRED)
    due_at = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

    satisfied_at = models.DateTimeField(null=True, blank=True)
    satisfied_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="release_conditions_satisfied",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["order", "status"]),
            models.Index(fields=["status", "created_at"]),
        ]

    def __str__(self):
        return f"release_condition:{self.pk}"


class ReleaseConditionProof(models.Model):
    condition = models.ForeignKey(ReleaseCondition, on_delete=models.CASCADE, related_name="proofs")
    file = models.FileField(upload_to=_release_proof_upload_to)
    original_name = models.CharField(max_length=255, blank=True)
    size_bytes = models.PositiveIntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["condition", "uploaded_at"]),
        ]

    def __str__(self):
        return f"release_proof:{self.pk}"


class WarehouseRelease(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        COMPLETED = "completed", "Completed"
        DECLINED = "declined", "Declined"

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="warehouse_release")
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="warehouse_releases")
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, related_name="warehouse_releases")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="warehouse_releases")
    recipient_name = models.CharField(max_length=200, blank=True, default="")
    id_card_number = models.CharField(max_length=64, blank=True, default="")
    vehicle_number = models.CharField(max_length=64, blank=True, default="")
    boxes_released = models.PositiveIntegerField(default=0)
    payment_amount = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(0)], default=0)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.COMPLETED)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["seller", "created_at"]),
            models.Index(fields=["warehouse", "created_at"]),
            models.Index(fields=["status", "created_at"]),
        ]

    def __str__(self):
        return f"warehouse_release:{self.pk}"

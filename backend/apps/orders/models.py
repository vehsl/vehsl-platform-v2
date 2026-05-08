from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from apps.catalog.models import Product, ProductVariation


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

    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="orders")
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="sales")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.CREATED)
    currency = models.CharField(max_length=3, default="USD")
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(0)], default=0)
    deadline_at = models.DateTimeField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["seller", "status"]),
            models.Index(fields=["buyer", "status"]),
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
                    (models.Q(target_type=TargetType.SELLER) & models.Q(target_seller__isnull=False) & models.Q(target_product__isnull=True))
                    | (models.Q(target_type=TargetType.PRODUCT) & models.Q(target_product__isnull=False) & models.Q(target_seller__isnull=True))
                ),
                name="review_target_exactly_one",
            ),
        ]

    def __str__(self):
        return f"review:{self.pk}"

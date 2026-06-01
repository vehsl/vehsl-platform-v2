from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils.text import slugify
from uuid import uuid4


class Category(models.Model):
    name = models.CharField(max_length=80)
    slug = models.SlugField(max_length=96, unique=True, blank=True)
    accent = models.CharField(max_length=16, blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    parent = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True, related_name="children")
    icon = models.CharField(max_length=255, blank=True)
    display_order = models.PositiveIntegerField(default=0)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["display_order", "sort_order", "name"]
        indexes = [
            models.Index(fields=["parent", "display_order"]),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name) or "category"
            if self.parent_id:
                parent_slug = getattr(self.parent, "slug", "") or str(self.parent_id)
                base = f"{parent_slug}-{base}"
            slug = base
            n = 2
            while Category.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{n}"
                n += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Product(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        ACTIVE = "active", "Active"
        ARCHIVED = "archived", "Archived"

    class IpProtectionLevel(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"

    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="products")
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")

    name = models.CharField(max_length=160)
    title = models.CharField(max_length=200, blank=True)
    sku = models.CharField(max_length=64, blank=True)
    hs_code = models.CharField(max_length=32, blank=True)
    description = models.TextField(blank=True)

    currency = models.CharField(max_length=3, default="USD")
    price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])

    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT)
    origin_location = models.JSONField(default=dict, blank=True)
    lead_time_days = models.PositiveIntegerField(default=0)
    weight_grams = models.PositiveIntegerField(default=500)
    ship_time_min_days = models.PositiveIntegerField(default=2)
    ship_time_max_days = models.PositiveIntegerField(default=3)
    sample_available = models.BooleanField(default=False)
    sample_ship_days = models.PositiveIntegerField(default=3)
    vehsl_rating = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    seller_rating = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    ip_protection_level = models.CharField(max_length=16, choices=IpProtectionLevel.choices, default=IpProtectionLevel.LOW)
    detail_config = models.JSONField(default=dict, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["category", "created_at"]),
            models.Index(fields=["seller", "status"]),
            models.Index(fields=["sku"]),
            models.Index(fields=["hs_code"]),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.title and not self.name:
            self.name = self.title
        if self.name and not self.title:
            self.title = self.name
        super().save(*args, **kwargs)


def _listing_request_upload_to(instance, filename: str) -> str:
    folder = getattr(getattr(instance, "listing_request", None), "folder_uuid", None) or getattr(instance, "folder_uuid", None) or uuid4()
    return f"listing_requests/{folder}/{filename}"


class ListingRequest(models.Model):
    class Stage(models.TextChoices):
        SAMPLES = "samples", "Samples"
        COMPLIANCE = "compliance", "Compliance"
        INSPECTION = "inspection", "Inspection"
        INBOUND = "inbound", "Inbound"
        LIVE = "live", "Live"
        DONE = "done", "Done"

    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="listing_requests")
    category = models.ForeignKey(Category, on_delete=models.PROTECT, null=True, blank=True, related_name="listing_requests")
    category_label = models.CharField(max_length=80, blank=True)

    product_name = models.CharField(max_length=160)
    company_name = models.CharField(max_length=160, blank=True)
    description = models.TextField(blank=True)
    monthly_capacity = models.CharField(max_length=64, blank=True)

    currency = models.CharField(max_length=3, default="USD")
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    moq = models.PositiveIntegerField(default=1)

    pickup_type = models.CharField(max_length=16, blank=True)
    pickup_address = models.CharField(max_length=300, blank=True)
    pickup_contact_name = models.CharField(max_length=160, blank=True)
    pickup_phone = models.CharField(max_length=32, blank=True)

    product_meta = models.JSONField(default=dict, blank=True)

    stage = models.CharField(max_length=16, choices=Stage.choices, default=Stage.SAMPLES)
    inspector = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="listing_inspections",
    )
    inspected = models.BooleanField(default=False)
    compliance_verified = models.BooleanField(default=False)
    compliance_notes = models.TextField(blank=True)
    rating = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    created_product = models.ForeignKey("Product", on_delete=models.SET_NULL, null=True, blank=True, related_name="created_from_listing_requests")

    folder_uuid = models.UUIDField(default=uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["seller", "stage", "created_at"]),
        ]

    def __str__(self):
        return f"listing_request:{self.pk}:{self.seller_id}"


class ListingRequestPhoto(models.Model):
    listing_request = models.ForeignKey(ListingRequest, on_delete=models.CASCADE, related_name="photos")
    file = models.FileField(upload_to=_listing_request_upload_to)
    original_name = models.CharField(max_length=255, blank=True)
    content_type = models.CharField(max_length=128, blank=True)
    size_bytes = models.BigIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]
        indexes = [
            models.Index(fields=["listing_request", "id"]),
        ]

    def __str__(self):
        return f"listing_request_photo:{self.pk}"


class ProductVariation(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="variations")
    attributes = models.JSONField(default=dict, blank=True)
    sku = models.CharField(max_length=64, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["product"]),
        ]

    def __str__(self):
        return f"variation:{self.pk}"


class PricingTier(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="pricing_tiers")
    variation = models.ForeignKey(ProductVariation, on_delete=models.SET_NULL, null=True, blank=True, related_name="pricing_tiers")
    min_quantity = models.PositiveIntegerField(default=1)
    max_quantity = models.PositiveIntegerField(null=True, blank=True)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, default="USD")
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["product"]),
        ]

    def __str__(self):
        return f"tier:{self.pk}"


def resolve_unit_price(product: Product, variation: "ProductVariation | None", quantity: int):
    try:
        qty = int(quantity)
    except Exception:
        qty = 1
    qty = max(1, qty)

    try:
        base_price = product.price
        base_currency = (product.currency or "USD").upper()
    except Exception:
        return (None, "")

    qs = PricingTier.objects.filter(product=product, deleted_at__isnull=True).order_by("-min_quantity", "id")

    def pick(qs_in):
        for t in qs_in:
            try:
                if (t.currency or "").upper() != base_currency:
                    continue
                mn = int(getattr(t, "min_quantity", 1) or 1)
                mx = getattr(t, "max_quantity", None)
                mx_val = int(mx) if mx is not None else None
            except Exception:
                continue
            if qty < mn:
                continue
            if mx_val is not None and qty > mx_val:
                continue
            try:
                return (t.unit_price, base_currency)
            except Exception:
                continue
        return (None, "")

    if variation is not None:
        price, curr = pick(qs.filter(variation=variation))
        if price is not None:
            return (price, curr)

    price, curr = pick(qs.filter(variation__isnull=True))
    if price is not None:
        return (price, curr)

    return (base_price, base_currency)


class ProductMedia(models.Model):
    class MediaType(models.TextChoices):
        IMAGE = "image", "Image"
        VIDEO = "video", "Video"
        VIEW_360 = "360_view", "360 View"
        DOCUMENT = "document", "Document"

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="media")
    variation = models.ForeignKey(ProductVariation, on_delete=models.SET_NULL, null=True, blank=True, related_name="media")
    media_type = models.CharField(max_length=16, choices=MediaType.choices)
    url = models.URLField(blank=True)
    storage_key = models.CharField(max_length=512, blank=True)
    title = models.CharField(max_length=160, blank=True)
    content_type = models.CharField(max_length=128, blank=True)
    size_bytes = models.BigIntegerField(default=0)
    position = models.PositiveIntegerField(default=0)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["position", "id"]
        indexes = [
            models.Index(fields=["product", "position"]),
        ]

    def __str__(self):
        return f"media:{self.pk}"


class Trademark(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        VERIFIED = "verified", "Verified"
        REJECTED = "rejected", "Rejected"

    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="trademarks")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="trademarks")
    registration_number = models.CharField(max_length=128, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    similar_product_risk_score = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["seller", "status"]),
        ]

    def __str__(self):
        return f"trademark:{self.pk}"


class ComplianceRule(models.Model):
    class RuleType(models.TextChoices):
        PERMIT = "permit", "Permit"
        LABEL = "label", "Label"
        LOGISTICS = "logistics", "Logistics"
        SHIPPING = "shipping", "Shipping"
        REGISTRATION = "registration", "Registration"

    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="compliance_rules")
    rule_type = models.CharField(max_length=24, choices=RuleType.choices)
    countries = models.JSONField(default=list, blank=True)
    payload = models.JSONField(default=dict, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["category", "rule_type"]),
        ]

    def __str__(self):
        return f"rule:{self.pk}"


class ShippingRate(models.Model):
    class Method(models.TextChoices):
        SEA = "sea", "Sea"
        AIR = "air", "Air"
        EXPRESS = "express", "Express"

    method = models.CharField(max_length=16, choices=Method.choices)
    origin_country = models.CharField(max_length=64, blank=True)
    dest_country = models.CharField(max_length=64, blank=True)

    currency = models.CharField(max_length=3, default="USD")
    base_fee = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)], default=0)
    price_per_kg = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)], default=0)
    per_unit_fee = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)], default=0)

    transit_min_days = models.PositiveIntegerField(default=1)
    transit_max_days = models.PositiveIntegerField(default=1)

    active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["method", "active", "updated_at"], name="shiprate_method_active_upd"),
            models.Index(fields=["origin_country", "dest_country"], name="shiprate_origin_dest"),
        ]

    def __str__(self):
        return f"shipping_rate:{self.method}:{self.origin_country or '*'}->{self.dest_country or '*'}:{self.id}"


class Warehouse(models.Model):
    name = models.CharField(max_length=160)
    code = models.SlugField(max_length=180, unique=True, blank=True)

    country = models.CharField(max_length=64, blank=True)
    region = models.CharField(max_length=64, blank=True)
    city = models.CharField(max_length=64, blank=True)
    street1 = models.CharField(max_length=128, blank=True)
    street2 = models.CharField(max_length=128, blank=True)
    postal_code = models.CharField(max_length=32, blank=True)

    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["country", "city", "name"]
        indexes = [
            models.Index(fields=["active", "country", "city"], name="warehouse_active_country_city"),
        ]

    def save(self, *args, **kwargs):
        if not self.code:
            base = slugify(self.name) or "warehouse"
            code = base
            n = 2
            while Warehouse.objects.filter(code=code).exclude(pk=self.pk).exists():
                code = f"{base}-{n}"
                n += 1
            self.code = code
        super().save(*args, **kwargs)

    def __str__(self):
        return f"warehouse:{self.code or self.id}"


class WarehouseStock(models.Model):
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name="stocks")
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="warehouse_stocks")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="warehouse_stocks")
    variation = models.ForeignKey(ProductVariation, on_delete=models.SET_NULL, null=True, blank=True, related_name="warehouse_stocks")
    quantity_units = models.PositiveIntegerField(default=0)
    reserved_units = models.PositiveIntegerField(default=0)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["seller", "warehouse"]),
            models.Index(fields=["product", "warehouse"]),
        ]
        constraints = [
            models.UniqueConstraint(fields=["warehouse", "product", "variation"], name="uniq_warehouse_stock_product_variation"),
        ]

    def __str__(self):
        return f"warehouse_stock:{self.warehouse_id}:{self.product_id}:{self.id}"


class InboundRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SHIPPED = "shipped", "Shipped"
        RECEIVED = "received", "Received"
        CANCELLED = "cancelled", "Cancelled"

    listing_request = models.OneToOneField(
        "ListingRequest",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="inbound_request",
    )
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="inbound_requests")
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name="inbound_requests")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    tracking_number = models.CharField(max_length=128, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["seller", "status"]),
            models.Index(fields=["warehouse", "status"]),
        ]

    def __str__(self):
        return f"inbound:{self.id}:{self.seller_id}"


class InboundRequestItem(models.Model):
    inbound_request = models.ForeignKey(InboundRequest, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    variation = models.ForeignKey(ProductVariation, on_delete=models.SET_NULL, null=True, blank=True)
    quantity_expected = models.PositiveIntegerField()
    quantity_received = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"inbound_item:{self.id}"

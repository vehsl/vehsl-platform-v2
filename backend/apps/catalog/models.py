from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    name = models.CharField(max_length=80, unique=True)
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
            self.slug = slugify(self.name)
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
    vehsl_rating = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    seller_rating = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    ip_protection_level = models.CharField(max_length=16, choices=IpProtectionLevel.choices, default=IpProtectionLevel.LOW)
    deleted_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["category", "created_at"]),
            models.Index(fields=["seller", "status"]),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.title and not self.name:
            self.name = self.title
        if self.name and not self.title:
            self.title = self.name
        super().save(*args, **kwargs)


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


class ProductMedia(models.Model):
    class MediaType(models.TextChoices):
        IMAGE = "image", "Image"
        VIDEO = "video", "Video"
        VIEW_360 = "360_view", "360 View"
        DOCUMENT = "document", "Document"

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="media")
    media_type = models.CharField(max_length=16, choices=MediaType.choices)
    url = models.URLField()
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

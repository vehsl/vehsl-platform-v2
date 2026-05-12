from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from apps.catalog.models import Product


class Sample(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="samples")
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="samples")
    available_quantity = models.PositiveIntegerField(default=0)
    low_stock_flag = models.BooleanField(default=False)
    last_updated = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["seller"]),
            models.Index(fields=["product"]),
        ]

    def __str__(self):
        return f"sample:{self.pk}"


class SampleRequest(models.Model):
    class Status(models.TextChoices):
        REQUESTED = "requested", "Requested"
        SHIPPED = "shipped", "Shipped"
        DELIVERED = "delivered", "Delivered"
        FEEDBACK_RECEIVED = "feedback_received", "Feedback Received"

    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="sample_requests")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="sample_requests")
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.REQUESTED)
    feedback_rating = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    feedback_text = models.TextField(blank=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["buyer", "status"]),
            models.Index(fields=["product", "status"]),
        ]

    def __str__(self):
        return f"sample_request:{self.pk}"


class QualityInspection(models.Model):
    class Status(models.TextChoices):
        IN_PROGRESS = "in_progress", "In Progress"
        PASSED = "passed", "Passed"
        FAILED = "failed", "Failed"

    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="quality_inspections")
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="quality_inspections_as_seller")
    inspector = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="quality_inspections_as_inspector"
    )
    inspector_name = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.IN_PROGRESS)
    score = models.PositiveIntegerField(default=0)
    inspected_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["product", "created_at"]),
            models.Index(fields=["seller", "status"]),
        ]

    def __str__(self):
        return f"quality_inspection:{self.pk}"

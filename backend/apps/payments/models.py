from django.core.validators import MinValueValidator
from django.db import models

from apps.orders.models import Order


class Payment(models.Model):
    class Method(models.TextChoices):
        BANK_TRANSFER = "bank_transfer", "Bank Transfer"
        CARD = "card", "Card"
        ESCROW = "escrow", "Escrow"

    class Status(models.TextChoices):
        INITIATED = "initiated", "Initiated"
        HELD = "held", "Held"
        RELEASED = "released", "Released"
        REFUNDED = "refunded", "Refunded"
        FAILED = "failed", "Failed"

    order = models.ForeignKey(Order, on_delete=models.PROTECT, related_name="payments")
    method = models.CharField(max_length=16, choices=Method.choices)
    amount = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, default="USD")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.INITIATED)
    gateway_reference = models.CharField(max_length=128, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["order", "status"]),
            models.Index(fields=["status", "created_at"], name="pay_sc_idx"),
            models.Index(fields=["deleted_at", "created_at"], name="pay_dc_idx"),
            models.Index(fields=["gateway_reference"]),
        ]

    def __str__(self):
        return f"payment:{self.pk}"

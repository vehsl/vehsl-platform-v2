from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from apps.catalog.models import Product


class Order(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SUBMITTED = "submitted", "Submitted"
        PAID = "paid", "Paid"
        SHIPPED = "shipped", "Shipped"
        DELIVERED = "delivered", "Delivered"
        CANCELED = "canceled", "Canceled"

    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="orders")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.SUBMITTED)
    currency = models.CharField(max_length=3, default="USD")
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(0)], default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"order:{self.pk}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="order_items")
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])

    class Meta:
        unique_together = [("order", "product")]

    @property
    def line_total(self):
        return self.unit_price * self.quantity

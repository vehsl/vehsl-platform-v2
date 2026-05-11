from datetime import timedelta

from django import forms
from django.contrib import admin
from django.contrib.admin import AdminSite
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from django.db.models import Count, Sum
from django.utils import timezone

from apps.catalog.models import Category, ComplianceRule, PricingTier, Product, ProductMedia, ProductVariation, Trademark
from apps.inventory.models import Sample, SampleRequest
from apps.orders.models import Cart, CartItem, Dispute, Document, Order, OrderItem, Review, Shipment, ShipmentEvent
from apps.payments.models import Payment

from .models import AdminProfile, BuyerProfile, ChatMessage, ChatThread, KycDocument, Notification, SellerProfile, Subscription, User, UserProfile


class VehslAdminSite(AdminSite):
    site_header = "VEHSL Admin"
    site_title = "VEHSL Admin"
    index_title = "Operations Dashboard"

    def index(self, request, extra_context=None):
        now = timezone.now()
        since_7d = now - timedelta(days=7)

        users_total = User.objects.count()
        users_7d = User.objects.filter(date_joined__gte=since_7d).count()
        buyers_total = User.objects.filter(account_type=User.AccountType.BUYER).count()
        sellers_total = User.objects.filter(account_type=User.AccountType.SELLER).count()

        products_total = Product.objects.filter(deleted_at__isnull=True).count()
        products_pending = Product.objects.filter(status=Product.Status.PENDING, deleted_at__isnull=True).count()
        products_7d = Product.objects.filter(created_at__gte=since_7d, deleted_at__isnull=True).count()

        orders_total = Order.objects.filter(deleted_at__isnull=True).count()
        orders_7d = Order.objects.filter(created_at__gte=since_7d, deleted_at__isnull=True).count()
        orders_by_status = (
            Order.objects.filter(deleted_at__isnull=True)
            .values("status")
            .annotate(c=Count("id"))
            .order_by()
        )

        payments_total = Payment.objects.filter(deleted_at__isnull=True).count()
        payments_sum = Payment.objects.filter(deleted_at__isnull=True).aggregate(s=Sum("amount")).get("s") or 0
        payments_7d = Payment.objects.filter(created_at__gte=since_7d, deleted_at__isnull=True).count()

        disputes_open = Dispute.objects.filter(status=Dispute.Status.OPEN, deleted_at__isnull=True).count()
        disputes_7d = Dispute.objects.filter(opened_at__gte=since_7d, deleted_at__isnull=True).count()

        sample_requests_total = SampleRequest.objects.filter(deleted_at__isnull=True).count()
        sample_requests_7d = SampleRequest.objects.filter(requested_at__gte=since_7d, deleted_at__isnull=True).count()

        extra_context = extra_context or {}
        extra_context["vehsl_stats"] = {
            "users_total": users_total,
            "users_7d": users_7d,
            "buyers_total": buyers_total,
            "sellers_total": sellers_total,
            "products_total": products_total,
            "products_pending": products_pending,
            "products_7d": products_7d,
            "orders_total": orders_total,
            "orders_7d": orders_7d,
            "orders_by_status": list(orders_by_status),
            "payments_total": payments_total,
            "payments_sum": payments_sum,
            "payments_7d": payments_7d,
            "disputes_open": disputes_open,
            "disputes_7d": disputes_7d,
            "sample_requests_total": sample_requests_total,
            "sample_requests_7d": sample_requests_7d,
            "generated_at": now,
        }
        return super().index(request, extra_context=extra_context)


admin_site = VehslAdminSite(name="vehsl_admin")


class VehslUserCreationForm(forms.ModelForm):
    password1 = forms.CharField(widget=forms.PasswordInput)
    password2 = forms.CharField(widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ("email", "phone", "first_name", "last_name", "account_type", "role", "is_staff", "is_superuser", "is_active")

    def clean(self):
        cleaned = super().clean()
        p1 = cleaned.get("password1")
        p2 = cleaned.get("password2")
        if p1 and p2 and p1 != p2:
            raise forms.ValidationError("Passwords do not match.")
        return cleaned

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


class VehslUserChangeForm(forms.ModelForm):
    password = ReadOnlyPasswordHashField()

    class Meta:
        model = User
        fields = (
            "email",
            "phone",
            "first_name",
            "last_name",
            "role",
            "account_type",
            "two_factor_enabled",
            "status",
            "is_active",
            "is_staff",
            "is_superuser",
            "password",
        )


@admin.register(User, site=admin_site)
class UserAdmin(admin.ModelAdmin):
    form = VehslUserChangeForm
    add_form = VehslUserCreationForm
    list_display = ("id", "email", "phone", "account_type", "role", "status", "is_staff", "is_active", "date_joined")
    list_filter = ("account_type", "role", "status", "is_staff", "is_active")
    search_fields = ("email", "phone", "first_name", "last_name")
    ordering = ("-date_joined",)

    def get_form(self, request, obj=None, **kwargs):
        defaults = {"form": self.add_form if obj is None else self.form}
        defaults.update(kwargs)
        return super().get_form(request, obj, **defaults)

    def get_fieldsets(self, request, obj=None):
        if obj is None:
            return (
                (None, {"fields": ("email", "phone", "first_name", "last_name", "account_type", "role")}),
                ("Security", {"fields": ("password1", "password2")}),
                ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser")}),
            )
        return (
            (None, {"fields": ("email", "phone", "first_name", "last_name")}),
            ("Account", {"fields": ("account_type", "role", "status", "two_factor_enabled")}),
            ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
            ("Password", {"fields": ("password",)}),
        )


@admin.register(UserProfile, site=admin_site)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "country", "city")
    search_fields = ("user__email", "user__phone", "country", "city")


@admin.register(KycDocument, site=admin_site)
class KycDocumentAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "kind", "doc_type", "original_name", "size_bytes", "uploaded_at")
    list_filter = ("kind",)
    search_fields = ("user__email", "user__phone", "original_name", "doc_type")


@admin.register(BuyerProfile, site=admin_site)
class BuyerProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "name", "currency_preference", "language_preference")
    search_fields = ("user__email", "user__phone", "name")


@admin.register(SellerProfile, site=admin_site)
class SellerProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "business_name", "verification_status", "country", "region")
    list_filter = ("verification_status", "country")
    search_fields = ("user__email", "user__phone", "business_name", "tax_id")


@admin.register(AdminProfile, site=admin_site)
class AdminProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "admin_role", "department")
    list_filter = ("admin_role",)
    search_fields = ("user__email", "user__phone", "department")


@admin.register(Subscription, site=admin_site)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "plan", "status", "trial_ends_at", "current_period_end", "created_at")
    list_filter = ("plan", "status")
    search_fields = ("user__email", "user__phone")


@admin.register(Notification, site=admin_site)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "channel", "event_type", "status", "created_at", "sent_at")
    list_filter = ("channel", "status")
    search_fields = ("user__email", "user__phone", "event_type")


@admin.register(ChatThread, site=admin_site)
class ChatThreadAdmin(admin.ModelAdmin):
    list_display = ("id", "type", "updated_at", "created_at")
    list_filter = ("type",)


@admin.register(ChatMessage, site=admin_site)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ("id", "thread", "sender", "sent_at")
    search_fields = ("sender__email", "sender__phone", "content")


@admin.register(Category, site=admin_site)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "parent", "display_order", "sort_order")
    search_fields = ("name", "slug")
    list_filter = ("parent",)


@admin.register(Product, site=admin_site)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "seller", "category", "status", "currency", "price", "created_at")
    list_filter = ("status", "currency", "category")
    search_fields = ("name", "title", "sku", "seller__email", "seller__phone")


@admin.register(ProductVariation, site=admin_site)
class ProductVariationAdmin(admin.ModelAdmin):
    list_display = ("id", "product", "sku")
    search_fields = ("product__name", "sku")


@admin.register(PricingTier, site=admin_site)
class PricingTierAdmin(admin.ModelAdmin):
    list_display = ("id", "product", "variation", "min_quantity", "max_quantity", "unit_price", "currency")
    list_filter = ("currency",)


@admin.register(ProductMedia, site=admin_site)
class ProductMediaAdmin(admin.ModelAdmin):
    list_display = ("id", "product", "media_type", "position")
    list_filter = ("media_type",)


@admin.register(Trademark, site=admin_site)
class TrademarkAdmin(admin.ModelAdmin):
    list_display = ("id", "seller", "product", "status", "registration_number", "similar_product_risk_score")
    list_filter = ("status",)
    search_fields = ("seller__email", "registration_number", "product__name")


@admin.register(ComplianceRule, site=admin_site)
class ComplianceRuleAdmin(admin.ModelAdmin):
    list_display = ("id", "category", "rule_type", "created_at")
    list_filter = ("rule_type",)


@admin.register(Cart, site=admin_site)
class CartAdmin(admin.ModelAdmin):
    list_display = ("id", "buyer", "updated_at", "created_at")
    search_fields = ("buyer__email", "buyer__phone")


@admin.register(CartItem, site=admin_site)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ("id", "cart", "product", "variation", "quantity", "currency")


@admin.register(Order, site=admin_site)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "buyer", "seller", "status", "currency", "total_amount", "created_at")
    list_filter = ("status", "currency")
    search_fields = ("buyer__email", "seller__email")


@admin.register(OrderItem, site=admin_site)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "product", "variation", "quantity", "unit_price")


@admin.register(Shipment, site=admin_site)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "status", "tracking_number", "created_at")
    list_filter = ("status",)
    search_fields = ("tracking_number",)


@admin.register(ShipmentEvent, site=admin_site)
class ShipmentEventAdmin(admin.ModelAdmin):
    list_display = ("id", "shipment", "type", "location", "occurred_at")
    list_filter = ("type",)


@admin.register(Document, site=admin_site)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ("id", "owner_type", "owner_id", "document_type", "generated_by_ai", "created_at")
    list_filter = ("owner_type", "document_type", "generated_by_ai")


@admin.register(Dispute, site=admin_site)
class DisputeAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "opened_by", "status", "opened_at", "resolved_at")
    list_filter = ("status",)


@admin.register(Review, site=admin_site)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "reviewer", "target_type", "rating", "created_at")
    list_filter = ("target_type",)


@admin.register(Payment, site=admin_site)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "method", "status", "amount", "currency", "created_at")
    list_filter = ("method", "status", "currency")
    search_fields = ("gateway_reference",)


@admin.register(Sample, site=admin_site)
class SampleAdmin(admin.ModelAdmin):
    list_display = ("id", "product", "seller", "available_quantity", "low_stock_flag", "last_updated")
    list_filter = ("low_stock_flag",)


@admin.register(SampleRequest, site=admin_site)
class SampleRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "buyer", "product", "status", "requested_at")
    list_filter = ("status",)

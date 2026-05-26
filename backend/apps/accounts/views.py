from __future__ import annotations

from rest_framework import generics, mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from django.conf import settings as django_settings
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, transaction
from django.db.models import CharField, Count, DecimalField, Q, Sum
from django.utils import timezone
from django.http import HttpResponse
from datetime import timedelta, datetime
import os
import uuid
import secrets
import base64
import hashlib
import hmac
import time
import csv

from django.core.files.storage import default_storage
from django.contrib.auth.hashers import make_password, check_password

from apps.catalog.models import Product, ListingRequest
from apps.orders.models import Order, OrderItem, Shipment, WishlistItem
from apps.accounts.permissions import IsAdmin, IsBuyer, IsSeller

from django.db.models import Avg, Case, Count, F, IntegerField, Prefetch, Q, Value, When
from django.db.models.functions import Coalesce, TruncDay, TruncHour, TruncMonth, TruncWeek

from .models import (
    AdminProfile,
    AdminPlatformSettings,
    AdminUiNotificationState,
    AuditLog,
    BuyerAddress,
    BuyerProfile,
    ChatMessage,
    ChatThread,
    HelpArticle,
    KycDocument,
    Notification,
    SellerProfile,
    Subscription,
    User,
    UserProfile,
    UserSettings,
)
from .admin_utils import audit as _audit
from .serializers import (
    AdminProfileUpdateSerializer,
    AdminKycDocumentSerializer,
    AdminUserListSerializer,
    AdminUserWriteSerializer,
    AdminVerificationUserSerializer,
    BuyerAddressSerializer,
    BuyerProfileSerializer,
    ChatMessageSerializer,
    ChatThreadSerializer,
    ChatThreadListSerializer,
    HelpArticleSerializer,
    KycDocumentSelfSerializer,
    KycDocumentUploadSerializer,
    NotificationSerializer,
    MeUpdateSerializer,
    RegisterSerializer,
    SellerProfileSerializer,
    SubscriptionSerializer,
    UserSerializer,
    UserSettingsSerializer,
    VehslTokenObtainPairSerializer,
)
from .dashboard_serializers import (
    SellerDashboardMetricsSerializer,
    SellerActionOrderSerializer,
    SellerActivitySerializer,
    SellerProductSerializer,
    WarehouseSerializer,
    WarehouseInventorySerializer,
    WarehouseReleaseRequestSerializer,
    WarehouseReleaseRecordSerializer,
)
from .admin_utils import AdminPageNumberPagination, response_list

SERVER_BUILD = os.environ.get("VEHSL_SERVER_BUILD") or datetime.utcnow().replace(microsecond=0).isoformat() + "Z"

def _admin_role(user: User) -> str:
    prof = getattr(user, "admin_profile", None)
    return (getattr(prof, "admin_role", "") or "").strip().lower()


def _is_super_admin(user: User) -> bool:
    if getattr(user, "is_superuser", False):
        return True
    return _admin_role(user) == AdminProfile.AdminRole.SUPER_ADMIN


def _can_manage_admin_users(actor: User) -> bool:
    role = (getattr(actor, "role", "") or "").lower()
    if role != User.Role.ADMIN:
        return False
    return _is_super_admin(actor)


def _can_manage_seller_verification(actor: User) -> bool:
    role = (getattr(actor, "role", "") or "").lower()
    if role != User.Role.ADMIN:
        return False
    ar = _admin_role(actor)
    return _is_super_admin(actor) or ar in {AdminProfile.AdminRole.COMPLIANCE}


def _can_issue_password_reset(actor: User) -> bool:
    role = (getattr(actor, "role", "") or "").lower()
    if role != User.Role.ADMIN:
        return False
    ar = _admin_role(actor)
    return _is_super_admin(actor) or ar in {AdminProfile.AdminRole.SUPPORT}


class AdminUiNotificationsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        now = timezone.now()
        items: list[dict] = []

        pending_docs = KycDocument.objects.filter(
            review_status__in=[KycDocument.ReviewStatus.PENDING, KycDocument.ReviewStatus.UNDER_REVIEW]
        )
        pending_users = (
            User.objects.filter(kyc_documents__in=pending_docs)
            .exclude(status__in=[User.Status.SUSPENDED, User.Status.DELETED])
            .distinct()
        )
        pending_users_count = pending_users.count()
        if pending_users_count:
            occurred_at = pending_docs.order_by("-uploaded_at").values_list("uploaded_at", flat=True).first() or now
            items.append(
                {
                    "key": "user_verification_pending",
                    "title": "User verification pending",
                    "body": f"{pending_users_count} users need document review",
                    "occurred_at": occurred_at,
                    "level": "warning",
                    "path": "/admin/verification",
                }
            )

        try:
            from apps.orders.models import Order, ReleaseCondition

            orders_qs = (
                Order.objects.filter(deleted_at__isnull=True)
                .exclude(status__in=[Order.Status.DELIVERED, Order.Status.COMPLETED, Order.Status.CANCELLED])
                .prefetch_related("release_conditions")
            )

            blocked = 0
            latest_blocked = None
            for o in orders_qs.iterator(chunk_size=200):
                conds = list(o.release_conditions.all())
                if not conds:
                    blocked += 1
                    if latest_blocked is None or o.created_at > latest_blocked:
                        latest_blocked = o.created_at
                    continue
                all_ok = all(c.status in {ReleaseCondition.Status.SATISFIED, ReleaseCondition.Status.WAIVED} for c in conds)
                if all_ok:
                    continue
                blocked += 1
                if latest_blocked is None or o.created_at > latest_blocked:
                    latest_blocked = o.created_at

            if blocked:
                items.append(
                    {
                        "key": "release_requirements_blocked",
                        "title": "Release requirements blocked",
                        "body": f"{blocked} orders need release conditions satisfied",
                        "occurred_at": latest_blocked or now,
                        "level": "error",
                        "path": "/admin/verification",
                    }
                )
        except Exception:
            pass

        try:
            from apps.inventory.models import QualityInspection

            start_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            failed_qs = QualityInspection.objects.filter(created_at__gte=start_month, status=QualityInspection.Status.FAILED)
            failed_count = failed_qs.count()
            if failed_count:
                occurred_at = failed_qs.order_by("-created_at").values_list("created_at", flat=True).first() or now
                items.append(
                    {
                        "key": "quality_failed",
                        "title": "Quality issues detected",
                        "body": f"{failed_count} inspections failed this month",
                        "occurred_at": occurred_at,
                        "level": "warning",
                        "path": "/admin/quality",
                    }
                )
        except Exception:
            pass

        try:
            from apps.catalog.models import Product

            threshold = 50
            from django.db.models import Sum
            from apps.inventory.models import Sample

            base = Product.objects.filter(deleted_at__isnull=True).annotate(
                stock_units=Coalesce(Sum("samples__available_quantity"), Value(0), output_field=IntegerField())
            )
            low_stock = (
                base.filter(status__in=[Product.Status.APPROVED, Product.Status.ACTIVE], stock_units__gt=0, stock_units__lt=threshold)
                .count()
            )
            if low_stock:
                occurred_at = (
                    Sample.objects.filter(deleted_at__isnull=True, low_stock_flag=True)
                    .order_by("-last_updated")
                    .values_list("last_updated", flat=True)
                    .first()
                    or now
                )
                items.append(
                    {
                        "key": "products_low_stock",
                        "title": "Inventory alert",
                        "body": f"{low_stock} products are low on stock",
                        "occurred_at": occurred_at,
                        "level": "info",
                        "path": "/admin/products",
                    }
                )
        except Exception:
            pass

        items.sort(key=lambda x: x.get("occurred_at") or now, reverse=True)

        keys = [i["key"] for i in items]
        state_map = {
            s.key: s.seen_at
            for s in AdminUiNotificationState.objects.filter(user=request.user, key__in=keys)
        }
        for it in items:
            seen_at = state_map.get(it["key"])
            occurred = it.get("occurred_at") or now
            it["unread"] = (seen_at is None) or (occurred and seen_at and occurred > seen_at)

        unread_count = sum(1 for i in items if i.get("unread"))
        return Response({"unread_count": unread_count, "items": items})


class AdminUiNotificationsMarkAllReadView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request):
        now = timezone.now()
        keys = request.data.get("keys") or []
        if keys and not isinstance(keys, list):
            return Response({"detail": "keys must be a list."}, status=status.HTTP_400_BAD_REQUEST)
        if not keys:
            return Response({"updated": 0})

        updated = 0
        for key in keys:
            if not isinstance(key, str) or not key.strip():
                continue
            obj, _ = AdminUiNotificationState.objects.get_or_create(user=request.user, key=key.strip())
            if obj.seen_at != now:
                AdminUiNotificationState.objects.filter(id=obj.id).update(seen_at=now)
            updated += 1
        return Response({"updated": updated})


class AdminUiNotificationsMarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request, key: str):
        now = timezone.now()
        key = (key or "").strip()
        if not key:
            return Response({"detail": "Invalid key."}, status=status.HTTP_400_BAD_REQUEST)
        obj, _ = AdminUiNotificationState.objects.get_or_create(user=request.user, key=key)
        AdminUiNotificationState.objects.filter(id=obj.id).update(seen_at=now)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminPlatformSettingsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def _defaults(self):
        return {
            "general": {
                "platform_name": "Vehsl",
                "default_currency": "USD",
                "timezone": "UTC",
                "language": "English",
            },
            "notifications": {
                "email_notifications": True,
                "push_notifications": True,
                "sms_alerts": False,
                "daily_digest": True,
            },
            "security": {
                "two_factor_auth": True,
                "session_timeout_minutes": 30,
                "ip_whitelisting": False,
                "password_policy": "strong_12_chars",
            },
        }

    def _integrations(self):
        stripe = bool(getattr(django_settings, "STRIPE_SECRET_KEY", "") or getattr(django_settings, "STRIPE_API_KEY", ""))
        sendgrid = bool(getattr(django_settings, "SENDGRID_API_KEY", ""))
        twilio = bool(getattr(django_settings, "TWILIO_AUTH_TOKEN", "") and getattr(django_settings, "TWILIO_ACCOUNT_SID", ""))
        google_maps = bool(getattr(django_settings, "GOOGLE_MAPS_API_KEY", ""))
        return {
            "stripe_payments": "connected" if stripe else "not_connected",
            "sendgrid_email": "connected" if sendgrid else "not_connected",
            "twilio_sms": "connected" if twilio else "not_connected",
            "google_maps": "connected" if google_maps else "not_connected",
        }

    def get(self, request):
        defaults = self._defaults()
        obj, _ = AdminPlatformSettings.objects.get_or_create(key="global")
        general = {**defaults["general"], **(obj.general or {})}
        notifications = {**defaults["notifications"], **(obj.notifications or {})}
        security = {**defaults["security"], **(obj.security or {})}
        return Response(
            {
                "general": general,
                "notifications": notifications,
                "security": security,
                "integrations": self._integrations(),
                "updated_at": obj.updated_at,
            }
        )

    def patch(self, request):
        if request.data is None:
            return Response({"detail": "Invalid payload."}, status=status.HTTP_400_BAD_REQUEST)

        obj, _ = AdminPlatformSettings.objects.get_or_create(key="global")
        defaults = self._defaults()

        def _ensure_dict(value, name: str):
            if value is None:
                return None
            if not isinstance(value, dict):
                raise ValueError(f"{name} must be an object.")
            return value

        try:
            incoming_general = _ensure_dict(request.data.get("general"), "general")
            incoming_notifications = _ensure_dict(request.data.get("notifications"), "notifications")
            incoming_security = _ensure_dict(request.data.get("security"), "security")
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if incoming_general is not None:
            current = {**defaults["general"], **(obj.general or {})}
            if "platform_name" in incoming_general:
                current["platform_name"] = str(incoming_general.get("platform_name") or "").strip() or defaults["general"]["platform_name"]
            if "default_currency" in incoming_general:
                current["default_currency"] = str(incoming_general.get("default_currency") or "").strip() or defaults["general"]["default_currency"]
            if "timezone" in incoming_general:
                current["timezone"] = str(incoming_general.get("timezone") or "").strip() or defaults["general"]["timezone"]
            if "language" in incoming_general:
                current["language"] = str(incoming_general.get("language") or "").strip() or defaults["general"]["language"]
            obj.general = current

        if incoming_notifications is not None:
            current = {**defaults["notifications"], **(obj.notifications or {})}
            for k in ["email_notifications", "push_notifications", "sms_alerts", "daily_digest"]:
                if k in incoming_notifications:
                    current[k] = bool(incoming_notifications.get(k))
            obj.notifications = current

        if incoming_security is not None:
            current = {**defaults["security"], **(obj.security or {})}
            if "two_factor_auth" in incoming_security:
                current["two_factor_auth"] = bool(incoming_security.get("two_factor_auth"))
            if "session_timeout_minutes" in incoming_security:
                try:
                    n = int(incoming_security.get("session_timeout_minutes"))
                except Exception:
                    n = defaults["security"]["session_timeout_minutes"]
                current["session_timeout_minutes"] = max(5, min(24 * 60, n))
            if "ip_whitelisting" in incoming_security:
                current["ip_whitelisting"] = bool(incoming_security.get("ip_whitelisting"))
            if "password_policy" in incoming_security:
                current["password_policy"] = str(incoming_security.get("password_policy") or "").strip() or defaults["security"]["password_policy"]
            obj.security = current

        obj.updated_by = request.user
        obj.save(update_fields=["general", "notifications", "security", "updated_at", "updated_by"])
        _audit(
            request.user,
            action="admin_platform_settings_updated",
            target_type="admin_settings",
            target_id="global",
            payload={"fields": list((request.data or {}).keys())},
        )

        general = {**defaults["general"], **(obj.general or {})}
        notifications = {**defaults["notifications"], **(obj.notifications or {})}
        security = {**defaults["security"], **(obj.security or {})}
        return Response(
            {
                "general": general,
                "notifications": notifications,
                "security": security,
                "integrations": self._integrations(),
                "updated_at": obj.updated_at,
            }
        )


class AdminPlatformOverviewView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def _delta(self, period: str) -> timedelta:
        p = (period or "").strip().lower()
        if p == "24h":
            return timedelta(hours=24)
        if p == "30d":
            return timedelta(days=30)
        if p == "90d":
            return timedelta(days=90)
        return timedelta(days=7)

    def _pct_change(self, curr: float, prev: float) -> float:
        try:
            c = float(curr)
            p = float(prev)
        except Exception:
            return 0.0
        if p == 0:
            return 0.0 if c == 0 else 100.0
        return ((c - p) / p) * 100.0

    def _avatar(self, user: User | None) -> str:
        if not user:
            return "U"
        first = (getattr(user, "first_name", "") or "").strip()
        last = (getattr(user, "last_name", "") or "").strip()
        if first or last:
            return (f"{first[:1]}{last[:1]}").strip().upper() or "U"
        email = (getattr(user, "email", "") or "").strip()
        if email and "@" in email:
            return email[0].upper()
        phone = (getattr(user, "phone", "") or "").strip()
        return phone[-1:].upper() or "U"

    def _bucket_trunc(self, period: str):
        p = (period or "").strip().lower()
        if p == "24h":
            return TruncHour("created_at"), "hour"
        if p in {"7d", "30d"}:
            return TruncDay("created_at"), "day"
        return TruncWeek("created_at"), "week"

    def _label_bucket(self, dt, kind: str) -> str:
        if not dt:
            return ""
        if kind == "hour":
            return dt.strftime("%H:%M")
        if kind == "week":
            return f"Wk {dt.strftime('%W')}"
        return dt.strftime("%b %d")

    def _downsample(self, items: list[dict], max_points: int = 7) -> list[dict]:
        if len(items) <= max_points:
            return items
        n = len(items)
        if max_points <= 1:
            return [items[-1]]
        idxs = []
        for i in range(max_points):
            idx = round(i * (n - 1) / (max_points - 1))
            if idxs and idx == idxs[-1]:
                continue
            idxs.append(idx)
        return [items[i] for i in idxs]

    def get(self, request):
        now = timezone.now()
        period = (request.query_params.get("period") or "7d").strip().lower()
        delta = self._delta(period)
        start = now - delta
        prev_start = start - delta
        prev_end = start

        try:
            from apps.payments.models import Payment
        except Exception:
            Payment = None
        try:
            from apps.orders.models import Order, Shipment
        except Exception:
            Order = None
            Shipment = None
        try:
            from apps.inventory.models import QualityInspection
        except Exception:
            QualityInspection = None

        b2b_when = When(order__buyer__buyer_profile__business_type__gt="", then=F("amount"))
        b2c_when = When(Q(order__buyer__buyer_profile__business_type="") | Q(order__buyer__buyer_profile__business_type__isnull=True), then=F("amount"))
        dec0 = Value(0, output_field=DecimalField(max_digits=14, decimal_places=2))

        revenue_total = 0.0
        revenue_b2b = 0.0
        revenue_b2c = 0.0
        revenue_change_pct = 0.0
        revenue_points: list[dict] = []

        if Payment is not None:
            payments_base = Payment.objects.filter(deleted_at__isnull=True).select_related("order", "order__buyer")
            payments_curr = payments_base.filter(
                created_at__gte=start,
                created_at__lt=now,
                status__in=[Payment.Status.HELD, Payment.Status.RELEASED],
            )
            payments_prev = payments_base.filter(
                created_at__gte=prev_start,
                created_at__lt=prev_end,
                status__in=[Payment.Status.HELD, Payment.Status.RELEASED],
            )

            curr_agg = payments_curr.aggregate(
                total=Coalesce(Sum("amount"), dec0),
                b2b=Coalesce(Sum(Case(b2b_when, default=dec0, output_field=DecimalField(max_digits=14, decimal_places=2))), dec0),
                b2c=Coalesce(Sum(Case(b2c_when, default=dec0, output_field=DecimalField(max_digits=14, decimal_places=2))), dec0),
            )
            prev_agg = payments_prev.aggregate(
                total=Coalesce(Sum("amount"), dec0),
            )

            revenue_total = float(curr_agg["total"] or 0)
            revenue_b2b = float(curr_agg["b2b"] or 0)
            revenue_b2c = float(curr_agg["b2c"] or 0)
            revenue_change_pct = self._pct_change(float(curr_agg["total"] or 0), float(prev_agg["total"] or 0))

            trunc, kind = self._bucket_trunc(period)
            series = (
                payments_curr.annotate(bucket=trunc)
                .values("bucket")
                .annotate(
                    b2b=Coalesce(
                        Sum(Case(b2b_when, default=dec0, output_field=DecimalField(max_digits=14, decimal_places=2))),
                        dec0,
                    ),
                    b2c=Coalesce(
                        Sum(Case(b2c_when, default=dec0, output_field=DecimalField(max_digits=14, decimal_places=2))),
                        dec0,
                    ),
                )
                .order_by("bucket")
            )
            revenue_points = [
                {
                    "label": self._label_bucket(row.get("bucket"), kind),
                    "b2b": float(row.get("b2b") or 0),
                    "b2c": float(row.get("b2c") or 0),
                }
                for row in series
            ]
            revenue_points = self._downsample(revenue_points, max_points=7) or [{"label": "", "b2b": 0.0, "b2c": 0.0}]

        active_orders_total = 0
        active_orders_b2b = 0
        active_orders_b2c = 0
        active_orders_change_pct = 0.0
        orders_sparkline: list[float] = []

        if Order is not None:
            active_status_exclude = [
                Order.Status.DELIVERED,
                Order.Status.COMPLETED,
                Order.Status.CANCELLED,
                Order.Status.REJECTED,
            ]
            orders_active_now = Order.objects.filter(deleted_at__isnull=True).exclude(status__in=active_status_exclude)
            orders_active_prev = Order.objects.filter(deleted_at__isnull=True, created_at__lt=start).exclude(status__in=active_status_exclude)

            active_orders_total = orders_active_now.count()
            active_orders_change_pct = self._pct_change(active_orders_total, orders_active_prev.count())

            active_orders_b2b = orders_active_now.filter(buyer__buyer_profile__business_type__gt="").count()
            active_orders_b2c = max(active_orders_total - active_orders_b2b, 0)

            trunc, kind = self._bucket_trunc(period)
            order_series = (
                Order.objects.filter(deleted_at__isnull=True, created_at__gte=start, created_at__lt=now)
                .annotate(bucket=trunc)
                .values("bucket")
                .annotate(total=Count("id"))
                .order_by("bucket")
            )
            orders_points = [{"label": self._label_bucket(r.get("bucket"), kind), "v": int(r.get("total") or 0)} for r in order_series]
            orders_points = self._downsample(orders_points, max_points=7)
            orders_sparkline = [float(p["v"]) for p in orders_points] or [0.0]

        users_online_total = 0
        users_online_buyers = 0
        users_online_sellers = 0
        users_online_workers = 0
        users_online_change_abs = 0
        users_sparkline: list[float] = []

        online_window = now - timedelta(minutes=15)
        prev_online_window_end = prev_end
        prev_online_window_start = prev_end - timedelta(minutes=15)
        online_qs = User.objects.filter(last_login__gte=online_window)
        prev_online_qs = User.objects.filter(last_login__gte=prev_online_window_start, last_login__lt=prev_online_window_end)

        users_online_total = online_qs.count()
        users_online_change_abs = users_online_total - prev_online_qs.count()
        users_online_buyers = online_qs.filter(role=User.Role.BUYER).count()
        users_online_sellers = online_qs.filter(role=User.Role.SELLER).count()
        users_online_workers = online_qs.filter(role=User.Role.ADMIN, admin_profile__admin_role__in=[AdminProfile.AdminRole.LOGISTICS, AdminProfile.AdminRole.INSPECTOR]).count()

        try:
            trunc, kind = self._bucket_trunc(period)
            login_series = (
                User.objects.filter(last_login__isnull=False, last_login__gte=start, last_login__lt=now)
                .annotate(bucket=TruncHour("last_login") if kind == "hour" else TruncDay("last_login") if kind == "day" else TruncWeek("last_login"))
                .values("bucket")
                .annotate(total=Count("id"))
                .order_by("bucket")
            )
            login_points = [{"label": self._label_bucket(r.get("bucket"), kind), "v": int(r.get("total") or 0)} for r in login_series]
            login_points = self._downsample(login_points, max_points=7)
            users_sparkline = [float(p["v"]) for p in login_points] or [0.0]
        except Exception:
            users_sparkline = [float(users_online_total)]

        quality_score = 0.0
        quality_inspections = 0
        quality_change_pct = 0.0
        quality_sparkline: list[float] = []

        if QualityInspection is not None:
            base = QualityInspection.objects.filter(deleted_at__isnull=True, status__in=[QualityInspection.Status.PASSED, QualityInspection.Status.FAILED])
            curr = base.filter(created_at__gte=start, created_at__lt=now)
            prev = base.filter(created_at__gte=prev_start, created_at__lt=prev_end)
            curr_avg = curr.aggregate(avg=Coalesce(Avg("score"), Value(0.0)))["avg"] or 0.0
            prev_avg = prev.aggregate(avg=Coalesce(Avg("score"), Value(0.0)))["avg"] or 0.0
            quality_score = float(curr_avg)
            quality_change_pct = self._pct_change(float(curr_avg), float(prev_avg))
            quality_inspections = curr.count()

            trunc, kind = self._bucket_trunc(period)
            q_series = (
                curr.annotate(bucket=trunc)
                .values("bucket")
                .annotate(avg=Coalesce(Avg("score"), Value(0.0)))
                .order_by("bucket")
            )
            q_points = [{"label": self._label_bucket(r.get("bucket"), kind), "v": float(r.get("avg") or 0)} for r in q_series]
            q_points = self._downsample(q_points, max_points=7)
            quality_sparkline = [float(p["v"]) for p in q_points] or [0.0]

        health_systems: list[dict] = []
        health_score = 100.0

        if Order is not None and Shipment is not None and Payment is not None:
            recent_orders = Order.objects.filter(deleted_at__isnull=True, created_at__gte=start, created_at__lt=now)
            recent_count = recent_orders.count()
            disputed = recent_orders.filter(status=Order.Status.DISPUTED).count()
            overdue = recent_orders.filter(deadline_at__isnull=False, deadline_at__lt=now).exclude(
                status__in=[Order.Status.DELIVERED, Order.Status.COMPLETED, Order.Status.CANCELLED]
            ).count()
            order_issue_rate = 0.0 if recent_count == 0 else float(disputed + overdue) / float(recent_count)
            order_uptime = max(90.0, 100.0 - (order_issue_rate * 50.0))

            ins_base = QualityInspection.objects.filter(deleted_at__isnull=True, created_at__gte=start, created_at__lt=now) if QualityInspection is not None else None
            ins_total = ins_base.count() if ins_base is not None else 0
            ins_failed = ins_base.filter(status=QualityInspection.Status.FAILED).count() if ins_base is not None else 0
            fail_rate = 0.0 if ins_total == 0 else float(ins_failed) / float(ins_total)
            quality_uptime = max(90.0, 100.0 - (fail_rate * 40.0))

            shipments = Shipment.objects.filter(deleted_at__isnull=True, created_at__gte=start, created_at__lt=now)
            ship_total = shipments.count()
            delayed = shipments.filter(estimated_delivery_at__isnull=False, estimated_delivery_at__lt=now).exclude(status=Shipment.Status.DELIVERED).count()
            delay_rate = 0.0 if ship_total == 0 else float(delayed) / float(ship_total)
            delivery_uptime = max(85.0, 100.0 - (delay_rate * 60.0))

            p_curr = Payment.objects.filter(deleted_at__isnull=True, created_at__gte=start, created_at__lt=now)
            p_total = p_curr.count()
            p_failed = p_curr.filter(status=Payment.Status.FAILED).count()
            p_fail_rate = 0.0 if p_total == 0 else float(p_failed) / float(p_total)
            payment_uptime = max(90.0, 100.0 - (p_fail_rate * 80.0))

            health_systems = [
                {"label": "Order Processing", "status": "success" if order_uptime >= 98 else "warning", "uptime": order_uptime},
                {"label": "Quality Pipeline", "status": "success" if quality_uptime >= 98 else "warning", "uptime": quality_uptime},
                {"label": "Delivery Network", "status": "success" if delivery_uptime >= 98 else "warning", "uptime": delivery_uptime},
                {"label": "Payment Gateway", "status": "success" if payment_uptime >= 98 else "warning", "uptime": payment_uptime},
            ]
            health_score = sum(float(s["uptime"]) for s in health_systems) / float(len(health_systems))

        health_label = "Healthy" if health_score >= 97 else "Degraded"
        health_sublabel = "All core systems running" if health_score >= 97 else "Some systems need attention"

        region_points: list[dict] = []
        channel_points: list[dict] = []

        if Payment is not None:
            window_30 = now - timedelta(days=30)
            payments_30 = Payment.objects.filter(
                deleted_at__isnull=True,
                created_at__gte=window_30,
                created_at__lt=now,
                status__in=[Payment.Status.HELD, Payment.Status.RELEASED],
            )
            region_series = (
                payments_30.annotate(country=Coalesce(F("order__buyer__profile__country"), Value("Unknown"), output_field=CharField()))
                .values("country")
                .annotate(total=Coalesce(Sum("amount"), dec0))
                .order_by("-total")[:5]
            )
            region_points = [{"label": (r.get("country") or "Unknown").strip() or "Unknown", "value": float(r.get("total") or 0)} for r in region_series]

            total_30 = payments_30.aggregate(total=Coalesce(Sum("amount"), dec0))["total"] or 0
            total_30_f = float(total_30 or 0)
            b2b_30 = payments_30.aggregate(
                b2b=Coalesce(Sum(Case(b2b_when, default=dec0, output_field=DecimalField(max_digits=14, decimal_places=2))), dec0)
            )["b2b"] or 0
            b2b_30_f = float(b2b_30 or 0)
            b2c_30_f = max(total_30_f - b2b_30_f, 0.0)
            wholesale_30 = payments_30.filter(order__total_amount__gte=5000).aggregate(total=Coalesce(Sum("amount"), dec0))["total"] or 0
            wholesale_30_f = float(wholesale_30 or 0)

            base = max(total_30_f, 1.0)
            b2b_pct = (b2b_30_f / base) * 100.0
            b2c_pct = (b2c_30_f / base) * 100.0
            wholesale_pct = (wholesale_30_f / base) * 100.0
            referral_pct = max(0.0, 100.0 - (b2b_pct + b2c_pct + wholesale_pct))

            channel_points = [
                {"name": "B2B Direct", "value": round(b2b_pct)},
                {"name": "B2C Marketplace", "value": round(b2c_pct)},
                {"name": "Wholesale", "value": round(wholesale_pct)},
                {"name": "Referral", "value": round(referral_pct)},
            ]
            total_pct = sum(int(c["value"]) for c in channel_points) or 100
            if total_pct != 100:
                channel_points[0]["value"] = int(channel_points[0]["value"]) + (100 - total_pct)

        alerts: list[dict] = []
        if QualityInspection is not None:
            backlog = QualityInspection.objects.filter(deleted_at__isnull=True, status=QualityInspection.Status.IN_PROGRESS).count()
            if backlog >= 25:
                alerts.append(
                    {
                        "type": "warning",
                        "message": f"Quality inspection backlog at {backlog} items",
                        "action": "Review Queue",
                        "path": "/admin/quality",
                        "occurred_at": now,
                    }
                )
        pending_sellers = SellerProfile.objects.filter(verification_status=SellerProfile.VerificationStatus.PENDING).count()
        if pending_sellers:
            alerts.append(
                {
                    "type": "info",
                    "message": f"{pending_sellers} seller verifications pending",
                    "action": "Review",
                    "path": "/admin/verification",
                    "occurred_at": now,
                }
            )
        expiring = KycDocument.objects.filter(kind=KycDocument.Kind.DRIVING_LICENSE, expires_at__isnull=False, expires_at__lte=(now + timedelta(days=30)).date()).count()
        if expiring:
            alerts.append(
                {
                    "type": "warning",
                    "message": f"{expiring} driving licenses expiring within 30 days",
                    "action": "Manage",
                    "path": "/admin/verification",
                    "occurred_at": now,
                }
            )
        pending_docs = KycDocument.objects.filter(review_status__in=[KycDocument.ReviewStatus.PENDING, KycDocument.ReviewStatus.UNDER_REVIEW]).count()
        if pending_docs:
            alerts.append(
                {
                    "type": "warning",
                    "message": f"{pending_docs} KYC documents waiting for review",
                    "action": "Review",
                    "path": "/admin/verification",
                    "occurred_at": now,
                }
            )
        alerts = alerts[:20]

        activities: list[dict] = []
        try:
            newest_orders = []
            newest_payments = []
            newest_inspections = []
            newest_docs = []
            newest_users = []

            if Order is not None:
                newest_orders = list(Order.objects.filter(deleted_at__isnull=True).select_related("buyer").order_by("-created_at")[:25])
                for o in newest_orders:
                    activities.append(
                        {
                            "occurred_at": o.created_at,
                            "user": o.buyer,
                            "action": "placed order",
                            "target": f"Order #{o.id}",
                            "path": "/admin/logistics",
                        }
                    )
            if Payment is not None:
                newest_payments = list(
                    Payment.objects.filter(deleted_at__isnull=True, status__in=[Payment.Status.HELD, Payment.Status.RELEASED])
                    .select_related("order", "order__buyer")
                    .order_by("-created_at")[:25]
                )
                for p in newest_payments:
                    activities.append(
                        {
                            "occurred_at": p.created_at,
                            "user": getattr(p.order, "buyer", None),
                            "action": "payment processed",
                            "target": f"Order #{p.order_id}",
                            "path": "/admin/logistics",
                        }
                    )
            if QualityInspection is not None:
                newest_inspections = list(
                    QualityInspection.objects.filter(deleted_at__isnull=True)
                    .select_related("inspector", "product")
                    .order_by("-created_at")[:25]
                )
                for qi in newest_inspections:
                    activities.append(
                        {
                            "occurred_at": qi.created_at,
                            "user": qi.inspector,
                            "action": "updated inspection",
                            "target": f"Inspection #{qi.id}",
                            "path": "/admin/quality",
                        }
                    )
            newest_docs = list(KycDocument.objects.select_related("user").order_by("-uploaded_at")[:25])
            for d in newest_docs:
                activities.append(
                    {
                        "occurred_at": d.uploaded_at,
                        "user": d.user,
                        "action": "uploaded document",
                        "target": d.get_kind_display(),
                        "path": "/admin/verification",
                    }
                )
            newest_users = list(User.objects.order_by("-date_joined")[:25])
            for u in newest_users:
                activities.append(
                    {
                        "occurred_at": u.date_joined,
                        "user": u,
                        "action": "joined platform",
                        "target": (u.email or u.phone or f"User #{u.id}"),
                        "path": "/admin/users",
                    }
                )
        except Exception:
            activities = []

        activities.sort(key=lambda x: x.get("occurred_at") or now, reverse=True)
        activities = activities[:30]
        activities_out = [
            {
                "user": (f"{(a.get('user').first_name or '').strip()} {(a.get('user').last_name or '').strip()}".strip() if a.get("user") else "System") or "System",
                "action": a.get("action") or "",
                "target": a.get("target") or "",
                "avatar": self._avatar(a.get("user")),
                "occurred_at": a.get("occurred_at"),
                "path": a.get("path") or "/admin",
            }
            for a in activities
        ]

        payload = {
            "period": period,
            "hero": {
                "total_revenue": {
                    "total": revenue_total,
                    "b2b": revenue_b2b,
                    "b2c": revenue_b2c,
                    "change_pct": revenue_change_pct,
                    "sparkline": [float(p.get("b2b", 0) + p.get("b2c", 0)) for p in revenue_points] if revenue_points else [0.0],
                },
                "active_orders": {
                    "total": active_orders_total,
                    "b2b": active_orders_b2b,
                    "b2c": active_orders_b2c,
                    "change_pct": active_orders_change_pct,
                    "sparkline": orders_sparkline,
                },
                "users_online": {
                    "total": users_online_total,
                    "buyers": users_online_buyers,
                    "sellers": users_online_sellers,
                    "workers": users_online_workers,
                    "change_abs": users_online_change_abs,
                    "sparkline": users_sparkline,
                },
                "quality_score": {
                    "value": quality_score,
                    "inspections": quality_inspections,
                    "change_pct": quality_change_pct,
                    "sparkline": quality_sparkline,
                },
            },
            "revenue_flow": {
                "total": revenue_total,
                "change_pct": revenue_change_pct,
                "points": revenue_points,
            },
            "health": {
                "score": float(health_score),
                "label": health_label,
                "sublabel": health_sublabel,
                "systems": health_systems,
            },
            "regions": region_points,
            "channels": channel_points,
            "alerts": alerts,
            "activity": activities_out,
        }
        return Response(payload)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=201)


class LoginView(TokenObtainPairView):
    serializer_class = VehslTokenObtainPairSerializer


class RefreshView(TokenRefreshView):
    pass


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        identifier = str(request.data.get("identifier") or "").strip()
        token = str(request.data.get("token") or "").strip()
        new_password = str(request.data.get("new_password") or "").strip()

        if not identifier or not token or not new_password:
            return Response({"detail": "identifier, token and new_password are required."}, status=status.HTTP_400_BAD_REQUEST)

        user = (
            User.objects.filter(email__iexact=identifier).first()
            if "@" in identifier
            else User.objects.filter(phone=identifier).first()
        )
        if not user:
            return Response({"detail": "Invalid identifier."}, status=status.HTTP_400_BAD_REQUEST)

        settings_obj, _ = UserSettings.objects.get_or_create(user=user)
        sec = dict(settings_obj.security or {})
        pr = sec.get("password_reset") if isinstance(sec.get("password_reset"), dict) else {}
        expires_at = pr.get("expires_at")
        token_hash = pr.get("token_hash")
        if not token_hash or not expires_at:
            return Response({"detail": "Reset token not found or expired."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            expires_dt = datetime.fromisoformat(str(expires_at).replace("Z", "+00:00"))
            if timezone.is_naive(expires_dt):
                expires_dt = timezone.make_aware(expires_dt, timezone=timezone.get_current_timezone())
        except Exception:
            return Response({"detail": "Reset token not found or expired."}, status=status.HTTP_400_BAD_REQUEST)

        if timezone.now() > expires_dt:
            sec.pop("password_reset", None)
            settings_obj.security = sec
            settings_obj.save(update_fields=["security", "updated_at"])
            return Response({"detail": "Reset token not found or expired."}, status=status.HTTP_400_BAD_REQUEST)

        if not check_password(token, str(token_hash)):
            return Response({"detail": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save(update_fields=["password"])

        sec.pop("password_reset", None)
        settings_obj.security = sec
        settings_obj.save(update_fields=["security", "updated_at"])

        _audit(user, action="password_reset_confirmed", target_type="user", target_id=str(user.id), payload={})
        return Response({"detail": "Password updated successfully."})


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh = request.data.get("refresh") or request.data.get("refresh_token") or ""
        refresh = str(refresh or "").strip()
        if refresh:
            try:
                token = RefreshToken(refresh)
                token.blacklist()
            except TokenError:
                pass
            except Exception:
                pass
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        ser = MeUpdateSerializer(data=request.data, partial=True, context={"user": request.user})
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        user = request.user
        for f in ["first_name", "last_name"]:
            if f in data:
                setattr(user, f, data.get(f) or "")

        if "phone" in data:
            phone_val = data.get("phone")
            user.phone = phone_val or None

        user.full_clean(exclude=["email"])
        user.save()

        profile = getattr(user, "profile", None)
        if profile is None:
            profile = UserProfile.objects.create(user=user)
        for f in [
            "country",
            "province",
            "city",
            "street",
            "address",
            "language_preference",
            "nationality",
            "gender",
            "date_of_birth",
        ]:
            if f in data:
                if f == "date_of_birth":
                    setattr(profile, f, data.get(f) or None)
                else:
                    setattr(profile, f, data.get(f) or "")
        profile.save()

        return Response(UserSerializer(user).data)


class BuyerAddressViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = BuyerAddressSerializer

    def get_queryset(self):
        return BuyerAddress.objects.filter(user=self.request.user).order_by("kind", "-updated_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


def _compact_relative_time(dt):
    if not dt:
        return ""
    now = timezone.now()
    try:
        delta = now - dt
    except Exception:
        return ""

    seconds = int(delta.total_seconds())
    if seconds < 0:
        seconds = 0
    if seconds < 60:
        return "Just now"
    if seconds < 3600:
        return f"{seconds // 60}m"
    if seconds < 86400:
        return f"{seconds // 3600}h"
    if seconds < 86400 * 7:
        return f"{seconds // 86400}d"
    return dt.strftime("%b %d")


def _title_from_event_type(event_type: str) -> str:
    base = (event_type or "").strip().replace("_", " ").replace("-", " ")
    base = " ".join(w.capitalize() for w in base.split())
    return base or "Update"


class MeMenuView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user: User = request.user
        role = (getattr(user, "role", "") or "").lower()
        account_type = (getattr(user, "account_type", "") or "").lower()

        active_account_type = account_type if account_type in {"buyer", "seller"} else (role if role in {"buyer", "seller"} else "buyer")

        if role == User.Role.SELLER:
            allowed_account_types = ["buyer", "seller"]
        elif role == User.Role.BUYER:
            allowed_account_types = ["buyer"]
        else:
            allowed_account_types = [active_account_type]

        uid = user.id
        threads_qs = ChatThread.objects.filter(deleted_at__isnull=True, participants__contains=[uid])
        unread_messages_qs = (
            ChatMessage.objects.filter(thread__in=threads_qs, deleted_at__isnull=True)
            .exclude(sender=user)
            .exclude(read_by__contains=[uid])
        )
        unread_messages_count = unread_messages_qs.count()
        latest_unread_message = unread_messages_qs.select_related("sender").order_by("-sent_at").first()

        notif_qs = (
            Notification.objects.filter(user=user, channel=Notification.Channel.IN_APP)
            .exclude(status=Notification.Status.READ)
            .order_by("-created_at")
        )
        unread_notifications_count = notif_qs.count()
        latest_notification = notif_qs.first()

        orders_on_the_way_count = 0
        wishlist_items_count = 0
        latest_shipped_order = None
        latest_shipment = None
        try:
            from apps.orders.models import Order, Shipment

            shipped_qs = Order.objects.filter(deleted_at__isnull=True, status=Order.Status.SHIPPED)
            shipped_qs = shipped_qs.filter(seller=user) if active_account_type == "seller" else shipped_qs.filter(buyer=user)
            orders_on_the_way_count = shipped_qs.count()
            latest_shipped_order = shipped_qs.order_by("-updated_at").first()
            if latest_shipped_order:
                latest_shipment = (
                    Shipment.objects.filter(order=latest_shipped_order, deleted_at__isnull=True)
                    .order_by("-created_at")
                    .first()
                )
        except Exception:
            pass

        try:
            from apps.orders.models import WishlistItem
            wishlist_items_count = WishlistItem.objects.filter(buyer=user, deleted_at__isnull=True).count()
        except Exception:
            pass

        updates: list[dict] = []

        if latest_shipped_order:
            progress = None
            stages = None
            eta = None
            if latest_shipment:
                stages = ["Packed", "Shipped", "Delivered"]
                status_key = (latest_shipment.status or "").lower()
                progress_map = {
                    "label_created": 0.12,
                    "picked_up": 0.35,
                    "in_transit": 0.62,
                    "customs": 0.72,
                    "out_for_delivery": 0.86,
                    "delivered": 1.0,
                }
                progress = progress_map.get(status_key, 0.6)
                if getattr(latest_shipment, "estimated_delivery_at", None):
                    eta = latest_shipment.estimated_delivery_at

            updates.append(
                {
                    "id": f"order-{latest_shipped_order.id}",
                    "kind": "shipping",
                    "headline": "On its way to you" if active_account_type == "buyer" else "Order shipped",
                    "detail": (f"Arriving {eta.strftime('%A')}" if eta else "Tracking updated"),
                    "meta": _compact_relative_time(getattr(latest_shipped_order, "updated_at", None) or getattr(latest_shipped_order, "created_at", None)),
                    "tint": "#34c759",
                    "action": "orders",
                    "progress": progress,
                    "stages": stages,
                }
            )

        if latest_unread_message:
            sender = getattr(latest_unread_message, "sender", None)
            sender_name = ""
            if sender:
                sender_name = f"{(sender.first_name or '').strip()} {(sender.last_name or '').strip()}".strip() or (sender.email or sender.phone or "")
            headline = f"{sender_name or 'Someone'} replied to you"
            detail = (latest_unread_message.content or "").strip()
            if len(detail) > 80:
                detail = detail[:77].rstrip() + "..."
            initial = ((sender_name or "M").strip()[:1] or "M").upper()
            updates.append(
                {
                    "id": f"msg-{latest_unread_message.id}",
                    "kind": "message",
                    "headline": headline,
                    "detail": detail or "New message",
                    "meta": _compact_relative_time(getattr(latest_unread_message, "sent_at", None)),
                    "tint": "#0071e3",
                    "action": "messages",
                    "personInitial": initial,
                    "personColor": "#0071e3",
                }
            )

        if latest_notification:
            payload = latest_notification.payload or {}
            event_type = (latest_notification.event_type or "").lower()
            title = (payload.get("title") or payload.get("headline") or "").strip() or _title_from_event_type(latest_notification.event_type)
            body = (payload.get("body") or payload.get("detail") or payload.get("message") or "").strip()
            if len(body) > 90:
                body = body[:87].rstrip() + "..."

            if "order" in event_type or "shipment" in event_type:
                kind = "shipping"
                tint = "#34c759"
                action = "orders"
            elif "message" in event_type or "chat" in event_type:
                kind = "message"
                tint = "#0071e3"
                action = "messages"
            else:
                kind = "deal"
                tint = "#ff9500"
                action = (payload.get("action") or "settings") if isinstance(payload, dict) else "settings"

            updates.append(
                {
                    "id": f"notif-{latest_notification.id}",
                    "kind": kind,
                    "headline": title,
                    "detail": body or "You have a new update",
                    "meta": _compact_relative_time(getattr(latest_notification, "created_at", None)),
                    "tint": tint,
                    "action": action,
                }
            )

        return Response(
            {
                "user": UserSerializer(user, context={"request": request}).data,
                "active_account_type": active_account_type,
                "allowed_account_types": allowed_account_types,
                "counts": {
                    "orders_on_the_way": orders_on_the_way_count,
                    "unread_messages": unread_messages_count,
                    "unread_updates": unread_notifications_count,
                    "wishlist_items": wishlist_items_count,
                },
                "updates": updates[:3],
            }
        )


class MeSwitchAccountTypeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user: User = request.user
        role = (getattr(user, "role", "") or "").lower()
        desired = (request.data.get("account_type") or request.data.get("role") or "").strip().lower()
        if desired not in {"buyer", "seller"}:
            return Response({"detail": "account_type must be buyer or seller."}, status=status.HTTP_400_BAD_REQUEST)

        if role == User.Role.BUYER and desired != "buyer":
            return Response({"detail": "This account cannot switch to seller."}, status=status.HTTP_403_FORBIDDEN)
        if role not in {User.Role.BUYER, User.Role.SELLER}:
            return Response({"detail": "This account cannot switch roles."}, status=status.HTTP_403_FORBIDDEN)

        user.account_type = desired
        user.save(update_fields=["account_type"])

        if desired == "buyer":
            BuyerProfile.objects.get_or_create(user=user)
        elif desired == "seller":
            SellerProfile.objects.get_or_create(user=user)

        user.refresh_from_db()
        return Response(UserSerializer(user, context={"request": request}).data)


def _kyc_requirement_groups_for_user(user: User) -> list[dict]:
    role = (getattr(user, "account_type", "") or getattr(user, "role", "") or "").lower()
    is_seller = role == User.AccountType.SELLER or role == User.Role.SELLER

    def opt(kind: str, label: str):
        return {"kind": kind, "label": label}

    identity_required = 2 if is_seller else 1
    groups = [
        {
            "key": "identity",
            "label": "Identity Document",
            "required": True,
            "required_count": identity_required,
            "options": [
                opt(KycDocument.Kind.PASSPORT, "Passport"),
                opt(KycDocument.Kind.ID_CARD, "National ID"),
                opt(KycDocument.Kind.DRIVING_LICENSE, "Driving License"),
            ],
        },
        {
            "key": "address",
            "label": "Proof of Address",
            "required": True,
            "required_count": 1,
            "options": [
                opt(KycDocument.Kind.BANK_STATEMENT, "Bank Statement"),
                opt(KycDocument.Kind.UTILITY_BILL, "Utility Bill"),
            ],
        },
    ]

    if is_seller:
        groups.append(
            {
                "key": "business",
                "label": "Business Document",
                "required": True,
                "required_count": 2,
                "options": [
                    opt(KycDocument.Kind.BUSINESS_REGISTRATION, "Business Registration"),
                    opt(KycDocument.Kind.BUSINESS_LICENSE, "Business License"),
                ],
            }
        )

    return groups


def _valid_kyc_docs_for_user(user: User) -> list[KycDocument]:
    docs: list[KycDocument] = []
    seen_kinds: set[str] = set()
    for doc in KycDocument.objects.filter(user=user).select_related("reviewed_by").order_by("-uploaded_at"):
        try:
            kind = (getattr(doc, "kind", "") or "").lower()
            if kind and kind in seen_kinds:
                continue
            name = getattr(doc.file, "name", "") or ""
            if name and default_storage.exists(name):
                docs.append(doc)
                if kind:
                    seen_kinds.add(kind)
        except Exception:
            continue
    return docs


def _required_kyc_is_verified(user: User) -> bool:
    docs = _valid_kyc_docs_for_user(user)
    groups = _kyc_requirement_groups_for_user(user)
    for group in groups:
        if not group.get("required"):
            continue
        required_count = int(group.get("required_count") or 1)
        kinds = {o["kind"] for o in (group.get("options") or [])}
        group_docs = [d for d in docs if (d.kind or "") in kinds]
        verified_count = sum(1 for d in group_docs if d.review_status == KycDocument.ReviewStatus.VERIFIED)
        if verified_count < required_count:
            return False
    return True


def _sync_seller_verification_status(user: User):
    role = (getattr(user, "account_type", "") or getattr(user, "role", "") or "").lower()
    if role != User.AccountType.SELLER and role != User.Role.SELLER:
        return

    SellerProfile.objects.get_or_create(user=user)
    docs = _valid_kyc_docs_for_user(user)
    if any(d.review_status == KycDocument.ReviewStatus.REJECTED for d in docs):
        next_status = SellerProfile.VerificationStatus.REJECTED
    elif _required_kyc_is_verified(user):
        next_status = SellerProfile.VerificationStatus.APPROVED
    else:
        next_status = SellerProfile.VerificationStatus.PENDING

    SellerProfile.objects.filter(user=user).update(verification_status=next_status)


def _kyc_requirements_payload(user: User, request) -> dict:
    groups = _kyc_requirement_groups_for_user(user)
    docs = _valid_kyc_docs_for_user(user)

    def docs_for_group(g: dict) -> list[KycDocument]:
        kinds = [o["kind"] for o in (g.get("options") or [])]
        kinds_set = set(kinds)
        return [d for d in docs if (d.kind or "") in kinds_set]

    out_groups: list[dict] = []
    missing_groups: list[str] = []
    unverified_groups: list[str] = []

    for g in groups:
        gdocs = docs_for_group(g)
        required_count = int(g.get("required_count") or (1 if g.get("required") else 0))
        uploaded_count = len(gdocs)
        verified_count = sum(1 for d in gdocs if d.review_status == KycDocument.ReviewStatus.VERIFIED)
        has_enough = uploaded_count >= required_count
        has_verified_enough = verified_count >= required_count
        if g.get("required") and not has_enough:
            missing_groups.append(g["key"])
        if g.get("required") and not has_verified_enough:
            unverified_groups.append(g["key"])

        out_groups.append(
            {
                "key": g["key"],
                "label": g["label"],
                "required": bool(g.get("required")),
                "required_count": required_count,
                "uploaded_count": uploaded_count,
                "verified_count": verified_count,
                "options": g.get("options") or [],
                "documents": KycDocumentSelfSerializer(gdocs, many=True, context={"request": request}).data,
                "status": (
                    "missing"
                    if not has_enough
                    else "rejected"
                    if any(d.review_status == KycDocument.ReviewStatus.REJECTED for d in gdocs)
                    else "pending"
                    if any(d.review_status in [KycDocument.ReviewStatus.PENDING, KycDocument.ReviewStatus.UNDER_REVIEW] for d in gdocs)
                    else "verified"
                    if has_verified_enough
                    else "pending"
                ),
            }
        )

    all_required_uploaded = len(missing_groups) == 0
    all_required_verified = len(unverified_groups) == 0
    role = (getattr(user, "role", "") or "").lower()
    account_type = (getattr(user, "account_type", "") or "").lower()
    seller_profile = getattr(user, "seller_profile", None)
    seller_verification_status = (getattr(seller_profile, "verification_status", "") or "").lower() if seller_profile else ""
    is_seller = account_type == User.AccountType.SELLER or role == User.Role.SELLER
    can_access_dashboard = all_required_verified and (not is_seller or seller_verification_status == SellerProfile.VerificationStatus.APPROVED)

    return {
        "role": role,
        "account_type": account_type,
        "groups": out_groups,
        "missing_groups": missing_groups,
        "unverified_groups": unverified_groups,
        "all_required_uploaded": all_required_uploaded,
        "all_required_verified": all_required_verified,
        "seller_verification_status": seller_verification_status,
        "can_access_dashboard": can_access_dashboard,
    }


class KycRequirementsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(_kyc_requirements_payload(request.user, request))


class KycDocumentsMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        docs: list[KycDocument] = []
        seen_kinds: set[str] = set()
        for doc in KycDocument.objects.filter(user=request.user).select_related("reviewed_by").order_by("-uploaded_at"):
            try:
                kind = (getattr(doc, "kind", "") or "").lower()
                if kind and kind in seen_kinds:
                    continue
                name = getattr(doc.file, "name", "") or ""
                if name and default_storage.exists(name):
                    docs.append(doc)
                    if kind:
                        seen_kinds.add(kind)
            except Exception:
                continue
        return Response(KycDocumentSelfSerializer(docs, many=True, context={"request": request}).data)

    def post(self, request):
        ser = KycDocumentUploadSerializer(data=request.data, context={"user": request.user})
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        f = data.get("file")
        kind = data["kind"]

        with transaction.atomic():
            User.objects.select_for_update().filter(id=request.user.id).exists()

            existing_docs = list(KycDocument.objects.filter(user=request.user, kind=kind).order_by("-uploaded_at"))
            valid_existing: list[KycDocument] = []
            for existing in existing_docs:
                try:
                    name = getattr(existing.file, "name", "") or ""
                    if name and default_storage.exists(name):
                        valid_existing.append(existing)
                    else:
                        existing.delete()
                except Exception:
                    continue

            if valid_existing:
                return Response(
                    {"detail": "Only one document can be uploaded for this field. Remove the existing document first."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            target_group = None
            for g in _kyc_requirement_groups_for_user(request.user):
                opts = g.get("options") or []
                if any((o.get("kind") or "") == kind for o in opts):
                    target_group = g
                    break

            if target_group is not None:
                try:
                    required_count = int(target_group.get("required_count") or 1)
                except Exception:
                    required_count = 1
                opts = target_group.get("options") or []
                group_kinds = {o.get("kind") for o in opts if o.get("kind")}
                if required_count > 0 and group_kinds:
                    group_docs = list(
                        KycDocument.objects.filter(user=request.user, kind__in=group_kinds).order_by("-uploaded_at")
                    )
                    seen_kinds: set[str] = set()
                    valid_unique = 0
                    for d in group_docs:
                        k = (getattr(d, "kind", "") or "").lower()
                        if k and k in seen_kinds:
                            continue
                        try:
                            name = getattr(d.file, "name", "") or ""
                            if name and default_storage.exists(name):
                                valid_unique += 1
                                if k:
                                    seen_kinds.add(k)
                        except Exception:
                            continue
                    if valid_unique >= required_count:
                        label = (target_group.get("label") or "this section").strip() or "this section"
                        return Response(
                            {
                                "detail": f"Only {required_count} document(s) can be uploaded for {label}. Remove an existing document first."
                            },
                            status=status.HTTP_400_BAD_REQUEST,
                        )

            doc = KycDocument(
                user=request.user,
                kind=kind,
                doc_type=(data.get("doc_type") or "").strip(),
                file=f,
                original_name=getattr(f, "name", "") or "",
                content_type=getattr(f, "content_type", "") or "",
                size_bytes=int(getattr(f, "size", 0) or 0),
                review_status=KycDocument.ReviewStatus.PENDING,
                expires_at=data.get("expires_at"),
            )
            doc.full_clean()
            doc.save()

        role = (getattr(request.user, "account_type", "") or getattr(request.user, "role", "") or "").lower()
        if role == User.AccountType.SELLER or role == User.Role.SELLER:
            SellerProfile.objects.get_or_create(user=request.user)
            SellerProfile.objects.filter(user=request.user).update(verification_status=SellerProfile.VerificationStatus.PENDING)

        return Response(KycDocumentSelfSerializer(doc, context={"request": request}).data, status=status.HTTP_201_CREATED)


class KycDocumentMeDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        doc = KycDocument.objects.filter(id=pk, user=request.user).first()
        if not doc:
            return Response({"detail": "Document not found."}, status=status.HTTP_404_NOT_FOUND)
        if doc.review_status == KycDocument.ReviewStatus.VERIFIED:
            return Response({"detail": "Verified documents cannot be removed. Request re-verification first."}, status=status.HTTP_400_BAD_REQUEST)

        file_name = getattr(doc.file, "name", "") or ""
        doc.delete()
        if file_name:
            try:
                default_storage.delete(file_name)
            except Exception:
                pass

        role = (getattr(request.user, "account_type", "") or getattr(request.user, "role", "") or "").lower()
        if role == User.AccountType.SELLER or role == User.Role.SELLER:
            SellerProfile.objects.get_or_create(user=request.user)
            SellerProfile.objects.filter(user=request.user).update(verification_status=SellerProfile.VerificationStatus.PENDING)

        return Response(status=status.HTTP_204_NO_CONTENT)


class BuyerProfileMeView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsBuyer]
    serializer_class = BuyerProfileSerializer

    def get_object(self):
        return self.request.user.buyer_profile


class SellerProfileMeView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsSeller]
    serializer_class = SellerProfileSerializer

    def get_object(self):
        return self.request.user.seller_profile


def _is_seller_account(user: User) -> bool:
    role = (getattr(user, "account_type", "") or getattr(user, "role", "") or "").lower()
    return role == "seller"


def _settings_defaults(user: User) -> dict:
    is_seller = _is_seller_account(user)
    display = {"compactView": False, "theme": "system", "currency": "USD"}
    notifications = {
        "orderConfirmed": True,
        "orderProcessing": True,
        "orderModified": True,
        "orderCancelled": True,
        "paymentConfirmed": True,
        "shipmentDispatched": True,
        "containerTracking": True,
        "deliveryScheduleChanges": True,
        "partialDeliveries": True,
        "proofOfDelivery": True,
        "customsClearance": False,
        "goodsReceived": True,
        "storageCapacity": True,
        "demurrageWarnings": True,
        "conditionMonitoring": False,
        "notifyHandler": True,
        "handlerConfirmation": True,
        "shareTrackingWithHandler": True,
        "paymentDueReminders": True,
        "creditLimitAlerts": True,
        "priceChangeAlerts": False,
        "invoiceGenerated": True,
        "emailNotifications": True,
        "pushNotifications": True,
        "smsNotifications": False,
        "whatsappNotifications": False,
        "sound": True,
        "quietHours": False,
        "quietFrom": "22:00",
        "quietTo": "07:00",
        "quietDays": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    }
    order_settings = {
        "defaultSort": "newest",
        "autoArchive": True,
        "autoArchiveDays": 30,
        "compactOrderCards": False,
        "trackingUpdates": "realtime",
        "shareTrackingLink": False,
        "defaultCurrency": "USD",
        "emailReceipts": True,
        "autoAccept": False,
        "autoAcceptThreshold": "5,000",
        "minOrderQty": 50,
        "responseDeadline": "24h",
        "defaultLeadTime": 14,
        "weeklyCapacity": "2,000",
        "qcCheckpoint": True,
        "sampleApproval": True,
        "preferredCarrier": "DHL Express",
        "autoInvoice": True,
        "exportDocs": True,
        "payoutSchedule": "Weekly",
    }
    security = {
        "twoFactor": bool(getattr(user, "two_factor_enabled", False)),
        "sessionTimeout": "30min",
        "smsEnabled": True,
        "authAppEnabled": False,
        "recoveryGenerated": False,
        "payoutPinEnabled": True,
        "listingLockEnabled": True,
        "cancelVerifyEnabled": True,
        "payoutPinSet": False,
    }

    business = {}
    if is_seller:
        sp = getattr(user, "seller_profile", None)
        name = (getattr(sp, "business_name", "") or "").strip()
        tax_id = (getattr(sp, "tax_id", "") or "").strip()
        email = (getattr(user, "email", "") or "").strip()
        full = f"{(getattr(user, 'first_name', '') or '').strip()} {(getattr(user, 'last_name', '') or '').strip()}".strip()
        business = {
            "activeBizId": "default",
            "businesses": [
                {
                    "id": "default",
                    "name": name or "My Business",
                    "regNo": "",
                    "vat": tax_id,
                    "address": "",
                    "rep": full or "Owner",
                    "email": email,
                    "emailVerified": True,
                    "payoutAccounts": [],
                    "factoryAddress": "",
                    "pickupAddress": "",
                    "productionCapacity": "",
                    "leadTime": "",
                    "moq": "",
                    "certifications": {
                        "iso9001": {"name": "", "status": "none", "expiry": ""},
                        "gmp": {"name": "", "status": "none", "expiry": ""},
                        "exportLicense": {"name": "", "status": "none", "expiry": ""},
                        "productSafety": {"name": "", "status": "none", "expiry": ""},
                    },
                }
            ],
        }
    else:
        bp = getattr(user, "buyer_profile", None)
        business = {
            "activeBizId": "default",
            "businesses": [
                {
                    "id": "default",
                    "name": (getattr(bp, "name", "") or "").strip() or "My Company",
                    "business_type": (getattr(bp, "business_type", "") or "").strip(),
                }
            ],
        }

    return {
        "display": display,
        "notifications": notifications,
        "order_settings": order_settings,
        "security": security,
        "business": business,
    }


def _merged_settings_payload(user: User, settings: UserSettings) -> dict:
    defaults = _settings_defaults(user)

    def merge(base: dict, override: dict) -> dict:
        out = dict(base or {})
        for k, v in (override or {}).items():
            out[k] = v
        return out

    display = merge(defaults["display"], settings.display or {})
    notifications = merge(defaults["notifications"], settings.notifications or {})
    order_settings = merge(defaults["order_settings"], settings.order_settings or {})
    security = merge(defaults["security"], settings.security or {})
    business = merge(defaults["business"], settings.business or {})
    security["twoFactor"] = bool(getattr(user, "two_factor_enabled", False))

    return {
        "display": display,
        "notifications": notifications,
        "order_settings": order_settings,
        "security": security,
        "business": business,
        "updated_at": settings.updated_at,
    }


class UserSettingsMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        obj, _ = UserSettings.objects.get_or_create(user=request.user)
        return Response({"user": UserSerializer(request.user, context={"request": request}).data, "settings": _merged_settings_payload(request.user, obj)})

    def patch(self, request):
        obj, _ = UserSettings.objects.get_or_create(user=request.user)
        data = request.data if isinstance(request.data, dict) else {}

        user = request.user

        if "two_factor_enabled" in data:
            user.two_factor_enabled = bool(data.get("two_factor_enabled"))
            user.save(update_fields=["two_factor_enabled"])

        display = data.get("display")
        if isinstance(display, dict):
            obj.display = {**(obj.display or {}), **display}

        notifications = data.get("notifications")
        if isinstance(notifications, dict):
            obj.notifications = {**(obj.notifications or {}), **notifications}

        order_settings = data.get("order_settings") or data.get("orderSettings")
        if isinstance(order_settings, dict):
            obj.order_settings = {**(obj.order_settings or {}), **order_settings}

        security = data.get("security") or data.get("privacy")
        if isinstance(security, dict):
            sec = {**(obj.security or {}), **security}
            if "payoutPin" in sec:
                pin = str(sec.get("payoutPin") or "").strip()
                if pin:
                    sec["payoutPinHash"] = make_password(pin)
                    sec["payoutPinSet"] = True
                sec.pop("payoutPin", None)
            if "twoFactor" in sec:
                desired = bool(sec.get("twoFactor"))
                if not desired:
                    user.two_factor_enabled = False
                    user.save(update_fields=["two_factor_enabled"])
            obj.security = sec

        business = data.get("business")
        if isinstance(business, dict):
            obj.business = business

        seller_profile = data.get("seller_profile")
        if isinstance(seller_profile, dict):
            try:
                sp = getattr(user, "seller_profile", None)
                if sp is None:
                    sp = SellerProfile.objects.create(user=user)
                updates = {}
                for f in ["business_name", "business_license_url", "tax_id", "country", "region", "sample_low_threshold"]:
                    if f in seller_profile:
                        updates[f] = seller_profile.get(f) or ""
                if updates:
                    SellerProfile.objects.filter(id=sp.id).update(**updates)
            except Exception:
                pass

        buyer_profile = data.get("buyer_profile")
        if isinstance(buyer_profile, dict):
            try:
                bp = getattr(user, "buyer_profile", None)
                if bp is None:
                    bp = BuyerProfile.objects.create(user=user)
                updates = {}
                for f in ["name", "business_type", "default_location", "currency_preference", "language_preference"]:
                    if f in buyer_profile:
                        updates[f] = buyer_profile.get(f)
                if updates:
                    BuyerProfile.objects.filter(id=bp.id).update(**updates)
            except Exception:
                pass

        obj.save()
        user.refresh_from_db()
        obj.refresh_from_db()
        return Response({"user": UserSerializer(user, context={"request": request}).data, "settings": _merged_settings_payload(user, obj)})


class DeactivateMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        user.status = User.Status.DELETED
        user.is_active = False
        user.save(update_fields=["status", "is_active"])
        return Response({"detail": "Account deactivated successfully."})


class RecoveryCodesMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        obj, _ = UserSettings.objects.get_or_create(user=request.user)
        sec = dict(obj.security or {})

        alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

        def gen_code() -> str:
            part1 = "".join(secrets.choice(alphabet) for _ in range(4))
            part2 = "".join(secrets.choice(alphabet) for _ in range(4))
            return f"{part1}-{part2}"

        codes = [gen_code() for _ in range(6)]
        sec["recoveryGenerated"] = True
        sec["recoveryCodes"] = [make_password(c) for c in codes]
        sec["recoveryGeneratedAt"] = timezone.now().isoformat()
        obj.security = sec
        obj.save(update_fields=["security", "updated_at"])
        return Response({"codes": codes})


class TotpSetupMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        obj, _ = UserSettings.objects.get_or_create(user=request.user)
        sec = dict(obj.security or {})

        raw = secrets.token_bytes(20)
        secret = base64.b32encode(raw).decode("utf-8").replace("=", "")
        sec["totp_secret"] = secret
        sec["totp_enabled"] = False
        sec["twoFactor"] = False
        obj.security = sec
        obj.save(update_fields=["security", "updated_at"])

        identifier = (request.user.email or request.user.phone or str(request.user.id) or "").strip()
        issuer = "Vehsl"
        label = f"{issuer}:{identifier}"
        otpauth = f"otpauth://totp/{label}?secret={secret}&issuer={issuer}&digits=6&period=30"
        return Response({"secret": secret, "otpauth_url": otpauth})


class TotpEnableMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code = str(request.data.get("code") or "").strip()
        if not code:
            return Response({"detail": "OTP code is required."}, status=status.HTTP_400_BAD_REQUEST)

        obj, _ = UserSettings.objects.get_or_create(user=request.user)
        sec = dict(obj.security or {})
        secret = str(sec.get("totp_secret") or "").strip()
        if not secret:
            return Response({"detail": "TOTP not set up."}, status=status.HTTP_400_BAD_REQUEST)

        def _totp(base32_secret: str, for_counter: int, digits: int = 6) -> str:
            key = base64.b32decode(base32_secret.upper().encode("utf-8") + b"=" * ((8 - len(base32_secret) % 8) % 8))
            msg = for_counter.to_bytes(8, "big")
            digest = hmac.new(key, msg, hashlib.sha1).digest()
            offset = digest[-1] & 0x0F
            code_int = int.from_bytes(digest[offset : offset + 4], "big") & 0x7FFFFFFF
            return str(code_int % (10**digits)).zfill(digits)

        counter = int(time.time() // 30)
        ok = any(_totp(secret, counter + w) == code for w in (-1, 0, 1))
        if not ok:
            return Response({"detail": "Invalid OTP code."}, status=status.HTTP_400_BAD_REQUEST)

        sec["totp_enabled"] = True
        sec["twoFactor"] = True
        obj.security = sec
        obj.save(update_fields=["security", "updated_at"])
        request.user.two_factor_enabled = True
        request.user.save(update_fields=["two_factor_enabled"])
        return Response({"enabled": True})


class TotpDisableMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code = str(request.data.get("code") or "").strip()
        recovery_code = str(request.data.get("recovery_code") or "").strip()

        obj, _ = UserSettings.objects.get_or_create(user=request.user)
        sec = dict(obj.security or {})
        secret = str(sec.get("totp_secret") or "").strip()

        ok = False
        if recovery_code:
            hashes = sec.get("recoveryCodes") or []
            if isinstance(hashes, list):
                ok = any(check_password(recovery_code, h) for h in hashes if isinstance(h, str) and h)

        if not ok and code and secret and bool(sec.get("totp_enabled")):
            def _totp(base32_secret: str, for_counter: int, digits: int = 6) -> str:
                key = base64.b32decode(base32_secret.upper().encode("utf-8") + b"=" * ((8 - len(base32_secret) % 8) % 8))
                msg = for_counter.to_bytes(8, "big")
                digest = hmac.new(key, msg, hashlib.sha1).digest()
                offset = digest[-1] & 0x0F
                code_int = int.from_bytes(digest[offset : offset + 4], "big") & 0x7FFFFFFF
                return str(code_int % (10**digits)).zfill(digits)

            counter = int(time.time() // 30)
            ok = any(_totp(secret, counter + w) == code for w in (-1, 0, 1))

        if not ok:
            return Response({"detail": "OTP or recovery code required."}, status=status.HTTP_400_BAD_REQUEST)

        sec["twoFactor"] = False
        sec["totp_enabled"] = False
        sec.pop("totp_secret", None)
        sec.pop("recoveryCodes", None)
        sec["recoveryGenerated"] = False
        obj.security = sec
        obj.save(update_fields=["security", "updated_at"])
        request.user.two_factor_enabled = False
        request.user.save(update_fields=["two_factor_enabled"])
        return Response({"enabled": False})


class AdminProfileMeView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = AdminProfileUpdateSerializer

    def get_object(self):
        prof = getattr(self.request.user, "admin_profile", None)
        if prof is None:
            prof = AdminProfile.objects.create(user=self.request.user, admin_role=AdminProfile.AdminRole.SUPER_ADMIN)
        return prof


class SubscriptionViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SubscriptionSerializer

    def get_queryset(self):
        return Subscription.objects.filter(user=self.request.user).order_by("-created_at")


class NotificationViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by("-created_at")

    @action(detail=False, methods=["post"], url_path="mark-read")
    def mark_read(self, request):
        ids = request.data.get("ids") or []
        if not isinstance(ids, list):
            return Response({"detail": "ids must be a list."}, status=status.HTTP_400_BAD_REQUEST)
        updated = Notification.objects.filter(user=request.user, id__in=ids).update(status=Notification.Status.READ)
        return Response({"updated": updated})


class HelpArticleViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = HelpArticle.objects.all().order_by("category", "id")
    serializer_class = HelpArticleSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category=category)
        return qs


class ChatThreadViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChatThreadSerializer
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get_queryset(self):
        uid = self.request.user.id
        qs = ChatThread.objects.filter(deleted_at__isnull=True).order_by("-updated_at")
        return qs.filter(participants__contains=[uid])

    def get_serializer_class(self):
        if self.action == "list":
            return ChatThreadListSerializer
        return ChatThreadSerializer

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        uid = request.user.id

        threads = list(qs[:200])
        thread_ids = [t.id for t in threads]

        last_map = {}
        unread_map = {}
        if thread_ids:
            msg_qs = (
                ChatMessage.objects.filter(thread_id__in=thread_ids, deleted_at__isnull=True)
                .select_related("sender")
                .order_by("-sent_at")
            )
            for m in msg_qs:
                if m.thread_id not in last_map:
                    last_map[m.thread_id] = m
                if m.sender_id != uid and uid not in (m.read_by or []):
                    unread_map[m.thread_id] = unread_map.get(m.thread_id, 0) + 1

        for t in threads:
            t._last_message_obj = last_map.get(t.id)
            t._unread_count = unread_map.get(t.id, 0)

        ser = self.get_serializer(threads, many=True, context={"request": request})
        return Response(ser.data)

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        participants = data.get("participants") or []
        if not isinstance(participants, list):
            return Response({"detail": "participants must be a list of user ids."}, status=status.HTTP_400_BAD_REQUEST)
        uid = request.user.id
        participants = [int(p) for p in participants if isinstance(p, int) or (isinstance(p, str) and str(p).isdigit())]
        if uid not in participants:
            participants = [uid, *participants]
        participants = list(dict.fromkeys(participants))

        thread_type = (data.get("type") or "").strip() or None
        if thread_type not in {ChatThread.ThreadType.BUYER_SELLER, ChatThread.ThreadType.BUYER_VEHSL, ChatThread.ThreadType.SELLER_VEHSL}:
            thread_type = ChatThread.ThreadType.BUYER_SELLER

        other_ids = [p for p in participants if p != uid]
        other_user = User.objects.filter(id=other_ids[0]).first() if other_ids else None
        is_actor_admin = bool(getattr(request.user, "role", None) == User.Role.ADMIN or getattr(request.user, "is_staff", False) or getattr(request.user, "is_superuser", False))
        is_other_admin = bool(other_user and (getattr(other_user, "role", None) == User.Role.ADMIN or getattr(other_user, "is_staff", False) or getattr(other_user, "is_superuser", False)))
        if other_user and (is_actor_admin or is_other_admin):
            non_admin = other_user if is_actor_admin else request.user
            acct = (getattr(non_admin, "account_type", "") or getattr(non_admin, "role", "") or "").lower()
            thread_type = ChatThread.ThreadType.SELLER_VEHSL if acct == "seller" else ChatThread.ThreadType.BUYER_VEHSL
        elif other_user:
            thread_type = ChatThread.ThreadType.BUYER_SELLER

        existing = None
        if len(participants) == 2 and other_ids:
            existing = (
                ChatThread.objects.filter(
                    Q(deleted_at__isnull=True),
                    Q(type=thread_type),
                    Q(participants__contains=[uid]),
                    Q(participants__contains=[other_ids[0]]),
                )
                .order_by("-updated_at")
                .first()
            )
        if existing:
            return Response(ChatThreadSerializer(existing).data, status=status.HTTP_200_OK)

        thread = ChatThread.objects.create(type=thread_type, participants=participants)
        return Response(ChatThreadSerializer(thread).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"], url_path="support")
    def support(self, request):
        user: User = request.user
        uid = user.id
        acct = (getattr(user, "account_type", "") or getattr(user, "role", "") or "").lower()
        thread_type = ChatThread.ThreadType.SELLER_VEHSL if acct == "seller" else ChatThread.ThreadType.BUYER_VEHSL

        support_user = (
            User.objects.filter(
                role=User.Role.ADMIN,
                status=User.Status.ACTIVE,
                admin_profile__admin_role=AdminProfile.AdminRole.SUPPORT,
            )
            .order_by("-date_joined")
            .first()
        )
        if not support_user:
            support_user = User.objects.filter(role=User.Role.ADMIN, status=User.Status.ACTIVE).order_by("-date_joined").first()
        if not support_user or support_user.id == uid:
            return Response({"detail": "No support agent available."}, status=status.HTTP_404_NOT_FOUND)

        other_id = support_user.id
        existing = (
            ChatThread.objects.filter(
                Q(deleted_at__isnull=True),
                Q(type=thread_type),
                Q(participants__contains=[uid]),
                Q(participants__contains=[other_id]),
            )
            .order_by("-updated_at")
            .first()
        )
        if existing:
            return Response(ChatThreadSerializer(existing).data, status=status.HTTP_200_OK)

        thread = ChatThread.objects.create(type=thread_type, participants=[uid, other_id])
        return Response(ChatThreadSerializer(thread).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="users")
    def users(self, request):
        q = (request.query_params.get("q") or "").strip()
        try:
            limit = int(request.query_params.get("limit") or 50)
        except Exception:
            limit = 50
        try:
            offset = int(request.query_params.get("offset") or 0)
        except Exception:
            offset = 0
        limit = max(1, min(limit, 100))
        offset = max(0, offset)

        qs = (
            User.objects.exclude(id=request.user.id)
            .exclude(status__in=[User.Status.SUSPENDED, User.Status.DELETED])
            .annotate(
                is_manager=Case(When(role=User.Role.ADMIN, then=Value(1)), default=Value(0), output_field=IntegerField()),
            )
            .order_by("-is_manager", "-date_joined")
        )
        if q:
            qs = qs.filter(
                Q(email__icontains=q)
                | Q(phone__icontains=q)
                | Q(first_name__icontains=q)
                | Q(last_name__icontains=q)
            )
        total = qs.count()
        users = list(
            qs[offset : offset + limit].only("id", "first_name", "last_name", "email", "phone", "role", "account_type")
        )
        out = []
        for u in users:
            full = f"{(u.first_name or '').strip()} {(u.last_name or '').strip()}".strip()
            out.append(
                {
                    "id": u.id,
                    "name": full or (u.email or "") or (u.phone or ""),
                    "role": getattr(u, "role", None),
                    "account_type": getattr(u, "account_type", None),
                    "email": u.email,
                    "phone": u.phone,
                    "is_manager": bool(getattr(u, "role", None) == User.Role.ADMIN),
                }
            )
        next_offset = offset + len(users)
        return Response({"results": out, "total": total, "next_offset": next_offset, "has_more": next_offset < total})

    @action(detail=True, methods=["get", "post"], url_path="messages")
    def messages(self, request, pk=None):
        thread = self.get_object()
        uid = request.user.id
        if uid not in (thread.participants or []):
            return Response({"detail": "Not a participant."}, status=status.HTTP_403_FORBIDDEN)

        if request.method == "GET":
            try:
                limit = int(request.query_params.get("limit") or 60)
            except Exception:
                limit = 60
            limit = max(1, min(limit, 200))
            qs = ChatMessage.objects.filter(thread=thread, deleted_at__isnull=True).select_related("sender").order_by("-sent_at")[:limit]
            msgs = list(reversed(list(qs)))

            updated_any = False
            for m in msgs:
                if m.sender_id != uid and uid not in (m.read_by or []):
                    m.read_by = list(dict.fromkeys([*(m.read_by or []), uid]))
                    updated_any = True
            if updated_any:
                ChatMessage.objects.bulk_update([m for m in msgs if m.sender_id != uid], ["read_by"])

            return Response(ChatMessageSerializer(msgs, many=True, context={"request": request}).data)

        content = (request.data.get("content") or "").strip()
        attachments = request.data.get("attachments") or []
        if not isinstance(attachments, list):
            attachments = []

        files = []
        try:
            files = request.FILES.getlist("files")
        except Exception:
            files = []

        uploaded = []
        for f in files[:10]:
            ext = os.path.splitext(getattr(f, "name", "") or "")[1]
            safe_ext = ext[:12] if ext else ""
            key = f"chat/{thread.id}/{uuid.uuid4().hex}{safe_ext}"
            path = default_storage.save(key, f)
            url = default_storage.url(path)
            if isinstance(url, str) and url.startswith("/"):
                url = request.build_absolute_uri(url)
            uploaded.append(
                {
                    "name": getattr(f, "name", "") or "file",
                    "url": url,
                    "content_type": getattr(f, "content_type", "") or "",
                    "size": int(getattr(f, "size", 0) or 0),
                }
            )

        msg = ChatMessage.objects.create(
            thread=thread,
            sender=request.user,
            content=content,
            attachments=[*attachments, *uploaded],
            read_by=[uid],
        )
        ChatThread.objects.filter(id=thread.id).update(updated_at=msg.sent_at)
        return Response(ChatMessageSerializer(msg, context={"request": request}).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="mark-read")
    def mark_read(self, request, pk=None):
        thread = self.get_object()
        uid = request.user.id
        if uid not in (thread.participants or []):
            return Response({"detail": "Not a participant."}, status=status.HTTP_403_FORBIDDEN)

        msgs = list(
            ChatMessage.objects.filter(thread=thread, deleted_at__isnull=True)
            .exclude(sender_id=uid)
            .exclude(read_by__contains=[uid])
            .order_by("-sent_at")[:500]
        )
        if not msgs:
            return Response({"updated": 0})
        for m in msgs:
            m.read_by = list(dict.fromkeys([*(m.read_by or []), uid]))
        ChatMessage.objects.bulk_update(msgs, ["read_by"])
        return Response({"updated": len(msgs)})


class ChatMessageViewSet(mixins.UpdateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChatMessageSerializer

    def get_queryset(self):
        uid = self.request.user.id
        threads = ChatThread.objects.filter(deleted_at__isnull=True, participants__contains=[uid]).values_list("id", flat=True)
        return ChatMessage.objects.filter(thread_id__in=threads, deleted_at__isnull=True).select_related("sender", "thread")

    def partial_update(self, request, *args, **kwargs):
        msg: ChatMessage = self.get_object()
        if msg.sender_id != request.user.id:
            return Response({"detail": "Only the sender can edit this message."}, status=status.HTTP_403_FORBIDDEN)
        content = request.data.get("content")
        if content is not None:
            msg.content = str(content)
        if "attachments" in request.data:
            attachments = request.data.get("attachments")
            if isinstance(attachments, list):
                msg.attachments = attachments
        msg.save(update_fields=["content", "attachments"])
        return Response(ChatMessageSerializer(msg, context={"request": request}).data)

    def destroy(self, request, *args, **kwargs):
        msg: ChatMessage = self.get_object()
        if msg.sender_id != request.user.id:
            return Response({"detail": "Only the sender can delete this message."}, status=status.HTTP_403_FORBIDDEN)
        msg.deleted_at = timezone.now()
        msg.content = ""
        msg.attachments = []
        msg.save(update_fields=["deleted_at", "content", "attachments"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminUserViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = AdminUserListSerializer
    pagination_class = AdminPageNumberPagination

    def _deny_if_target_is_admin_and_not_super(self, actor: User, target: User):
        if (getattr(target, "role", "") or "").lower() == User.Role.ADMIN and not _is_super_admin(actor):
            return Response({"detail": "Only super admins can manage admin users."}, status=status.HTTP_403_FORBIDDEN)
        return None

    def _deny_if_payload_promotes_to_admin_and_not_super(self, actor: User, data: dict):
        role_in = (data.get("role") or "").strip().lower() if isinstance(data, dict) else ""
        if role_in == User.Role.ADMIN and not _is_super_admin(actor):
            return Response({"detail": "Only super admins can create or promote admin users."}, status=status.HTTP_403_FORBIDDEN)
        return None

    def get_queryset(self):
        qs = (
            User.objects.select_related("profile", "seller_profile", "admin_profile")
            .annotate(
                orders_count=Count("orders", distinct=True) + Count("sales", distinct=True),
            )
            .order_by("-date_joined")
        )

        q = (self.request.query_params.get("q") or "").strip()
        if q:
            qv = q.strip()
            qn = qv.lower()
            is_email = "@" in qn and "." in qn
            phoneish = qn.replace("+", "").replace(" ", "").replace("-", "").isdigit()
            parts = [p for p in qv.split(" ") if p]

            if is_email:
                qs = qs.filter(email__icontains=qv)
            elif phoneish:
                qs = qs.filter(phone__icontains=qv)
            elif len(parts) >= 2:
                first = parts[0]
                last = " ".join(parts[1:])
                qs = qs.filter(
                    Q(first_name__icontains=first, last_name__icontains=last)
                    | Q(first_name__icontains=last, last_name__icontains=first)
                    | Q(email__icontains=qv)
                    | Q(phone__icontains=qv)
                )
            else:
                qs = qs.filter(
                    Q(first_name__icontains=qv)
                    | Q(last_name__icontains=qv)
                    | Q(email__icontains=qv)
                    | Q(phone__icontains=qv)
                )

        role = (self.request.query_params.get("role") or "").strip().lower()
        if role in {"buyer", "seller", "admin", "partner"}:
            qs = qs.filter(role=role)

        active_now = (self.request.query_params.get("active_now") or "").strip().lower()
        if active_now in {"1", "true", "yes"}:
            window = timezone.now() - timedelta(minutes=15)
            qs = qs.filter(last_login__gte=window)

        admin_role = (self.request.query_params.get("admin_role") or "").strip().lower()
        if admin_role:
            if admin_role == "manager":
                qs = qs.filter(role=User.Role.ADMIN).exclude(admin_profile__admin_role=AdminProfile.AdminRole.SUPER_ADMIN)
            else:
                qs = qs.filter(role=User.Role.ADMIN, admin_profile__admin_role=admin_role)

        admin_status = (self.request.query_params.get("admin_status") or "").strip().lower()
        if admin_status == "suspended":
            qs = qs.filter(status=User.Status.SUSPENDED)
        elif admin_status == "pending":
            qs = qs.filter(status=User.Status.ACTIVE, seller_profile__verification_status="pending")
        elif admin_status == "review":
            qs = qs.filter(status=User.Status.ACTIVE, seller_profile__verification_status="rejected")
        elif admin_status == "active":
            qs = qs.exclude(status=User.Status.SUSPENDED)

        return qs

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return AdminUserWriteSerializer
        return AdminUserListSerializer

    def create(self, request, *args, **kwargs):
        deny = self._deny_if_payload_promotes_to_admin_and_not_super(request.user, request.data or {})
        if deny is not None:
            return deny

        ser = AdminUserWriteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        email = (data.get("email") or "").strip() or None
        phone = (data.get("phone") or "").strip() or None
        password = (data.get("password") or "").strip()
        role = data.get("role")
        account_type = (data.get("account_type") or "").strip()
        status_val = data.get("status") or User.Status.ACTIVE
        admin_role = (data.get("admin_role") or "").strip()
        department = (data.get("department") or "").strip()

        if email and User.objects.filter(email__iexact=email).exists():
            return Response({"email": ["A user with this email already exists."]}, status=status.HTTP_400_BAD_REQUEST)
        if phone and User.objects.filter(phone=phone).exists():
            return Response({"phone": ["A user with this phone already exists."]}, status=status.HTTP_400_BAD_REQUEST)
        if not password:
            return Response({"password": ["Password is required."]}, status=status.HTTP_400_BAD_REQUEST)

        user = User(
            email=email,
            phone=phone,
            first_name=(data.get("first_name") or "").strip(),
            last_name=(data.get("last_name") or "").strip(),
            role=role,
            account_type=account_type,
            status=status_val,
            is_active=True,
        )
        user.set_password(password)
        try:
            with transaction.atomic():
                user.full_clean()
                user.save()
        except DjangoValidationError as e:
            payload = getattr(e, "message_dict", None) or {"detail": e.messages[0] if getattr(e, "messages", None) else "Invalid data."}
            return Response(payload, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError:
            return Response({"detail": "A user with these credentials already exists."}, status=status.HTTP_400_BAD_REQUEST)

        UserProfile.objects.get_or_create(user=user)
        if role == User.Role.SELLER:
            from .models import SellerProfile

            SellerProfile.objects.get_or_create(user=user)
        if role == User.Role.BUYER:
            from .models import BuyerProfile

            BuyerProfile.objects.get_or_create(user=user)
        if role == User.Role.ADMIN:
            role_val = admin_role or AdminProfile.AdminRole.SUPER_ADMIN
            prof, _ = AdminProfile.objects.get_or_create(user=user, defaults={"admin_role": role_val})
            updates = {}
            if admin_role and prof.admin_role != admin_role:
                updates["admin_role"] = admin_role
            if department and prof.department != department:
                updates["department"] = department
            if updates:
                AdminProfile.objects.filter(id=prof.id).update(**updates)

        out = AdminUserListSerializer(user, context=self.get_serializer_context()).data
        _audit(request.user, action="admin_user_created", target_type="user", target_id=str(user.id), payload={"role": role, "admin_role": admin_role})
        return Response(out, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        user = self.get_object()
        deny = self._deny_if_target_is_admin_and_not_super(request.user, user)
        if deny is not None:
            return deny
        deny = self._deny_if_payload_promotes_to_admin_and_not_super(request.user, request.data or {})
        if deny is not None:
            return deny

        ser = AdminUserWriteSerializer(data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        email_in = None
        phone_in = None
        for f in ["first_name", "last_name"]:
            if f in data:
                setattr(user, f, (data.get(f) or "").strip())
        if "email" in data:
            email_in = (data.get("email") or "").strip() or None
            user.email = email_in
        if "phone" in data:
            phone_in = (data.get("phone") or "").strip() or None
            user.phone = phone_in
        if "role" in data:
            user.role = data.get("role")
        if "account_type" in data:
            user.account_type = (data.get("account_type") or "").strip()
        if "status" in data:
            user.status = data.get("status")
        if "password" in data and (data.get("password") or "").strip():
            user.set_password((data.get("password") or "").strip())

        if email_in and User.objects.filter(email__iexact=email_in).exclude(id=user.id).exists():
            return Response({"email": ["A user with this email already exists."]}, status=status.HTTP_400_BAD_REQUEST)
        if phone_in and User.objects.filter(phone=phone_in).exclude(id=user.id).exists():
            return Response({"phone": ["A user with this phone already exists."]}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                user.full_clean()
                user.save()
        except DjangoValidationError as e:
            payload = getattr(e, "message_dict", None) or {"detail": e.messages[0] if getattr(e, "messages", None) else "Invalid data."}
            return Response(payload, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError:
            return Response({"detail": "Update violates a unique constraint."}, status=status.HTTP_400_BAD_REQUEST)

        UserProfile.objects.get_or_create(user=user)
        if user.role == User.Role.ADMIN:
            AdminProfile.objects.get_or_create(user=user, defaults={"admin_role": AdminProfile.AdminRole.SUPER_ADMIN})
        if user.role == User.Role.ADMIN and ("admin_role" in data or "department" in data):
            prof, _ = AdminProfile.objects.get_or_create(user=user, defaults={"admin_role": AdminProfile.AdminRole.SUPER_ADMIN})
            updates = {}
            if "admin_role" in data and (data.get("admin_role") or "").strip():
                updates["admin_role"] = (data.get("admin_role") or "").strip()
            if "department" in data:
                updates["department"] = (data.get("department") or "").strip()
            if updates:
                AdminProfile.objects.filter(id=prof.id).update(**updates)
        out = AdminUserListSerializer(user, context=self.get_serializer_context()).data
        _audit(request.user, action="admin_user_updated", target_type="user", target_id=str(user.id), payload={"fields": list((request.data or {}).keys())})
        return Response(out)

    @action(detail=True, methods=["post"], url_path="seller-verify/approve")
    def seller_verify_approve(self, request, pk=None):
        if not _can_manage_seller_verification(request.user):
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        user = self.get_object()
        seller_prof = getattr(user, "seller_profile", None)
        if not seller_prof:
            return Response({"detail": "This user is not a seller."}, status=status.HTTP_400_BAD_REQUEST)

        SellerProfile.objects.filter(id=seller_prof.id).update(verification_status=SellerProfile.VerificationStatus.APPROVED)

        try:
            Notification.objects.create(
                user=user,
                channel=Notification.Channel.IN_APP,
                event_type="seller_verification_approved",
                payload={"approved_by": request.user.id},
                status=Notification.Status.QUEUED,
            )
        except Exception:
            pass

        user.refresh_from_db()
        out = AdminUserListSerializer(user, context=self.get_serializer_context()).data
        _audit(request.user, action="seller_verification_approved", target_type="user", target_id=str(user.id), payload={})
        return Response(out)

    @action(detail=True, methods=["post"], url_path="seller-verify/reject")
    def seller_verify_reject(self, request, pk=None):
        if not _can_manage_seller_verification(request.user):
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        user = self.get_object()
        seller_prof = getattr(user, "seller_profile", None)
        if not seller_prof:
            return Response({"detail": "This user is not a seller."}, status=status.HTTP_400_BAD_REQUEST)

        reason = (request.data.get("reason") or "").strip()
        SellerProfile.objects.filter(id=seller_prof.id).update(verification_status=SellerProfile.VerificationStatus.REJECTED)

        try:
            Notification.objects.create(
                user=user,
                channel=Notification.Channel.IN_APP,
                event_type="seller_verification_rejected",
                payload={"rejected_by": request.user.id, "reason": reason},
                status=Notification.Status.QUEUED,
            )
        except Exception:
            pass

        user.refresh_from_db()
        out = AdminUserListSerializer(user, context=self.get_serializer_context()).data
        _audit(request.user, action="seller_verification_rejected", target_type="user", target_id=str(user.id), payload={"reason": reason})
        return Response(out)

    @action(detail=True, methods=["get"], url_path="detail")
    def user_detail(self, request, pk=None):
        user = self.get_object()

        try:
            prof = getattr(user, "profile", None)
            buyer_prof = getattr(user, "buyer_profile", None)
            seller_prof = getattr(user, "seller_profile", None)
            admin_prof = getattr(user, "admin_profile", None)

            settings_obj = None
            try:
                settings_obj = UserSettings.objects.filter(user=user).first()
            except Exception:
                settings_obj = None

            sec = dict(getattr(settings_obj, "security", None) or {}) if settings_obj else {}
            recovery_generated = bool(sec.get("recoveryGenerated"))
            recovery_generated_at = sec.get("recoveryGeneratedAt")
            totp_enabled = bool(sec.get("totp_enabled"))

            docs_out = []
            try:
                docs = list(KycDocument.objects.filter(user=user).order_by("-uploaded_at")[:25])
                docs_out = [
                    {
                        "id": d.id,
                        "kind": d.kind,
                        "doc_type": d.doc_type,
                        "review_status": d.review_status,
                        "uploaded_at": d.uploaded_at,
                        "reviewed_at": d.reviewed_at,
                        "rejection_reason": d.rejection_reason,
                        "expires_at": d.expires_at,
                    }
                    for d in docs
                ]
            except Exception:
                docs_out = []

            commerce = {
                "buyer_orders_count": 0,
                "seller_orders_count": 0,
                "shipments_count": 0,
                "disputes_count": 0,
                "payments_count": 0,
                "payments_total": 0.0,
            }
            try:
                from apps.orders.models import Dispute, Order, Shipment

                commerce["buyer_orders_count"] = Order.objects.filter(buyer=user, deleted_at__isnull=True).count()
                commerce["seller_orders_count"] = Order.objects.filter(seller=user, deleted_at__isnull=True).count()
                commerce["shipments_count"] = Shipment.objects.filter(order__buyer=user, deleted_at__isnull=True).count() + Shipment.objects.filter(order__seller=user, deleted_at__isnull=True).count()
                commerce["disputes_count"] = Dispute.objects.filter(opened_by=user, deleted_at__isnull=True).count()
            except Exception:
                pass
            try:
                from apps.payments.models import Payment

                qs = Payment.objects.filter(deleted_at__isnull=True).select_related("order")
                if getattr(user, "account_type", None) == "seller":
                    qs = qs.filter(order__seller=user)
                else:
                    qs = qs.filter(order__buyer=user)
                commerce["payments_count"] = qs.count()
                commerce["payments_total"] = float(qs.aggregate(v=Coalesce(Sum("amount"), Value(0)))["v"] or 0)
            except Exception:
                pass

            chat_summary = {"threads_count": 0}
            try:
                chat_summary["threads_count"] = ChatThread.objects.filter(deleted_at__isnull=True, participants__contains=[user.id]).count()
            except Exception:
                pass

            payload = {
                "user": AdminUserListSerializer(user, context=self.get_serializer_context()).data,
                "profiles": {
                    "profile": {
                        "country": getattr(prof, "country", "") if prof else "",
                        "province": getattr(prof, "province", "") if prof else "",
                        "city": getattr(prof, "city", "") if prof else "",
                        "street": getattr(prof, "street", "") if prof else "",
                        "address": getattr(prof, "address", "") if prof else "",
                        "nationality": getattr(prof, "nationality", "") if prof else "",
                        "gender": getattr(prof, "gender", "") if prof else "",
                        "date_of_birth": getattr(prof, "date_of_birth", None) if prof else None,
                    },
                    "buyer_profile": {
                        "name": getattr(buyer_prof, "name", "") if buyer_prof else "",
                        "business_type": getattr(buyer_prof, "business_type", "") if buyer_prof else "",
                        "default_location": getattr(buyer_prof, "default_location", {}) if buyer_prof else {},
                        "currency_preference": getattr(buyer_prof, "currency_preference", "") if buyer_prof else "",
                        "language_preference": getattr(buyer_prof, "language_preference", "") if buyer_prof else "",
                    },
                    "seller_profile": {
                        "business_name": getattr(seller_prof, "business_name", "") if seller_prof else "",
                        "verification_status": getattr(seller_prof, "verification_status", "") if seller_prof else "",
                        "country": getattr(seller_prof, "country", "") if seller_prof else "",
                        "region": getattr(seller_prof, "region", "") if seller_prof else "",
                        "tax_id": getattr(seller_prof, "tax_id", "") if seller_prof else "",
                        "sample_low_threshold": getattr(seller_prof, "sample_low_threshold", None) if seller_prof else None,
                    },
                    "admin_profile": {
                        "admin_role": getattr(admin_prof, "admin_role", None) if admin_prof else None,
                        "department": getattr(admin_prof, "department", "") if admin_prof else "",
                    },
                },
                "kyc": {"documents": docs_out},
                "commerce": commerce,
                "chat": chat_summary,
                "security": {
                    "two_factor_enabled": bool(getattr(user, "two_factor_enabled", False)),
                    "totp_enabled": totp_enabled,
                    "recovery_generated": recovery_generated,
                    "recovery_generated_at": recovery_generated_at,
                    "last_login": getattr(user, "last_login", None),
                    "date_joined": getattr(user, "date_joined", None),
                },
            }
            return Response(payload)
        except Exception as e:
            fallback = {
                "user": AdminUserListSerializer(user, context=self.get_serializer_context()).data,
                "profiles": {"profile": {}, "buyer_profile": {}, "seller_profile": {}, "admin_profile": {}},
                "kyc": {"documents": []},
                "commerce": {
                    "buyer_orders_count": 0,
                    "seller_orders_count": 0,
                    "shipments_count": 0,
                    "disputes_count": 0,
                    "payments_count": 0,
                    "payments_total": 0.0,
                },
                "chat": {"threads_count": 0},
                "security": {
                    "two_factor_enabled": bool(getattr(user, "two_factor_enabled", False)),
                    "totp_enabled": False,
                    "recovery_generated": False,
                    "recovery_generated_at": None,
                    "last_login": getattr(user, "last_login", None),
                    "date_joined": getattr(user, "date_joined", None),
                },
                "error": str(e),
            }
            return Response(fallback)

    @action(detail=True, methods=["post"], url_path="password-reset-link")
    def password_reset_link(self, request, pk=None):
        if not _can_issue_password_reset(request.user):
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        user = self.get_object()
        deny = self._deny_if_target_is_admin_and_not_super(request.user, user)
        if deny is not None:
            return deny

        identifier = (user.email or user.phone or "").strip()
        if not identifier:
            return Response({"detail": "User has no email or phone."}, status=status.HTTP_400_BAD_REQUEST)

        token = secrets.token_urlsafe(24)
        now = timezone.now()
        expires = now + timedelta(hours=24)

        obj, _ = UserSettings.objects.get_or_create(user=user)
        sec = dict(obj.security or {})
        sec["password_reset"] = {
            "token_hash": make_password(token),
            "expires_at": expires.isoformat(),
            "issued_at": now.isoformat(),
            "issued_by": request.user.id,
        }
        obj.security = sec
        obj.save(update_fields=["security", "updated_at"])

        _audit(request.user, action="admin_password_reset_issued", target_type="user", target_id=str(user.id), payload={"identifier": identifier, "expires_at": expires.isoformat()})
        return Response({"identifier": identifier, "token": token, "expires_at": expires.isoformat()})

    @action(detail=False, methods=["post"], url_path="bulk/status")
    def bulk_status(self, request):
        ids = request.data.get("ids") or []
        status_in = str(request.data.get("status") or "").strip().lower()
        reason = str(request.data.get("reason") or "").strip()
        if not isinstance(ids, list) or not ids:
            return Response({"detail": "ids must be a non-empty list."}, status=status.HTTP_400_BAD_REQUEST)
        if status_in not in {"active", "suspended"}:
            return Response({"detail": "status must be active or suspended."}, status=status.HTTP_400_BAD_REQUEST)

        actor = request.user
        id_ints = [int(x) for x in ids if isinstance(x, int) or (isinstance(x, str) and str(x).isdigit())]
        qs = User.objects.filter(id__in=id_ints)

        if not _is_super_admin(actor):
            qs = qs.exclude(role=User.Role.ADMIN)

        status_val = User.Status.SUSPENDED if status_in == "suspended" else User.Status.ACTIVE
        updated = qs.update(status=status_val)
        for u in qs.only("id"):
            _audit(actor, action="admin_user_status_changed", target_type="user", target_id=str(u.id), payload={"status": status_in, "reason": reason})
        return Response({"updated": updated})

    @action(detail=False, methods=["post"], url_path="bulk/request-reverification")
    def bulk_request_reverification(self, request):
        ids = request.data.get("ids") or []
        if not isinstance(ids, list) or not ids:
            return Response({"detail": "ids must be a non-empty list."}, status=status.HTTP_400_BAD_REQUEST)

        actor = request.user
        id_ints = [int(x) for x in ids if isinstance(x, int) or (isinstance(x, str) and str(x).isdigit())]
        users = list(User.objects.filter(id__in=id_ints).select_related("seller_profile"))

        updated = 0
        for u in users:
            if (getattr(u, "role", "") or "").lower() == User.Role.ADMIN and not _is_super_admin(actor):
                continue
            sp = getattr(u, "seller_profile", None)
            if sp is None:
                sp = SellerProfile.objects.create(user=u)
            SellerProfile.objects.filter(id=sp.id).update(verification_status=SellerProfile.VerificationStatus.PENDING)
            updated += 1
            try:
                Notification.objects.create(
                    user=u,
                    channel=Notification.Channel.IN_APP,
                    event_type="seller_reverification_requested",
                    payload={"requested_by": actor.id},
                    status=Notification.Status.QUEUED,
                )
            except Exception:
                pass
            _audit(actor, action="seller_reverification_requested", target_type="user", target_id=str(u.id), payload={})

        return Response({"updated": updated})

    @action(detail=False, methods=["get"], url_path="export")
    def export(self, request):
        qs = self.get_queryset()
        qs = self.filter_queryset(qs)
        rows = list(qs[:5000])

        resp = HttpResponse(content_type="text/csv")
        resp["Content-Disposition"] = 'attachment; filename="vehsl_users_export.csv"'
        writer = csv.writer(resp)
        writer.writerow(["id", "display_name", "email", "phone", "role", "account_type", "status", "admin_role", "orders_count", "last_active_at"])
        ser = AdminUserListSerializer(rows, many=True, context=self.get_serializer_context())
        for item in ser.data:
            writer.writerow([
                item.get("id"),
                item.get("display_name"),
                item.get("email"),
                item.get("phone"),
                item.get("role"),
                item.get("account_type"),
                item.get("status"),
                item.get("admin_role"),
                item.get("orders_count"),
                item.get("last_active_at"),
            ])
        _audit(request.user, action="admin_users_exported", target_type="admin_users", target_id="", payload={"count": len(rows)})
        return resp

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        total_users = User.objects.count()
        suspended = User.objects.filter(status=User.Status.SUSPENDED).count()
        pending_review = User.objects.filter(status=User.Status.ACTIVE, seller_profile__verification_status="pending").count()
        review = User.objects.filter(status=User.Status.ACTIVE, seller_profile__verification_status="rejected").count()
        active = (
            User.objects.exclude(status=User.Status.SUSPENDED)
            .exclude(status=User.Status.DELETED)
            .filter(Q(seller_profile__isnull=True) | ~Q(seller_profile__verification_status__in=["pending", "rejected"]))
            .count()
        )

        return Response(
            {
                "server_build": SERVER_BUILD,
                "total_users": total_users,
                "active": active,
                "pending_review": pending_review,
                "review": review,
                "suspended": suspended,
            }
        )


class AdminVerificationUserViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = AdminVerificationUserSerializer
    pagination_class = AdminPageNumberPagination

    def _base_users_queryset(self):
        qs = User.objects.select_related("profile", "seller_profile")

        utype = (self.request.query_params.get("type") or "").strip().lower()
        is_seller = Q(account_type="seller") | Q(role="seller")
        if utype == "seller":
            qs = qs.filter(is_seller)
        elif utype == "buyer":
            qs = qs.exclude(is_seller)

        status_q = (self.request.query_params.get("status") or "").strip().lower()
        if status_q in {"pending", "under_review", "verified", "rejected"}:
            if status_q == "verified":
                qs = qs.filter(
                    Q(seller_profile__verification_status=SellerProfile.VerificationStatus.APPROVED)
                    | (
                        Q(kyc_documents__review_status="verified")
                        & ~Q(kyc_documents__review_status__in=["pending", "under_review", "rejected"])
                    )
                )
            else:
                if status_q == "pending":
                    qs = qs.filter(
                        Q(seller_profile__verification_status=SellerProfile.VerificationStatus.PENDING)
                        | Q(kyc_documents__review_status__in=["pending", "under_review"])
                    )
                elif status_q == "rejected":
                    qs = qs.filter(
                        Q(seller_profile__verification_status=SellerProfile.VerificationStatus.REJECTED)
                        | Q(kyc_documents__review_status="rejected")
                    )
                else:
                    qs = qs.filter(kyc_documents__review_status=status_q)

        return qs.distinct()

    def get_queryset(self):
        docs_qs = KycDocument.objects.select_related("reviewed_by").order_by("-uploaded_at")
        return (
            self._base_users_queryset()
            .prefetch_related(Prefetch("kyc_documents", queryset=docs_qs))
            .order_by("-date_joined")
        )

    def list(self, request, *args, **kwargs):
        return response_list(self, qs=self.get_queryset(), serializer_class=AdminVerificationUserSerializer, request=request)

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        qs = self._base_users_queryset()

        total_users = qs.count()
        is_seller = Q(account_type="seller") | Q(role="seller")
        sellers = qs.filter(is_seller).count()
        buyers = qs.exclude(is_seller).count()

        pending_review = qs.filter(
            Q(seller_profile__verification_status=SellerProfile.VerificationStatus.PENDING)
            | Q(kyc_documents__review_status__in=["pending", "under_review"])
        ).distinct().count()

        fully_verified = qs.filter(
            Q(seller_profile__verification_status=SellerProfile.VerificationStatus.APPROVED)
            | (
                Q(kyc_documents__review_status="verified")
                & ~Q(kyc_documents__review_status__in=["pending", "under_review", "rejected"])
            )
        ).distinct().count()

        qs_annotated = qs.annotate(
            verified_docs=Count("kyc_documents", filter=Q(kyc_documents__review_status="verified"), distinct=True),
            pending_docs=Count("kyc_documents", filter=Q(kyc_documents__review_status="pending"), distinct=True),
            under_review_docs=Count("kyc_documents", filter=Q(kyc_documents__review_status="under_review"), distinct=True),
            rejected_docs=Count("kyc_documents", filter=Q(kyc_documents__review_status="rejected"), distinct=True),
        ).annotate(
            kyc_level=Case(
                When(verified_docs__gte=3, then=Value(3)),
                When(verified_docs__gte=2, then=Value(2)),
                When(verified_docs__gte=1, then=Value(1)),
                default=Value(0),
                output_field=IntegerField(),
            )
        ).annotate(
            trust_score=Case(
                When(rejected_docs__gt=0, then=Value(30) + F("kyc_level") * Value(10)),
                When(under_review_docs__gt=0, then=Value(45) + F("kyc_level") * Value(10)),
                When(pending_docs__gt=0, then=Value(50) + F("kyc_level") * Value(10)),
                When(verified_docs__gt=0, then=Value(70) + F("kyc_level") * Value(10)),
                default=Value(50),
                output_field=IntegerField(),
            )
        )

        avg_trust = qs_annotated.aggregate(v=Avg("trust_score"))["v"] or 0
        kyc_level_3 = qs_annotated.filter(verified_docs__gte=3).count()
        # fingerprint_enrolled = qs.filter(two_factor_enabled=True).count()
        # face_id_enrolled = 0

        return Response(
            {
                "total_users": total_users,
                "buyers": buyers,
                "sellers": sellers,
                "fully_verified": fully_verified,
                "pending_review": pending_review,
                "avg_trust_score": round(float(avg_trust), 0),
                "kyc_level_3": kyc_level_3,
            }
        )

    @action(detail=True, methods=["post"], url_path="approve-all")
    def approve_all(self, request, pk=None):
        user = self.get_object()
        reqs = _kyc_requirements_payload(user, request)
        if reqs.get("missing_groups"):
            return Response(
                {"detail": "Missing required documents.", "missing_groups": reqs.get("missing_groups")}, status=status.HTTP_400_BAD_REQUEST
            )
        valid_doc_ids = []
        for doc in KycDocument.objects.filter(user=user):
            try:
                name = getattr(doc.file, "name", "") or ""
                if name and default_storage.exists(name):
                    valid_doc_ids.append(doc.id)
            except Exception:
                continue

        now = timezone.now()
        KycDocument.objects.filter(id__in=valid_doc_ids, review_status__in=["pending", "under_review"]).update(
            review_status=KycDocument.ReviewStatus.VERIFIED,
            reviewed_at=now,
            reviewed_by=request.user,
            rejection_reason="",
        )
        if (user.account_type or user.role) == User.AccountType.SELLER or user.role == User.Role.SELLER:
            prof = getattr(user, "seller_profile", None)
            if prof is None:
                prof = SellerProfile.objects.create(user=user)
            SellerProfile.objects.filter(id=prof.id).update(verification_status=SellerProfile.VerificationStatus.APPROVED)
        user = User.objects.select_related("profile", "seller_profile").prefetch_related(
            Prefetch("kyc_documents", queryset=KycDocument.objects.select_related("reviewed_by").order_by("-uploaded_at"))
        ).get(id=user.id)
        return Response(AdminVerificationUserSerializer(user, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="request-reverification")
    def request_reverification(self, request, pk=None):
        user = self.get_object()
        KycDocument.objects.filter(user=user).update(
            review_status=KycDocument.ReviewStatus.PENDING,
            reviewed_at=None,
            reviewed_by=None,
            rejection_reason="",
        )
        if (user.account_type or user.role) == User.AccountType.SELLER or user.role == User.Role.SELLER:
            prof = getattr(user, "seller_profile", None)
            if prof is None:
                prof = SellerProfile.objects.create(user=user)
            SellerProfile.objects.filter(id=prof.id).update(verification_status=SellerProfile.VerificationStatus.PENDING)

        reqs = _kyc_requirements_payload(user, request)
        try:
            Notification.objects.create(
                user=user,
                channel=Notification.Channel.IN_APP,
                event_type="kyc_documents_requested",
                payload={
                    "requested_by": request.user.id,
                    "missing_groups": reqs.get("missing_groups") or [],
                    "path": "/kyc",
                },
                status=Notification.Status.QUEUED,
            )
        except Exception:
            pass

        user = User.objects.select_related("profile", "seller_profile").prefetch_related(
            Prefetch("kyc_documents", queryset=KycDocument.objects.select_related("reviewed_by").order_by("-uploaded_at"))
        ).get(id=user.id)
        return Response(AdminVerificationUserSerializer(user, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="request-documents")
    def request_documents(self, request, pk=None):
        user = self.get_object()
        reqs = _kyc_requirements_payload(user, request)
        missing = reqs.get("missing_groups") or []
        try:
            Notification.objects.create(
                user=user,
                channel=Notification.Channel.IN_APP,
                event_type="kyc_documents_requested",
                payload={
                    "requested_by": request.user.id,
                    "missing_groups": missing,
                    "path": "/kyc",
                },
                status=Notification.Status.QUEUED,
            )
        except Exception:
            pass

        if (user.account_type or user.role) == User.AccountType.SELLER or user.role == User.Role.SELLER:
            SellerProfile.objects.get_or_create(user=user)
            SellerProfile.objects.filter(user=user).update(verification_status=SellerProfile.VerificationStatus.PENDING)

        _audit(request.user, action="admin_kyc_documents_requested", target_type="user", target_id=str(user.id), payload={"missing_groups": missing})
        return Response({"requested": True, "missing_groups": missing})


class AdminKycDocumentViewSet(mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = AdminKycDocumentSerializer
    queryset = KycDocument.objects.select_related("user", "reviewed_by").order_by("-uploaded_at")

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        doc = self.get_object()
        try:
            name = getattr(doc.file, "name", "") or ""
            if not name or not default_storage.exists(name):
                return Response({"detail": "Document file is missing. Ask the user to upload it again."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({"detail": "Document file is missing. Ask the user to upload it again."}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        KycDocument.objects.filter(id=doc.id).update(
            review_status=KycDocument.ReviewStatus.VERIFIED,
            reviewed_at=now,
            reviewed_by=request.user,
            rejection_reason="",
        )
        doc.refresh_from_db()
        _sync_seller_verification_status(doc.user)
        _audit(request.user, action="admin_kyc_document_approved", target_type="kyc_document", target_id=str(doc.id), payload={"user_id": doc.user_id})
        return Response(AdminKycDocumentSerializer(doc, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        doc = self.get_object()
        try:
            name = getattr(doc.file, "name", "") or ""
            if not name or not default_storage.exists(name):
                return Response({"detail": "Document file is missing. Ask the user to upload it again."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({"detail": "Document file is missing. Ask the user to upload it again."}, status=status.HTTP_400_BAD_REQUEST)

        reason = (request.data.get("reason") or "").strip()
        now = timezone.now()
        KycDocument.objects.filter(id=doc.id).update(
            review_status=KycDocument.ReviewStatus.REJECTED,
            reviewed_at=now,
            reviewed_by=request.user,
            rejection_reason=reason,
        )
        doc.refresh_from_db()
        _sync_seller_verification_status(doc.user)
        _audit(request.user, action="admin_kyc_document_rejected", target_type="kyc_document", target_id=str(doc.id), payload={"user_id": doc.user_id, "reason": reason})
        return Response(AdminKycDocumentSerializer(doc, context={"request": request}).data)

class SellerDashboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, IsSeller]

    def _kyc_gate(self, request):
        _sync_seller_verification_status(request.user)
        profile = getattr(request.user, "seller_profile", None)
        if getattr(profile, "verification_status", "") != SellerProfile.VerificationStatus.APPROVED:
            return Response(
                {"detail": "Seller verification is pending admin approval.", "code": "kyc_pending"},
                status=status.HTTP_403_FORBIDDEN,
            )
        return None

    @action(detail=False, methods=["get"])
    def metrics(self, request):
        gate = self._kyc_gate(request)
        if gate is not None:
            return gate
        user = request.user
        total_pending = Order.objects.filter(seller=user, status__in=[Order.Status.CREATED, Order.Status.ACCEPTED, Order.Status.SHIPPED]).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        last_paid = 12912.00  # Mock or fetch from payments app if implemented
        unread_messages = ChatMessage.objects.exclude(sender=user).exclude(read_by__contains=[user.id]).filter(thread__participants__contains=[user.id]).count()
        active_orders = Order.objects.filter(seller=user).exclude(status__in=[Order.Status.COMPLETED, Order.Status.CANCELLED, Order.Status.REJECTED]).count()
        
        # Calculate protection score
        settings = getattr(user, 'settings', None)
        security = getattr(settings, 'security', {}) if settings else {}
        score = 0
        if security.get('twoFactor'): score += 25
        if security.get('payoutPinEnabled'): score += 25
        if security.get('listingLockEnabled'): score += 25
        if security.get('cancelVerifyEnabled'): score += 18
        if score == 0: score = 68 # Default mock score if nothing set
        
        data = {
            "total_pending": total_pending,
            "last_paid": last_paid,
            "unread_messages_count": unread_messages,
            "active_orders_count": active_orders,
            "protection_score": score
        }
        return Response(data)

    @action(detail=False, methods=["get"])
    def orders(self, request):
        gate = self._kyc_gate(request)
        if gate is not None:
            return gate
        user = request.user
        orders = Order.objects.filter(seller=user).exclude(status__in=[Order.Status.COMPLETED, Order.Status.CANCELLED])
        
        results = []
        for o in orders:
            item = o.items.first()
            product_name = item.product.name if item else "Unknown Product"
            image_url = ""
            if item and item.product:
                media = item.product.media.filter(media_type="image").first()
                if media:
                    image_url = media.url

            results.append({
                "id": str(o.id),
                "product": product_name,
                "image": image_url,
                "type": "approval" if o.status == Order.Status.CREATED else "production",
                "deadline": "2d left",
                "deadline_urgent": o.status == Order.Status.CREATED,
                "order_number": f"#VH-{o.id}",
                "qty": sum(i.quantity for i in o.items.all()),
                "unit_price": float(item.unit_price) if item else 0,
                "buyer": f"{o.buyer.first_name} {o.buyer.last_name}",
                "destination": "London, UK",
            })
        
        if not results:
            return Response([])
            
        return Response(results)

    @action(detail=False, methods=["get"])
    def activities(self, request):
        gate = self._kyc_gate(request)
        if gate is not None:
            return gate
        user = request.user
        qs = Notification.objects.filter(user=user).order_by("-created_at")[:10]
        ser = SellerActivitySerializer(qs, many=True)
        return Response(ser.data)

    @action(detail=False, methods=["get"])
    def products(self, request):
        gate = self._kyc_gate(request)
        if gate is not None:
            return gate
        user = request.user
        qs = Product.objects.filter(seller=user).exclude(status=Product.Status.ARCHIVED)
        ser = SellerProductSerializer(qs, many=True)
        return Response(ser.data)

class WarehouseDashboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, IsSeller]

    def _kyc_gate(self, request):
        _sync_seller_verification_status(request.user)
        profile = getattr(request.user, "seller_profile", None)
        if getattr(profile, "verification_status", "") != SellerProfile.VerificationStatus.APPROVED:
            return Response(
                {"detail": "Seller verification is pending admin approval.", "code": "kyc_pending"},
                status=status.HTTP_403_FORBIDDEN,
            )
        return None

    @action(detail=False, methods=["get"])
    def list_warehouses(self, request):
        gate = self._kyc_gate(request)
        if gate is not None:
            return gate
        # Mock warehouses for now as there is no Warehouse model yet
        # In a real scenario, you'd fetch from a Warehouse model
        from .dashboard_serializers import WarehouseSerializer
        data = [
            {
                "id": "w1",
                "name": "Greenstore G1 warehouse",
                "address": "123 Green Street, Lahore",
                "distance": "1.2 miles away",
                "price_per_week": 35.0,
                "rating": "A",
                "features": ["climate", "security", "covered"],
                "manager_name": "John Doe",
                "manager_phone": "0300-1234567",
                "hours": {"open": "08:00", "close": "18:00", "days": "Mon–Sat"}
            },
            {
                "id": "w2",
                "name": "James ZS warehouse",
                "address": "456 James Street, Islamabad",
                "distance": "4 miles away",
                "price_per_week": 45.0,
                "rating": "A+",
                "features": ["climate", "security", "covered"],
                "manager_name": "Jane Smith",
                "manager_phone": "0300-7654321",
                "hours": {"open": "07:00", "close": "22:00", "days": "Mon–Sun"}
            }
        ]
        return Response(data)

    @action(detail=False, methods=["get"])
    def inventory(self, request):
        gate = self._kyc_gate(request)
        if gate is not None:
            return gate
        warehouse_id = request.query_params.get("warehouse_id")
        user = request.user
        products = Product.objects.filter(seller=user).exclude(status=Product.Status.ARCHIVED)
        
        results = []
        for p in products:
            image_url = ""
            media = p.media.filter(media_type="image").first()
            if media:
                image_url = media.url

            results.append({
                "id": f"inv-{p.id}",
                "product_name": p.name,
                "sku": p.sku or f"SKU-{p.id}",
                "image": image_url,
                "total_boxes": 120,
                "released_boxes": 34,
                "pallets_count": 6,
                "unit_price": float(p.price),
                "warehouse_id": warehouse_id or "w2"
            })
        return Response(results)

    @action(detail=False, methods=["get"])
    def release_requests(self, request):
        gate = self._kyc_gate(request)
        if gate is not None:
            return gate
        # Mock release requests
        data = [
            {
                "id": "req1",
                "inventory_item_id": "inv1",
                "requester_name": "Bilal Hussain",
                "id_card_number": "35201-1234567-9",
                "vehicle_number": "LHR-2291",
                "boxes_requested": 15,
                "payment_amount": 480.0,
                "requested_date": "2026-05-19",
                "note": "Buyer from Lahore, needs delivery before Friday"
            }
        ]
        return Response(data)

    @action(detail=False, methods=["get"])
    def release_records(self, request):
        gate = self._kyc_gate(request)
        if gate is not None:
            return gate
        # Mock release records
        data = [
            {
                "id": "rel1",
                "inventory_item_id": "inv1",
                "recipient_name": "Ahmed Khan",
                "id_card_number": "35202-XXXX-123-4",
                "vehicle_number": "LEA-7721",
                "boxes_released": 20,
                "payment_amount": 640.0,
                "date": "2026-05-18",
                "status": "completed"
            }
        ]
        return Response(data)

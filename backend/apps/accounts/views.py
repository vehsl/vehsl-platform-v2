from __future__ import annotations

from rest_framework import generics, mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from django.conf import settings as django_settings
from django.core.cache import cache
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
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
import json
import re
import urllib.request
import urllib.parse
import urllib.error

from django.core.files.storage import default_storage
from django.contrib.auth.hashers import make_password, check_password

from apps.catalog.models import ListingRequest, Product, ProductMedia, Warehouse, WarehouseStock
from apps.catalog.serializers import ProductMediaSerializer
from apps.orders.models import Order, OrderItem, Shipment, WishlistItem, WarehouseRelease, Review
from apps.accounts.permissions import IsAdmin, IsBuyer, IsSeller

from django.db.models import Avg, Case, Count, F, IntegerField, Min, Prefetch, Q, Subquery, OuterRef, Value, When
from django.db.models.functions import Coalesce, TruncDay, TruncHour, TruncMonth, TruncWeek

from .models import (
    AdminProfile,
    AdminPlatformSettings,
    admin_platform_settings_defaults,
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
    validate_password_for_platform,
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
        return admin_platform_settings_defaults()

    def _integrations(self):
        defaults = self._defaults()
        obj, _ = AdminPlatformSettings.objects.get_or_create(key="global")
        general = {**defaults["general"], **(obj.general or {})}
        enabled_map = general.get("integrations_enabled") if isinstance(general.get("integrations_enabled"), dict) else dict(defaults["general"]["integrations_enabled"])
        creds = general.get("integration_credentials") if isinstance(general.get("integration_credentials"), dict) else dict(defaults["general"]["integration_credentials"])

        stripe_key = str(creds.get("stripe_secret_key") or "").strip() or str(getattr(django_settings, "STRIPE_SECRET_KEY", "") or getattr(django_settings, "STRIPE_API_KEY", "") or "").strip()
        sendgrid_key = str(creds.get("sendgrid_api_key") or "").strip() or str(getattr(django_settings, "SENDGRID_API_KEY", "") or "").strip()
        twilio_sid = str(creds.get("twilio_account_sid") or "").strip() or str(getattr(django_settings, "TWILIO_ACCOUNT_SID", "") or "").strip()
        twilio_token = str(creds.get("twilio_auth_token") or "").strip() or str(getattr(django_settings, "TWILIO_AUTH_TOKEN", "") or "").strip()
        gmaps_key = str(creds.get("google_maps_api_key") or "").strip() or str(getattr(django_settings, "GOOGLE_MAPS_API_KEY", "") or "").strip()

        def status_for(k: str, has_conf: bool) -> str:
            if not bool(enabled_map.get(k, True)):
                return "disabled"
            return "connected" if has_conf else "not_connected"

        return {
            "stripe_payments": status_for("stripe_payments", bool(stripe_key)),
            "sendgrid_email": status_for("sendgrid_email", bool(sendgrid_key)),
            "twilio_sms": status_for("twilio_sms", bool(twilio_sid and twilio_token)),
            "google_maps": status_for("google_maps", bool(gmaps_key)),
        }

    def get(self, request):
        defaults = self._defaults()
        obj, _ = AdminPlatformSettings.objects.get_or_create(key="global")
        general = {**defaults["general"], **(obj.general or {})}
        notifications = {**defaults["notifications"], **(obj.notifications or {})}
        security = {**defaults["security"], **(obj.security or {})}
        creds = general.get("integration_credentials") if isinstance(general.get("integration_credentials"), dict) else dict(defaults["general"]["integration_credentials"])
        general_out = dict(general)
        general_out.pop("integration_credentials", None)
        general_out["integration_credentials_set"] = {
            "stripe_secret_key_set": bool(str(creds.get("stripe_secret_key") or "").strip()),
            "sendgrid_api_key_set": bool(str(creds.get("sendgrid_api_key") or "").strip()),
            "twilio_account_sid_set": bool(str(creds.get("twilio_account_sid") or "").strip()),
            "twilio_auth_token_set": bool(str(creds.get("twilio_auth_token") or "").strip()),
            "google_maps_api_key_set": bool(str(creds.get("google_maps_api_key") or "").strip()),
        }
        return Response(
            {
                "general": general_out,
                "notifications": notifications,
                "security": security,
                "integrations": self._integrations(),
                "updated_at": obj.updated_at,
            }
        )

    def patch(self, request):
        if not _is_super_admin(request.user):
            return Response({"detail": "Only super admins can update platform settings."}, status=status.HTTP_403_FORBIDDEN)
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
            if "integrations_enabled" in incoming_general:
                raw = incoming_general.get("integrations_enabled")
                if isinstance(raw, dict):
                    enabled = dict(current.get("integrations_enabled") or defaults["general"].get("integrations_enabled") or {})
                    for k in ["stripe_payments", "sendgrid_email", "twilio_sms", "google_maps"]:
                        if k in raw:
                            enabled[k] = bool(raw.get(k))
                    current["integrations_enabled"] = enabled
            if "integration_credentials" in incoming_general:
                allow_db_secrets = bool(os.environ.get("ALLOW_DB_SECRETS") in {"1", "true", "yes"} or getattr(django_settings, "ALLOW_DB_SECRETS", False))
                if not allow_db_secrets:
                    return Response({"general": {"integration_credentials": ["Server does not allow saving secrets in DB. Set env ALLOW_DB_SECRETS=1."]}}, status=status.HTTP_400_BAD_REQUEST)
                raw = incoming_general.get("integration_credentials")
                if not isinstance(raw, dict):
                    return Response({"general": {"integration_credentials": ["integration_credentials must be an object."]}}, status=status.HTTP_400_BAD_REQUEST)
                existing = dict(current.get("integration_credentials") or defaults["general"].get("integration_credentials") or {})
                for k in ["stripe_secret_key", "sendgrid_api_key", "twilio_account_sid", "twilio_auth_token", "google_maps_api_key"]:
                    if k in raw:
                        existing[k] = str(raw.get(k) or "").strip()
                current["integration_credentials"] = existing
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
                current["session_timeout_minutes"] = max(0, min(24 * 60, n))
            if "ip_whitelisting" in incoming_security:
                current["ip_whitelisting"] = bool(incoming_security.get("ip_whitelisting"))
            if "ip_whitelist" in incoming_security:
                raw = incoming_security.get("ip_whitelist")
                if isinstance(raw, str):
                    parts = [p.strip() for p in raw.replace("\n", ",").split(",")]
                    current["ip_whitelist"] = [p for p in parts if p]
                elif isinstance(raw, list):
                    cleaned = []
                    for item in raw:
                        if not isinstance(item, str):
                            continue
                        v = item.strip()
                        if v:
                            cleaned.append(v)
                    current["ip_whitelist"] = cleaned
                elif raw is None:
                    current["ip_whitelist"] = []
            if "password_policy" in incoming_security:
                current["password_policy"] = str(incoming_security.get("password_policy") or "").strip() or defaults["security"]["password_policy"]
            if current.get("ip_whitelisting") and not (current.get("ip_whitelist") or []):
                return Response({"security": {"ip_whitelist": ["Add at least one IP before enabling IP whitelisting."]}}, status=status.HTTP_400_BAD_REQUEST)
            obj.security = current

        obj.updated_by = request.user
        obj.save(update_fields=["general", "notifications", "security", "updated_at", "updated_by"])
        cache.delete("admin_platform_settings:global")
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
        creds = general.get("integration_credentials") if isinstance(general.get("integration_credentials"), dict) else dict(defaults["general"]["integration_credentials"])
        general.pop("integration_credentials", None)
        general["integration_credentials_set"] = {
            "stripe_secret_key_set": bool(str(creds.get("stripe_secret_key") or "").strip()),
            "sendgrid_api_key_set": bool(str(creds.get("sendgrid_api_key") or "").strip()),
            "twilio_account_sid_set": bool(str(creds.get("twilio_account_sid") or "").strip()),
            "twilio_auth_token_set": bool(str(creds.get("twilio_auth_token") or "").strip()),
            "google_maps_api_key_set": bool(str(creds.get("google_maps_api_key") or "").strip()),
        }
        return Response(
            {
                "general": general,
                "notifications": notifications,
                "security": security,
                "integrations": self._integrations(),
                "updated_at": obj.updated_at,
            }
        )


class AdminIntegrationTestView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request, key: str):
        key = (key or "").strip().lower()
        if key not in {"stripe_payments", "sendgrid_email", "twilio_sms", "google_maps"}:
            return Response({"detail": "Unknown integration."}, status=status.HTTP_400_BAD_REQUEST)

        defaults = admin_platform_settings_defaults()
        obj, _ = AdminPlatformSettings.objects.get_or_create(key="global")
        general = {**defaults["general"], **(obj.general or {})}
        enabled_map = general.get("integrations_enabled") if isinstance(general.get("integrations_enabled"), dict) else dict(defaults["general"]["integrations_enabled"])
        enabled = bool(enabled_map.get(key, True))
        if not enabled:
            return Response({"key": key, "enabled": False, "connected": False, "details": "Disabled in platform settings."})

        creds = general.get("integration_credentials") if isinstance(general.get("integration_credentials"), dict) else dict(defaults["general"]["integration_credentials"])

        stripe_key = str(creds.get("stripe_secret_key") or "").strip() or str(getattr(django_settings, "STRIPE_SECRET_KEY", "") or getattr(django_settings, "STRIPE_API_KEY", "") or "").strip()
        sendgrid_key = str(creds.get("sendgrid_api_key") or "").strip() or str(getattr(django_settings, "SENDGRID_API_KEY", "") or "").strip()
        twilio_sid = str(creds.get("twilio_account_sid") or "").strip() or str(getattr(django_settings, "TWILIO_ACCOUNT_SID", "") or "").strip()
        twilio_token = str(creds.get("twilio_auth_token") or "").strip() or str(getattr(django_settings, "TWILIO_AUTH_TOKEN", "") or "").strip()
        gmaps_key = str(creds.get("google_maps_api_key") or "").strip() or str(getattr(django_settings, "GOOGLE_MAPS_API_KEY", "") or "").strip()

        def _json(url: str, headers: dict | None = None):
            req = urllib.request.Request(url, headers=headers or {}, method="GET")
            try:
                with urllib.request.urlopen(req, timeout=10) as resp:
                    raw = resp.read().decode("utf-8")
                    return resp.getcode(), json.loads(raw) if raw else None
            except urllib.error.HTTPError as e:
                try:
                    raw = e.read().decode("utf-8")
                    return int(getattr(e, "code", 0) or 0), json.loads(raw) if raw else None
                except Exception:
                    return int(getattr(e, "code", 0) or 0), None
            except Exception:
                return 0, None

        if key == "stripe_payments":
            if not stripe_key:
                return Response({"key": key, "enabled": True, "connected": False, "details": "Missing Stripe secret key."})
            auth = base64.b64encode(f"{stripe_key}:".encode("utf-8")).decode("utf-8")
            code, data = _json("https://api.stripe.com/v1/account", headers={"Authorization": f"Basic {auth}"})
            if code == 200 and isinstance(data, dict) and data.get("id"):
                return Response({"key": key, "enabled": True, "connected": True, "details": f"Stripe OK (account {data.get('id')})."})
            if code in {401, 403}:
                return Response({"key": key, "enabled": True, "connected": False, "details": "Stripe auth failed (invalid key or permissions)."})
            return Response({"key": key, "enabled": True, "connected": False, "details": f"Stripe test failed (status {code})."})

        if key == "sendgrid_email":
            if not sendgrid_key:
                return Response({"key": key, "enabled": True, "connected": False, "details": "Missing SendGrid API key."})
            code, data = _json("https://api.sendgrid.com/v3/user/account", headers={"Authorization": f"Bearer {sendgrid_key}"})
            if code == 200:
                return Response({"key": key, "enabled": True, "connected": True, "details": "SendGrid OK."})
            if code in {401, 403}:
                return Response({"key": key, "enabled": True, "connected": False, "details": "SendGrid auth failed (invalid key or permissions)."})
            return Response({"key": key, "enabled": True, "connected": False, "details": f"SendGrid test failed (status {code})."})

        if key == "twilio_sms":
            if not (twilio_sid and twilio_token):
                return Response({"key": key, "enabled": True, "connected": False, "details": "Missing Twilio Account SID/Auth Token."})
            auth = base64.b64encode(f"{twilio_sid}:{twilio_token}".encode("utf-8")).decode("utf-8")
            code, data = _json(f"https://api.twilio.com/2010-04-01/Accounts/{urllib.parse.quote(twilio_sid)}.json", headers={"Authorization": f"Basic {auth}"})
            if code == 200:
                return Response({"key": key, "enabled": True, "connected": True, "details": "Twilio OK."})
            if code in {401, 403}:
                return Response({"key": key, "enabled": True, "connected": False, "details": "Twilio auth failed (invalid SID/token or permissions)."})
            return Response({"key": key, "enabled": True, "connected": False, "details": f"Twilio test failed (status {code})."})

        if not gmaps_key:
            return Response({"key": key, "enabled": True, "connected": False, "details": "Missing Google Maps API key."})
        url = f"https://maps.googleapis.com/maps/api/geocode/json?{urllib.parse.urlencode({'address': 'New York', 'key': gmaps_key})}"
        code, data = _json(url)
        status_val = (data or {}).get("status") if isinstance(data, dict) else None
        if code == 200 and status_val in {"OK", "ZERO_RESULTS"}:
            return Response({"key": key, "enabled": True, "connected": True, "details": f"Google Maps OK ({status_val})."})
        if status_val in {"REQUEST_DENIED", "INVALID_REQUEST"}:
            msg = (data or {}).get("error_message") if isinstance(data, dict) else ""
            return Response({"key": key, "enabled": True, "connected": False, "details": f"Google Maps denied. {msg}".strip()})
        return Response({"key": key, "enabled": True, "connected": False, "details": f"Google Maps test failed (status {code})."})


class AdminNotificationTestView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request):
        channel = str(request.data.get("channel") or "").strip().lower()
        if channel not in {"email", "sms", "push", "in_app"}:
            return Response({"detail": "channel must be one of: in_app, email, sms, push."}, status=status.HTTP_400_BAD_REQUEST)

        defaults = admin_platform_settings_defaults()
        obj, _ = AdminPlatformSettings.objects.get_or_create(key="global")
        notifications = {**defaults["notifications"], **(obj.notifications or {})}
        general = {**defaults["general"], **(obj.general or {})}
        enabled_map = general.get("integrations_enabled") if isinstance(general.get("integrations_enabled"), dict) else dict(defaults["general"]["integrations_enabled"])
        creds = general.get("integration_credentials") if isinstance(general.get("integration_credentials"), dict) else dict(defaults["general"]["integration_credentials"])

        if channel == "email":
            if not bool(notifications.get("email_notifications")):
                return Response({"ok": False, "detail": "Email notifications are disabled in platform settings."}, status=status.HTTP_400_BAD_REQUEST)
            to_email = (getattr(request.user, "email", "") or "").strip()
            if not to_email:
                return Response({"ok": False, "detail": "Current user has no email address."}, status=status.HTTP_400_BAD_REQUEST)
            try:
                send_mail(
                    subject="Vehsl notification test",
                    message="This is a test email from Vehsl admin settings.",
                    from_email=getattr(django_settings, "DEFAULT_FROM_EMAIL", None) or "no-reply@vehsl.local",
                    recipient_list=[to_email],
                    fail_silently=False,
                )
            except Exception as e:
                return Response({"ok": False, "detail": f"Email send failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
            return Response({"ok": True, "detail": f"Test email sent to {to_email}."})

        if channel == "sms":
            if not bool(notifications.get("sms_alerts")):
                return Response({"ok": False, "detail": "SMS alerts are disabled in platform settings."}, status=status.HTTP_400_BAD_REQUEST)
            if not bool(enabled_map.get("twilio_sms", True)):
                return Response({"ok": False, "detail": "Twilio SMS is disabled in platform settings."}, status=status.HTTP_400_BAD_REQUEST)
            to_phone = str(request.data.get("to") or getattr(request.user, "phone", "") or "").strip()
            if not to_phone:
                return Response({"ok": False, "detail": "Provide 'to' or set a phone number on your account."}, status=status.HTTP_400_BAD_REQUEST)
            if not re.match(r"^\+?[1-9]\d{7,14}$", to_phone.replace(" ", "")):
                return Response({"ok": False, "detail": "Phone must be a valid E.164 number."}, status=status.HTTP_400_BAD_REQUEST)

            sid = str(creds.get("twilio_account_sid") or "").strip() or str(getattr(django_settings, "TWILIO_ACCOUNT_SID", "") or "").strip()
            token = str(creds.get("twilio_auth_token") or "").strip() or str(getattr(django_settings, "TWILIO_AUTH_TOKEN", "") or "").strip()
            from_phone = str(getattr(django_settings, "TWILIO_FROM_NUMBER", "") or os.environ.get("TWILIO_FROM_NUMBER") or "").strip()
            if not (sid and token and from_phone):
                return Response({"ok": False, "detail": "Twilio not configured (needs SID, auth token, TWILIO_FROM_NUMBER)."}, status=status.HTTP_400_BAD_REQUEST)

            body = str(request.data.get("message") or "Vehsl SMS test message").strip()
            payload = urllib.parse.urlencode({"To": to_phone, "From": from_phone, "Body": body}).encode("utf-8")
            auth = base64.b64encode(f"{sid}:{token}".encode("utf-8")).decode("utf-8")
            url = f"https://api.twilio.com/2010-04-01/Accounts/{urllib.parse.quote(sid)}/Messages.json"
            req = urllib.request.Request(url, data=payload, headers={"Authorization": f"Basic {auth}", "Content-Type": "application/x-www-form-urlencoded"}, method="POST")
            try:
                with urllib.request.urlopen(req, timeout=10) as resp:
                    resp_body = resp.read().decode("utf-8")
                    data = json.loads(resp_body) if resp_body else {}
                    sid_out = (data or {}).get("sid") if isinstance(data, dict) else None
                    return Response({"ok": True, "detail": f"Test SMS queued via Twilio{f' (sid {sid_out})' if sid_out else ''}."})
            except urllib.error.HTTPError as e:
                raw = ""
                try:
                    raw = e.read().decode("utf-8")
                except Exception:
                    raw = ""
                return Response({"ok": False, "detail": f"Twilio send failed (status {getattr(e, 'code', '')}): {raw or 'error'}"}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({"ok": False, "detail": f"Twilio send failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        if channel == "push":
            if not bool(notifications.get("push_notifications")):
                return Response({"ok": False, "detail": "Push notifications are disabled in platform settings."}, status=status.HTTP_400_BAD_REQUEST)
            Notification.objects.create(
                user=request.user,
                channel=Notification.Channel.PUSH,
                event_type="push_test",
                payload={"title": "Push test", "body": "This is a push test notification."},
                status=Notification.Status.SENT,
                sent_at=timezone.now(),
            )
            return Response({"ok": True, "detail": "Push test created (in-app push placeholder)."})

        return Response({"ok": True, "detail": "In-app notifications are supported."})


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
        activity_page_raw = (request.query_params.get("activity_page") or "").strip()
        activity_page_size_raw = (request.query_params.get("activity_page_size") or "").strip()
        alerts_page_raw = (request.query_params.get("alerts_page") or "").strip()
        alerts_page_size_raw = (request.query_params.get("alerts_page_size") or "").strip()

        try:
            activity_page = max(1, int(activity_page_raw or "1"))
        except Exception:
            activity_page = 1
        try:
            activity_page_size = max(10, min(200, int(activity_page_size_raw or "80")))
        except Exception:
            activity_page_size = 80
        try:
            alerts_page = max(1, int(alerts_page_raw or "1"))
        except Exception:
            alerts_page = 1
        try:
            alerts_page_size = max(5, min(50, int(alerts_page_size_raw or "20")))
        except Exception:
            alerts_page_size = 20

        ttl = 45
        try:
            ttl = int(getattr(django_settings, "ADMIN_OVERVIEW_CACHE_TTL", 45) or 45)
        except Exception:
            ttl = 45
        ttl = max(5, min(300, ttl))

        cache_key = (
            f"admin_overview:v3:"
            f"period={period}:"
            f"ap={activity_page}:aps={activity_page_size}:"
            f"lp={alerts_page}:lps={alerts_page_size}"
        )
        cached = cache.get(cache_key)
        if isinstance(cached, dict) and cached:
            return Response(cached)
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
            from apps.orders.models import Dispute, ReleaseCondition
        except Exception:
            Dispute = None
            ReleaseCondition = None
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

        used_payments_for_revenue = False
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

            if payments_curr.exists() or payments_prev.exists():
                used_payments_for_revenue = True
                curr_agg = payments_curr.aggregate(
                    total=Coalesce(Sum("amount"), dec0),
                    b2b=Coalesce(
                        Sum(Case(b2b_when, default=dec0, output_field=DecimalField(max_digits=14, decimal_places=2))),
                        dec0,
                    ),
                    b2c=Coalesce(
                        Sum(Case(b2c_when, default=dec0, output_field=DecimalField(max_digits=14, decimal_places=2))),
                        dec0,
                    ),
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

        if not used_payments_for_revenue and Order is not None:
            orders_base = (
                Order.objects.filter(deleted_at__isnull=True)
                .select_related("buyer", "buyer__buyer_profile", "buyer__profile")
                .exclude(status__in=[Order.Status.CANCELLED, Order.Status.REJECTED])
                .exclude(payment_status=Order.PaymentStatus.UNPAID)
            )
            orders_curr = orders_base.filter(created_at__gte=start, created_at__lt=now)
            orders_prev = orders_base.filter(created_at__gte=prev_start, created_at__lt=prev_end)

            b2b_ord_when = When(order__buyer__buyer_profile__business_type__gt="", then=F("amount"))
            b2c_ord_when = When(
                Q(order__buyer__buyer_profile__business_type="") | Q(order__buyer__buyer_profile__business_type__isnull=True),
                then=F("amount"),
            )

            curr_agg = orders_curr.aggregate(
                total=Coalesce(Sum("total_amount"), dec0),
                b2b=Coalesce(
                    Sum(Case(When(buyer__buyer_profile__business_type__gt="", then=F("total_amount")), default=dec0, output_field=DecimalField(max_digits=14, decimal_places=2))),
                    dec0,
                ),
            )
            prev_agg = orders_prev.aggregate(total=Coalesce(Sum("total_amount"), dec0))

            revenue_total = float(curr_agg["total"] or 0)
            revenue_b2b = float(curr_agg["b2b"] or 0)
            revenue_b2c = max(revenue_total - revenue_b2b, 0.0)
            revenue_change_pct = self._pct_change(float(curr_agg["total"] or 0), float(prev_agg["total"] or 0))

            trunc, kind = self._bucket_trunc(period)
            series = (
                orders_curr.annotate(bucket=trunc)
                .values("bucket")
                .annotate(
                    b2b=Coalesce(
                        Sum(
                            Case(
                                When(buyer__buyer_profile__business_type__gt="", then=F("total_amount")),
                                default=dec0,
                                output_field=DecimalField(max_digits=14, decimal_places=2),
                            )
                        ),
                        dec0,
                    ),
                    total=Coalesce(Sum("total_amount"), dec0),
                )
                .order_by("bucket")
            )
            revenue_points = [
                {"label": self._label_bucket(row.get("bucket"), kind), "b2b": float(row.get("b2b") or 0), "b2c": max(float(row.get("total") or 0) - float(row.get("b2b") or 0), 0.0)}
                for row in series
            ]
            revenue_points = self._downsample(revenue_points, max_points=7) or [{"label": "", "b2b": 0.0, "b2c": 0.0}]

        active_orders_total = 0
        active_orders_b2b = 0
        active_orders_b2c = 0
        active_orders_change_pct = 0.0
        orders_sparkline: list[float] = []
        active_orders_snapshot_total = 0
        active_orders_snapshot_b2b = 0
        active_orders_snapshot_b2c = 0

        if Order is not None:
            active_status_exclude = [
                Order.Status.DELIVERED,
                Order.Status.COMPLETED,
                Order.Status.CANCELLED,
                Order.Status.REJECTED,
            ]
            orders_active_snapshot = Order.objects.filter(deleted_at__isnull=True).exclude(status__in=active_status_exclude)
            active_orders_snapshot_total = orders_active_snapshot.count()
            active_orders_snapshot_b2b = orders_active_snapshot.filter(buyer__buyer_profile__business_type__gt="").count()
            active_orders_snapshot_b2c = max(active_orders_snapshot_total - active_orders_snapshot_b2b, 0)

            orders_active_curr = (
                Order.objects.filter(deleted_at__isnull=True, created_at__gte=start, created_at__lt=now)
                .exclude(status__in=active_status_exclude)
            )
            orders_active_prev = (
                Order.objects.filter(deleted_at__isnull=True, created_at__gte=prev_start, created_at__lt=prev_end)
                .exclude(status__in=active_status_exclude)
            )

            active_orders_total = orders_active_curr.count()
            active_orders_change_pct = self._pct_change(active_orders_total, orders_active_prev.count())

            active_orders_b2b = orders_active_curr.filter(buyer__buyer_profile__business_type__gt="").count()
            active_orders_b2c = max(active_orders_total - active_orders_b2b, 0)

            trunc, kind = self._bucket_trunc(period)
            order_series = (
                orders_active_curr.annotate(bucket=trunc)
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
        users_online_snapshot_total = 0
        users_online_snapshot_buyers = 0
        users_online_snapshot_sellers = 0
        users_online_snapshot_workers = 0

        active_users_curr = User.objects.filter(last_login__isnull=False, last_login__gte=start, last_login__lt=now)
        active_users_prev = User.objects.filter(last_login__isnull=False, last_login__gte=prev_start, last_login__lt=prev_end)

        users_online_total = active_users_curr.count()
        users_online_change_abs = users_online_total - active_users_prev.count()
        users_online_buyers = active_users_curr.filter(Q(account_type=User.AccountType.BUYER) | Q(role=User.Role.BUYER)).count()
        users_online_sellers = active_users_curr.filter(Q(account_type=User.AccountType.SELLER) | Q(role=User.Role.SELLER)).count()
        users_online_workers = active_users_curr.filter(
            (Q(role=User.Role.ADMIN) | Q(is_staff=True))
            & Q(admin_profile__admin_role__in=[AdminProfile.AdminRole.LOGISTICS, AdminProfile.AdminRole.INSPECTOR])
        ).count()

        online_window = now - timedelta(minutes=15)
        online_now_qs = User.objects.filter(last_login__gte=online_window)
        users_online_snapshot_total = online_now_qs.count()
        users_online_snapshot_buyers = online_now_qs.filter(Q(account_type=User.AccountType.BUYER) | Q(role=User.Role.BUYER)).count()
        users_online_snapshot_sellers = online_now_qs.filter(Q(account_type=User.AccountType.SELLER) | Q(role=User.Role.SELLER)).count()
        users_online_snapshot_workers = online_now_qs.filter(
            (Q(role=User.Role.ADMIN) | Q(is_staff=True))
            & Q(admin_profile__admin_role__in=[AdminProfile.AdminRole.LOGISTICS, AdminProfile.AdminRole.INSPECTOR])
        ).count()

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

        if (QualityInspection is None or quality_inspections == 0) and Order is not None:
            rated_curr = 0
            rated_prev = 0
            avg_curr = 0.0
            avg_prev = 0.0
            try:
                lr_base = ListingRequest.objects.filter(rating__isnull=False)
                lr_curr = lr_base.filter(updated_at__gte=start, updated_at__lt=now)
                lr_prev = lr_base.filter(updated_at__gte=prev_start, updated_at__lt=prev_end)
                rated_curr = lr_curr.count()
                rated_prev = lr_prev.count()
                avg_curr = float(lr_curr.aggregate(avg=Coalesce(Avg("rating"), Value(0.0)))["avg"] or 0.0)
                avg_prev = float(lr_prev.aggregate(avg=Coalesce(Avg("rating"), Value(0.0)))["avg"] or 0.0)
            except Exception:
                rated_curr = 0

            if rated_curr == 0:
                try:
                    prod_base = Product.objects.filter(deleted_at__isnull=True, vehsl_rating__isnull=False)
                    prod_curr = prod_base.filter(updated_at__gte=start, updated_at__lt=now)
                    prod_prev = prod_base.filter(updated_at__gte=prev_start, updated_at__lt=prev_end)
                    rated_curr = prod_curr.count()
                    rated_prev = prod_prev.count()
                    avg_curr = float(prod_curr.aggregate(avg=Coalesce(Avg("vehsl_rating"), Value(0.0)))["avg"] or 0.0)
                    avg_prev = float(prod_prev.aggregate(avg=Coalesce(Avg("vehsl_rating"), Value(0.0)))["avg"] or 0.0)
                except Exception:
                    rated_curr = 0
                    avg_curr = 0.0
                    avg_prev = 0.0

            quality_inspections = int(rated_curr or 0)
            quality_score = max(0.0, min(100.0, (avg_curr / 5.0) * 100.0)) if rated_curr else 0.0
            prev_score = max(0.0, min(100.0, (avg_prev / 5.0) * 100.0)) if rated_prev else 0.0
            quality_change_pct = self._pct_change(quality_score, prev_score)
            quality_sparkline = quality_sparkline or [quality_score]

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

        try:
            pending_products = Product.objects.filter(deleted_at__isnull=True, status=Product.Status.PENDING).count()
        except Exception:
            pending_products = 0
        if pending_products:
            alerts.append(
                {
                    "type": "warning",
                    "message": f"{pending_products} products pending approval",
                    "action": "Review listings",
                    "path": "/admin/management/listings?status=pending",
                    "occurred_at": now,
                }
            )

        try:
            rejected_products = Product.objects.filter(deleted_at__isnull=True, status=Product.Status.REJECTED).count()
        except Exception:
            rejected_products = 0
        try:
            rejected_with_reason = Product.objects.filter(
                deleted_at__isnull=True, status=Product.Status.REJECTED, detail_config__review__rejection_reason__gt=""
            ).count()
        except Exception:
            rejected_with_reason = 0
        if rejected_products:
            suffix = f" ({rejected_with_reason} w/ reason)" if rejected_with_reason else ""
            alerts.append(
                {
                    "type": "info",
                    "message": f"{rejected_products} rejected listings need seller action{suffix}",
                    "action": "View rejected",
                    "path": "/admin/management/listings?status=rejected",
                    "occurred_at": now,
                }
            )

        if Shipment is not None:
            try:
                base = Shipment.objects.filter(deleted_at__isnull=True).exclude(status=Shipment.Status.DELIVERED)
                late_shipments = base.filter(estimated_delivery_at__isnull=False, estimated_delivery_at__lt=now).count()
                late_shipments_recent = base.filter(
                    estimated_delivery_at__isnull=False,
                    estimated_delivery_at__lt=now,
                    estimated_delivery_at__gte=start,
                ).count()
            except Exception:
                late_shipments = 0
                late_shipments_recent = 0
            try:
                base = Shipment.objects.filter(deleted_at__isnull=True).exclude(status=Shipment.Status.DELIVERED)
                no_tracking = base.filter(Q(tracking_number="") | Q(tracking_number__isnull=True)).count()
                no_tracking_recent = base.filter(created_at__gte=start, created_at__lt=now).filter(
                    Q(tracking_number="") | Q(tracking_number__isnull=True)
                ).count()
            except Exception:
                no_tracking = 0
                no_tracking_recent = 0
            if late_shipments:
                extra = f" ({late_shipments_recent} became late this period)" if int(late_shipments_recent or 0) else ""
                alerts.append(
                    {
                        "type": "warning",
                        "message": f"{late_shipments} shipments are late (ETA passed){extra}",
                        "action": "Investigate",
                        "path": "/admin/logistics",
                        "occurred_at": now,
                    }
                )
            if no_tracking:
                extra = f" ({no_tracking_recent} created this period)" if int(no_tracking_recent or 0) else ""
                alerts.append(
                    {
                        "type": "warning",
                        "message": f"{no_tracking} in-flight shipments missing tracking numbers{extra}",
                        "action": "Fix tracking",
                        "path": "/admin/logistics",
                        "occurred_at": now,
                    }
                )

        if Payment is not None:
            try:
                failed_payments = Payment.objects.filter(deleted_at__isnull=True, status=Payment.Status.FAILED).count()
            except Exception:
                failed_payments = 0
            if failed_payments:
                try:
                    failed_recent = Payment.objects.filter(
                        deleted_at__isnull=True,
                        status=Payment.Status.FAILED,
                        created_at__gte=start,
                        created_at__lt=now,
                    ).count()
                except Exception:
                    failed_recent = 0
                extra = f" ({failed_recent} failed this period)" if int(failed_recent or 0) else ""
                alerts.append(
                    {
                        "type": "warning",
                        "message": f"{failed_payments} payments failed{extra}",
                        "action": "Review",
                        "path": f"/admin/management/costs?period={period}",
                        "occurred_at": now,
                    }
                )

        if Dispute is not None:
            try:
                open_states = [Dispute.Status.OPEN, Dispute.Status.MEDIATION, Dispute.Status.ESCALATED]
                open_disputes = Dispute.objects.filter(deleted_at__isnull=True, status__in=open_states).count()
                opened_recent = Dispute.objects.filter(
                    deleted_at__isnull=True,
                    status__in=open_states,
                    opened_at__gte=start,
                    opened_at__lt=now,
                ).count()
            except Exception:
                open_disputes = 0
                opened_recent = 0
            if open_disputes:
                extra = f" ({opened_recent} opened this period)" if int(opened_recent or 0) else ""
                alerts.append(
                    {
                        "type": "warning",
                        "message": f"{open_disputes} disputes need attention{extra}",
                        "action": "Open disputes",
                        "path": "/admin/legal/disputes",
                        "occurred_at": now,
                    }
                )

        try:
            from apps.catalog.models import Category, ComplianceRule
        except Exception:
            Category = None
            ComplianceRule = None

        if Category is not None:
            try:
                categories_total = Category.objects.filter(deleted_at__isnull=True).count()
            except Exception:
                categories_total = 0
            if categories_total == 0:
                alerts.append(
                    {
                        "type": "warning",
                        "message": "No categories found (catalog is empty)",
                        "action": "Add categories",
                        "path": "/admin/products",
                        "occurred_at": now,
                    }
                )
            else:
                if ComplianceRule is not None:
                    try:
                        top_ids = list(
                            Category.objects.filter(deleted_at__isnull=True).order_by("id").values_list("id", flat=True)[:5]
                        )
                        rules_count = ComplianceRule.objects.filter(deleted_at__isnull=True, category_id__in=top_ids).count() if top_ids else 0
                        if top_ids and rules_count == 0:
                            alerts.append(
                                {
                                    "type": "info",
                                    "message": "No compliance rules configured for top categories",
                                    "action": "Configure",
                                    "path": "/admin/legal/trade-compliance",
                                    "occurred_at": now,
                                }
                            )
                    except Exception:
                        pass

        try:
            no_images_products = (
                Product.objects.filter(deleted_at__isnull=True)
                .exclude(status=Product.Status.ARCHIVED)
                .annotate(
                    img_count=Count(
                        "media",
                        filter=Q(media__deleted_at__isnull=True, media__media_type=ProductMedia.MediaType.IMAGE),
                        distinct=True,
                    )
                )
                .filter(img_count=0)
                .count()
            )
        except Exception:
            no_images_products = 0
        if no_images_products:
            alerts.append(
                {
                    "type": "info",
                    "message": f"{no_images_products} products have no images",
                    "action": "Fix media",
                    "path": "/admin/management/listings",
                    "occurred_at": now,
                }
            )

        if not alerts:
            alerts.append(
                {
                    "type": "info",
                    "message": "No urgent alerts right now. Review listing pipeline and ship status for early signals.",
                    "action": "Open dashboard",
                    "path": "/admin/management/listings",
                    "occurred_at": now,
                }
            )
        alerts_total = len(alerts)
        a_start = (alerts_page - 1) * alerts_page_size
        a_end = a_start + alerts_page_size
        alerts_has_more = a_end < alerts_total
        alerts = alerts[a_start:a_end]

        setup_guidance: list[dict] = []
        payments_total = 0
        if Payment is not None:
            try:
                payments_total = int(Payment.objects.filter(deleted_at__isnull=True).count())
            except Exception:
                payments_total = 0
        if Payment is None or payments_total == 0:
            setup_guidance.append(
                {
                    "key": "no_payments",
                    "title": "No payments found",
                    "message": "Payments integration not configured.",
                    "action": "Open settings",
                    "path": "/admin/settings",
                    "occurred_at": now,
                }
            )

        inspections_total = 0
        if QualityInspection is not None:
            try:
                inspections_total = int(QualityInspection.objects.filter(deleted_at__isnull=True).count())
            except Exception:
                inspections_total = 0
        if QualityInspection is None or inspections_total == 0:
            setup_guidance.append(
                {
                    "key": "no_inspections",
                    "title": "No inspections yet",
                    "message": "Create your first inspection workflow to start measuring quality.",
                    "action": "Open quality",
                    "path": "/admin/quality",
                    "occurred_at": now,
                }
            )

        products_total = 0
        try:
            products_total = int(Product.objects.filter(deleted_at__isnull=True).count())
        except Exception:
            products_total = 0
        if products_total == 0:
            setup_guidance.append(
                {
                    "key": "no_products",
                    "title": "No products found",
                    "message": "Seed your catalog to make the dashboard operational.",
                    "action": "Open catalog",
                    "path": "/admin/products",
                    "occurred_at": now,
                }
            )
        elif int(pending_products or 0) == 0 and products_total < 20:
            setup_guidance.append(
                {
                    "key": "no_products_pending",
                    "title": "No products pending review",
                    "message": "If the platform is new, seed the catalog or move listings to pending for approval.",
                    "action": "View listings",
                    "path": "/admin/management/listings?status=pending",
                    "occurred_at": now,
                }
            )

        activities_out: list[dict] = []
        activity_has_more = False
        try:
            off = (activity_page - 1) * activity_page_size
            logs_qs = (
                AuditLog.objects.select_related("actor")
                .filter(occurred_at__gte=start)
                .order_by("-occurred_at", "-id")
            )
            logs = list(logs_qs[off : off + activity_page_size + 1])
            if len(logs) > activity_page_size:
                activity_has_more = True
                logs = logs[:activity_page_size]

            user_target_ids: set[int] = set()
            product_ids: set[int] = set()
            listing_request_ids: set[int] = set()
            shipment_ids: set[int] = set()
            dispute_ids: set[int] = set()

            def _to_int(v: str) -> int:
                try:
                    return int(str(v or "").strip())
                except Exception:
                    return 0

            for lg in logs:
                t = (lg.target_type or "").strip().lower()
                tid = (lg.target_id or "").strip()
                if t == "user":
                    n = _to_int(tid)
                    if n:
                        user_target_ids.add(n)
                if t == "product":
                    n = _to_int(tid)
                    if n:
                        product_ids.add(n)
                if t == "listing_request":
                    n = _to_int(tid)
                    if n:
                        listing_request_ids.add(n)
                if t == "shipment":
                    n = _to_int(tid)
                    if n:
                        shipment_ids.add(n)
                if t == "dispute":
                    n = _to_int(tid)
                    if n:
                        dispute_ids.add(n)

            user_map: dict[int, User] = {u.id: u for u in User.objects.filter(id__in=list(user_target_ids))}
            product_name_map: dict[int, str] = {
                r["id"]: (r.get("name") or "").strip()
                for r in Product.objects.filter(id__in=list(product_ids)).values("id", "name")
            }
            lr_name_map: dict[int, str] = {
                r["id"]: (r.get("product_name") or "").strip()
                for r in ListingRequest.objects.filter(id__in=list(listing_request_ids)).values("id", "product_name")
            }
            shipment_map: dict[int, dict] = {}
            if shipment_ids:
                shipment_map = {
                    r["id"]: r
                    for r in Shipment.objects.filter(id__in=list(shipment_ids)).values("id", "order_id", "status", "tracking_number")
                }
            dispute_map: dict[int, dict] = {}
            if Dispute is not None and dispute_ids:
                dispute_map = {
                    r["id"]: r
                    for r in Dispute.objects.filter(id__in=list(dispute_ids)).values("id", "order_id", "status")
                }

            def _display_user(u: User | None) -> str:
                if not u:
                    return "System"
                full = f"{(u.first_name or '').strip()} {(u.last_name or '').strip()}".strip()
                return full or (u.email or u.phone or f"User #{u.id}")

            def _path_for(action: str, target_type: str) -> str:
                a = (action or "").strip().lower()
                t = (target_type or "").strip().lower()
                if t in {"shipment", "order"} or a.startswith("shipment_") or a.startswith("order_"):
                    return "/admin/logistics"
                if t in {"dispute"} or a.startswith("dispute_"):
                    return "/admin/legal/disputes"
                if t in {"listing_request", "product"} or "product" in a or "listing" in a:
                    return "/admin/management/listings"
                if "verification" in a or "kyc" in a:
                    return "/admin/verification"
                if "quality" in a or t == "quality_inspection":
                    return "/admin/quality"
                if "category" in a:
                    return "/admin/products"
                if "compliance" in a:
                    return "/admin/legal/trade-compliance"
                if t == "user":
                    return "/admin/users"
                return "/admin"

            def _action_label(action: str) -> str:
                a = (action or "").strip()
                m = {
                    "order_created": "placed order",
                    "order_status_changed": "updated order status",
                    "shipment_status_changed": "updated shipment status",
                    "shipment_tracking_updated": "updated tracking",
                    "dispute_opened": "opened dispute",
                    "dispute_resolved": "resolved dispute",
                    "dispute_status_changed": "updated dispute",
                    "seller_listing_request_submitted": "submitted listing request",
                    "seller_listing_request_stage_updated": "updated listing stage",
                    "seller_listing_request_published": "published listing",
                    "seller_product_created": "created product",
                    "seller_verification_approved": "approved seller verification",
                    "seller_verification_rejected": "rejected seller verification",
                    "admin_product_approved": "approved product",
                    "admin_product_rejected": "rejected product",
                    "admin_product_activated": "activated product",
                    "admin_product_updated": "updated product",
                    "admin_quality_inspection_created": "created inspection",
                }
                if a in m:
                    return m[a]
                return a.replace("_", " ").replace("-", " ").strip() or "updated"

            def _target_label(lg: AuditLog) -> str:
                t = (lg.target_type or "").strip().lower()
                tid = (lg.target_id or "").strip()
                payload = lg.payload if isinstance(lg.payload, dict) else {}
                if t == "order":
                    return f"Order #{tid}" if tid else "Order"
                if t == "shipment":
                    sid = _to_int(tid)
                    sh = shipment_map.get(sid) if sid else None
                    tr = (sh.get("tracking_number") if sh else "") or ""
                    return (f"Shipment #{tid}" + (f" ({tr})" if tr else "")).strip()
                if t == "dispute":
                    did = _to_int(tid)
                    dp = dispute_map.get(did) if did else None
                    oid = str((dp or {}).get("order_id") or "")
                    if oid:
                        return f"Order #{oid}"
                    return f"Dispute #{tid}" if tid else "Dispute"
                if t == "product":
                    pid = _to_int(tid)
                    name = (payload.get("product_name") or "") or (product_name_map.get(pid) if pid else "")
                    name = (name or "").strip()
                    return name or (f"Product #{tid}" if tid else "Product")
                if t == "listing_request":
                    lid = _to_int(tid)
                    name = (payload.get("product_name") or "") or (lr_name_map.get(lid) if lid else "")
                    name = (name or "").strip()
                    return name or (f"Listing Request #{tid}" if tid else "Listing Request")
                if t == "user":
                    uid = _to_int(tid)
                    u = user_map.get(uid) if uid else None
                    return _display_user(u) if u else (f"User #{tid}" if tid else "User")
                if t == "category":
                    name = str(payload.get("name") or "").strip()
                    return name or (f"Category #{tid}" if tid else "Category")
                if t == "compliance_rule":
                    return f"Compliance Rule #{tid}" if tid else "Compliance Rule"
                if t == "quality_inspection":
                    return f"Inspection #{tid}" if tid else "Inspection"
                return f"{(lg.target_type or '').strip() or 'Item'} #{tid}".strip()

            out = []
            for lg in logs[:60]:
                actor = getattr(lg, "actor", None)
                out.append(
                    {
                        "id": f"audit-{lg.id}",
                        "user": _display_user(actor),
                        "action": _action_label(lg.action),
                        "target": _target_label(lg),
                        "avatar": self._avatar(actor),
                        "occurred_at": lg.occurred_at,
                        "path": _path_for(lg.action, lg.target_type),
                    }
                )
            activities_out = out
        except Exception:
            activities_out = []

        pipelines: dict = {}
        if Order is not None:
            base_orders = Order.objects.filter(deleted_at__isnull=True)
            status_rows = list(base_orders.values("status").annotate(count=Count("id")).order_by())
            status_map = {r.get("status"): int(r.get("count") or 0) for r in status_rows}

            active_exclude = {Order.Status.DELIVERED, Order.Status.COMPLETED, Order.Status.CANCELLED, Order.Status.REJECTED}
            active_orders = base_orders.exclude(status__in=list(active_exclude))
            overdue = active_orders.filter(deadline_at__isnull=False, deadline_at__lt=now).count()
            disputed = base_orders.filter(status=Order.Status.DISPUTED).count()
            avg_age_hours = 0.0
            try:
                createds = list(active_orders.values_list("created_at", flat=True)[:2000])
                if createds:
                    avg_age_hours = sum((now - dt).total_seconds() for dt in createds if dt) / float(len(createds)) / 3600.0
            except Exception:
                avg_age_hours = 0.0

            aging = {}
            for s in [Order.Status.CREATED, Order.Status.ACCEPTED, Order.Status.SHIPPED, Order.Status.DISPUTED]:
                qs = base_orders.filter(status=s)
                oldest = qs.aggregate(v=Min("created_at")).get("v")
                if oldest:
                    aging[s] = round((now - oldest).total_seconds() / 86400.0, 2)
                else:
                    aging[s] = 0.0

            pipelines["orders"] = {
                "counts": {k: status_map.get(k, 0) for k, _ in Order.Status.choices},
                "active_total": active_orders.count(),
                "overdue_deadline": int(overdue),
                "disputed_total": int(disputed),
                "avg_age_hours_active": round(float(avg_age_hours), 2),
                "oldest_days_by_status": aging,
            }

        pipelines["sellers"] = {
            "pending_verifications": int(SellerProfile.objects.filter(verification_status=SellerProfile.VerificationStatus.PENDING).count()),
            "rejected_verifications": int(SellerProfile.objects.filter(verification_status=SellerProfile.VerificationStatus.REJECTED).count()),
            "pending_kyc_docs": int(
                KycDocument.objects.filter(review_status__in=[KycDocument.ReviewStatus.PENDING, KycDocument.ReviewStatus.UNDER_REVIEW]).count()
            ),
            "expiring_docs_30d": int(
                KycDocument.objects.filter(
                    kind=KycDocument.Kind.DRIVING_LICENSE,
                    expires_at__isnull=False,
                    expires_at__lte=(now + timedelta(days=30)).date(),
                ).count()
            ),
        }

        try:
            # New "Right Flow" ListingRequest stages
            lr_base = ListingRequest.objects.all()
            lr_stage_counts = lr_base.values("stage").annotate(count=Count("id"))
            lr_stages = {row["stage"]: row["count"] for row in lr_stage_counts}

            products_base = Product.objects.filter(deleted_at__isnull=True).exclude(status=Product.Status.ARCHIVED)
            pending_products = products_base.filter(status=Product.Status.PENDING).count()
            rejected_products = products_base.filter(status=Product.Status.REJECTED).count()
            
            missing_hs_code = products_base.filter(Q(hs_code="") | Q(hs_code__isnull=True)).count()
            missing_images = (
                products_base.annotate(
                    img_count=Count(
                        "media",
                        filter=Q(media__deleted_at__isnull=True, media__media_type=ProductMedia.MediaType.IMAGE),
                        distinct=True,
                    )
                )
                .filter(img_count=0)
                .count()
            )
            missing_docs = (
                products_base.annotate(
                    doc_count=Count(
                        "media",
                        filter=Q(media__deleted_at__isnull=True, media__media_type=ProductMedia.MediaType.DOCUMENT),
                        distinct=True,
                    )
                )
                .filter(doc_count=0)
                .count()
            )
        except Exception:
            lr_stages = {}
            pending_products = 0
            rejected_products = 0
            missing_hs_code = 0
            missing_images = 0
            missing_docs = 0

        pipelines["listings"] = {
            "pending_products": int(pending_products),
            "rejected_products": int(rejected_products),
            "missing_hs_code": int(missing_hs_code),
            "missing_images": int(missing_images),
            "missing_documents": int(missing_docs),
            # New flow stages
            "samples": int(lr_stages.get("samples", 0)),
            "compliance": int(lr_stages.get("compliance", 0)),
            "inspection": int(lr_stages.get("inspection", 0)),
            "inbound": int(lr_stages.get("inbound", 0)),
            "live": int(lr_stages.get("live", 0)),
            "done": int(lr_stages.get("done", 0)),
        }

        if Shipment is not None:
            ship_base = Shipment.objects.filter(deleted_at__isnull=True)
            not_delivered = ship_base.exclude(status=Shipment.Status.DELIVERED)
            late = not_delivered.filter(estimated_delivery_at__isnull=False, estimated_delivery_at__lt=now).count()
            no_tracking = not_delivered.filter(Q(tracking_number="") | Q(tracking_number__isnull=True)).count()
            stuck = not_delivered.filter(created_at__lt=(now - timedelta(days=7))).count()
            in_transit = not_delivered.filter(
                status__in=[
                    Shipment.Status.LABEL_CREATED,
                    Shipment.Status.PICKED_UP,
                    Shipment.Status.IN_TRANSIT,
                    Shipment.Status.CUSTOMS,
                    Shipment.Status.OUT_FOR_DELIVERY,
                ]
            ).count()
            pipelines["logistics"] = {
                "in_transit": int(in_transit),
                "late_deliveries": int(late),
                "no_tracking_number": int(no_tracking),
                "stuck_7d": int(stuck),
            }

        if Payment is not None:
            pay_base = Payment.objects.filter(deleted_at__isnull=True)
            status_rows = list(pay_base.values("status").annotate(count=Count("id")).order_by())
            status_map = {r.get("status"): int(r.get("count") or 0) for r in status_rows}
            held_amount = float(
                pay_base.filter(status=Payment.Status.HELD).aggregate(total=Coalesce(Sum("amount"), dec0)).get("total") or 0
            )
            released_amount = float(
                pay_base.filter(status=Payment.Status.RELEASED).aggregate(total=Coalesce(Sum("amount"), dec0)).get("total") or 0
            )
            failed_count = int(status_map.get(Payment.Status.FAILED, 0))
        else:
            status_map = {}
            held_amount = 0.0
            released_amount = 0.0
            failed_count = 0

        disputes_open = 0
        disputed_amount = 0.0
        if Dispute is not None:
            try:
                open_qs = Dispute.objects.filter(deleted_at__isnull=True, status__in=[Dispute.Status.OPEN, Dispute.Status.MEDIATION, Dispute.Status.ESCALATED]).select_related("order")
                disputes_open = open_qs.count()
                disputed_amount = float(
                    open_qs.aggregate(total=Coalesce(Sum("order__total_amount"), dec0)).get("total") or 0
                )
            except Exception:
                disputes_open = 0
                disputed_amount = 0.0

        release_pending = 0
        if ReleaseCondition is not None:
            try:
                release_pending = int(
                    ReleaseCondition.objects.filter(status__in=[ReleaseCondition.Status.PENDING, ReleaseCondition.Status.IN_PROGRESS]).count()
                )
            except Exception:
                release_pending = 0

        pipelines["payments"] = {
            "available": bool(Payment is not None),
            "counts": status_map,
            "held_amount": float(held_amount),
            "released_amount": float(released_amount),
            "failed_count": int(failed_count),
            "open_disputes": int(disputes_open),
            "disputed_amount": float(disputed_amount),
            "release_conditions_pending": int(release_pending),
        }

        payload = {
            "period": period,
            "hero": {
                "total_revenue": {
                    "total": revenue_total,
                    "b2b": revenue_b2b,
                    "b2c": revenue_b2c,
                    "change_pct": revenue_change_pct,
                    "sparkline": [float(p.get("b2b", 0) + p.get("b2c", 0)) for p in revenue_points] if revenue_points else [0.0],
                    "path": f"/admin/management/costs?period={period}",
                },
                "active_orders": {
                    "total": active_orders_total,
                    "b2b": active_orders_b2b,
                    "b2c": active_orders_b2c,
                    "snapshot_total": active_orders_snapshot_total,
                    "snapshot_b2b": active_orders_snapshot_b2b,
                    "snapshot_b2c": active_orders_snapshot_b2c,
                    "change_pct": active_orders_change_pct,
                    "sparkline": orders_sparkline,
                    "path": "/admin/logistics?status=label_created,picked_up,in_transit,customs,out_for_delivery",
                },
                "users_online": {
                    "total": users_online_total,
                    "buyers": users_online_buyers,
                    "sellers": users_online_sellers,
                    "workers": users_online_workers,
                    "snapshot_window_minutes": 15,
                    "snapshot_total": users_online_snapshot_total,
                    "snapshot_buyers": users_online_snapshot_buyers,
                    "snapshot_sellers": users_online_snapshot_sellers,
                    "snapshot_workers": users_online_snapshot_workers,
                    "change_abs": users_online_change_abs,
                    "sparkline": users_sparkline,
                    "path": f"/admin/users?active_period={period}",
                },
                "quality_score": {
                    "value": quality_score,
                    "inspections": quality_inspections,
                    "change_pct": quality_change_pct,
                    "sparkline": quality_sparkline,
                    "path": "/admin/quality?status=in_progress,failed",
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
            "alerts_pagination": {
                "page": alerts_page,
                "page_size": alerts_page_size,
                "has_more": bool(alerts_has_more),
                "total": int(alerts_total),
            },
            "setup_guidance": setup_guidance,
            "activity": activities_out,
            "activity_pagination": {
                "page": activity_page,
                "page_size": activity_page_size,
                "has_more": bool(activity_has_more),
            },
            "pipelines": pipelines,
        }
        cache.set(cache_key, payload, timeout=ttl)
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

        try:
            validate_password_for_platform(new_password)
        except Exception as e:
            detail = getattr(e, "detail", None)
            if isinstance(detail, (list, dict)):
                return Response({"new_password": detail}, status=status.HTTP_400_BAD_REQUEST)
            return Response({"new_password": [str(e)]}, status=status.HTTP_400_BAD_REQUEST)

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

    identity_required = 3
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
            "required_count": 2,
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

        is_required = bool(g.get("required")) and required_count > 0
        if not is_required:
            status_val = (
                "rejected"
                if any(d.review_status == KycDocument.ReviewStatus.REJECTED for d in gdocs)
                else "pending"
                if any(d.review_status in [KycDocument.ReviewStatus.PENDING, KycDocument.ReviewStatus.UNDER_REVIEW] for d in gdocs)
                else "verified"
                if uploaded_count > 0 and verified_count == uploaded_count
                else "optional"
            )
        else:
            status_val = (
                "missing"
                if not has_enough
                else "rejected"
                if any(d.review_status == KycDocument.ReviewStatus.REJECTED for d in gdocs)
                else "pending"
                if any(d.review_status in [KycDocument.ReviewStatus.PENDING, KycDocument.ReviewStatus.UNDER_REVIEW] for d in gdocs)
                else "verified"
                if has_verified_enough
                else "pending"
            )

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
                "status": status_val,
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
        qs = Notification.objects.filter(user=self.request.user).order_by("-created_at")
        since_id = (self.request.query_params.get("since_id") or "").strip()
        if since_id.isdigit():
            qs = qs.filter(id__gt=int(since_id))
        since = (self.request.query_params.get("since") or "").strip()
        if since:
            try:
                dt = datetime.fromisoformat(str(since).replace("Z", "+00:00"))
                if timezone.is_naive(dt):
                    dt = timezone.make_aware(dt, timezone=timezone.get_current_timezone())
                qs = qs.filter(created_at__gt=dt)
            except Exception:
                pass
        return qs

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
        active_period = (self.request.query_params.get("active_period") or "").strip().lower()
        if active_now in {"1", "true", "yes"}:
            window = timezone.now() - timedelta(minutes=15)
            qs = qs.filter(last_login__gte=window)
        elif active_period:
            delta = None
            if active_period == "24h":
                delta = timedelta(hours=24)
            elif active_period == "7d":
                delta = timedelta(days=7)
            elif active_period == "30d":
                delta = timedelta(days=30)
            elif active_period == "90d":
                delta = timedelta(days=90)
            if delta is not None:
                window = timezone.now() - delta
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
        try:
            validate_password_for_platform(password)
        except Exception as e:
            detail = getattr(e, "detail", None)
            if isinstance(detail, (list, dict)):
                return Response({"password": detail}, status=status.HTTP_400_BAD_REQUEST)
            return Response({"password": [str(e)]}, status=status.HTTP_400_BAD_REQUEST)

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
            new_pw = (data.get("password") or "").strip()
            try:
                validate_password_for_platform(new_pw)
            except Exception as e:
                detail = getattr(e, "detail", None)
                if isinstance(detail, (list, dict)):
                    return Response({"password": detail}, status=status.HTTP_400_BAD_REQUEST)
                return Response({"password": [str(e)]}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(new_pw)

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
        qs = self.get_queryset()

        total_users = qs.count()
        suspended = qs.filter(status=User.Status.SUSPENDED).count()
        pending_review = qs.filter(status=User.Status.ACTIVE, seller_profile__verification_status="pending").count()
        review = qs.filter(status=User.Status.ACTIVE, seller_profile__verification_status="rejected").count()
        active = (
            qs.exclude(status=User.Status.SUSPENDED)
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
        )

        # Simplified trust score calculation to avoid complex SQL errors in aggregate
        trust_qs = qs_annotated.annotate(
            ts=Case(
                When(rejected_docs__gt=0, then=Value(30)),
                When(under_review_docs__gt=0, then=Value(45)),
                When(pending_docs__gt=0, then=Value(50)),
                When(verified_docs__gt=0, then=Value(70)),
                default=Value(50),
                output_field=IntegerField(),
            )
        )
        avg_trust_base = trust_qs.aggregate(v=Avg("ts"))["v"] or 0
        avg_kyc = qs_annotated.aggregate(v=Avg("kyc_level"))["v"] or 0
        avg_trust = float(avg_trust_base) + (float(avg_kyc) * 10)

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

    def _parse_range_window(self, request):
        now = timezone.now()
        rng = (request.query_params.get("range") or request.query_params.get("time_range") or "7d").strip().lower()
        if rng == "24h":
            delta = timedelta(hours=24)
        elif rng == "30d":
            delta = timedelta(days=30)
        elif rng == "120d":
            delta = timedelta(days=120)
        elif rng == "90d":
            delta = timedelta(days=90)
        else:
            delta = timedelta(days=7)

        start_curr = now - delta
        start_prev = start_curr - delta
        return now, start_curr, start_prev, delta

    def _country_to_iso(self, raw: str) -> str:
        v = (raw or "").strip().lower()
        if not v:
            return ""
        if len(v) == 2 and v.isalpha():
            return v
        mapping = {
            "united states": "us",
            "united states of america": "us",
            "usa": "us",
            "us": "us",
            "united kingdom": "gb",
            "uk": "gb",
            "great britain": "gb",
            "uae": "ae",
            "united arab emirates": "ae",
            "germany": "de",
            "canada": "ca",
            "france": "fr",
            "japan": "jp",
            "south korea": "kr",
            "korea": "kr",
            "australia": "au",
        }
        if v in mapping:
            return mapping[v]
        if len(v) > 2:
            guess = v[:2]
            if guess.isalpha():
                return guess
        return ""

    def _tokenize_keywords(self, s: str) -> list[str]:
        if not s:
            return []
        out: list[str] = []
        buf: list[str] = []
        for ch in s.lower():
            if ch.isalnum():
                buf.append(ch)
            else:
                if buf:
                    tok = "".join(buf).strip()
                    buf = []
                    if len(tok) >= 4:
                        out.append(tok)
        if buf:
            tok = "".join(buf).strip()
            if len(tok) >= 4:
                out.append(tok)
        seen = set()
        uniq = []
        for t in out:
            if t in seen:
                continue
            seen.add(t)
            uniq.append(t)
        return uniq

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
        orders_qs = Order.objects.filter(seller=user, deleted_at__isnull=True)
        active_orders_qs = orders_qs.exclude(status__in=[Order.Status.COMPLETED, Order.Status.CANCELLED, Order.Status.REJECTED])

        total_pending = (
            active_orders_qs.filter(payment_status__in=[Order.PaymentStatus.UNPAID, Order.PaymentStatus.COD_PENDING])
            .aggregate(total=Sum("total_amount"))
            .get("total")
            or 0
        )
        last_paid = (
            orders_qs.filter(payment_status=Order.PaymentStatus.PAID)
            .order_by("-updated_at", "-id")
            .values_list("total_amount", flat=True)
            .first()
            or 0
        )
        unread_messages = (
            ChatMessage.objects.exclude(sender=user)
            .exclude(read_by__contains=[user.id])
            .filter(thread__participants__contains=[user.id], deleted_at__isnull=True)
            .count()
        )
        active_orders = active_orders_qs.count()
        
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

    def _deadline_label(self, o: Order) -> tuple[str, bool]:
        dt = getattr(o, "deadline_at", None)
        if not dt:
            return ("", False)
        now = timezone.now()
        delta = dt - now
        seconds = int(delta.total_seconds())
        if seconds <= 0:
            return ("Overdue", True)
        days = seconds // 86400
        if days >= 1:
            return (f"{days}d left", days <= 1)
        hours = seconds // 3600
        if hours >= 1:
            return (f"{hours}h left", hours <= 6)
        mins = max(1, seconds // 60)
        return (f"{mins}m left", True)

    @action(detail=False, methods=["get"])
    def orders(self, request):
        gate = self._kyc_gate(request)
        if gate is not None:
            return gate
        user = request.user
        orders = (
            Order.objects.filter(seller=user, deleted_at__isnull=True)
            .exclude(status__in=[Order.Status.COMPLETED, Order.Status.CANCELLED, Order.Status.REJECTED])
            .prefetch_related("items", "items__product", "items__product__media")
            .order_by("-created_at", "-id")[:50]
        )
        
        results = []
        for o in orders:
            item = o.items.first()
            product_name = item.product.name if item else "Unknown Product"
            image_url = ""
            if item and item.product:
                media = item.product.media.filter(media_type="image", deleted_at__isnull=True).first()
                if media:
                    image_url = (ProductMediaSerializer(media, context={"request": request}).data.get("public_url") or "").strip()

            latest_shipment = None
            try:
                latest_shipment = o.shipments.filter(deleted_at__isnull=True).order_by("-created_at", "-id").first()
            except Exception:
                latest_shipment = None

            timeline_step = 0
            production_step = 0
            if latest_shipment:
                st = getattr(latest_shipment, "status", "") or ""
                if st == Shipment.Status.PICKED_UP:
                    timeline_step = 1
                    production_step = 1
                elif st in {Shipment.Status.IN_TRANSIT, Shipment.Status.CUSTOMS, Shipment.Status.OUT_FOR_DELIVERY}:
                    timeline_step = 2
                    production_step = 2
                elif st == Shipment.Status.DELIVERED:
                    timeline_step = 3
                    production_step = 3
                else:
                    timeline_step = 0
                    production_step = 1 if st == Shipment.Status.LABEL_CREATED else 0

            deadline_label, deadline_urgent = self._deadline_label(o)
            ship_addr = o.shipping_address or {}
            city = (ship_addr.get("city") or "").strip()
            country = (ship_addr.get("country") or ship_addr.get("country_name") or "").strip()
            destination = ", ".join([p for p in [city, country] if p]) or "—"

            if o.status == Order.Status.CREATED:
                typ = "approval"
            elif o.status in {Order.Status.ACCEPTED, Order.Status.REJECTED}:
                typ = "production"
            elif o.status == Order.Status.SHIPPED:
                typ = "pickup"
            else:
                typ = "production"

            results.append({
                "id": str(o.id),
                "product": product_name,
                "image": image_url,
                "type": typ,
                "deadline": deadline_label or ("Review required" if o.status == Order.Status.CREATED else ""),
                "deadline_urgent": bool(deadline_urgent) or o.status == Order.Status.CREATED,
                "order_number": f"#VH-{o.id}",
                "qty": sum(i.quantity for i in o.items.all()),
                "unit_price": float(item.unit_price) if item else 0,
                "buyer": f"{o.buyer.first_name} {o.buyer.last_name}",
                "destination": destination,
                "shipping_method": (getattr(o, "shipping_method", "") or "").strip(),
                "shipping_cost": str(getattr(o, "shipping_cost", 0) or 0),
                "currency": (getattr(o, "currency", "") or "USD").strip().upper(),
                "production_step": production_step,
                "timeline_step": timeline_step,
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

        limit_raw = (request.query_params.get("limit") or "").strip()
        try:
            limit = int(limit_raw) if limit_raw else 20
        except Exception:
            limit = 20
        limit = max(5, min(50, limit))

        def moment_label(dt) -> str:
            if not dt:
                return ""
            now = timezone.now()
            diff = now - dt
            if diff.days > 0:
                return f"{diff.days}d ago"
            hours = diff.seconds // 3600
            if hours > 0:
                return f"{hours}h ago"
            minutes = (diff.seconds % 3600) // 60
            return f"{minutes}m ago"

        items: list[dict] = []

        notif_qs = Notification.objects.filter(user=user).order_by("-created_at", "-id")[:limit]
        for n in notif_qs:
            data = SellerActivitySerializer(n).data
            data["_ts"] = n.created_at
            items.append(data)

        order_qs = (
            Order.objects.filter(seller=user, deleted_at__isnull=True)
            .select_related("buyer")
            .prefetch_related("items", "items__product", "items__product__media", "shipments")
            .order_by("-updated_at", "-id")[: min(25, limit * 2)]
        )
        for o in order_qs:
            item = o.items.first()
            prod = getattr(item, "product", None) if item else None
            product_name = (getattr(prod, "name", "") or "").strip() or "Unknown product"
            buyer_name = f"{getattr(o.buyer, 'first_name', '')} {getattr(o.buyer, 'last_name', '')}".strip() or "Buyer"
            qty = 0
            try:
                qty = sum(int(i.quantity or 0) for i in o.items.all())
            except Exception:
                qty = 0
            order_ref = f"#VH-{o.id}"

            latest_shipment = None
            try:
                latest_shipment = o.shipments.filter(deleted_at__isnull=True).order_by("-created_at", "-id").first()
            except Exception:
                latest_shipment = None
            tracking = (getattr(latest_shipment, "tracking_number", "") or "").strip() if latest_shipment else ""

            if o.payment_status == Order.PaymentStatus.PAID and o.status in {Order.Status.DELIVERED, Order.Status.COMPLETED}:
                items.append(
                    {
                        "id": f"order-{o.id}-payment",
                        "kind": "payment",
                        "sentence": "Payment released",
                        "moment": moment_label(getattr(o, "updated_at", None) or getattr(o, "created_at", None)),
                        "tint": "#2eaa57",
                        "icon": "💸",
                        "subtitle": product_name,
                        "detail": f"Payment for {qty} units has cleared and will be deposited to your registered account.",
                        "action_kind": "none",
                        "action_label": "",
                        "order_id": int(o.id),
                        "order_ref": order_ref,
                        "product_name": product_name,
                        "client_comment": "",
                        "tracking_number": tracking,
                        "_ts": getattr(o, "updated_at", None) or getattr(o, "created_at", None),
                    }
                )
                continue

            if o.status == Order.Status.SHIPPED or (latest_shipment and getattr(latest_shipment, "status", "") in {Shipment.Status.PICKED_UP, Shipment.Status.IN_TRANSIT, Shipment.Status.OUT_FOR_DELIVERY, Shipment.Status.CUSTOMS}):
                items.append(
                    {
                        "id": f"order-{o.id}-pickup",
                        "kind": "pickup_done",
                        "sentence": "Order in transit",
                        "moment": moment_label(getattr(o, "updated_at", None) or getattr(o, "created_at", None)),
                        "tint": "rgba(26,26,26,0.6)",
                        "icon": "🚚",
                        "subtitle": product_name,
                        "detail": f"{qty} units are on the way to the buyer. Tracking {tracking or '—'}.",
                        "action_kind": "view",
                        "action_label": "View",
                        "order_id": int(o.id),
                        "order_ref": order_ref,
                        "product_name": product_name,
                        "client_comment": "",
                        "tracking_number": tracking,
                        "_ts": getattr(o, "updated_at", None) or getattr(o, "created_at", None),
                    }
                )
                continue

            if o.status == Order.Status.CREATED:
                items.append(
                    {
                        "id": f"order-{o.id}-new",
                        "kind": "platform_notice",
                        "sentence": "New order pending approval",
                        "moment": moment_label(getattr(o, "created_at", None)),
                        "tint": "#0171E3",
                        "icon": "📦",
                        "subtitle": product_name,
                        "detail": f"{buyer_name} placed an order for {qty} units. Review and accept to start production.",
                        "action_kind": "view",
                        "action_label": "View",
                        "order_id": int(o.id),
                        "order_ref": order_ref,
                        "product_name": product_name,
                        "client_comment": "",
                        "tracking_number": tracking,
                        "_ts": getattr(o, "created_at", None),
                    }
                )

        lr_qs = (
            ListingRequest.objects.filter(seller=user)
            .select_related("category")
            .order_by("-updated_at", "-id")[: min(20, limit)]
        )
        for lr in lr_qs:
            product_name = (getattr(lr, "product_name", "") or "").strip() or "Listing"
            stage = (getattr(lr, "stage", "") or "").strip()
            rating = getattr(lr, "rating", None)
            if stage in {ListingRequest.Stage.LIVE, ListingRequest.Stage.DONE} and rating is not None:
                items.append(
                    {
                        "id": f"listing-{lr.id}-inspection",
                        "kind": "inspection_done",
                        "sentence": "Inspection complete",
                        "moment": moment_label(getattr(lr, "updated_at", None) or getattr(lr, "created_at", None)),
                        "tint": "#2eaa57",
                        "icon": "✅",
                        "subtitle": product_name,
                        "detail": f"Your listing is live with a verified rating of {rating}.",
                        "action_kind": "none",
                        "action_label": "",
                        "order_id": None,
                        "order_ref": "",
                        "product_name": product_name,
                        "client_comment": "",
                        "tracking_number": "",
                        "_ts": getattr(lr, "updated_at", None) or getattr(lr, "created_at", None),
                    }
                )
                continue

            stage_label = {
                ListingRequest.Stage.SAMPLES: "Samples",
                ListingRequest.Stage.INSPECTION: "Inspection",
                ListingRequest.Stage.LIVE: "Live",
                ListingRequest.Stage.DONE: "Done",
            }.get(stage, "Update")
            items.append(
                {
                    "id": f"listing-{lr.id}",
                    "kind": "platform_notice",
                    "sentence": "Listing request update",
                    "moment": moment_label(getattr(lr, "updated_at", None) or getattr(lr, "created_at", None)),
                    "tint": "#0071e3",
                    "icon": "📝",
                    "subtitle": product_name,
                    "detail": f"Stage: {stage_label}. We’ll notify you as we progress your verification.",
                    "action_kind": "none",
                    "action_label": "",
                    "order_id": None,
                    "order_ref": "",
                    "product_name": product_name,
                    "client_comment": "",
                    "tracking_number": "",
                    "_ts": getattr(lr, "updated_at", None) or getattr(lr, "created_at", None),
                }
            )

        products_qs = (
            Product.objects.filter(seller=user, deleted_at__isnull=True)
            .filter(status__in=[Product.Status.PENDING, Product.Status.REJECTED])
            .order_by("-updated_at", "-id")[: min(15, limit)]
        )
        for p in products_qs:
            status_label = "Pending review" if p.status == Product.Status.PENDING else "Listing needs updates"
            kind = "listing_rejected" if p.status == Product.Status.REJECTED else "platform_notice"
            reason = ""
            rejection_photos = []
            improvement_suggestions = []
            try:
                cfg = p.detail_config if isinstance(p.detail_config, dict) else {}
            except Exception:
                cfg = {}
            if isinstance(cfg, dict):
                review = cfg.get("review") if isinstance(cfg.get("review"), dict) else {}
                if isinstance(review, dict):
                    reason = str(review.get("rejection_reason") or "").strip()
                    rejection_photos = review.get("rejection_photos") if isinstance(review.get("rejection_photos"), list) else []
                    improvement_suggestions = (
                        review.get("improvement_suggestions") if isinstance(review.get("improvement_suggestions"), list) else []
                    )
            items.append(
                {
                    "id": f"product-{p.id}-{p.status}",
                    "kind": kind,
                    "sentence": status_label,
                    "moment": moment_label(getattr(p, "updated_at", None) or getattr(p, "created_at", None)),
                    "tint": "#e67e22" if p.status == Product.Status.REJECTED else "#0071e3",
                    "icon": "🛡️" if p.status == Product.Status.REJECTED else "🕒",
                    "subtitle": (p.name or "").strip() or "Product",
                    "detail": (reason or "Update your listing details and resubmit for approval.") if p.status == Product.Status.REJECTED else "Your listing is being reviewed by the Vehsl team.",
                    "action_kind": "resubmit" if p.status == Product.Status.REJECTED else "none",
                    "action_label": "Fix & resubmit" if p.status == Product.Status.REJECTED else "",
                    "rejection_reason": reason,
                    "rejection_photos": rejection_photos,
                    "improvement_suggestions": improvement_suggestions,
                    "order_id": None,
                    "order_ref": "",
                    "product_name": (p.name or "").strip() or "",
                    "client_comment": "",
                    "tracking_number": "",
                    "_ts": getattr(p, "updated_at", None) or getattr(p, "created_at", None),
                }
            )

        items.sort(key=lambda r: (r.get("_ts") or timezone.now()), reverse=True)
        out = []
        for r in items[:limit]:
            rr = dict(r)
            rr.pop("_ts", None)
            out.append(rr)
        return Response(out)

    @action(detail=False, methods=["post"], url_path=r"activities/(?P<activity_id>[^/.]+)/dismiss")
    def dismiss_activity(self, request, activity_id=None):
        gate = self._kyc_gate(request)
        if gate is not None:
            return gate
        try:
            nid = int(activity_id)
        except Exception:
            return Response({"dismissed": True})

        updated = (
            Notification.objects.filter(user=request.user, id=nid)
            .exclude(status=Notification.Status.READ)
            .update(status=Notification.Status.READ)
        )
        return Response({"dismissed": bool(updated)})

    @action(detail=False, methods=["post"], url_path=r"activities/(?P<activity_id>[^/.]+)/reply")
    def reply_activity(self, request, activity_id=None):
        gate = self._kyc_gate(request)
        if gate is not None:
            return gate

        content = str((request.data.get("content") if isinstance(request.data, dict) else "") or "").strip()
        if not content:
            return Response({"detail": "content is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            nid = int(activity_id)
        except Exception:
            nid = None

        notif = None
        payload = {}
        if nid is not None:
            notif = Notification.objects.filter(user=request.user, id=nid).first()
            if not notif:
                return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
            payload = notif.payload or {}

        order_id = payload.get("order_id") or payload.get("orderId") or (request.data.get("order_id") if isinstance(request.data, dict) else None)
        try:
            order_id = int(order_id)
        except Exception:
            order_id = 0
        if not order_id:
            return Response({"detail": "order_id is required for reply."}, status=status.HTTP_400_BAD_REQUEST)

        order = Order.objects.filter(id=order_id, seller=request.user, deleted_at__isnull=True).select_related("buyer").first()
        if not order:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        uid = request.user.id
        other_id = order.buyer_id
        thread = (
            ChatThread.objects.filter(
                deleted_at__isnull=True,
                type=ChatThread.ThreadType.BUYER_SELLER,
                participants__contains=[uid, other_id],
            )
            .order_by("-updated_at", "-id")
            .first()
        )
        if not thread:
            thread = ChatThread.objects.create(type=ChatThread.ThreadType.BUYER_SELLER, participants=[uid, other_id])

        msg = ChatMessage.objects.create(thread=thread, sender=request.user, content=content, read_by=[uid])
        ChatThread.objects.filter(id=thread.id).update(updated_at=msg.sent_at)

        if nid is not None:
            Notification.objects.filter(user=request.user, id=nid).update(status=Notification.Status.READ)

        return Response(
            {
                "thread": ChatThreadSerializer(thread, context={"request": request}).data,
                "message": ChatMessageSerializer(msg, context={"request": request}).data,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["get"])
    def shipments(self, request):
        gate = self._kyc_gate(request)
        if gate is not None:
            return gate
        user = request.user
        qs = (
            Shipment.objects.select_related("order")
            .prefetch_related("order__items", "order__items__product", "order__items__product__media")
            .filter(order__seller=user, deleted_at__isnull=True, order__deleted_at__isnull=True)
            .exclude(status=Shipment.Status.DELIVERED)
            .order_by("-created_at", "-id")[:50]
        )
        out = []
        for s in qs:
            o = s.order
            item = o.items.first()
            if not item:
                continue
            media = item.product.media.filter(media_type="image", deleted_at__isnull=True).first()
            image_url = (ProductMediaSerializer(media, context={"request": request}).data.get("public_url") or "").strip() if media else ""
            ship_addr = o.shipping_address or {}
            city = (ship_addr.get("city") or "").strip()
            country = (ship_addr.get("country") or ship_addr.get("country_name") or "").strip()
            dest = ", ".join([p for p in [city, country] if p]) or "—"
            out.append(
                {
                    "id": str(s.id),
                    "item": item.product.name,
                    "image": image_url,
                    "qty": sum(i.quantity for i in o.items.all()),
                    "unit_price": float(item.unit_price),
                    "dest": dest,
                    "order_ref": f"#VH-{o.id}",
                    "shipment_status": s.status,
                    "tracking_number": (s.tracking_number or "").strip(),
                }
            )
        return Response(out)

    @action(detail=False, methods=["get"])
    def reels(self, request):
        gate = self._kyc_gate(request)
        if gate is not None:
            return gate
        user = request.user
        qs = (
            ProductMedia.objects.select_related("product")
            .filter(
                deleted_at__isnull=True,
                media_type=ProductMedia.MediaType.VIDEO,
                product__seller=user,
                product__deleted_at__isnull=True,
            )
            .order_by("id")[:100]
        )
        out = []
        for m in qs:
            p = m.product
            caption = (m.title or "").strip() or p.name
            thumb = (ProductMediaSerializer(m, context={"request": request}).data.get("public_url") or "").strip()
            if not thumb:
                img = p.media.filter(media_type="image", deleted_at__isnull=True).first()
                thumb = (ProductMediaSerializer(img, context={"request": request}).data.get("public_url") or "").strip() if img else ""
            stats = (p.detail_config or {}).get("reels_stats") or {}
            s = stats.get(str(m.id)) if isinstance(stats, dict) else None
            if not isinstance(s, dict):
                seed = int(m.id) * 2654435761 % 100000
                s = {
                    "views": int(500 + (seed % 25000)),
                    "likes": int(30 + (seed % 2000)),
                    "comments": int(seed % 200),
                    "shares": int(seed % 300),
                }
            hashtags = []
            for part in (p.name or "").replace("—", " ").replace("-", " ").split(" "):
                part = part.strip().lower()
                if len(part) < 4:
                    continue
                if len(hashtags) >= 4:
                    break
                hashtags.append(part)
            out.append(
                {
                    "id": f"r{m.id}",
                    "thumbnail": thumb,
                    "caption": caption,
                    "product": p.name,
                    "productId": str(p.id),
                    "status": "published",
                    "views": int(s.get("views") or 0),
                    "likes": int(s.get("likes") or 0),
                    "comments": int(s.get("comments") or 0),
                    "shares": int(s.get("shares") or 0),
                    "duration": "0:20",
                    "postedAt": "Recently",
                    "hashtags": hashtags,
                    "visibility": "public",
                }
            )
        return Response(out)

    @action(detail=False, methods=["get"], url_path="insights/portfolio")
    def insights_portfolio(self, request):
        gate = self._kyc_gate(request)
        if gate is not None:
            return gate

        now, start_curr, start_prev, delta = self._parse_range_window(request)
        user = request.user

        search = (request.query_params.get("search") or "").strip()
        industry = (request.query_params.get("industry") or "").strip().lower()
        limit_raw = (request.query_params.get("limit") or "").strip()
        try:
            limit = int(limit_raw) if limit_raw else 100
        except Exception:
            limit = 100
        limit = max(1, min(200, limit))

        prod_qs = (
            Product.objects.filter(seller=user, deleted_at__isnull=True)
            .exclude(status=Product.Status.ARCHIVED)
            .select_related("category")
            .prefetch_related("media")
            .order_by("-updated_at", "-id")
        )
        if search:
            prod_qs = prod_qs.filter(Q(name__icontains=search) | Q(sku__icontains=search))
        if industry and industry != "all":
            prod_qs = prod_qs.filter(category__slug=industry)

        products = list(prod_qs[:limit])
        prod_ids = [p.id for p in products]
        if not prod_ids:
            return Response([])

        stock_map: dict[int, int] = {}
        try:
            stock_rows = (
                WarehouseStock.objects.filter(deleted_at__isnull=True, seller_id=user.id, product_id__in=prod_ids)
                .values("product_id")
                .annotate(total=Coalesce(Sum("quantity_units"), Value(0), output_field=IntegerField()))
                .annotate(reserved=Coalesce(Sum("reserved_units"), Value(0), output_field=IntegerField()))
            )
            for r in stock_rows:
                total = int(r.get("total") or 0)
                reserved = int(r.get("reserved") or 0)
                stock_map[int(r["product_id"])] = max(0, total - reserved)
        except Exception:
            stock_map = {}

        missing_stock = [pid for pid in prod_ids if pid not in stock_map]
        if missing_stock:
            try:
                from apps.inventory.models import Sample

                sample_rows = (
                    Sample.objects.filter(deleted_at__isnull=True, seller_id=user.id, product_id__in=missing_stock)
                    .values("product_id")
                    .annotate(total=Coalesce(Sum("available_quantity"), Value(0), output_field=IntegerField()))
                )
                for r in sample_rows:
                    stock_map[int(r["product_id"])] = int(r.get("total") or 0)
            except Exception:
                pass

        review_map: dict[int, dict] = {}
        try:
            rr = (
                Review.objects.filter(deleted_at__isnull=True, target_type=Review.TargetType.PRODUCT, target_product_id__in=prod_ids)
                .values("target_product_id")
                .annotate(avg=Coalesce(Avg("rating"), Value(0), output_field=DecimalField()))
                .annotate(cnt=Coalesce(Count("id"), Value(0), output_field=IntegerField()))
            )
            for r in rr:
                review_map[int(r["target_product_id"])] = {"avg": float(r.get("avg") or 0), "cnt": int(r.get("cnt") or 0)}
        except Exception:
            review_map = {}

        items_qs = (
            OrderItem.objects.select_related("order", "product")
            .filter(
                deleted_at__isnull=True,
                order__deleted_at__isnull=True,
                order__seller=user,
                order__created_at__gte=start_prev,
                order__created_at__lt=now,
                product_id__in=prod_ids,
            )
            .exclude(order__status__in=[Order.Status.CANCELLED, Order.Status.REJECTED])
        )

        sales: dict[int, dict] = {}
        for it in items_qs.iterator(chunk_size=500):
            pid = int(it.product_id)
            d = sales.get(pid)
            if d is None:
                d = {
                    "curr_qty": 0,
                    "curr_rev": 0.0,
                    "prev_qty": 0,
                    "prev_rev": 0.0,
                    "countries": {},
                    "spark": [0] * 12,
                }
                sales[pid] = d

            created_at = getattr(it.order, "created_at", None)
            qty = int(it.quantity or 0)
            try:
                rev = float(it.unit_price) * qty
            except Exception:
                rev = 0.0

            is_curr = bool(created_at and created_at >= start_curr)
            if is_curr:
                d["curr_qty"] += qty
                d["curr_rev"] += rev
                if created_at and delta.total_seconds() > 0:
                    idx = int(((created_at - start_curr).total_seconds() / delta.total_seconds()) * 12)
                    idx = max(0, min(11, idx))
                    d["spark"][idx] += qty
                ship_addr = getattr(it.order, "shipping_address", None) or {}
                raw_country = (ship_addr.get("country") or ship_addr.get("country_name") or "").strip()
                iso = self._country_to_iso(raw_country)
                if iso:
                    d["countries"][iso] = d["countries"].get(iso, 0) + qty
            else:
                d["prev_qty"] += qty
                d["prev_rev"] += rev

        out = []
        for p in products:
            pid = int(p.id)
            st = (p.status or "").lower()
            if st in {Product.Status.ACTIVE, Product.Status.APPROVED}:
                status_key = "active"
            elif st == Product.Status.PENDING:
                status_key = "review"
            else:
                status_key = "draft"

            media = p.media.filter(media_type="image", deleted_at__isnull=True).first()
            img = media.url if media else ""

            d = sales.get(pid) or {}
            curr_qty = int(d.get("curr_qty") or 0)
            curr_rev = float(d.get("curr_rev") or 0.0)

            views = max(curr_qty * (12 + (pid % 7)) + (pid % 300), curr_qty)
            conv = round((curr_qty / max(views, 1)) * 100.0, 1)

            r = review_map.get(pid) or {"avg": 0.0, "cnt": 0}
            rating = float(r.get("avg") or 0.0)
            reviews = int(r.get("cnt") or 0)

            countries = d.get("countries") or {}
            total_c = sum(int(v or 0) for v in countries.values())
            top_buyers = []
            if total_c > 0:
                for iso, v in sorted(countries.items(), key=lambda kv: kv[1], reverse=True)[:5]:
                    top_buyers.append({"iso": iso, "pct": int(round((int(v) / total_c) * 100))})

            out.append(
                {
                    "id": f"sp{pid}",
                    "name": p.name,
                    "image": img,
                    "price": float(p.price),
                    "status": status_key,
                    "sold": curr_qty,
                    "revenue": int(round(curr_rev)),
                    "views7d": int(views),
                    "convRate": float(conv),
                    "rating": float(round(rating, 1)) if rating else 0,
                    "reviews": reviews,
                    "stock": int(stock_map.get(pid, 0)),
                    "category": getattr(getattr(p, "category", None), "name", "") or "—",
                    "sparkline": (d.get("spark") or [0] * 12),
                    "topBuyers": top_buyers,
                }
            )

        out.sort(key=lambda r: int(r.get("revenue") or 0), reverse=True)
        return Response(out)

    @action(detail=False, methods=["get"], url_path="insights/buyers")
    def insights_buyers(self, request):
        gate = self._kyc_gate(request)
        if gate is not None:
            return gate

        now, start_curr, start_prev, delta = self._parse_range_window(request)
        user = request.user

        orders_qs = (
            Order.objects.filter(seller=user, deleted_at__isnull=True, created_at__gte=start_prev, created_at__lt=now)
            .exclude(status__in=[Order.Status.CANCELLED, Order.Status.REJECTED])
            .select_related("buyer")
            .order_by("-created_at", "-id")
        )

        by_country: dict[str, dict] = {}
        for o in orders_qs.iterator(chunk_size=500):
            ship_addr = getattr(o, "shipping_address", None) or {}
            raw_country = (ship_addr.get("country") or ship_addr.get("country_name") or "").strip()
            iso = self._country_to_iso(raw_country)
            if not iso:
                continue

            d = by_country.get(iso)
            if d is None:
                d = {
                    "iso": iso,
                    "orders_curr": 0,
                    "orders_prev": 0,
                    "value_curr": 0.0,
                    "value_prev": 0.0,
                    "buyers_curr": {},
                    "buckets": [0] * 7,
                }
                by_country[iso] = d

            is_curr = o.created_at >= start_curr
            total_amount = float(o.total_amount or 0)
            if is_curr:
                d["orders_curr"] += 1
                d["value_curr"] += total_amount
                d["buyers_curr"][int(o.buyer_id)] = d["buyers_curr"].get(int(o.buyer_id), 0) + 1
                if delta.total_seconds() > 0:
                    idx = int(((o.created_at - start_curr).total_seconds() / delta.total_seconds()) * 7)
                    idx = max(0, min(6, idx))
                    d["buckets"][idx] += 1
            else:
                d["orders_prev"] += 1
                d["value_prev"] += total_amount

        items_qs = (
            OrderItem.objects.select_related("order", "product", "product__category")
            .filter(
                deleted_at__isnull=True,
                order__deleted_at__isnull=True,
                order__seller=user,
                order__created_at__gte=start_curr,
                order__created_at__lt=now,
            )
            .exclude(order__status__in=[Order.Status.CANCELLED, Order.Status.REJECTED])
        )

        cats_by_country: dict[str, dict[str, float]] = {}
        for it in items_qs.iterator(chunk_size=500):
            ship_addr = getattr(it.order, "shipping_address", None) or {}
            raw_country = (ship_addr.get("country") or ship_addr.get("country_name") or "").strip()
            iso = self._country_to_iso(raw_country)
            if not iso or iso not in by_country:
                continue
            cat_name = getattr(getattr(it.product, "category", None), "name", "") or "Other"
            try:
                v = float(it.unit_price) * int(it.quantity or 0)
            except Exception:
                v = 0.0
            c = cats_by_country.get(iso)
            if c is None:
                c = {}
                cats_by_country[iso] = c
            c[cat_name] = c.get(cat_name, 0.0) + v

        out = []
        for iso, d in by_country.items():
            orders_curr = int(d.get("orders_curr") or 0)
            orders_prev = int(d.get("orders_prev") or 0)
            value_curr = float(d.get("value_curr") or 0.0)
            growth = int(round(((orders_curr - orders_prev) / max(orders_prev, 1)) * 100))
            avg_order = int(round(value_curr / max(orders_curr, 1)))

            buyer_counts = d.get("buyers_curr") or {}
            uniq_buyers = len(buyer_counts)
            repeat_buyers = len([1 for _, c in buyer_counts.items() if int(c) >= 2])
            repeat_rate = int(round((repeat_buyers / max(uniq_buyers, 1)) * 100))

            cats = cats_by_country.get(iso) or {}
            top_cats = [{"name": k, "value": int(round(v))} for k, v in sorted(cats.items(), key=lambda kv: kv[1], reverse=True)[:4]]

            name = iso.upper()
            mapping = {
                "us": "United States",
                "gb": "United Kingdom",
                "ae": "United Arab Emirates",
                "de": "Germany",
                "ca": "Canada",
                "fr": "France",
                "jp": "Japan",
                "kr": "South Korea",
                "au": "Australia",
            }
            if iso in mapping:
                name = mapping[iso]

            out.append(
                {
                    "id": iso,
                    "name": name,
                    "flag": iso,
                    "totalImports": int(round(value_curr)),
                    "orders7d": orders_curr,
                    "growth": growth,
                    "topCategories": top_cats,
                    "avgOrderValue": avg_order,
                    "repeatRate": repeat_rate,
                    "monthlyTrend": [int(x) for x in (d.get("buckets") or [0] * 7)],
                }
            )

        out.sort(key=lambda r: int(r.get("totalImports") or 0), reverse=True)
        return Response(out)

    @action(detail=False, methods=["get"], url_path="insights/keywords")
    def insights_keywords(self, request):
        gate = self._kyc_gate(request)
        if gate is not None:
            return gate

        now, start_curr, start_prev, _delta = self._parse_range_window(request)
        user = request.user

        limit_raw = (request.query_params.get("limit") or "").strip()
        try:
            limit = int(limit_raw) if limit_raw else 50
        except Exception:
            limit = 50
        limit = max(1, min(100, limit))

        items_qs = (
            OrderItem.objects.select_related("order", "product", "product__category")
            .filter(
                deleted_at__isnull=True,
                order__deleted_at__isnull=True,
                order__seller=user,
                order__created_at__gte=start_prev,
                order__created_at__lt=now,
            )
            .exclude(order__status__in=[Order.Status.CANCELLED, Order.Status.REJECTED])
        )

        kw: dict[str, dict] = {}
        for it in items_qs.iterator(chunk_size=500):
            created_at = getattr(it.order, "created_at", None)
            is_curr = bool(created_at and created_at >= start_curr)
            qty = int(it.quantity or 0)

            p = it.product
            parts = []
            parts.extend(self._tokenize_keywords(getattr(p, "name", "") or ""))
            parts.extend(self._tokenize_keywords(getattr(getattr(p, "category", None), "name", "") or ""))
            if not parts:
                continue

            for token in parts:
                d = kw.get(token)
                if d is None:
                    d = {"curr": 0, "prev": 0, "product": "", "product_qty": 0}
                    kw[token] = d
                if is_curr:
                    d["curr"] += qty
                    if qty > int(d.get("product_qty") or 0):
                        d["product_qty"] = qty
                        d["product"] = getattr(p, "name", "") or ""
                else:
                    d["prev"] += qty

        rows = []
        for token, d in kw.items():
            curr = int(d.get("curr") or 0)
            prev = int(d.get("prev") or 0)
            if curr <= 0 and prev <= 0:
                continue
            change = int(round(((curr - prev) / max(prev, 1)) * 100))
            volume = int(curr * 120 + (hash(token) % 80))
            rows.append({"token": token, "product": d.get("product") or "", "volume": volume, "change": change, "curr": curr})

        rows.sort(key=lambda r: int(r.get("curr") or 0), reverse=True)
        rows = rows[:limit]

        out = []
        for r in rows:
            token = r["token"]
            try:
                comp = (
                    Product.objects.filter(deleted_at__isnull=True)
                    .exclude(status=Product.Status.ARCHIVED)
                    .filter(Q(name__icontains=token) | Q(category__name__icontains=token))
                    .count()
                )
            except Exception:
                comp = 0
            competition = "High" if comp > 40 else "Medium" if comp > 20 else "Low"

            out.append(
                {
                    "keyword": token,
                    "product": r.get("product") or "—",
                    "volume": int(r.get("volume") or 0),
                    "change": int(r.get("change") or 0),
                    "competition": competition,
                }
            )

        out.sort(key=lambda r: int(r.get("volume") or 0), reverse=True)
        return Response(out)

    @action(detail=False, methods=["get"])
    def trends(self, request):
        gate = self._kyc_gate(request)
        if gate is not None:
            return gate

        now, start_curr, start_prev, delta = self._parse_range_window(request)
        user = request.user
        industry = (request.query_params.get("industry") or "").strip().lower()
        search = (request.query_params.get("search") or "").strip()
        limit_raw = (request.query_params.get("limit") or "").strip()
        try:
            limit = int(limit_raw) if limit_raw else 15
        except Exception:
            limit = 15
        limit = max(1, min(200, limit))

        qs = (
            OrderItem.objects.select_related("order", "product", "product__category")
            .filter(
                deleted_at__isnull=True,
                order__deleted_at__isnull=True,
                order__seller=user,
                order__created_at__gte=start_prev,
                product__deleted_at__isnull=True,
            )
            .exclude(order__status__in=[Order.Status.CANCELLED, Order.Status.REJECTED])
        )
        if industry and industry != "all":
            qs = qs.filter(product__category__slug=industry)
        if search:
            qs = qs.filter(Q(product__name__icontains=search) | Q(product__sku__icontains=search))

        stats: dict[int, dict] = {}
        for it in qs.iterator(chunk_size=500):
            pid = int(it.product_id)
            d = stats.get(pid)
            if d is None:
                d = {"product": it.product, "curr": 0, "prev": 0, "daily": {}, "markets": {}, "sum_price": 0.0, "sum_qty": 0}
                stats[pid] = d
            created_at = getattr(it.order, "created_at", None)
            if created_at and created_at >= start_curr:
                d["curr"] += int(it.quantity or 0)
                key = created_at.date().isoformat()
                d["daily"][key] = d["daily"].get(key, 0) + int(it.quantity or 0)
                ship_addr = getattr(it.order, "shipping_address", None) or {}
                raw_country = (ship_addr.get("country") or ship_addr.get("country_name") or "").strip()
                iso = self._country_to_iso(raw_country)
                if iso:
                    d["markets"][iso] = d["markets"].get(iso, 0) + int(it.quantity or 0)
            else:
                d["prev"] += int(it.quantity or 0)
            try:
                d["sum_price"] += float(it.unit_price) * int(it.quantity or 0)
                d["sum_qty"] += int(it.quantity or 0)
            except Exception:
                pass

        rows = []
        for pid, d in stats.items():
            p: Product = d["product"]
            curr = int(d["curr"])
            prev = int(d["prev"])
            if curr <= 0 and prev <= 0:
                continue
            change = int(round(((curr - prev) / max(prev, 1)) * 100))
            score = max(0, min(100, int(25 + min(curr, 2000) / 25 + max(change, -50) / 2)))
            badge = "breakout" if change >= 35 and curr >= 50 else "popular" if curr >= 200 else "rising" if change >= 10 else "steady"

            media = p.media.filter(media_type="image", deleted_at__isnull=True).first()
            img = media.url if media else ""

            cat_name = getattr(getattr(p, "category", None), "name", "") or ""
            industry = getattr(getattr(p, "category", None), "slug", "") or "all"

            days_count = max(1, int(delta.total_seconds() // 86400))
            days_count = min(days_count, 60)
            days = [(now - timedelta(days=i)).date().isoformat() for i in range(min(6, days_count - 1), -1, -1)]
            daily_vals = [int(d["daily"].get(day, 0)) for day in days]
            spark = (daily_vals + daily_vals)[-12:] if daily_vals else [0] * 12

            weekly_data = []
            for day, orders in zip(days, daily_vals):
                wd = day[-5:]
                views = orders * 3 + (pid % 30)
                weekly_data.append({"day": wd, "orders": orders, "views": views})

            mk = d["markets"]
            top_markets = [k for k, _ in sorted(mk.items(), key=lambda kv: kv[1], reverse=True)[:3]]

            avg_price = float(p.price)
            if d["sum_qty"] > 0:
                avg_price = round(float(d["sum_price"]) / float(d["sum_qty"]), 2)

            keywords = []
            for part in (p.name or "").replace("—", " ").replace("-", " ").split(" "):
                part = part.strip().lower()
                if len(part) < 4:
                    continue
                if part in keywords:
                    continue
                keywords.append(part)
                if len(keywords) >= 6:
                    break
            if cat_name:
                for part in cat_name.replace("&", " ").split(" "):
                    part = part.strip().lower()
                    if len(part) < 4:
                        continue
                    if part in keywords:
                        continue
                    keywords.append(part)
                    if len(keywords) >= 6:
                        break

            competitor_count = Product.objects.filter(category_id=p.category_id, deleted_at__isnull=True).exclude(status=Product.Status.ARCHIVED).count()

            rows.append(
                {
                    "id": f"tp{pid}",
                    "name": p.name,
                    "image": img,
                    "category": cat_name or "—",
                    "industry": industry or "all",
                    "popularityScore": score,
                    "change": change,
                    "badge": badge,
                    "sparkline": spark,
                    "orders7d": curr,
                    "avgPrice": avg_price,
                    "topMarkets": top_markets,
                    "buyerInterest": int(curr * 3.2 + (pid % 50)),
                    "competitorCount": competitor_count,
                    "relatedKeywords": keywords,
                    "weeklyData": weekly_data,
                }
            )

        rows.sort(key=lambda r: int(r.get("orders7d") or 0), reverse=True)
        return Response(rows[:limit])

    @action(detail=False, methods=["get"])
    def products(self, request):
        gate = self._kyc_gate(request)
        if gate is not None:
            return gate
        user = request.user
        search = (request.query_params.get("search") or "").strip()

        qs = Product.objects.filter(seller=user, deleted_at__isnull=True).exclude(status=Product.Status.ARCHIVED).prefetch_related("media")
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(sku__icontains=search))

        sold_sq = (
            OrderItem.objects.filter(
                deleted_at__isnull=True,
                order__deleted_at__isnull=True,
                order__status__in=[Order.Status.DELIVERED, Order.Status.COMPLETED],
                product_id=OuterRef("pk"),
            )
            .values("product_id")
            .annotate(total=Coalesce(Sum("quantity"), Value(0), output_field=IntegerField()))
            .values("total")[:1]
        )
        transit_sq = (
            OrderItem.objects.filter(
                deleted_at__isnull=True,
                order__deleted_at__isnull=True,
                order__status=Order.Status.SHIPPED,
                product_id=OuterRef("pk"),
            )
            .values("product_id")
            .annotate(total=Coalesce(Sum("quantity"), Value(0), output_field=IntegerField()))
            .values("total")[:1]
        )
        wh_sq = (
            WarehouseStock.objects.filter(
                deleted_at__isnull=True,
                seller_id=user.id,
                product_id=OuterRef("pk"),
            )
            .values("product_id")
            .annotate(
                total=Coalesce(Sum("quantity_units"), Value(0), output_field=IntegerField()),
                reserved=Coalesce(Sum("reserved_units"), Value(0), output_field=IntegerField()),
            )
            .annotate(available=F("total") - F("reserved"))
            .values("available")[:1]
        )
        try:
            from apps.inventory.models import Sample
        except Exception:
            Sample = None
        if Sample is not None:
            sample_sq = (
                Sample.objects.filter(
                    deleted_at__isnull=True,
                    seller_id=user.id,
                    product_id=OuterRef("pk"),
                )
                .values("product_id")
                .annotate(total=Coalesce(Sum("available_quantity"), Value(0), output_field=IntegerField()))
                .values("total")[:1]
            )
            in_warehouse_expr = Coalesce(Subquery(wh_sq, output_field=IntegerField()), Subquery(sample_sq, output_field=IntegerField()), Value(0))
        else:
            in_warehouse_expr = Coalesce(Subquery(wh_sq, output_field=IntegerField()), Value(0))

        qs = qs.annotate(
            sold=Coalesce(Subquery(sold_sq, output_field=IntegerField()), Value(0)),
            in_transit=Coalesce(Subquery(transit_sq, output_field=IntegerField()), Value(0)),
            in_warehouse=in_warehouse_expr,
        ).order_by("-id")

        class _SellerDashboardProductsPagination(AdminPageNumberPagination):
            page_size = 10
            max_page_size = 10

        paginator = _SellerDashboardProductsPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        data = SellerProductSerializer(page, many=True, context={"request": request}).data
        return paginator.get_paginated_response(data)

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
        qs = Warehouse.objects.filter(active=True).order_by("country", "city", "name", "id")
        out = []
        for w in qs[:50]:
            parts = [w.street1, w.street2, w.city, w.region, w.country, w.postal_code]
            address = ", ".join([p for p in parts if p])
            out.append(
                {
                    "id": str(w.id),
                    "name": w.name,
                    "address": address or "—",
                    "distance": "",
                    "price_per_week": 0,
                    "rating": "A",
                    "features": ["climate", "security", "covered"],
                    "manager_name": "",
                    "manager_phone": "",
                    "hours": "24/7",
                }
            )
        return Response(out)

    @action(detail=False, methods=["get"])
    def inventory(self, request):
        gate = self._kyc_gate(request)
        if gate is not None:
            return gate
        warehouse_id = (request.query_params.get("warehouse_id") or "").strip()
        search = (request.query_params.get("search") or "").strip()
        user = request.user
        qs = WarehouseStock.objects.filter(seller=user, deleted_at__isnull=True).select_related("product", "warehouse").prefetch_related("product__media")
        if warehouse_id:
            try:
                wid = int(warehouse_id)
            except Exception:
                wid = None
            if wid:
                qs = qs.filter(warehouse_id=wid)
        if search:
            qs = qs.filter(Q(product__name__icontains=search) | Q(product__sku__icontains=search))

        results = []
        for st in qs.order_by("-updated_at", "-id")[:500]:
            p = st.product
            image_url = ""
            media = p.media.filter(media_type="image", deleted_at__isnull=True).first()
            if media:
                image_url = media.url
            total_boxes = int(getattr(st, "quantity_units", 0) or 0)
            released_boxes = int(getattr(st, "reserved_units", 0) or 0)
            pallets_count = max(1, int((total_boxes + 29) // 30))
            results.append(
                {
                    "id": f"inv-{p.id}-{st.warehouse_id}",
                    "product_name": p.name,
                    "sku": p.sku or f"SKU-{p.id}",
                    "image": image_url,
                    "total_boxes": total_boxes,
                    "released_boxes": released_boxes,
                    "pallets_count": pallets_count,
                    "unit_price": float(p.price),
                    "warehouse_id": str(st.warehouse_id),
                }
            )
        return Response(results)

    @action(detail=False, methods=["get"])
    def release_requests(self, request):
        gate = self._kyc_gate(request)
        if gate is not None:
            return gate
        user = request.user
        warehouse_id = (request.query_params.get("warehouse_id") or "").strip()
        try:
            wid = int(warehouse_id) if warehouse_id else None
        except Exception:
            wid = None
        qs = (
            Order.objects.filter(seller=user, deleted_at__isnull=True)
            .filter(status=Order.Status.SHIPPED, release_authorized_at__isnull=True, release_declined_at__isnull=True)
            .prefetch_related("items", "items__product")
            .order_by("-created_at", "-id")[:50]
        )
        out = []
        for o in qs:
            item = o.items.first()
            if not item:
                continue
            wh = None
            if wid:
                wh = Warehouse.objects.filter(id=wid, active=True).first()
            if wh is None:
                stock = WarehouseStock.objects.filter(seller_id=user.id, product_id=item.product_id, deleted_at__isnull=True).select_related("warehouse").first()
                wh = stock.warehouse if stock else Warehouse.objects.filter(active=True).order_by("id").first()
            wh_id = str(wh.id) if wh else ""
            buyer_name = f"{o.buyer.first_name} {o.buyer.last_name}".strip() or (o.buyer.email or "")
            inv_id = f"inv-{item.product_id}-{wh_id}" if wh_id else f"inv-{item.product_id}"
            out.append(
                {
                    "id": f"req-{o.id}",
                    "order_id": o.id,
                    "warehouse_id": wh_id,
                    "inventory_item_id": inv_id,
                    "requester_name": buyer_name,
                    "id_card_number": "",
                    "vehicle_number": "",
                    "boxes_requested": int(sum(i.quantity for i in o.items.all())),
                    "payment_amount": float(o.total_amount),
                    "requested_date": o.created_at.date().isoformat(),
                    "note": f"Order #{o.id}",
                }
            )
        return Response(out)

    @action(detail=False, methods=["get"])
    def release_records(self, request):
        gate = self._kyc_gate(request)
        if gate is not None:
            return gate
        user = request.user
        warehouse_id = (request.query_params.get("warehouse_id") or "").strip()
        try:
            wid = int(warehouse_id) if warehouse_id else None
        except Exception:
            wid = None
        qs = WarehouseRelease.objects.filter(seller=user, deleted_at__isnull=True).select_related("order", "product", "warehouse").order_by("-created_at", "-id")[:50]
        if wid:
            qs = qs.filter(warehouse_id=wid)
        out = []
        for r in qs:
            o = r.order
            out.append(
                {
                    "id": f"rel-{r.id}",
                    "order_id": o.id,
                    "warehouse_id": str(r.warehouse_id),
                    "inventory_item_id": f"inv-{r.product_id}-{r.warehouse_id}",
                    "recipient_name": r.recipient_name or "",
                    "id_card_number": r.id_card_number or "",
                    "vehicle_number": r.vehicle_number or "",
                    "boxes_released": int(r.boxes_released or 0),
                    "payment_amount": float(r.payment_amount or 0),
                    "date": (r.created_at.date().isoformat() if r.created_at else o.updated_at.date().isoformat()),
                    "status": ("pending" if r.status == WarehouseRelease.Status.PENDING else "completed"),
                }
            )
        return Response(out)

    @action(detail=False, methods=["post"], url_path=r"release_requests/(?P<order_id>\d+)/approve")
    def approve_release_request(self, request, order_id=None):
        gate = self._kyc_gate(request)
        if gate is not None:
            return gate
        user = request.user
        try:
            oid = int(order_id)
        except Exception:
            return Response({"detail": "Invalid order id."}, status=status.HTTP_400_BAD_REQUEST)

        o = Order.objects.filter(id=oid, seller=user, deleted_at__isnull=True).prefetch_related("items").first()
        if not o:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
        if o.status != Order.Status.SHIPPED:
            return Response({"detail": "Order is not in shipped state."}, status=status.HTTP_400_BAD_REQUEST)
        if o.release_authorized_at is not None:
            return Response({"detail": "Release already authorized."}, status=status.HTTP_400_BAD_REQUEST)
        if o.release_declined_at is not None:
            return Response({"detail": "Release already declined."}, status=status.HTTP_400_BAD_REQUEST)

        # Check release conditions
        from apps.orders.models import ReleaseCondition
        pending = o.release_conditions.filter(
            status__in=[ReleaseCondition.Status.PENDING, ReleaseCondition.Status.IN_PROGRESS, ReleaseCondition.Status.FAILED]
        ).exists()
        if pending:
            return Response({"detail": "Cannot authorize release while conditions are pending or failed."}, status=status.HTTP_400_BAD_REQUEST)

        body = request.data or {}
        warehouse_id = str(body.get("warehouse_id") or "").strip()
        recipient_name = str(body.get("recipient_name") or "").strip()
        id_card_number = str(body.get("id_card_number") or "").strip()
        vehicle_number = str(body.get("vehicle_number") or "").strip()
        boxes_raw = body.get("boxes_released") or body.get("boxes") or body.get("boxes_requested")
        try:
            boxes = int(boxes_raw)
        except Exception:
            boxes = 0
        if boxes <= 0:
            boxes = int(sum(i.quantity for i in o.items.all()))

        item = o.items.first()
        if not item:
            return Response({"detail": "Order has no items."}, status=status.HTTP_400_BAD_REQUEST)

        wh = None
        try:
            wid = int(warehouse_id) if warehouse_id else None
        except Exception:
            wid = None
        if wid:
            wh = Warehouse.objects.filter(id=wid, active=True).first()
        if wh is None:
            stock = WarehouseStock.objects.filter(seller_id=user.id, product_id=item.product_id, deleted_at__isnull=True).select_related("warehouse").first()
            wh = stock.warehouse if stock else Warehouse.objects.filter(active=True).order_by("id").first()
        if wh is None:
            return Response({"detail": "No warehouse available."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            st = WarehouseStock.objects.select_for_update().filter(
                seller_id=user.id, warehouse_id=wh.id, product_id=item.product_id, variation_id__isnull=True, deleted_at__isnull=True
            ).first()
            if not st:
                return Response({"detail": "No warehouse stock for this product."}, status=status.HTTP_400_BAD_REQUEST)
            available = int(st.quantity_units or 0) - int(st.reserved_units or 0)
            if boxes > available:
                return Response({"detail": f"Insufficient stock. Available: {available}."}, status=status.HTTP_400_BAD_REQUEST)
            st.reserved_units = int(st.reserved_units or 0) + boxes
            st.save(update_fields=["reserved_units", "updated_at"])

            o.release_authorized_at = timezone.now()
            o.release_authorized_by = user
            o.release_declined_at = None
            o.release_declined_by = None
            o.release_decline_reason = ""
            o.save(update_fields=["release_authorized_at", "release_authorized_by", "release_declined_at", "release_declined_by", "release_decline_reason", "updated_at"])

            rel, _ = WarehouseRelease.objects.update_or_create(
                order=o,
                defaults={
                    "seller": user,
                    "warehouse": wh,
                    "product_id": item.product_id,
                    "recipient_name": recipient_name,
                    "id_card_number": id_card_number,
                    "vehicle_number": vehicle_number,
                    "boxes_released": boxes,
                    "payment_amount": o.total_amount,
                    "status": WarehouseRelease.Status.COMPLETED,
                    "deleted_at": None,
                },
            )

        return Response(
            {
                "id": f"rel-{rel.id}",
                "order_id": o.id,
                "warehouse_id": str(wh.id),
                "inventory_item_id": f"inv-{item.product_id}-{wh.id}",
                "recipient_name": rel.recipient_name,
                "id_card_number": rel.id_card_number,
                "vehicle_number": rel.vehicle_number,
                "boxes_released": int(rel.boxes_released or 0),
                "payment_amount": float(rel.payment_amount or 0),
                "date": rel.created_at.date().isoformat(),
                "status": "completed",
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"], url_path=r"release_requests/(?P<order_id>\d+)/decline")
    def decline_release_request(self, request, order_id=None):
        gate = self._kyc_gate(request)
        if gate is not None:
            return gate
        user = request.user
        try:
            oid = int(order_id)
        except Exception:
            return Response({"detail": "Invalid order id."}, status=status.HTTP_400_BAD_REQUEST)
        o = Order.objects.filter(id=oid, seller=user, deleted_at__isnull=True).first()
        if not o:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
        if o.status != Order.Status.SHIPPED:
            return Response({"detail": "Order is not in shipped state."}, status=status.HTTP_400_BAD_REQUEST)
        if o.release_authorized_at is not None:
            return Response({"detail": "Release already authorized."}, status=status.HTTP_400_BAD_REQUEST)
        if o.release_declined_at is not None:
            return Response({"detail": "Release already declined."}, status=status.HTTP_400_BAD_REQUEST)

        reason = str((request.data or {}).get("reason") or "").strip()
        o.release_declined_at = timezone.now()
        o.release_declined_by = user
        o.release_decline_reason = reason
        o.save(update_fields=["release_declined_at", "release_declined_by", "release_decline_reason", "updated_at"])
        return Response({"status": "declined"})

    @action(detail=False, methods=["get"])
    def auto_order_settings(self, request):
        gate = self._kyc_gate(request)
        if gate is not None:
            return gate
        settings_obj, _ = UserSettings.objects.get_or_create(user=request.user)
        business = settings_obj.business if isinstance(settings_obj.business, dict) else {}
        data = business.get("auto_order", {})
        return Response(data if isinstance(data, dict) else {})

    @action(detail=False, methods=["patch"])
    def update_auto_order_settings(self, request):
        gate = self._kyc_gate(request)
        if gate is not None:
            return gate
        body = request.data or {}
        inventory_item_id = str(body.get("inventory_item_id") or "").strip()
        if not inventory_item_id:
            return Response({"detail": "inventory_item_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        enabled = body.get("enabled")
        min_threshold = body.get("min_threshold")
        max_capacity = body.get("max_capacity")
        patch = {}
        if enabled is not None:
            patch["enabled"] = bool(enabled)
        if min_threshold is not None:
            try:
                patch["minThreshold"] = max(0, int(min_threshold))
            except Exception:
                return Response({"detail": "Invalid min_threshold."}, status=status.HTTP_400_BAD_REQUEST)
        if max_capacity is not None:
            try:
                patch["maxCapacity"] = max(0, int(max_capacity))
            except Exception:
                return Response({"detail": "Invalid max_capacity."}, status=status.HTTP_400_BAD_REQUEST)
        settings_obj, _ = UserSettings.objects.get_or_create(user=request.user)
        business = settings_obj.business if isinstance(settings_obj.business, dict) else {}
        existing = business.get("auto_order", {})
        if not isinstance(existing, dict):
            existing = {}
        current = existing.get(inventory_item_id, {})
        if not isinstance(current, dict):
            current = {}
        merged = {**current, **patch}
        existing[inventory_item_id] = merged
        business["auto_order"] = existing
        settings_obj.business = business
        settings_obj.save(update_fields=["business", "updated_at"])
        return Response({inventory_item_id: merged})


class MarketingPromisesView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        def image_url_for(pid: str) -> str:
            key = f"marketing/promises/{pid}.png"
            try:
                if not default_storage.exists(key):
                    return ""
            except Exception:
                return ""
            try:
                url = default_storage.url(key)
            except Exception:
                url = f"/media/{key}"
            if isinstance(url, str) and url.startswith("/") and request is not None:
                try:
                    return request.build_absolute_uri(url)
                except Exception:
                    return url
            return url if isinstance(url, str) else ""

        return Response(
            {
                "promises": [
                    {
                        "id": "sellers-verified",
                        "image_url": image_url_for("sellers-verified"),
                        "title_en": "100% Sellers verified.",
                        "title_zh": "100% 卖家已认证。",
                        "description_en": "Every seller on our Vehsl is fully KYC-verified, ensuring you buy directly and securely from only verified sellers, no exceptions.",
                        "description_zh": "我们的 Vehsl 平台上的每位卖家都经过完整的 KYC 认证，确保您直接且安全地从经过验证的卖家处购买，绝无例外。",
                    },
                    {
                        "id": "manufacturing-visit",
                        "image_url": image_url_for("manufacturing-visit"),
                        "title_en": "Each manufacturing unit is visited.",
                        "title_zh": "实地探访每个制造工厂。",
                        "description_en": "Every manufacturer on Vehsl is validated through in-person visits and careful review of their facility documents, ensuring credibility and transparency.",
                        "description_zh": "通过实地走访以及对设施文件的仔细审查，来核实 Vehsl 上的每家制造商，确保信誉与透明度。",
                    },
                    {
                        "id": "payment-protection",
                        "image_url": image_url_for("payment-protection"),
                        "title_en": "Each Payment and product is protected.",
                        "title_zh": "每一笔付款与商品都受保护。",
                        "description_en": "No payment moves without delivery, and no order is placed without secured funds.",
                        "description_zh": "未交货不付款，资金未安全托管不发单。",
                    },
                    {
                        "id": "customer-support",
                        "image_url": image_url_for("customer-support"),
                        "title_en": "Questions at midnight? No problem. Our team is always online.",
                        "title_zh": "半夜有疑问？没问题。我们的团队始终在线。",
                        "description_en": "Our global support team provides 24/7 assistance with orders, payments, listings, and more, expert help, wherever you are.",
                        "description_zh": "我们的全球支持团队全天候 (24/7) 提供订单、付款、商品列表等方面的协助，无论您身在何处，都能获得专家帮助。",
                    },
                    {
                        "id": "buyer-kyc-verified",
                        "image_url": image_url_for("buyer-kyc-verified"),
                        "title_en": "Buyer KYC Verified.",
                        "title_zh": "买家 KYC 已验证。",
                        "description_en": "Every buyer on our platform is verified through KYC to ensure secure and reliable marketplace.",
                        "description_zh": "平台上的每位买家都经过 KYC 验证，以确保安全可靠的市场环境。",
                    },
                ]
            }
        )


class MarketingAssetUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request):
        raw_key = str((request.data.get("key") or request.data.get("path") or "")).strip()
        upload = request.FILES.get("file")
        if not raw_key:
            return Response({"detail": "key is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not upload:
            return Response({"detail": "file is required."}, status=status.HTTP_400_BAD_REQUEST)
        key = raw_key.lstrip("/").strip()
        if ".." in key or "\\" in key:
            return Response({"detail": "Invalid key."}, status=status.HTTP_400_BAD_REQUEST)
        if not key.startswith("marketing/"):
            return Response({"detail": "key must start with marketing/."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            saved = default_storage.save(key, upload)
        except Exception:
            return Response({"detail": "Upload failed."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            url = default_storage.url(saved)
        except Exception:
            url = f"/media/{saved}"
        if isinstance(url, str) and url.startswith("/"):
            try:
                url = request.build_absolute_uri(url)
            except Exception:
                pass
        return Response({"storage_key": saved, "url": url}, status=status.HTTP_201_CREATED)

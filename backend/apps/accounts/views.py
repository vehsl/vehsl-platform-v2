from rest_framework import generics, mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from django.conf import settings as django_settings
from django.db.models import CharField, Count, DecimalField, Q, Sum
from django.utils import timezone
from datetime import timedelta

from apps.accounts.permissions import IsAdmin, IsBuyer, IsSeller

from django.db.models import Avg, Case, Count, F, IntegerField, Prefetch, Q, Value, When
from django.db.models.functions import Coalesce, TruncDay, TruncHour, TruncMonth, TruncWeek

from .models import (
    AdminProfile,
    AdminPlatformSettings,
    AdminUiNotificationState,
    ChatMessage,
    ChatThread,
    KycDocument,
    Notification,
    SellerProfile,
    Subscription,
    User,
    UserProfile,
)
from .serializers import (
    AdminProfileUpdateSerializer,
    AdminKycDocumentSerializer,
    AdminUserListSerializer,
    AdminUserWriteSerializer,
    AdminVerificationUserSerializer,
    BuyerProfileSerializer,
    ChatMessageSerializer,
    ChatThreadSerializer,
    NotificationSerializer,
    MeUpdateSerializer,
    RegisterSerializer,
    SellerProfileSerializer,
    SubscriptionSerializer,
    UserSerializer,
    VehslTokenObtainPairSerializer,
)


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
            for o in orders_qs.iterator():
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

            base = Product.objects.filter(deleted_at__isnull=True).annotate(
                stock_units=Coalesce(Sum("samples__available_quantity"), Value(0), output_field=IntegerField())
            )
            low_stock = (
                base.filter(status__in=[Product.Status.APPROVED, Product.Status.ACTIVE], stock_units__gt=0, stock_units__lt=threshold)
                .count()
            )
            if low_stock:
                items.append(
                    {
                        "key": "products_low_stock",
                        "title": "Inventory alert",
                        "body": f"{low_stock} products are low on stock",
                        "occurred_at": now,
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
        alerts = alerts[:6]

        activities: list[dict] = []
        try:
            newest_orders = []
            newest_payments = []
            newest_inspections = []
            newest_docs = []
            newest_users = []

            if Order is not None:
                newest_orders = list(Order.objects.filter(deleted_at__isnull=True).select_related("buyer").order_by("-created_at")[:6])
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
                    .order_by("-created_at")[:6]
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
                    .order_by("-created_at")[:6]
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
            newest_docs = list(KycDocument.objects.select_related("user").order_by("-uploaded_at")[:6])
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
            newest_users = list(User.objects.order_by("-date_joined")[:6])
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
        activities = activities[:8]
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
        for f in ["country", "province", "city", "street", "address", "nationality", "gender", "date_of_birth"]:
            if f in data:
                setattr(profile, f, data.get(f) or (None if f == "date_of_birth" else ""))
        profile.save()

        return Response(UserSerializer(user).data)


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


class ChatThreadViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChatThreadSerializer

    def get_queryset(self):
        uid = self.request.user.id
        qs = ChatThread.objects.all().order_by("-updated_at")
        return qs.filter(participants__contains=[uid])

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        participants = data.get("participants") or []
        if not isinstance(participants, list):
            return Response({"detail": "participants must be a list of user ids."}, status=status.HTTP_400_BAD_REQUEST)
        uid = request.user.id
        if uid not in participants:
            participants = [uid, *participants]
        data["participants"] = participants
        ser = self.get_serializer(data=data)
        ser.is_valid(raise_exception=True)
        thread = ser.save()
        return Response(self.get_serializer(thread).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get", "post"], url_path="messages")
    def messages(self, request, pk=None):
        thread = self.get_object()
        uid = request.user.id
        if uid not in (thread.participants or []):
            return Response({"detail": "Not a participant."}, status=status.HTTP_403_FORBIDDEN)

        if request.method == "GET":
            qs = ChatMessage.objects.filter(thread=thread).order_by("sent_at")
            return Response(ChatMessageSerializer(qs, many=True).data)

        msg = ChatMessage.objects.create(
            thread=thread,
            sender=request.user,
            content=(request.data.get("content") or ""),
            attachments=request.data.get("attachments") or [],
        )
        ChatThread.objects.filter(id=thread.id).update(updated_at=msg.sent_at)
        return Response(ChatMessageSerializer(msg).data, status=status.HTTP_201_CREATED)


class AdminUserViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = AdminUserListSerializer

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
            qs = qs.filter(
                Q(email__icontains=q)
                | Q(phone__icontains=q)
                | Q(first_name__icontains=q)
                | Q(last_name__icontains=q)
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
        user.set_password(password or "Test123!@#")
        user.full_clean()
        user.save()

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
        return Response(out, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        user = self.get_object()
        ser = AdminUserWriteSerializer(data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        for f in ["first_name", "last_name"]:
            if f in data:
                setattr(user, f, (data.get(f) or "").strip())
        if "email" in data:
            user.email = (data.get("email") or "").strip() or None
        if "phone" in data:
            user.phone = (data.get("phone") or "").strip() or None
        if "role" in data:
            user.role = data.get("role")
        if "account_type" in data:
            user.account_type = (data.get("account_type") or "").strip()
        if "status" in data:
            user.status = data.get("status")
        if "password" in data and (data.get("password") or "").strip():
            user.set_password((data.get("password") or "").strip())

        user.full_clean()
        user.save()

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
        return Response(out)

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
                qs = qs.exclude(kyc_documents__review_status__in=["pending", "under_review", "rejected"]).filter(
                    kyc_documents__review_status="verified"
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
        page = self.paginate_queryset(self.get_queryset())
        if page is not None:
            ser = AdminVerificationUserSerializer(page, many=True, context={"request": request})
            return self.get_paginated_response(ser.data)
        ser = AdminVerificationUserSerializer(self.get_queryset(), many=True, context={"request": request})
        return Response(ser.data)

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        qs = self._base_users_queryset()

        total_users = qs.count()
        is_seller = Q(account_type="seller") | Q(role="seller")
        sellers = qs.filter(is_seller).count()
        buyers = qs.exclude(is_seller).count()

        pending_review = qs.filter(kyc_documents__review_status__in=["pending", "under_review"]).distinct().count()
        fully_verified = (
            qs.exclude(kyc_documents__review_status__in=["pending", "under_review", "rejected"])
            .filter(kyc_documents__review_status="verified")
            .distinct()
            .count()
        )

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
        now = timezone.now()
        KycDocument.objects.filter(user=user, review_status__in=["pending", "under_review"]).update(
            review_status=KycDocument.ReviewStatus.VERIFIED,
            reviewed_at=now,
            reviewed_by=request.user,
            rejection_reason="",
        )
        if (user.account_type or user.role) == User.AccountType.SELLER or user.role == User.Role.SELLER:
            prof = getattr(user, "seller_profile", None)
            if prof:
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
        user = User.objects.select_related("profile", "seller_profile").prefetch_related(
            Prefetch("kyc_documents", queryset=KycDocument.objects.select_related("reviewed_by").order_by("-uploaded_at"))
        ).get(id=user.id)
        return Response(AdminVerificationUserSerializer(user, context={"request": request}).data)


class AdminKycDocumentViewSet(mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = AdminKycDocumentSerializer
    queryset = KycDocument.objects.select_related("user", "reviewed_by").order_by("-uploaded_at")

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        doc = self.get_object()
        now = timezone.now()
        KycDocument.objects.filter(id=doc.id).update(
            review_status=KycDocument.ReviewStatus.VERIFIED,
            reviewed_at=now,
            reviewed_by=request.user,
            rejection_reason="",
        )
        doc.refresh_from_db()
        return Response(AdminKycDocumentSerializer(doc, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        doc = self.get_object()
        reason = (request.data.get("reason") or "").strip()
        now = timezone.now()
        KycDocument.objects.filter(id=doc.id).update(
            review_status=KycDocument.ReviewStatus.REJECTED,
            reviewed_at=now,
            reviewed_by=request.user,
            rejection_reason=reason,
        )
        doc.refresh_from_db()
        return Response(AdminKycDocumentSerializer(doc, context={"request": request}).data)

from __future__ import annotations

from copy import deepcopy
from datetime import timedelta

from django.core.cache import cache
from django.db.models import Avg, Count, Q
from django.db.models.functions import TruncDay, TruncHour, TruncWeek
from django.utils import timezone

from apps.accounts.models import User
from apps.catalog.models import ListingRequest, Product
from apps.inventory.models import QualityInspection
from apps.inventory.views import build_admin_quality_stats_payload
from apps.orders.models import Dispute, Order
from apps.orders.views import build_admin_logistics_stats_payload

from .dashboard_serializers import CommandCenterSummarySerializer

SUPPORTED_COMMAND_CENTER_PERIODS = ("24h", "7d", "30d", "90d")
COMMAND_CENTER_PERIOD_DAYS = {
    "24h": 1,
    "7d": 7,
    "30d": 30,
    "90d": 90,
}
COMMON_DAYS = (1, 7, 30, 90)


def normalize_command_center_period(period: str | None) -> str:
    period = (period or "7d").strip().lower()
    return period if period in SUPPORTED_COMMAND_CENTER_PERIODS else "7d"


def command_center_cache_ttl_seconds(period: str) -> int:
    return 60 if COMMAND_CENTER_PERIOD_DAYS.get(normalize_command_center_period(period), 7) <= 7 else 120


def invalidate_command_center_caches() -> None:
    keys = [f"admin_command_center:{period}" for period in SUPPORTED_COMMAND_CENTER_PERIODS]
    keys.extend(f"admin_overview:{period}" for period in SUPPORTED_COMMAND_CENTER_PERIODS)
    keys.extend(f"admin_quality_stats:{days}" for days in COMMON_DAYS)
    keys.extend(f"admin_logistics_stats:{days}" for days in COMMON_DAYS)
    cache.delete_many(keys)


def _downsample(values: list[float], max_points: int = 7) -> list[float]:
    if len(values) <= max_points:
        return values
    step = (len(values) - 1) / float(max_points - 1)
    out = []
    used = set()
    for idx in range(max_points):
        pick = int(round(idx * step))
        if pick >= len(values):
            pick = len(values) - 1
        if pick in used:
            continue
        used.add(pick)
        out.append(values[pick])
    return out or values[-max_points:]


def _bucket_trunc(period: str, field_name: str):
    period = normalize_command_center_period(period)
    if period == "24h":
        return TruncHour(field_name)
    if period in {"7d", "30d"}:
        return TruncDay(field_name)
    return TruncWeek(field_name)


def _period_window(period: str):
    period = normalize_command_center_period(period)
    now = timezone.now()
    days = COMMAND_CENTER_PERIOD_DAYS[period]
    start = now - timedelta(days=days)
    prev_start = start - timedelta(days=days)
    prev_end = start
    return now, start, prev_start, prev_end, days


def _staff_filter() -> Q:
    return Q(role__in=[User.Role.ADMIN, User.Role.LOGISTICS]) | Q(is_staff=True)


def _build_active_orders(period: str, start, now) -> dict:
    active_exclude = [
        Order.Status.DELIVERED,
        Order.Status.COMPLETED,
        Order.Status.CANCELLED,
        Order.Status.REJECTED,
    ]
    snapshot = Order.objects.filter(deleted_at__isnull=True).exclude(status__in=active_exclude)
    window = snapshot.filter(created_at__gte=start, created_at__lt=now)
    sparkline = list(
        window.annotate(bucket=_bucket_trunc(period, "created_at"))
        .values("bucket")
        .annotate(total=Count("id"))
        .order_by("bucket")
        .values_list("total", flat=True)
    )
    snapshot_total = snapshot.count()
    snapshot_b2b = snapshot.filter(buyer__buyer_profile__business_type__gt="").count()
    return {
        "snapshot_total": int(snapshot_total),
        "snapshot_b2b": int(snapshot_b2b),
        "snapshot_b2c": int(max(snapshot_total - snapshot_b2b, 0)),
        "sparkline": [int(v) for v in (_downsample([float(v) for v in sparkline]) or [float(window.count())])],
        "path": "/admin/management/orders",
    }


def _build_users_online(period: str, start, prev_start, prev_end, now) -> dict:
    recent_window = now - timedelta(minutes=15)
    active_now = User.objects.filter(last_login__isnull=False, last_login__gte=recent_window)
    logins_period = User.objects.filter(last_login__isnull=False, last_login__gte=start, last_login__lt=now)
    previous = User.objects.filter(last_login__isnull=False, last_login__gte=prev_start, last_login__lt=prev_end)
    login_series = list(
        logins_period.annotate(bucket=_bucket_trunc(period, "last_login"))
        .values("bucket")
        .annotate(total=Count("id"))
        .order_by("bucket")
        .values_list("total", flat=True)
    )
    return {
        "snapshot_total": int(active_now.count()),
        "snapshot_buyers": int(active_now.filter(Q(account_type=User.AccountType.BUYER) | Q(role=User.Role.BUYER)).count()),
        "snapshot_sellers": int(active_now.filter(Q(account_type=User.AccountType.SELLER) | Q(role=User.Role.SELLER)).count()),
        "snapshot_workers": int(active_now.filter(_staff_filter()).count()),
        "sparkline": [int(v) for v in (_downsample([float(v) for v in login_series]) or [float(logins_period.count()), float(previous.count())])],
        "path": f"/admin/users?active_period={normalize_command_center_period(period)}",
    }


def _build_quality_score(period: str, start, now, days: int) -> dict:
    stats = build_admin_quality_stats_payload(days)
    completed = QualityInspection.objects.filter(
        deleted_at__isnull=True,
        status__in=[QualityInspection.Status.PASSED, QualityInspection.Status.FAILED],
        created_at__gte=start,
        created_at__lt=now,
    )
    sparkline = list(
        completed.annotate(bucket=_bucket_trunc(period, "created_at"))
        .values("bucket")
        .annotate(avg_score=Avg("score"))
        .order_by("bucket")
        .values_list("avg_score", flat=True)
    )
    return {
        "total": round(float(stats.get("avg_quality_score") or 0.0), 1),
        "pass_rate": round(float(stats.get("pass_rate") or 0.0), 1),
        "pending": int(stats.get("pending") or 0),
        "inspections": int(completed.count()),
        "delta": round(float(stats.get("avg_quality_score_delta") or 0.0), 1),
        "sparkline": [round(float(v or 0.0), 1) for v in (_downsample([float(v or 0.0) for v in sparkline]) or [float(stats.get("avg_quality_score") or 0.0)])],
        "path": "/admin/quality",
    }


def _build_shipments(period: str, days: int) -> dict:
    stats = build_admin_logistics_stats_payload(days)
    return {
        "total": int(stats.get("in_transit") or 0),
        "on_time_rate": round(float(stats.get("on_time_rate") or 0.0), 1),
        "delta": round(float(stats.get("on_time_delta") or 0.0), 1),
        "path": "/admin/logistics",
    }


def _build_listings_pipeline() -> dict:
    listing_counts = {
        row["stage"]: int(row["count"] or 0)
        for row in ListingRequest.objects.values("stage").annotate(count=Count("id"))
    }
    products_base = Product.objects.filter(deleted_at__isnull=True).exclude(status=Product.Status.ARCHIVED)
    items = [
        {
            "key": "samples",
            "label": "Samples",
            "count": int(listing_counts.get(ListingRequest.Stage.SAMPLES, 0)),
            "path": "/admin/management/listings",
        },
        {
            "key": "compliance",
            "label": "Compliance",
            "count": int(listing_counts.get(ListingRequest.Stage.COMPLIANCE, 0)),
            "path": "/admin/management/listings",
        },
        {
            "key": "inspection",
            "label": "Inspection",
            "count": int(listing_counts.get(ListingRequest.Stage.INSPECTION, 0)),
            "path": "/admin/management/listings",
        },
        {
            "key": "live",
            "label": "Live",
            "count": int(products_base.filter(status=Product.Status.ACTIVE).count()),
            "path": "/admin/management/listings",
        },
        {
            "key": "rejected",
            "label": "Rejected",
            "count": int(products_base.filter(status=Product.Status.REJECTED).count()),
            "path": "/admin/management/listings",
        },
    ]
    return {
        "total": sum(int(item["count"]) for item in items),
        "items": items,
    }


def _build_orders_pipeline() -> dict:
    base_orders = Order.objects.filter(deleted_at__isnull=True)
    disputed_count = (
        base_orders.filter(
            Q(status=Order.Status.DISPUTED)
            | Q(disputes__deleted_at__isnull=True, disputes__status__in=[Dispute.Status.OPEN, Dispute.Status.MEDIATION, Dispute.Status.ESCALATED])
        )
        .distinct()
        .count()
    )
    items = [
        {
            "key": "created",
            "label": "Created",
            "count": int(base_orders.filter(status=Order.Status.CREATED).count()),
            "path": "/admin/management/orders?status=created",
        },
        {
            "key": "accepted",
            "label": "Accepted",
            "count": int(base_orders.filter(status=Order.Status.ACCEPTED).count()),
            "path": "/admin/management/orders?status=accepted",
        },
        {
            "key": "shipped",
            "label": "Shipped",
            "count": int(base_orders.filter(status=Order.Status.SHIPPED).count()),
            "path": "/admin/management/orders?status=shipped",
        },
        {
            "key": "delivered",
            "label": "Delivered",
            "count": int(base_orders.filter(status__in=[Order.Status.DELIVERED, Order.Status.COMPLETED]).count()),
            "path": "/admin/management/orders?status=delivered",
        },
        {
            "key": "disputed",
            "label": "Disputed",
            "count": int(disputed_count),
            "path": "/admin/management/orders?status=disputed",
        },
    ]
    return {
        "total": sum(int(item["count"]) for item in items),
        "items": items,
    }


def build_command_center_summary(period: str, *, use_cache: bool = True) -> dict:
    period = normalize_command_center_period(period)
    ttl = command_center_cache_ttl_seconds(period)
    cache_key = f"admin_command_center:{period}"
    if use_cache:
        cached = cache.get(cache_key)
        if cached is not None:
            payload = deepcopy(cached)
            payload.setdefault("meta", {})
            payload["meta"]["generated_from_cache"] = True
            return payload

    now, start, prev_start, prev_end, days = _period_window(period)
    warnings: list[str] = []
    data_sources = [
        "orders",
        "shipments",
        "users",
        "listing_requests",
        "products",
        "quality_inspections",
        "disputes",
    ]

    def run(section_name: str, builder, fallback):
        try:
            return builder()
        except Exception as exc:
            warnings.append(f"{section_name}: {exc.__class__.__name__}")
            return fallback

    hero = {
        "active_orders": run(
            "active_orders",
            lambda: _build_active_orders(period, start, now),
            {"snapshot_total": 0, "snapshot_b2b": 0, "snapshot_b2c": 0, "sparkline": [0], "path": "/admin/management/orders"},
        ),
        "quality_score": run(
            "quality_score",
            lambda: _build_quality_score(period, start, now, days),
            {"total": 0.0, "pass_rate": 0.0, "pending": 0, "inspections": 0, "delta": 0.0, "sparkline": [0.0], "path": "/admin/quality"},
        ),
        "users_online": run(
            "users_online",
            lambda: _build_users_online(period, start, prev_start, prev_end, now),
            {"snapshot_total": 0, "snapshot_buyers": 0, "snapshot_sellers": 0, "snapshot_workers": 0, "sparkline": [0], "path": "/admin/users"},
        ),
        "shipments_in_transit": run(
            "shipments_in_transit",
            lambda: _build_shipments(period, days),
            {"total": 0, "on_time_rate": 0.0, "delta": 0.0, "path": "/admin/logistics"},
        ),
    }
    pipelines = {
        "listings": run("listings_pipeline", _build_listings_pipeline, {"total": 0, "items": []}),
        "orders": run("orders_pipeline", _build_orders_pipeline, {"total": 0, "items": []}),
    }
    payload = {
        "meta": {
            "period": period,
            "generated_at": now,
            "last_updated": now,
            "cache_ttl_seconds": ttl,
            "generated_from_cache": False,
            "is_partial": bool(warnings),
            "warnings": warnings,
            "data_sources": data_sources,
            "paths": {
                "orders": "/admin/management/orders",
                "listings": "/admin/management/listings",
                "logistics": "/admin/logistics",
                "users": "/admin/users",
                "quality": "/admin/quality",
            },
        },
        "hero": hero,
        "pipelines": pipelines,
    }
    serializer = CommandCenterSummarySerializer(data=payload)
    serializer.is_valid(raise_exception=True)
    data = serializer.data
    if use_cache:
        cache.set(cache_key, data, timeout=ttl)
    return data

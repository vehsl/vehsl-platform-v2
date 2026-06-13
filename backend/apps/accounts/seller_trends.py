from __future__ import annotations

from datetime import timedelta
import hashlib
import json

from django.core.cache import cache
from django.db.models import Avg, Count, Q
from django.utils import timezone

from apps.catalog.models import Category, Product, ProductMedia
from apps.catalog.serializers import ProductMediaSerializer
from apps.orders.models import Order, OrderItem, Review

from .models import SellerProfile, User

SUPPORTED_SELLER_TRENDS_PERIODS = ("24h", "7d", "30d", "120d")
SUPPORTED_PRODUCT_TREND_SORTS = ("orders", "revenue", "change")
SELLER_TRENDS_PERIOD_DELTAS = {
    "24h": timedelta(hours=24),
    "7d": timedelta(days=7),
    "30d": timedelta(days=30),
    "120d": timedelta(days=120),
}
SELLER_TRENDS_CACHE_VERSION_KEY = "seller_trends:cache_version"

COUNTRY_CODE_MAP = {
    "ae": "United Arab Emirates",
    "au": "Australia",
    "bd": "Bangladesh",
    "bh": "Bahrain",
    "ca": "Canada",
    "de": "Germany",
    "fr": "France",
    "gb": "United Kingdom",
    "jp": "Japan",
    "kr": "South Korea",
    "kw": "Kuwait",
    "pk": "Pakistan",
    "qa": "Qatar",
    "sa": "Saudi Arabia",
    "us": "United States",
}
COUNTRY_NAME_TO_CODE = {
    "australia": "au",
    "bahrain": "bh",
    "bangladesh": "bd",
    "canada": "ca",
    "france": "fr",
    "germany": "de",
    "great britain": "gb",
    "japan": "jp",
    "korea": "kr",
    "kuwait": "kw",
    "pakistan": "pk",
    "qatar": "qa",
    "saudi arabia": "sa",
    "south korea": "kr",
    "uae": "ae",
    "united arab emirates": "ae",
    "united kingdom": "gb",
    "uk": "gb",
    "united states": "us",
    "united states of america": "us",
    "usa": "us",
}
COUNTRY_FLAGS = {
    "ae": "🇦🇪",
    "au": "🇦🇺",
    "bd": "🇧🇩",
    "bh": "🇧🇭",
    "ca": "🇨🇦",
    "de": "🇩🇪",
    "fr": "🇫🇷",
    "gb": "🇬🇧",
    "jp": "🇯🇵",
    "kr": "🇰🇷",
    "kw": "🇰🇼",
    "pk": "🇵🇰",
    "qa": "🇶🇦",
    "sa": "🇸🇦",
    "us": "🇺🇸",
}


def normalize_seller_trends_period(period: str | None) -> str:
    value = (period or "7d").strip().lower()
    return value if value in SUPPORTED_SELLER_TRENDS_PERIODS else "7d"


def normalize_product_trend_sort(sort_by: str | None) -> str:
    value = (sort_by or "orders").strip().lower()
    return value if value in SUPPORTED_PRODUCT_TREND_SORTS else "orders"


def seller_trends_cache_ttl_seconds(period: str) -> int:
    normalized = normalize_seller_trends_period(period)
    return 60 if normalized in {"24h", "7d"} else 180


def invalidate_seller_trends_caches() -> None:
    current = int(cache.get(SELLER_TRENDS_CACHE_VERSION_KEY) or 1)
    cache.set(SELLER_TRENDS_CACHE_VERSION_KEY, current + 1, None)


def seller_trends_cache_key(segment: str, params: dict) -> str:
    version = int(cache.get(SELLER_TRENDS_CACHE_VERSION_KEY) or 1)
    payload = json.dumps(params, sort_keys=True, default=str)
    digest = hashlib.sha1(payload.encode("utf-8")).hexdigest()
    return f"seller_trends:{segment}:v{version}:{digest}"


def parse_seller_trends_window(period: str):
    normalized = normalize_seller_trends_period(period)
    delta = SELLER_TRENDS_PERIOD_DELTAS[normalized]
    now = timezone.now()
    start_curr = now - delta
    start_prev = start_curr - delta
    return now, start_curr, start_prev, delta


def country_to_iso(raw: str) -> str:
    value = (raw or "").strip().lower()
    if not value:
        return ""
    if len(value) == 2 and value.isalpha():
        return value
    code = COUNTRY_NAME_TO_CODE.get(value, "")
    if code:
        return code
    guess = value[:2]
    return guess if len(guess) == 2 and guess.isalpha() else ""


def iso_to_country_name(code: str) -> str:
    normalized = (code or "").strip().lower()
    if not normalized:
        return "Unknown"
    return COUNTRY_CODE_MAP.get(normalized, normalized.upper())


def iso_to_flag(code: str) -> str:
    return COUNTRY_FLAGS.get((code or "").strip().lower(), "🌍")


def tokenize_keywords(value: str) -> list[str]:
    if not value:
        return []
    out: list[str] = []
    buff: list[str] = []
    for ch in value.lower():
        if ch.isalnum():
            buff.append(ch)
            continue
        if not buff:
            continue
        token = "".join(buff).strip()
        buff = []
        if len(token) >= 4:
            out.append(token)
    if buff:
        token = "".join(buff).strip()
        if len(token) >= 4:
            out.append(token)
    uniq: list[str] = []
    seen: set[str] = set()
    for token in out:
        if token in seen:
            continue
        seen.add(token)
        uniq.append(token)
    return uniq


def safe_public_media_url(media: ProductMedia | None, request=None) -> str:
    if not media:
        return ""
    try:
        return (ProductMediaSerializer(media, context={"request": request}).data.get("public_url") or "").strip()
    except Exception:
        return (getattr(media, "url", "") or "").strip()


def product_primary_image_url(product: Product, request=None) -> str:
    image = None
    try:
        image = product.media.filter(media_type=ProductMedia.MediaType.IMAGE, deleted_at__isnull=True).first()
    except Exception:
        image = None
    return safe_public_media_url(image, request=request)


def build_trends_cache_params(
    *,
    period: str,
    search: str = "",
    industry: str = "all",
    country: str = "all",
    sort_by: str = "orders",
    limit: int = 100,
    seller_id: int | None = None,
) -> dict:
    return {
        "period": normalize_seller_trends_period(period),
        "search": (search or "").strip().lower(),
        "industry": (industry or "all").strip().lower() or "all",
        "country": (country or "all").strip().lower() or "all",
        "sort_by": normalize_product_trend_sort(sort_by),
        "limit": int(limit),
        "seller_id": int(seller_id) if seller_id else None,
    }


def _stable_seed(value: str) -> int:
    return int(hashlib.sha1(value.encode("utf-8")).hexdigest()[:8], 16)


def _safe_float(value) -> float:
    try:
        return float(value or 0.0)
    except Exception:
        return 0.0


def _safe_int(value) -> int:
    try:
        return int(value or 0)
    except Exception:
        return 0


def _initials(user: User | None) -> str:
    if not user:
        return "U"
    seller_profile = getattr(user, "seller_profile", None)
    business_name = (getattr(seller_profile, "business_name", "") or "").strip()
    if business_name:
        parts = [part[:1].upper() for part in business_name.split() if part.strip()]
        if parts:
            return "".join(parts[:2])
    first = (getattr(user, "first_name", "") or "").strip()
    last = (getattr(user, "last_name", "") or "").strip()
    if first or last:
        return f"{first[:1]}{last[:1]}".strip().upper() or "U"
    email = (getattr(user, "email", "") or "").strip()
    if email:
        return email[:2].upper()
    return "U"


def _seller_label(user: User | None) -> str:
    if not user:
        return "Unknown seller"
    seller_profile = getattr(user, "seller_profile", None)
    business_name = (getattr(seller_profile, "business_name", "") or "").strip()
    if business_name:
        return business_name
    full_name = f"{(user.first_name or '').strip()} {(user.last_name or '').strip()}".strip()
    if full_name:
        return full_name
    return (user.email or f"seller-{user.pk}").strip()


def _range_labels(period: str, now, start_curr) -> list[tuple[str, timezone.datetime]]:
    normalized = normalize_seller_trends_period(period)
    if normalized == "24h":
        labels = []
        for idx in range(6, -1, -1):
            point = now - timedelta(hours=idx * 4)
            labels.append((point.strftime("%H:%M"), point))
        return labels
    if normalized == "120d":
        labels = []
        for idx in range(6, -1, -1):
            point = start_curr + timedelta(days=(idx * 20))
            labels.append((f"W{7 - idx}", point))
        return labels
    if normalized == "30d":
        labels = []
        for idx in range(6, -1, -1):
            point = start_curr + timedelta(days=(idx * 5))
            labels.append((f"D{30 - idx * 5}", point))
        return labels
    labels = []
    for idx in range(6, -1, -1):
        point = now - timedelta(days=idx)
        labels.append((point.strftime("%a"), point))
    return labels


def _bucket_label_for_datetime(period: str, created_at, now, start_curr) -> str:
    if not created_at:
        return ""
    normalized = normalize_seller_trends_period(period)
    if normalized == "24h":
        diff = max(0.0, (now - created_at).total_seconds())
        slot = min(6, int(diff // (4 * 3600)))
        point = now - timedelta(hours=slot * 4)
        return point.strftime("%H:%M")
    if normalized == "120d":
        diff_days = max(0, (created_at.date() - start_curr.date()).days)
        slot = min(6, max(0, diff_days // 20))
        return f"W{slot + 1}"
    if normalized == "30d":
        diff_days = max(0, (created_at.date() - start_curr.date()).days)
        slot = min(6, max(0, diff_days // 5))
        return f"D{(slot + 1) * 5}"
    return created_at.strftime("%a")


def _badge_for(curr: int, change: int) -> str:
    if change >= 35 and curr >= 3:
        return "breakout"
    if curr >= 10:
        return "popular"
    if change >= 10:
        return "rising"
    if curr > 0 and change > 0:
        return "new"
    return "steady"


def _product_base_queryset(seller: User | None = None):
    qs = (
        Product.objects.filter(deleted_at__isnull=True)
        .exclude(status=Product.Status.ARCHIVED)
        .select_related("category", "seller", "seller__seller_profile")
        .prefetch_related("media")
    )
    if seller is not None:
        qs = qs.filter(seller=seller)
    return qs


def _order_items_queryset(
    *,
    seller: User | None,
    start_prev,
    now,
    industry: str,
    search: str,
):
    qs = (
        OrderItem.objects.select_related(
            "order",
            "order__seller",
            "order__seller__seller_profile",
            "order__buyer",
            "product",
            "product__category",
            "product__seller",
            "product__seller__seller_profile",
        )
        .filter(
            deleted_at__isnull=True,
            order__deleted_at__isnull=True,
            order__created_at__gte=start_prev,
            order__created_at__lt=now,
            product__deleted_at__isnull=True,
        )
        .exclude(order__status__in=[Order.Status.CANCELLED, Order.Status.REJECTED])
    )
    if seller is not None:
        qs = qs.filter(order__seller=seller)
    if industry and industry != "all":
        qs = qs.filter(product__category__slug=industry)
    if search:
        qs = qs.filter(
            Q(product__name__icontains=search)
            | Q(product__sku__icontains=search)
            | Q(product__category__name__icontains=search)
            | Q(order__seller__seller_profile__business_name__icontains=search)
        )
    return qs


def _seller_country_matches(user: User | None, selected_country: str) -> bool:
    if not selected_country or selected_country == "all":
        return True
    profile = getattr(user, "seller_profile", None)
    country = country_to_iso(getattr(profile, "country", "") or "")
    region = country_to_iso(getattr(profile, "region", "") or "")
    return selected_country in {country, region}


def _filter_options_payload(seller: User | None = None) -> tuple[list[dict], list[dict]]:
    industry_rows = list(
        Category.objects.filter(products__deleted_at__isnull=True)
        .distinct()
        .order_by("name")
        .values("slug", "name")
    )
    country_values: set[str] = set()
    seller_qs = SellerProfile.objects.exclude(country="")
    if seller is not None:
        seller_qs = seller_qs.filter(user=seller)
    for row in seller_qs.values_list("country", flat=True):
        code = country_to_iso(row or "")
        if code:
            country_values.add(code)
    for ship_addr in (
        Order.objects.filter(deleted_at__isnull=True)
        .exclude(shipping_address={})
        .values_list("shipping_address", flat=True)[:500]
    ):
        raw_country = ""
        if isinstance(ship_addr, dict):
            raw_country = (ship_addr.get("country") or ship_addr.get("country_name") or "").strip()
        code = country_to_iso(raw_country)
        if code:
            country_values.add(code)
    industries = [{"value": "all", "label": "All Industries"}]
    industries.extend(
        {"value": (row.get("slug") or "").strip() or "all", "label": (row.get("name") or "").strip() or "Unknown"}
        for row in industry_rows
        if (row.get("slug") or "").strip()
    )
    countries = [{"code": "all", "name": "All Regions", "flag": "🌍"}]
    countries.extend(
        {
            "code": code,
            "name": iso_to_country_name(code),
            "flag": iso_to_flag(code),
        }
        for code in sorted(country_values)
    )
    return industries, countries


def build_trend_summary(
    *,
    period: str,
    seller: User | None = None,
    industry: str = "all",
    country: str = "all",
    search: str = "",
) -> dict:
    normalized = normalize_seller_trends_period(period)
    now, start_curr, start_prev, _delta = parse_seller_trends_window(normalized)
    selected_country = (country or "all").strip().lower() or "all"
    items_qs = _order_items_queryset(
        seller=seller,
        start_prev=start_prev,
        now=now,
        industry=(industry or "all").strip().lower(),
        search=(search or "").strip(),
    )
    total_orders = 0
    total_sales = 0.0
    total_views = 0
    active_sellers: set[int] = set()
    current_products: dict[int, int] = {}
    for item in items_qs.iterator(chunk_size=500):
        order = item.order
        if not order.created_at or order.created_at < start_curr:
            continue
        ship_addr = getattr(order, "shipping_address", None) or {}
        order_country = country_to_iso((ship_addr.get("country") or ship_addr.get("country_name") or "").strip())
        if selected_country != "all" and order_country != selected_country:
            continue
        qty = _safe_int(item.quantity)
        total_orders += qty
        total_sales += _safe_float(item.unit_price) * qty
        active_sellers.add(int(order.seller_id))
        current_products[int(item.product_id)] = current_products.get(int(item.product_id), 0) + qty
    for product_id, qty in current_products.items():
        total_views += max(qty * (12 + (product_id % 7)) + (product_id % 300), qty)
    industries, countries = _filter_options_payload(seller=seller)
    return {
        "period": normalized,
        "generated_at": now,
        "is_partial": False,
        "warnings": [],
        "data_sources": [
            "orders",
            "order_items",
            "products",
            "seller_profiles",
            "product_media",
        ],
        "metrics": {
            "total_sales_value": round(total_sales, 2),
            "total_orders": int(total_orders),
            "total_views": int(total_views),
            "active_sellers": int(len(active_sellers)),
            "avg_order_value": round(total_sales / max(total_orders, 1), 2),
            "buy_rate": round((total_orders / max(total_views, 1)) * 100.0, 1),
        },
        "filters": {
            "industry_options": industries,
            "country_options": countries,
        },
    }


def build_trend_products(
    *,
    period: str,
    seller: User | None = None,
    industry: str = "all",
    country: str = "all",
    search: str = "",
    sort_by: str = "orders",
    limit: int = 100,
    request=None,
) -> list[dict]:
    normalized = normalize_seller_trends_period(period)
    normalized_sort = normalize_product_trend_sort(sort_by)
    now, start_curr, start_prev, _delta = parse_seller_trends_window(normalized)
    selected_country = (country or "all").strip().lower() or "all"
    items_qs = _order_items_queryset(
        seller=seller,
        start_prev=start_prev,
        now=now,
        industry=(industry or "all").strip().lower(),
        search=(search or "").strip(),
    )
    stats: dict[int, dict] = {}
    for item in items_qs.iterator(chunk_size=500):
        order = item.order
        ship_addr = getattr(order, "shipping_address", None) or {}
        order_country = country_to_iso((ship_addr.get("country") or ship_addr.get("country_name") or "").strip())
        if selected_country != "all" and order_country != selected_country:
            continue
        qty = _safe_int(item.quantity)
        revenue = _safe_float(item.unit_price) * qty
        product_id = int(item.product_id)
        data = stats.get(product_id)
        if data is None:
            data = {
                "product": item.product,
                "curr_qty": 0,
                "curr_rev": 0.0,
                "prev_qty": 0,
                "sum_price": 0.0,
                "sum_qty": 0,
                "daily_orders": {},
                "daily_revenue": {},
                "markets": {},
                "sellers": set(),
            }
            stats[product_id] = data
        is_curr = bool(order.created_at and order.created_at >= start_curr)
        if is_curr:
            data["curr_qty"] += qty
            data["curr_rev"] += revenue
            data["sellers"].add(int(order.seller_id))
            label = _bucket_label_for_datetime(normalized, order.created_at, now, start_curr)
            data["daily_orders"][label] = data["daily_orders"].get(label, 0) + qty
            data["daily_revenue"][label] = round(data["daily_revenue"].get(label, 0.0) + revenue, 2)
            if order_country:
                mk = data["markets"].get(order_country)
                if mk is None:
                    mk = {"orders": 0, "revenue": 0.0}
                    data["markets"][order_country] = mk
                mk["orders"] += qty
                mk["revenue"] = round(mk["revenue"] + revenue, 2)
        else:
            data["prev_qty"] += qty
        data["sum_price"] += revenue
        data["sum_qty"] += qty
    if not stats:
        return []
    products = _product_base_queryset(seller=seller).filter(id__in=list(stats.keys()))
    product_map = {int(product.id): product for product in products}
    category_counts = {
        int(row["category_id"]): _safe_int(row["count"])
        for row in (
            Product.objects.filter(category_id__in=[product.category_id for product in products if product.category_id], deleted_at__isnull=True)
            .exclude(status=Product.Status.ARCHIVED)
            .values("category_id")
            .annotate(count=Count("id"))
        )
    }
    label_points = _range_labels(normalized, now, start_curr)
    rows: list[dict] = []
    for product_id, data in stats.items():
        product = product_map.get(product_id) or data["product"]
        curr_qty = _safe_int(data["curr_qty"])
        prev_qty = _safe_int(data["prev_qty"])
        if curr_qty <= 0 and prev_qty <= 0:
            continue
        change = int(round(((curr_qty - prev_qty) / max(prev_qty, 1)) * 100))
        avg_price = round(data["sum_price"] / max(data["sum_qty"], 1), 2)
        views = max(curr_qty * (12 + (product_id % 7)) + (product_id % 300), curr_qty)
        keywords: list[str] = []
        for token in tokenize_keywords(product.name):
            if token not in keywords:
                keywords.append(token)
            if len(keywords) >= 6:
                break
        for token in tokenize_keywords(getattr(getattr(product, "category", None), "name", "") or ""):
            if token not in keywords:
                keywords.append(token)
            if len(keywords) >= 6:
                break
        top_markets = []
        for code, market in sorted(
            (data.get("markets") or {}).items(),
            key=lambda item: (_safe_float(item[1].get("revenue")), _safe_int(item[1].get("orders"))),
            reverse=True,
        )[:5]:
            top_markets.append(
                {
                    "code": code,
                    "name": iso_to_country_name(code),
                    "flag": iso_to_flag(code),
                    "orders": _safe_int(market.get("orders")),
                    "revenue": round(_safe_float(market.get("revenue")), 2),
                }
            )
        weekly_data = []
        sparkline = []
        for label, _point in label_points:
            label_key = label
            label_orders = _safe_int(data["daily_orders"].get(label_key))
            label_revenue = round(_safe_float(data["daily_revenue"].get(label_key)), 2)
            weekly_data.append(
                {
                    "day": label_key,
                    "orders": label_orders,
                    "revenue": label_revenue,
                    "views": max(label_orders * 3 + (product_id % 30), label_orders),
                }
            )
            sparkline.append(label_orders)
        rows.append(
            {
                "id": f"tp{product_id}",
                "product_id": str(product_id),
                "name": product.name,
                "image": product_primary_image_url(product, request=request),
                "category": getattr(getattr(product, "category", None), "name", "") or "—",
                "industry": getattr(getattr(product, "category", None), "slug", "") or "all",
                "popularityScore": max(0, min(100, int(25 + min(curr_qty, 2000) / 25 + max(change, -50) / 2))),
                "change": change,
                "badge": _badge_for(curr_qty, change),
                "sparkline": sparkline or [0] * 7,
                "orders7d": curr_qty,
                "views7d": int(views),
                "revenue7d": round(_safe_float(data["curr_rev"]), 2),
                "avgPrice": avg_price,
                "avg_price": avg_price,
                "topMarkets": top_markets,
                "buyerInterest": int(curr_qty * 3.2 + (product_id % 50)),
                "competitorCount": _safe_int(category_counts.get(int(product.category_id or 0))),
                "relatedKeywords": keywords,
                "weeklyData": weekly_data,
                "sellers": int(len(data.get("sellers") or [])),
                "views_source": "derived",
                "path": f"/admin/management/listings?product_id={product_id}",
            }
        )
    if normalized_sort == "revenue":
        rows.sort(key=lambda row: (_safe_float(row.get("revenue7d")), _safe_int(row.get("orders7d"))), reverse=True)
    elif normalized_sort == "change":
        rows.sort(key=lambda row: (_safe_int(row.get("change")), _safe_float(row.get("revenue7d"))), reverse=True)
    else:
        rows.sort(key=lambda row: (_safe_int(row.get("orders7d")), _safe_float(row.get("revenue7d"))), reverse=True)
    for index, row in enumerate(rows, start=1):
        row["rank"] = index
    return rows[: max(1, min(int(limit or 100), 200))]


def build_trend_keywords(
    *,
    period: str,
    seller: User | None = None,
    industry: str = "all",
    country: str = "all",
    search: str = "",
    limit: int = 50,
) -> list[dict]:
    normalized = normalize_seller_trends_period(period)
    now, start_curr, start_prev, _delta = parse_seller_trends_window(normalized)
    selected_country = (country or "all").strip().lower() or "all"
    items_qs = _order_items_queryset(
        seller=seller,
        start_prev=start_prev,
        now=now,
        industry=(industry or "all").strip().lower(),
        search=(search or "").strip(),
    )
    keywords: dict[str, dict] = {}
    for item in items_qs.iterator(chunk_size=500):
        ship_addr = getattr(item.order, "shipping_address", None) or {}
        order_country = country_to_iso((ship_addr.get("country") or ship_addr.get("country_name") or "").strip())
        if selected_country != "all" and order_country != selected_country:
            continue
        product = item.product
        qty = _safe_int(item.quantity)
        is_curr = bool(item.order.created_at and item.order.created_at >= start_curr)
        for token in tokenize_keywords(product.name) + tokenize_keywords(getattr(getattr(product, "category", None), "name", "")):
            data = keywords.get(token)
            if data is None:
                data = {"curr": 0, "prev": 0, "top_product": "", "top_qty": 0}
                keywords[token] = data
            if is_curr:
                data["curr"] += qty
                if qty > _safe_int(data["top_qty"]):
                    data["top_qty"] = qty
                    data["top_product"] = product.name
            else:
                data["prev"] += qty
    rows = []
    for token, data in keywords.items():
        curr = _safe_int(data["curr"])
        prev = _safe_int(data["prev"])
        if curr <= 0 and prev <= 0:
            continue
        change = int(round(((curr - prev) / max(prev, 1)) * 100))
        seed = _stable_seed(token)
        volume = int(curr * 120 + (seed % 80))
        competition_count = (
            Product.objects.filter(deleted_at__isnull=True)
            .exclude(status=Product.Status.ARCHIVED)
            .filter(Q(name__icontains=token) | Q(category__name__icontains=token))
            .count()
        )
        competition = "High" if competition_count > 40 else "Medium" if competition_count > 20 else "Low"
        rows.append(
            {
                "keyword": token,
                "product": data.get("top_product") or "—",
                "volume": volume,
                "change": change,
                "competition": competition,
                "source_type": "derived_order_tokens",
            }
        )
    rows.sort(key=lambda row: (_safe_int(row.get("volume")), _safe_int(row.get("change"))), reverse=True)
    return rows[: max(1, min(int(limit or 50), 100))]


def build_trend_reels(
    *,
    period: str,
    seller: User | None = None,
    industry: str = "all",
    country: str = "all",
    search: str = "",
    limit: int = 24,
    request=None,
) -> list[dict]:
    normalized = normalize_seller_trends_period(period)
    now, start_curr, _start_prev, _delta = parse_seller_trends_window(normalized)
    selected_country = (country or "all").strip().lower() or "all"
    qs = (
        ProductMedia.objects.select_related("product", "product__seller", "product__seller__seller_profile", "product__category")
        .filter(
            deleted_at__isnull=True,
            media_type=ProductMedia.MediaType.VIDEO,
            product__deleted_at__isnull=True,
        )
        .exclude(product__status=Product.Status.ARCHIVED)
    )
    if seller is not None:
        qs = qs.filter(product__seller=seller)
    if industry and industry != "all":
        qs = qs.filter(product__category__slug=industry)
    if search:
        qs = qs.filter(
            Q(title__icontains=search)
            | Q(product__name__icontains=search)
            | Q(product__seller__seller_profile__business_name__icontains=search)
        )
    product_ids = list(qs.values_list("product_id", flat=True)[:200])
    current_sales = {
        int(row["product_id"]): _safe_int(row["qty"])
        for row in (
            OrderItem.objects.filter(
                deleted_at__isnull=True,
                order__deleted_at__isnull=True,
                order__created_at__gte=start_curr,
                order__created_at__lt=now,
                product_id__in=product_ids or [0],
            )
            .exclude(order__status__in=[Order.Status.CANCELLED, Order.Status.REJECTED])
            .values("product_id")
            .annotate(qty=Count("id"))
        )
    }
    rows = []
    for media in qs[:200]:
        if selected_country != "all" and not _seller_country_matches(getattr(media.product, "seller", None), selected_country):
            continue
        product = media.product
        stats = (product.detail_config or {}).get("reels_stats") or {}
        item_stats = stats.get(str(media.id)) if isinstance(stats, dict) else None
        if not isinstance(item_stats, dict):
            seed = _stable_seed(f"reel:{media.id}:{product.id}")
            sales_hint = current_sales.get(int(product.id), 0)
            item_stats = {
                "views": int(max(250, sales_hint * 55 + (seed % 5000))),
                "likes": int(max(20, sales_hint * 6 + (seed % 400))),
                "comments": int(max(4, sales_hint * 2 + (seed % 80))),
                "shares": int(max(2, sales_hint + (seed % 40))),
            }
        thumbnail = safe_public_media_url(media, request=request) or product_primary_image_url(product, request=request)
        seller_user = getattr(product, "seller", None)
        rows.append(
            {
                "id": f"r{media.id}",
                "video_id": str(media.id),
                "thumbnail": thumbnail,
                "caption": (media.title or "").strip() or product.name,
                "title": (media.title or "").strip() or product.name,
                "product": product.name,
                "productId": str(product.id),
                "product_id": str(product.id),
                "seller_id": str(getattr(seller_user, "id", "")),
                "seller_name": _seller_label(seller_user),
                "status": "published",
                "views": _safe_int(item_stats.get("views")),
                "likes": _safe_int(item_stats.get("likes")),
                "comments": _safe_int(item_stats.get("comments")),
                "shares": _safe_int(item_stats.get("shares")),
                "duration": "0:20",
                "postedAt": "Recently",
                "published_at": getattr(product, "updated_at", None) or getattr(product, "created_at", None),
                "hashtags": tokenize_keywords(product.name)[:4],
                "visibility": "public",
                "stats_source": "detail_config" if isinstance(stats.get(str(media.id)) if isinstance(stats, dict) else None, dict) else "derived",
            }
        )
    rows.sort(key=lambda row: (_safe_int(row.get("views")), _safe_int(row.get("likes"))), reverse=True)
    return rows[: max(1, min(int(limit or 24), 48))]


def build_top_sellers(
    *,
    period: str,
    industry: str = "all",
    country: str = "all",
    search: str = "",
    limit: int = 50,
    request=None,
) -> list[dict]:
    normalized = normalize_seller_trends_period(period)
    now, start_curr, start_prev, _delta = parse_seller_trends_window(normalized)
    selected_country = (country or "all").strip().lower() or "all"
    items_qs = _order_items_queryset(
        seller=None,
        start_prev=start_prev,
        now=now,
        industry=(industry or "all").strip().lower(),
        search=(search or "").strip(),
    )
    seller_stats: dict[int, dict] = {}
    for item in items_qs.iterator(chunk_size=500):
        order = item.order
        ship_addr = getattr(order, "shipping_address", None) or {}
        order_country = country_to_iso((ship_addr.get("country") or ship_addr.get("country_name") or "").strip())
        if selected_country != "all" and order_country != selected_country:
            continue
        seller_id = int(order.seller_id)
        data = seller_stats.get(seller_id)
        if data is None:
            data = {
                "seller": order.seller,
                "curr_qty": 0,
                "curr_rev": 0.0,
                "prev_qty": 0,
                "curr_order_ids": set(),
                "disputed_order_ids": set(),
                "buyers": {},
                "products": set(),
                "markets": {},
                "top_products": {},
            }
            seller_stats[seller_id] = data
        qty = _safe_int(item.quantity)
        revenue = _safe_float(item.unit_price) * qty
        is_curr = bool(order.created_at and order.created_at >= start_curr)
        if is_curr:
            data["curr_qty"] += qty
            data["curr_rev"] += revenue
            data["curr_order_ids"].add(int(order.id))
            data["products"].add(int(item.product_id))
            buyer_id = int(order.buyer_id)
            data["buyers"][buyer_id] = data["buyers"].get(buyer_id, 0) + 1
            if order.status == Order.Status.DISPUTED:
                data["disputed_order_ids"].add(int(order.id))
            if order_country:
                market = data["markets"].get(order_country)
                if market is None:
                    market = {"revenue": 0.0, "orders": 0}
                    data["markets"][order_country] = market
                market["revenue"] = round(_safe_float(market.get("revenue")) + revenue, 2)
                market["orders"] += qty
            top_product = data["top_products"].get(int(item.product_id))
            if top_product is None:
                top_product = {"product": item.product, "orders": 0, "revenue": 0.0}
                data["top_products"][int(item.product_id)] = top_product
            top_product["orders"] += qty
            top_product["revenue"] = round(_safe_float(top_product.get("revenue")) + revenue, 2)
        else:
            data["prev_qty"] += qty
    if not seller_stats:
        return []
    seller_ids = list(seller_stats.keys())
    seller_review_map = {
        int(row["target_seller_id"]): {
            "avg": round(_safe_float(row.get("avg")), 1),
            "count": _safe_int(row.get("count")),
        }
        for row in (
            Review.objects.filter(
                deleted_at__isnull=True,
                target_type=Review.TargetType.SELLER,
                target_seller_id__in=seller_ids,
            )
            .values("target_seller_id")
            .annotate(avg=Avg("rating"), count=Count("id"))
        )
    }
    seller_products = _product_base_queryset().filter(seller_id__in=seller_ids)
    product_map = {int(product.id): product for product in seller_products}
    rows = []
    for seller_id, data in seller_stats.items():
        seller_user = data["seller"]
        profile = getattr(seller_user, "seller_profile", None)
        curr_qty = _safe_int(data["curr_qty"])
        prev_qty = _safe_int(data["prev_qty"])
        if curr_qty <= 0 and prev_qty <= 0:
            continue
        order_count = len(data["curr_order_ids"])
        change = int(round(((curr_qty - prev_qty) / max(prev_qty, 1)) * 100))
        buyer_counts = data["buyers"]
        repeat_buyers = len([1 for count in buyer_counts.values() if _safe_int(count) >= 2])
        repeat_rate = int(round((repeat_buyers / max(len(buyer_counts), 1)) * 100))
        disputed_rate = round((len(data["disputed_order_ids"]) / max(order_count, 1)) * 100.0, 1)
        rating_data = seller_review_map.get(seller_id) or {}
        rating = round(_safe_float(getattr(profile, "vehsl_rating", 0) or rating_data.get("avg")), 1)
        top_products = []
        for pid, top_product in sorted(
            (data.get("top_products") or {}).items(),
            key=lambda item: (_safe_float(item[1].get("revenue")), _safe_int(item[1].get("orders"))),
            reverse=True,
        )[:3]:
            product = product_map.get(pid) or top_product["product"]
            top_products.append(
                {
                    "name": product.name,
                    "image": product_primary_image_url(product, request=request),
                    "orders": _safe_int(top_product.get("orders")),
                    "revenue": round(_safe_float(top_product.get("revenue")), 2),
                }
            )
        top_markets = []
        for code, market in sorted(
            (data.get("markets") or {}).items(),
            key=lambda item: (_safe_float(item[1].get("revenue")), _safe_int(item[1].get("orders"))),
            reverse=True,
        )[:5]:
            top_markets.append(
                {
                    "name": iso_to_country_name(code),
                    "flag": iso_to_flag(code),
                    "revenue": round(_safe_float(market.get("revenue")), 2),
                    "orders": _safe_int(market.get("orders")),
                }
            )
        months_ago = max(0, int((timezone.now().date() - seller_user.date_joined.date()).days // 30))
        rows.append(
            {
                "id": str(seller_id),
                "seller_id": str(seller_id),
                "name": _seller_label(seller_user),
                "avatar": _initials(seller_user),
                "orders": curr_qty,
                "revenue": round(_safe_float(data["curr_rev"]), 2),
                "products": len(data["products"]),
                "rating": rating,
                "change": change,
                "avgOrderValue": round(_safe_float(data["curr_rev"]) / max(order_count, 1), 2),
                "joinedMonthsAgo": months_ago,
                "topProducts": top_products,
                "monthlySales": [],
                "topMarkets": top_markets,
                "returnRate": disputed_rate,
                "repeatBuyerRate": repeat_rate,
                "rating_count": _safe_int(rating_data.get("count")),
                "path": f"/admin/users?seller_id={seller_id}",
                "metrics_source": {
                    "return_rate": "derived_dispute_rate",
                },
            }
        )
    rows.sort(key=lambda row: (_safe_int(row.get("orders")), _safe_float(row.get("revenue"))), reverse=True)
    rows = rows[: max(1, min(int(limit or 50), 100))]
    top_seller_ids = [int(row["seller_id"]) for row in rows]
    month_start = now - timedelta(days=180)
    monthly_qs = (
        OrderItem.objects.select_related("order")
        .filter(
            deleted_at__isnull=True,
            order__deleted_at__isnull=True,
            order__created_at__gte=month_start,
            order__seller_id__in=top_seller_ids,
        )
        .exclude(order__status__in=[Order.Status.CANCELLED, Order.Status.REJECTED])
    )
    monthly_map: dict[int, dict[str, dict]] = {}
    for item in monthly_qs.iterator(chunk_size=500):
        order = item.order
        ship_addr = getattr(order, "shipping_address", None) or {}
        order_country = country_to_iso((ship_addr.get("country") or ship_addr.get("country_name") or "").strip())
        if selected_country != "all" and order_country != selected_country:
            continue
        key = order.created_at.strftime("%b")
        seller_id = int(order.seller_id)
        seller_months = monthly_map.setdefault(seller_id, {})
        entry = seller_months.get(key)
        if entry is None:
            entry = {"month": key, "orders": 0, "revenue": 0.0}
            seller_months[key] = entry
        qty = _safe_int(item.quantity)
        entry["orders"] += qty
        entry["revenue"] = round(_safe_float(entry.get("revenue")) + (_safe_float(item.unit_price) * qty), 2)
    month_labels = [(now - timedelta(days=30 * idx)).strftime("%b") for idx in range(5, -1, -1)]
    for row in rows:
        seller_id = int(row["seller_id"])
        seller_months = monthly_map.get(seller_id, {})
        row["monthlySales"] = [
            {
                "month": label,
                "orders": _safe_int((seller_months.get(label) or {}).get("orders")),
                "revenue": round(_safe_float((seller_months.get(label) or {}).get("revenue")), 2),
            }
            for label in month_labels
        ]
    for rank, row in enumerate(rows, start=1):
        row["rank"] = rank
    return rows

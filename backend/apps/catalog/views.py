import csv

from decimal import Decimal
from uuid import uuid4

from django.core.files.storage import default_storage
from django.db.models import Avg, BooleanField, Case, CharField, Count, DecimalField, ExpressionWrapper, F, IntegerField, Q, Sum, Value, When
from django.db.models.functions import Coalesce
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.admin_utils import AdminPageNumberPagination, audit
from apps.accounts.permissions import IsAdmin, IsSeller
from apps.accounts.models import Notification, User

from .models import (
    Category,
    ComplianceRule,
    InboundRequest,
    InboundRequestItem,
    ListingRequest,
    ListingRequestPhoto,
    PricingTier,
    Product,
    ProductMedia,
    ProductVariation,
    ShippingRate,
    Trademark,
    Warehouse,
    WarehouseStock,
)
from .serializers import (
    AdminProductListSerializer,
    AdminProductWriteSerializer,
    AdminListingRequestSerializer,
    CategorySerializer,
    ComplianceRuleSerializer,
    InboundRequestSerializer,
    InboundRequestItemSerializer,
    ListingRequestCreateSerializer,
    ListingRequestUpdateSerializer,
    ListingRequestSerializer,
    PricingTierSerializer,
    ProductMediaSerializer,
    ProductSerializer,
    ProductVariationSerializer,
    TrademarkSerializer,
    WarehouseSerializer,
    WarehouseStockSerializer,
)

def _ensure_seed_categories():
    try:
        has_real = (
            Category.objects.filter(deleted_at__isnull=True)
            .exclude(Q(slug__iexact="other") | Q(name__iexact="other"))
            .exists()
        )
    except Exception:
        has_real = True
    if has_real:
        return

    defaults: list[tuple[str, list[str]]] = [
        ("Vehicles", ["SUV", "Electric", "Accessories", "Heavy Vehicles", "Bike", "E Bikes", "Ships", "Helicopters", "Drones"]),
        ("Industrial", ["Machinery", "Raw Materials", "Industrial Chemicals", "Packaging", "Safety Gear", "Power Tools", "Construction Equipment", "Factory Automation"]),
        ("Hardware", ["Hand Tools", "Power Tools", "Fasteners", "Plumbing", "Electrical", "Paint", "Adhesives"]),
        ("Electronics", ["Laptops", "Phones", "Tablets", "Audio", "Wearables", "Components"]),
        ("Furniture", ["Living Room", "Bedroom", "Office", "Outdoor", "Kitchen"]),
        ("Energy", ["Solar Systems", "Batteries", "Inverters", "Generators", "EV Charging"]),
        ("Apparel", ["Men's Wear", "Women's Wear", "Kids", "Footwear", "Sportswear"]),
        ("Beauty", ["Skincare", "Hair Care", "Makeup", "Fragrance"]),
        ("Mining", ["Industrial Minerals", "Metals & Ores", "Excavation", "Safety"]),
        ("Agriculture", ["Farming Equipment", "Seeds", "Fertilizers", "Vegetables", "Fruits"]),
        ("Sports", ["Gym Equipment", "Outdoor Gear", "Team Sports", "Water Sports"]),
    ]

    for p_idx, (parent_name, children) in enumerate(defaults, start=1):
        parent, _ = Category.objects.get_or_create(
            name=parent_name,
            parent=None,
            defaults={"display_order": p_idx, "sort_order": 0},
        )
        if parent.display_order != p_idx:
            Category.objects.filter(id=parent.id).update(display_order=p_idx)
        for c_idx, child_name in enumerate(children, start=1):
            Category.objects.get_or_create(
                name=child_name,
                parent=parent,
                defaults={"display_order": c_idx, "sort_order": 0},
            )


def _create_product_from_listing_request(lr: ListingRequest) -> Product:
    category = lr.category
    if category is None:
        category = Category.objects.filter(Q(name__iexact="Other") | Q(slug__iexact="other")).first()
    if category is None:
        category = Category.objects.first()
    if category is None:
        category, _ = Category.objects.get_or_create(name="Other")

    p = Product.objects.create(
        seller=lr.seller,
        category=category,
        name=lr.product_name,
        title=lr.product_name,
        description=lr.description or "",
        currency=(lr.currency or "USD").upper(),
        price=lr.unit_price,
        status=Product.Status.ACTIVE,
        vehsl_rating=lr.rating,
    )
    try:
        meta = lr.product_meta if isinstance(lr.product_meta, dict) else {}
        sku = str(meta.get("sku") or "").strip()
        hs_code = str(meta.get("hs_code") or "").strip()
        origin_location = meta.get("origin_location") if isinstance(meta.get("origin_location"), dict) else {}
        detail_cfg = meta.get("detail_config") if isinstance(meta.get("detail_config"), dict) else {}
        ip_level = str(meta.get("ip_protection_level") or "").strip().lower()
        trademark_reg = str(meta.get("trademark_registration_number") or "").strip()
        variations_in = meta.get("variations") if isinstance(meta.get("variations"), list) else []
        tiers_in = meta.get("pricing_tiers") if isinstance(meta.get("pricing_tiers"), list) else []

        if sku:
            p.sku = sku[:64]
        if hs_code:
            p.hs_code = hs_code[:32]
        if ip_level and ip_level in {c[0] for c in Product.IpProtectionLevel.choices}:
            p.ip_protection_level = ip_level

        if isinstance(origin_location, dict):
            p.origin_location = {
                "country": str(origin_location.get("country") or "").strip(),
                "region": str(origin_location.get("region") or "").strip(),
                "city": str(origin_location.get("city") or "").strip(),
            }

        def as_int(v, default=None):
            try:
                if v is None or v == "":
                    return default
                return int(v)
            except Exception:
                return default

        lead = as_int(meta.get("lead_time_days"), None)
        if lead is not None and lead >= 0:
            p.lead_time_days = int(lead)

        w = as_int(meta.get("weight_grams"), None)
        if w is not None and w > 0:
            p.weight_grams = int(w)

        mn = as_int(meta.get("ship_time_min_days"), None)
        mx = as_int(meta.get("ship_time_max_days"), None)
        if mn is not None and mn >= 0:
            p.ship_time_min_days = int(mn)
        if mx is not None and mx >= 0:
            p.ship_time_max_days = int(mx)
        if mn is not None and mx is not None and int(mx) < int(mn):
            p.ship_time_min_days = int(mx)
            p.ship_time_max_days = int(mn)

        p.sample_available = bool(meta.get("sample_available") is True)
        ss = as_int(meta.get("sample_ship_days"), None)
        if ss is not None and ss >= 0:
            p.sample_ship_days = int(ss)

        merged_cfg = dict(detail_cfg) if isinstance(detail_cfg, dict) else {}
        try:
            merged_cfg["moq"] = int(lr.moq or 1)
        except Exception:
            merged_cfg["moq"] = 1
        if (lr.company_name or "").strip():
            merged_cfg.setdefault("company_name", (lr.company_name or "").strip())
        if (lr.monthly_capacity or "").strip():
            merged_cfg.setdefault("monthly_capacity", (lr.monthly_capacity or "").strip())
        p.detail_config = merged_cfg
        p.save()

        created_variations: list[ProductVariation] = []
        if isinstance(variations_in, list) and variations_in:
            for v in variations_in[:40]:
                if not isinstance(v, dict):
                    continue
                attrs = v.get("attributes") if isinstance(v.get("attributes"), dict) else {}
                cleaned_attrs = {}
                for k, val in list(attrs.items())[:30]:
                    kk = str(k or "").strip()
                    vv = str(val or "").strip()
                    if not kk or not vv:
                        continue
                    if len(kk) > 40 or len(vv) > 80:
                        continue
                    cleaned_attrs[kk] = vv
                vsku = str(v.get("sku") or "").strip()[:64]
                created_variations.append(ProductVariation.objects.create(product=p, attributes=cleaned_attrs, sku=vsku))

        created_tiers = 0
        if isinstance(tiers_in, list) and tiers_in:
            base_currency = (p.currency or "USD").upper()

            def as_int(v, default=None):
                try:
                    if v is None or v == "":
                        return default
                    return int(v)
                except Exception:
                    return default

            for t in tiers_in[:120]:
                if not isinstance(t, dict):
                    continue
                min_q = as_int(t.get("min_quantity"), 1)
                max_q = as_int(t.get("max_quantity"), None) if t.get("max_quantity", None) is not None else None
                if max_q is not None and max_q < min_q:
                    continue
                cur = str(t.get("currency") or base_currency).strip().upper()
                if len(cur) != 3 or cur != base_currency:
                    continue
                unit_price_raw = t.get("unit_price")
                try:
                    unit_price = Decimal(str(unit_price_raw).strip())
                except Exception:
                    continue
                if unit_price < 0:
                    continue
                v_idx = as_int(t.get("variation"), None)
                variation = None
                if v_idx is not None and 0 <= v_idx < len(created_variations):
                    variation = created_variations[v_idx]
                PricingTier.objects.create(
                    product=p,
                    variation=variation,
                    min_quantity=max(1, int(min_q or 1)),
                    max_quantity=int(max_q) if max_q is not None else None,
                    unit_price=unit_price,
                    currency=base_currency,
                )
                created_tiers += 1

        if created_tiers <= 0 and int(lr.moq or 1) > 1:
            PricingTier.objects.get_or_create(
                product=p,
                variation=None,
                min_quantity=int(lr.moq or 1),
                max_quantity=None,
                currency=(p.currency or "USD").upper(),
                defaults={"unit_price": lr.unit_price},
            )

        if trademark_reg:
            Trademark.objects.create(
                seller=lr.seller,
                product=p,
                registration_number=trademark_reg[:128],
                status=Trademark.Status.PENDING,
            )
    except Exception:
        pass

    photos = list(lr.photos.all())
    img_pos = 0
    doc_pos = 0
    for ph in photos[:25]:
        try:
            url = ph.file.url
        except Exception:
            continue
        ct = (getattr(ph, "content_type", "") or "").lower()
        if ct.startswith("image/"):
            ProductMedia.objects.create(product=p, media_type=ProductMedia.MediaType.IMAGE, url=url, position=img_pos)
            img_pos += 1
        else:
            ProductMedia.objects.create(
                product=p,
                media_type=ProductMedia.MediaType.DOCUMENT,
                url=url,
                title=(getattr(ph, "original_name", "") or "").strip()[:160],
                content_type=(getattr(ph, "content_type", "") or "").strip()[:128],
                size_bytes=int(getattr(ph, "size_bytes", 0) or 0),
                position=doc_pos,
            )
            doc_pos += 1

    return p


def _listing_request_missing_required_product_fields(lr: ListingRequest) -> list[str]:
    meta = lr.product_meta if isinstance(lr.product_meta, dict) else {}
    origin = meta.get("origin_location") if isinstance(meta.get("origin_location"), dict) else {}
    missing: list[str] = []
    if not str(meta.get("sku") or "").strip():
        missing.append("sku")
    if not str(meta.get("hs_code") or "").strip():
        missing.append("hs_code")
    if not str(origin.get("country") or "").strip():
        missing.append("origin_country")
    if meta.get("lead_time_days", None) in (None, ""):
        missing.append("lead_time_days")
    if meta.get("weight_grams", None) in (None, ""):
        missing.append("weight_grams")
    if meta.get("ship_time_min_days", None) in (None, "") or meta.get("ship_time_max_days", None) in (None, ""):
        missing.append("ship_time_range_days")
    return missing


def _listing_request_required_documents(lr: ListingRequest) -> set[str]:
    required_documents: set[str] = set()
    try:
        rules = list(ComplianceRule.objects.filter(category_id=lr.category_id, deleted_at__isnull=True).order_by("-created_at")[:200])
        for r in rules:
            payload = getattr(r, "payload", None) or {}
            if isinstance(payload, dict):
                docs = payload.get("required_documents") or payload.get("required_certifications") or payload.get("certifications")
                if isinstance(docs, list):
                    for item in docs:
                        s = str(item or "").strip()
                        if s:
                            required_documents.add(s)
                elif isinstance(docs, str):
                    s = docs.strip()
                    if s:
                        required_documents.add(s)
    except Exception:
        required_documents = set()
    return required_documents


def _listing_request_non_image_attachment_count(lr: ListingRequest) -> int:
    doc_count = 0
    try:
        for ph in list(lr.photos.all())[:50]:
            ct = (getattr(ph, "content_type", "") or "").lower()
            if ct and not ct.startswith("image/"):
                doc_count += 1
    except Exception:
        doc_count = 0
    return doc_count


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "slug"]

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [permissions.IsAuthenticated(), IsAdmin()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        obj = serializer.save()
        audit(self.request.user, action="admin_category_created", target_type="category", target_id=str(obj.id), payload={})

    def perform_update(self, serializer):
        obj = serializer.save()
        audit(
            self.request.user,
            action="admin_category_updated",
            target_type="category",
            target_id=str(obj.id),
            payload={"fields": list((self.request.data or {}).keys())},
        )

    def perform_destroy(self, instance):
        obj_id = getattr(instance, "id", "")
        audit(self.request.user, action="admin_category_deleted", target_type="category", target_id=str(obj_id), payload={})
        super().perform_destroy(instance)

    @action(detail=False, methods=["get"], url_path="explore")
    def explore(self, request):
        _ensure_seed_categories()
        base_all = Category.objects.filter(deleted_at__isnull=True)
        base_qs = base_all.exclude(Q(slug__iexact="other") | Q(name__iexact="other"))
        top = list(base_qs.filter(parent__isnull=True).order_by("display_order", "sort_order", "name"))
        if not top:
            top = list(base_all.filter(parent__isnull=True).order_by("display_order", "sort_order", "name"))
        if not top:
            return Response({"categories": [], "total_products": 0})

        top_ids = [c.id for c in top]
        children = list(base_all.filter(parent_id__in=top_ids).order_by("display_order", "sort_order", "name"))
        all_cat_ids = top_ids + [c.id for c in children]

        product_qs = Product.objects.filter(
            deleted_at__isnull=True,
            status__in=[Product.Status.APPROVED, Product.Status.ACTIVE],
            category_id__in=all_cat_ids,
        )
        counts = {row["category_id"]: row["c"] for row in product_qs.values("category_id").annotate(c=Count("id"))}

        children_by_parent: dict[int, list[Category]] = {}
        for ch in children:
            children_by_parent.setdefault(int(ch.parent_id), []).append(ch)

        out = []
        total_products = 0
        for c in top:
            chs = children_by_parent.get(int(c.id), [])
            children_out = []
            subtotal = int(counts.get(c.id, 0) or 0)
            for ch in chs:
                ch_count = int(counts.get(ch.id, 0) or 0)
                subtotal += ch_count
                children_out.append(
                    {
                        "id": int(ch.id),
                        "name": ch.name,
                        "slug": ch.slug,
                        "accent": ch.accent or "",
                        "icon": ch.icon or "",
                        "product_count": ch_count,
                        "parent_id": int(c.id),
                    }
                )

            total_products += subtotal
            out.append(
                {
                    "id": int(c.id),
                    "name": c.name,
                    "slug": c.slug,
                    "accent": c.accent or "",
                    "icon": c.icon or "",
                    "product_count": subtotal,
                    "children": children_out,
                }
            )

        return Response({"categories": out, "total_products": total_products})


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    pagination_class = AdminPageNumberPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "title", "sku", "description"]
    ordering_fields = ["created_at", "price"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = Product.objects.select_related("category", "seller").prefetch_related("media").filter(deleted_at__isnull=True)
        user = self.request.user
        if user.is_authenticated and user.account_type == "seller":
            out = qs.filter(seller=user)
        else:
            out = qs.filter(status__in=[Product.Status.APPROVED, Product.Status.ACTIVE])

        cat = (self.request.query_params.get("category") or "").strip()
        if cat:
            try:
                cat_id = int(cat)
            except Exception:
                cat_id = None
            if cat_id:
                out = out.filter(category_id=cat_id)
            else:
                cat_obj = Category.objects.filter(deleted_at__isnull=True, slug__iexact=cat).first()
                if cat_obj:
                    child_ids = list(
                        Category.objects.filter(deleted_at__isnull=True, parent=cat_obj).values_list("id", flat=True)
                    )
                    out = out.filter(category_id__in=[int(cat_obj.id), *[int(x) for x in child_ids]])
                else:
                    out = out.filter(category__slug__iexact=cat)

        raw_min_price = (self.request.query_params.get("min_price") or "").strip()
        if raw_min_price:
            try:
                out = out.filter(price__gte=Decimal(raw_min_price))
            except Exception:
                pass

        raw_max_price = (self.request.query_params.get("max_price") or "").strip()
        if raw_max_price:
            try:
                out = out.filter(price__lte=Decimal(raw_max_price))
            except Exception:
                pass

        out = out.annotate(
            review_count=Count("reviews", filter=Q(reviews__deleted_at__isnull=True), distinct=True),
            average_rating=Avg("reviews__rating", filter=Q(reviews__deleted_at__isnull=True)),
        )

        raw_min_rating = (self.request.query_params.get("min_rating") or "").strip()
        if raw_min_rating:
            try:
                out = out.filter(average_rating__gte=float(raw_min_rating))
            except Exception:
                pass

        return out.prefetch_related("variations", "pricing_tiers")

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [permissions.IsAuthenticated(), IsSeller()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        try:
            obj.status = Product.Status.ARCHIVED
            obj.save(update_fields=["status", "updated_at"])
        except Exception:
            obj.status = Product.Status.ARCHIVED
            obj.save(update_fields=["status", "updated_at"])
        audit(
            request.user,
            action="seller_product_deleted",
            target_type="product",
            target_id=str(getattr(obj, "id", "") or ""),
            payload={"status": "archived"},
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["get"], url_path="compare")
    def compare(self, request, *args, **kwargs):
        raw = (request.query_params.get("ids") or "").strip()
        if not raw:
            return Response({"results": []})
        ids = []
        for part in raw.split(","):
            part = part.strip()
            if not part:
                continue
            try:
                ids.append(int(part))
            except Exception:
                continue
        uniq = []
        seen = set()
        for i in ids:
            if i in seen:
                continue
            seen.add(i)
            uniq.append(i)
        uniq = uniq[:4]
        qs = self.get_queryset().filter(id__in=uniq).prefetch_related("media", "variations", "pricing_tiers")
        rows = list(qs)
        order = {pid: idx for idx, pid in enumerate(uniq)}
        rows.sort(key=lambda p: order.get(getattr(p, "id", 0), 999))
        data = ProductSerializer(rows, many=True, context={"request": request}).data
        return Response({"results": data})

    @action(detail=False, methods=["get"], url_path="facets")
    def facets(self, request):
        return Response(
            {
                "price_options": [
                    {"label": "Under $50", "value": "under-50", "min_price": None, "max_price": 50},
                    {"label": "$50–$500", "value": "50-500", "min_price": 50, "max_price": 500},
                    {"label": "$500–$5K", "value": "500-5k", "min_price": 500, "max_price": 5000},
                    {"label": "$5K–$50K", "value": "5k-50k", "min_price": 5000, "max_price": 50000},
                    {"label": "$50K+", "value": "50k-plus", "min_price": 50000, "max_price": None},
                    {"label": "Bulk / B2B", "value": "bulk", "min_price": None, "max_price": None},
                ],
                "rating_options": [
                    {"label": "4.5+", "value": 4.5},
                    {"label": "4.0+", "value": 4.0},
                    {"label": "3.5+", "value": 3.5},
                ],
                "qa_grades": [
                    {"label": "A+", "desc": "Premium", "value": "a-plus", "color": "#059669", "bg": "rgba(5,150,105,0.08)"},
                    {"label": "A", "desc": "Verified", "value": "a", "color": "#2563eb", "bg": "rgba(37,99,235,0.08)"},
                    {"label": "B", "desc": "Standard", "value": "b", "color": "#d97706", "bg": "rgba(217,119,6,0.08)"},
                    {"label": "C", "desc": "Budget", "value": "c", "color": "#6b7280", "bg": "rgba(107,114,128,0.06)"},
                ],
            }
        )


class WarehouseViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = WarehouseSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Warehouse.objects.filter(active=True).order_by("country", "city", "name", "id")
        country = (self.request.query_params.get("country") or "").strip()
        city = (self.request.query_params.get("city") or "").strip()
        region = (self.request.query_params.get("region") or "").strip()
        if country:
            qs = qs.filter(country__iexact=country)
        if region:
            qs = qs.filter(region__iexact=region)
        if city:
            qs = qs.filter(city__iexact=city)
        return qs


class ShippingQuoteAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        raw_pid = (request.query_params.get("product_id") or "").strip()
        try:
            product_id = int(raw_pid)
        except Exception:
            product_id = 0
        if not product_id:
            return Response({"detail": "product_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        raw_qty = (request.query_params.get("quantity") or "").strip()
        try:
            qty = int(raw_qty or 1)
        except Exception:
            qty = 1
        qty = max(1, min(100000, qty))

        product = (
            Product.objects.select_related("seller")
            .filter(id=product_id, deleted_at__isnull=True)
            .first()
        )
        if not product:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        def norm_country(val: str) -> str:
            return (val or "").strip().lower()

        def country_from_location(loc: object) -> str:
            if not loc or not isinstance(loc, dict):
                return ""
            return str(loc.get("country") or "").strip()

        origin_country = ""
        try:
            origin_country = country_from_location(getattr(product, "origin_location", None))
        except Exception:
            origin_country = ""

        if not origin_country:
            try:
                sp = getattr(getattr(product, "seller", None), "seller_profile", None)
                if sp:
                    origin_country = country_from_location(getattr(sp, "warehouse_location", None)) or (getattr(sp, "country", "") or "")
            except Exception:
                origin_country = ""

        dest_country = (request.query_params.get("country") or "").strip()
        raw_addr_id = (request.query_params.get("address_id") or "").strip()
        if raw_addr_id:
            if not request.user.is_authenticated:
                return Response({"detail": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)
            try:
                addr_id = int(raw_addr_id)
            except Exception:
                addr_id = 0
            if not addr_id:
                return Response({"detail": "Invalid address_id."}, status=status.HTTP_400_BAD_REQUEST)
            from apps.accounts.models import BuyerAddress

            addr = BuyerAddress.objects.filter(id=addr_id, user=request.user).first()
            if not addr:
                return Response({"detail": "Address not found."}, status=status.HTTP_404_NOT_FOUND)
            dest_country = (getattr(addr, "country", "") or "").strip()

        methods = [
            ("sea", "Sea Freight"),
            ("air", "Air Freight"),
            ("express", "Express Air"),
        ]

        try:
            weight_grams = int(getattr(product, "weight_grams", 0) or 0)
        except Exception:
            weight_grams = 0
        weight_grams = max(1, weight_grams or 1)
        total_kg = Decimal(weight_grams * qty) / Decimal(1000)
        if total_kg <= 0:
            total_kg = Decimal("0.01")

        try:
            handling_min = int(getattr(product, "ship_time_min_days", 0) or 0)
        except Exception:
            handling_min = 0
        try:
            handling_max = int(getattr(product, "ship_time_max_days", handling_min) or handling_min)
        except Exception:
            handling_max = handling_min
        handling_min = max(0, handling_min)
        handling_max = max(handling_min, handling_max)

        origin_norm = norm_country(origin_country)
        dest_norm = norm_country(dest_country)

        def pick_rate(method: str):
            candidates = list(ShippingRate.objects.filter(active=True, method=method).order_by("-updated_at", "-id")[:200])
            if not candidates:
                return None
            best = None
            best_score = -1
            for r in candidates:
                ro = norm_country(getattr(r, "origin_country", ""))
                rd = norm_country(getattr(r, "dest_country", ""))
                if ro and origin_norm and ro != origin_norm:
                    continue
                if rd and dest_norm and rd != dest_norm:
                    continue
                if rd and not dest_norm:
                    continue
                score = 0
                if ro:
                    score += 2
                if rd:
                    score += 2
                if score > best_score:
                    best = r
                    best_score = score
            return best

        def fallback_rate(method: str) -> dict:
            if method == "sea":
                return {"currency": "USD", "base_fee": Decimal("20.00"), "price_per_kg": Decimal("0.90"), "per_unit_fee": Decimal("0.00"), "min": 30, "max": 40}
            if method == "air":
                return {"currency": "USD", "base_fee": Decimal("35.00"), "price_per_kg": Decimal("4.25"), "per_unit_fee": Decimal("0.00"), "min": 7, "max": 12}
            return {"currency": "USD", "base_fee": Decimal("45.00"), "price_per_kg": Decimal("6.50"), "per_unit_fee": Decimal("0.00"), "min": 3, "max": 5}

        results = []
        for method, label in methods:
            r = pick_rate(method)
            if r:
                currency = (getattr(r, "currency", "") or "USD").upper()
                base_fee = Decimal(getattr(r, "base_fee", 0) or 0)
                ppk = Decimal(getattr(r, "price_per_kg", 0) or 0)
                ppu = Decimal(getattr(r, "per_unit_fee", 0) or 0)
                tmin = int(getattr(r, "transit_min_days", 0) or 0)
                tmax = int(getattr(r, "transit_max_days", tmin) or tmin)
                source = "rate_card"
            else:
                fb = fallback_rate(method)
                currency = fb["currency"]
                base_fee = fb["base_fee"]
                ppk = fb["price_per_kg"]
                ppu = fb["per_unit_fee"]
                tmin = int(fb["min"])
                tmax = int(fb["max"])
                source = "fallback"

            tmin = max(0, tmin)
            tmax = max(tmin, tmax)

            total = base_fee + (ppk * total_kg) + (ppu * Decimal(qty))
            if total < 0:
                total = Decimal("0")
            unit = total / Decimal(qty)

            results.append(
                {
                    "method": method,
                    "label": label,
                    "currency": currency,
                    "unit_price": f"{unit.quantize(Decimal('0.01'))}",
                    "total_price": f"{total.quantize(Decimal('0.01'))}",
                    "min_days": int(handling_min + tmin),
                    "max_days": int(handling_max + tmax),
                    "handling_min_days": handling_min,
                    "handling_max_days": handling_max,
                    "transit_min_days": tmin,
                    "transit_max_days": tmax,
                    "origin_country": origin_country,
                    "dest_country": dest_country,
                    "weight_grams": weight_grams,
                    "quantity": qty,
                    "source": source,
                }
            )

        return Response({"results": results})


class SellerListingRequestViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated, IsSeller]
    serializer_class = ListingRequestSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return ListingRequest.objects.filter(seller=self.request.user).select_related("category", "created_product").prefetch_related("photos")

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset().order_by("-created_at")
        return Response(ListingRequestSerializer(qs, many=True, context={"request": request}).data)

    def retrieve(self, request, pk=None, *args, **kwargs):
        obj = self.get_queryset().filter(pk=pk).first()
        if not obj:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(ListingRequestSerializer(obj, context={"request": request}).data)

    def create(self, request, *args, **kwargs):
        ser = ListingRequestCreateSerializer(data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)
        lr = ser.save()
        try:
            files = []
            for key in ["photos", "images", "documents", "docs", "files"]:
                try:
                    files.extend(list(request.FILES.getlist(key) or []))
                except Exception:
                    continue
            files = files[:20]
            for f in files:
                try:
                    ListingRequestPhoto.objects.create(
                        listing_request=lr,
                        file=f,
                        original_name=getattr(f, "name", "") or "",
                        content_type=getattr(f, "content_type", "") or "",
                        size_bytes=int(getattr(f, "size", 0) or 0),
                    )
                except Exception:
                    continue
        except Exception:
            pass
        audit(
            request.user,
            action="seller_listing_request_submitted",
            target_type="listing_request",
            target_id=str(lr.id),
            payload={
                "product_name": (getattr(lr, "product_name", "") or "").strip(),
                "stage": (getattr(lr, "stage", "") or "").strip(),
                "category_id": str(getattr(lr, "category_id", "") or ""),
            },
        )
        out = ListingRequestSerializer(lr, context={"request": request}).data
        return Response(out, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None, *args, **kwargs):
        lr = self.get_queryset().filter(pk=pk).first()
        if not lr:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        if lr.created_product_id or lr.stage in {ListingRequest.Stage.DONE, ListingRequest.Stage.LIVE}:
            return Response({"detail": "This listing request can no longer be edited."}, status=status.HTTP_400_BAD_REQUEST)
        if lr.stage not in {ListingRequest.Stage.SAMPLES, ListingRequest.Stage.COMPLIANCE}:
            return Response({"detail": "You can only edit a listing request when it is in Samples or Compliance."}, status=status.HTTP_400_BAD_REQUEST)

        ser = ListingRequestUpdateSerializer(lr, data=request.data, partial=True, context={"request": request})
        ser.is_valid(raise_exception=True)
        lr = ser.save()
        audit(
            request.user,
            action="seller_listing_request_updated",
            target_type="listing_request",
            target_id=str(lr.id),
            payload={"stage": lr.stage},
        )
        return Response(ListingRequestSerializer(lr, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="sample")
    def sample(self, request, pk=None):
        lr = self.get_queryset().filter(pk=pk).first()
        if not lr:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        lr.pickup_type = (request.data.get("type") or request.data.get("pickup_type") or "").strip()
        lr.pickup_address = (request.data.get("address") or request.data.get("pickup_address") or "").strip()
        lr.pickup_contact_name = (request.data.get("contact_name") or request.data.get("pickup_contact_name") or "").strip()
        lr.pickup_phone = (request.data.get("phone") or request.data.get("pickup_phone") or "").strip()

        if len(lr.pickup_address) < 7 or len(lr.pickup_contact_name) < 2:
            return Response({"detail": "Pickup address and contact name are required."}, status=status.HTTP_400_BAD_REQUEST)

        lr.stage = ListingRequest.Stage.INSPECTION
        lr.save()
        audit(
            request.user,
            action="seller_listing_request_stage_updated",
            target_type="listing_request",
            target_id=str(lr.id),
            payload={"stage": lr.stage, "from": "sample"},
        )
        return Response(ListingRequestSerializer(lr, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="advance")
    def advance(self, request, pk=None):
        return Response({"detail": "Only the review team can advance inspection stages."}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=["post"], url_path="publish")
    def publish(self, request, pk=None):
        return Response({"detail": "Only the review team can publish listings."}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=["post"], url_path="resubmit")
    def resubmit(self, request, pk=None):
        lr = self.get_queryset().filter(pk=pk).first()
        if not lr:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        if lr.created_product_id:
            return Response({"detail": "This listing request has already been published."}, status=status.HTTP_400_BAD_REQUEST)
        if lr.stage != ListingRequest.Stage.SAMPLES:
            return Response({"detail": "Only listing requests in Samples can be resubmitted."}, status=status.HTTP_400_BAD_REQUEST)

        lr.stage = ListingRequest.Stage.COMPLIANCE
        lr.compliance_verified = False
        lr.compliance_notes = ""
        lr.inspected = False
        lr.inspector = None
        lr.save(update_fields=["stage", "compliance_verified", "compliance_notes", "inspected", "inspector", "updated_at"])
        audit(
            request.user,
            action="seller_listing_request_resubmitted",
            target_type="listing_request",
            target_id=str(lr.id),
            payload={"stage": lr.stage},
        )
        return Response(ListingRequestSerializer(lr, context={"request": request}).data)


class AdminListingRequestViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = AdminListingRequestSerializer
    pagination_class = AdminPageNumberPagination
    parser_classes = [JSONParser]

    def get_queryset(self):
        return (
            ListingRequest.objects.select_related("seller", "category", "created_product")
            .prefetch_related("photos")
            .order_by("-created_at")
        )

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        stage = (request.query_params.get("stage") or "").strip().lower()
        q = (request.query_params.get("q") or "").strip()
        seller = (request.query_params.get("seller") or "").strip()
        if stage and stage != "all":
            qs = qs.filter(stage=stage)
        if seller:
            qs = qs.filter(Q(seller__email__icontains=seller) | Q(seller__first_name__icontains=seller) | Q(seller__last_name__icontains=seller))
        if q:
            qs = qs.filter(Q(product_name__icontains=q) | Q(company_name__icontains=q) | Q(description__icontains=q))
        page = self.paginate_queryset(qs)
        items = list(page) if page is not None else []
        category_ids = {int(x.category_id) for x in items if getattr(x, "category_id", None)}
        required_documents_by_category: dict[int, list[str]] = {}
        if category_ids:
            cat_map: dict[int, set[str]] = {cid: set() for cid in category_ids}
            try:
                rules = list(ComplianceRule.objects.filter(category_id__in=list(category_ids), deleted_at__isnull=True).order_by("-created_at")[:400])
                for r in rules:
                    payload = getattr(r, "payload", None) or {}
                    if not isinstance(payload, dict):
                        continue
                    docs = payload.get("required_documents") or payload.get("required_certifications") or payload.get("certifications")
                    if docs is None:
                        continue
                    if isinstance(docs, str):
                        s = docs.strip()
                        if s:
                            cat_map.get(int(r.category_id), set()).add(s)
                    elif isinstance(docs, list):
                        for item in docs:
                            s = str(item or "").strip()
                            if s:
                                cat_map.get(int(r.category_id), set()).add(s)
            except Exception:
                cat_map = {cid: set() for cid in category_ids}
            required_documents_by_category = {cid: sorted(list(vals))[:80] for cid, vals in cat_map.items() if vals}

        missing_fields_by_id: dict[int, list[str]] = {}
        documents_attached_by_id: dict[int, int] = {}
        for lr in items:
            lrid = int(getattr(lr, "id", 0) or 0)
            if not lrid:
                continue
            meta = lr.product_meta if isinstance(getattr(lr, "product_meta", None), dict) else {}
            origin = meta.get("origin_location") if isinstance(meta.get("origin_location"), dict) else {}
            missing: list[str] = []
            if not str(meta.get("sku") or "").strip():
                missing.append("sku")
            if not str(meta.get("hs_code") or "").strip():
                missing.append("hs_code")
            if not str(origin.get("country") or "").strip():
                missing.append("origin_country")
            if meta.get("lead_time_days", None) in (None, ""):
                missing.append("lead_time_days")
            if meta.get("weight_grams", None) in (None, ""):
                missing.append("weight_grams")
            if meta.get("ship_time_min_days", None) in (None, "") or meta.get("ship_time_max_days", None) in (None, ""):
                missing.append("ship_time_range_days")
            missing_fields_by_id[lrid] = missing

            doc_count = 0
            try:
                for ph in list(lr.photos.all())[:50]:
                    ct = (getattr(ph, "content_type", "") or "").lower()
                    if ct and not ct.startswith("image/"):
                        doc_count += 1
            except Exception:
                doc_count = 0
            documents_attached_by_id[lrid] = doc_count

        ser = AdminListingRequestSerializer(
            items,
            many=True,
            context={
                "request": request,
                "required_documents_by_category": required_documents_by_category,
                "missing_fields_by_id": missing_fields_by_id,
                "documents_attached_by_id": documents_attached_by_id,
            },
        )
        return self.get_paginated_response(ser.data)

    def retrieve(self, request, pk=None, *args, **kwargs):
        obj = self.get_queryset().filter(pk=pk).first()
        if not obj:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        cid = getattr(obj, "category_id", None)
        required_documents_by_category: dict[int, list[str]] = {}
        if cid:
            required_documents_by_category = {int(cid): sorted(list(_listing_request_required_documents(obj)))[:80]}
        missing_fields_by_id = {int(obj.id): _listing_request_missing_required_product_fields(obj)}
        documents_attached_by_id = {int(obj.id): _listing_request_non_image_attachment_count(obj)}
        return Response(
            AdminListingRequestSerializer(
                obj,
                context={
                    "request": request,
                    "required_documents_by_category": required_documents_by_category,
                    "missing_fields_by_id": missing_fields_by_id,
                    "documents_attached_by_id": documents_attached_by_id,
                },
            ).data
        )

    @action(detail=True, methods=["post"], url_path="review")
    def review(self, request, pk=None):
        lr = self.get_queryset().filter(pk=pk).first()
        if not lr:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        decision = (request.data.get("decision") or "").strip().lower()
        message = (request.data.get("message") or "").strip()
        rating_in = request.data.get("rating", None)

        if decision not in {"approve", "needs_changes", "reject"}:
            return Response({"detail": "Invalid decision."}, status=status.HTTP_400_BAD_REQUEST)

        if decision == "approve":
            if not lr.compliance_verified:
                return Response({"detail": "Compliance must be verified before approval."}, status=status.HTTP_400_BAD_REQUEST)
            if lr.inspector and not lr.inspected:
                return Response({"detail": "Inspection must be completed before approval."}, status=status.HTTP_400_BAD_REQUEST)
            if lr.stage != ListingRequest.Stage.INBOUND:
                return Response({"detail": "Inbound must be completed before approval."}, status=status.HTTP_400_BAD_REQUEST)
            inbound_status = ""
            try:
                inbound_obj = getattr(lr, "inbound_request", None)
            except Exception:
                inbound_obj = None
            if inbound_obj is not None:
                inbound_status = (getattr(inbound_obj, "status", "") or "").lower()
                if inbound_status and inbound_status != InboundRequest.Status.RECEIVED:
                    return Response({"detail": "Inbound must be received before approval.", "inbound_status": inbound_status}, status=status.HTTP_400_BAD_REQUEST)
            missing = _listing_request_missing_required_product_fields(lr)
            if missing:
                return Response(
                    {"detail": "Listing request is missing required product fields.", "missing": missing},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            required_documents = _listing_request_required_documents(lr)
            if required_documents and _listing_request_non_image_attachment_count(lr) <= 0:
                return Response(
                    {"detail": "Compliance documents required before approval.", "required_documents": sorted(list(required_documents))[:80]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                rating = float(rating_in) if rating_in is not None else float(lr.rating or 4.8)
            except Exception:
                rating = 4.8
            rating = max(0.0, min(5.0, rating))
            lr.rating = rating
            lr.stage = ListingRequest.Stage.LIVE
            lr.save(update_fields=["rating", "stage", "updated_at"])
            try:
                Notification.objects.create(
                    user=lr.seller,
                    channel=Notification.Channel.IN_APP,
                    event_type="listing_request_approved",
                    payload={
                        "title": "Listing approved",
                        "body": f'Your listing "{(lr.product_name or "").strip()}" was approved and is pending publish.',
                        "listing_request_id": str(lr.id),
                        "stage": lr.stage,
                        "rating": float(rating),
                    },
                    status=Notification.Status.QUEUED,
                )
            except Exception:
                pass
            audit(
                request.user,
                action="admin_listing_request_reviewed",
                target_type="listing_request",
                target_id=str(lr.id),
                payload={"decision": "approve", "rating": float(rating)},
            )
            return Response(AdminListingRequestSerializer(lr, context={"request": request}).data)

        meta = lr.product_meta if isinstance(lr.product_meta, dict) else {}
        if message:
            meta = {**meta, "review_message": message}
            lr.product_meta = meta

        if decision == "needs_changes":
            lr.rating = None
            lr.stage = ListingRequest.Stage.SAMPLES
            lr.compliance_verified = False
            lr.compliance_notes = ""
            lr.inspected = False
            lr.inspector = None
            lr.save(update_fields=["product_meta", "rating", "stage", "compliance_verified", "compliance_notes", "inspected", "inspector", "updated_at"])
            try:
                Notification.objects.create(
                    user=lr.seller,
                    channel=Notification.Channel.IN_APP,
                    event_type="listing_request_changes_requested",
                    payload={"listing_request_id": str(lr.id), "message": message, "stage": lr.stage},
                    status=Notification.Status.QUEUED,
                )
            except Exception:
                pass
            audit(
                request.user,
                action="admin_listing_request_reviewed",
                target_type="listing_request",
                target_id=str(lr.id),
                payload={"decision": "needs_changes"},
            )
            return Response(AdminListingRequestSerializer(lr, context={"request": request}).data)

        lr.rating = None
        lr.stage = ListingRequest.Stage.DONE
        lr.save(update_fields=["product_meta", "rating", "stage", "updated_at"])
        audit(
            request.user,
            action="admin_listing_request_reviewed",
            target_type="listing_request",
            target_id=str(lr.id),
            payload={"decision": "reject"},
        )
        return Response(AdminListingRequestSerializer(lr, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="publish")
    def publish(self, request, pk=None):
        lr = self.get_queryset().filter(pk=pk).first()
        if not lr:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if lr.created_product_id:
            lr.stage = ListingRequest.Stage.DONE
            lr.save(update_fields=["stage", "updated_at"])
            return Response(AdminListingRequestSerializer(lr, context={"request": request}).data)

        if lr.stage != ListingRequest.Stage.LIVE:
            return Response({"detail": "Listing must be approved (Live stage) before publish."}, status=status.HTTP_400_BAD_REQUEST)

        missing = _listing_request_missing_required_product_fields(lr)
        if missing:
            return Response(
                {"detail": "Listing request is missing required product fields.", "missing": missing},
                status=status.HTTP_400_BAD_REQUEST,
            )

        required_documents = _listing_request_required_documents(lr)

        if required_documents:
            if _listing_request_non_image_attachment_count(lr) <= 0:
                return Response(
                    {"detail": "Compliance documents required before publish.", "required_documents": sorted(list(required_documents))[:80]},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if not lr.compliance_verified:
            return Response({"detail": "Compliance must be verified before publish."}, status=status.HTTP_400_BAD_REQUEST)

        if lr.inspector and not lr.inspected:
            return Response({"detail": "Inspection must be completed before publish."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            rating = float(request.data.get("rating")) if request.data.get("rating") is not None else float(lr.rating or 4.8)
        except Exception:
            rating = 4.8
        rating = max(0.0, min(5.0, rating))
        lr.rating = rating
        lr.stage = ListingRequest.Stage.LIVE
        lr.save(update_fields=["rating", "stage", "updated_at"])

        p = _create_product_from_listing_request(lr)
        audit(
            request.user,
            action="admin_product_created",
            target_type="product",
            target_id=str(p.id),
            payload={"product_name": (p.name or "").strip(), "source": "listing_request", "listing_request_id": str(lr.id)},
        )

        lr.created_product = p
        lr.stage = ListingRequest.Stage.DONE
        lr.save(update_fields=["created_product", "stage", "updated_at"])
        try:
            Notification.objects.create(
                user=lr.seller,
                channel=Notification.Channel.IN_APP,
                event_type="listing_request_published",
                payload={
                    "title": "Listing published",
                    "body": f'Your product "{(p.name or "").strip()}" is now live on the marketplace.',
                    "listing_request_id": str(lr.id),
                    "product_id": str(p.id),
                    "stage": lr.stage,
                },
                status=Notification.Status.QUEUED,
            )
        except Exception:
            pass
        audit(
            request.user,
            action="admin_listing_request_published",
            target_type="listing_request",
            target_id=str(lr.id),
            payload={"stage": lr.stage, "created_product_id": str(p.id), "seller_id": str(lr.seller_id)},
        )
        return Response(AdminListingRequestSerializer(lr, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="verify_compliance")
    def verify_compliance(self, request, pk=None):
        lr = self.get_queryset().filter(pk=pk).first()
        if not lr:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        verified = request.data.get("verified", False)
        notes = (request.data.get("notes") or "").strip()

        if verified:
            stage_key = (getattr(lr, "stage", "") or "").strip().lower()
            meta = lr.product_meta if isinstance(lr.product_meta, dict) else {}
            review_message = (meta.get("review_message") or "").strip() if isinstance(meta, dict) else ""
            allowed = stage_key == ListingRequest.Stage.COMPLIANCE or (stage_key == ListingRequest.Stage.SAMPLES and not review_message)
            if not allowed:
                return Response({"detail": "Listing must be in Compliance stage to verify."}, status=status.HTTP_400_BAD_REQUEST)

        lr.compliance_verified = verified
        lr.compliance_notes = notes
        if verified:
            lr.stage = ListingRequest.Stage.INSPECTION
        lr.save(update_fields=["compliance_verified", "compliance_notes", "stage", "updated_at"])

        inbound_created = False
        inbound_id = None
        if verified:
            try:
                inbound = getattr(lr, "inbound_request", None)
            except Exception:
                inbound = None
            if inbound is None:
                wh = Warehouse.objects.filter(active=True).order_by("id").first() or Warehouse.objects.order_by("id").first()
                if wh is None:
                    try:
                        wh = Warehouse.objects.create(name="Main Warehouse", active=True)
                    except Exception:
                        wh = None
                if wh is not None:
                    try:
                        inbound = InboundRequest.objects.create(seller=lr.seller, warehouse=wh, listing_request=lr)
                        inbound_created = True
                        inbound_id = inbound.id
                    except Exception:
                        inbound_created = False

        if verified:
            try:
                Notification.objects.create(
                    user=lr.seller,
                    channel=Notification.Channel.IN_APP,
                    event_type="listing_request_compliance_verified",
                    payload={
                        "title": "Compliance verified",
                        "body": f'Compliance was verified for "{(lr.product_name or "").strip()}".',
                        "listing_request_id": str(lr.id),
                        "stage": lr.stage,
                        "inbound_request_id": str(inbound_id or ""),
                    },
                    status=Notification.Status.QUEUED,
                )
            except Exception:
                pass

        audit(
            request.user,
            action="admin_listing_request_compliance_verified",
            target_type="listing_request",
            target_id=str(lr.id),
            payload={"verified": verified, "inbound_created": inbound_created, "inbound_id": str(inbound_id or "")},
        )
        return Response(AdminListingRequestSerializer(lr, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="assign_inspector")
    def assign_inspector(self, request, pk=None):
        lr = self.get_queryset().filter(pk=pk).first()
        if not lr:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        inspector_id = request.data.get("inspector_id")
        if not inspector_id:
            return Response({"detail": "inspector_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        inspector = User.objects.filter(id=inspector_id, role=User.Role.ADMIN).first()
        if not inspector:
            return Response({"detail": "Invalid inspector."}, status=status.HTTP_400_BAD_REQUEST)

        lr.inspector = inspector
        lr.save(update_fields=["inspector", "updated_at"])

        audit(
            request.user,
            action="admin_listing_request_inspector_assigned",
            target_type="listing_request",
            target_id=str(lr.id),
            payload={"inspector_id": str(inspector.id)},
        )
        return Response(AdminListingRequestSerializer(lr, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="complete_inspection")
    def complete_inspection(self, request, pk=None):
        lr = self.get_queryset().filter(pk=pk).first()
        if not lr:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        inspected = request.data.get("inspected", False)
        lr.inspected = inspected
        if inspected:
            lr.stage = ListingRequest.Stage.INBOUND
        lr.save(update_fields=["inspected", "stage", "updated_at"])

        audit(
            request.user,
            action="admin_listing_request_inspected",
            target_type="listing_request",
            target_id=str(lr.id),
            payload={"inspected": inspected},
        )
        return Response(AdminListingRequestSerializer(lr, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="complete_inbound")
    def complete_inbound(self, request, pk=None):
        lr = self.get_queryset().filter(pk=pk).first()
        if not lr:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            inbound = getattr(lr, "inbound_request", None)
        except Exception:
            inbound = None
        if inbound is None:
            return Response({"detail": "Inbound request not found."}, status=status.HTTP_400_BAD_REQUEST)
        inbound.status = InboundRequest.Status.RECEIVED
        inbound.save(update_fields=["status", "updated_at"])

        if lr.stage != ListingRequest.Stage.INBOUND:
            lr.stage = ListingRequest.Stage.INBOUND
            lr.save(update_fields=["stage", "updated_at"])

        audit(
            request.user,
            action="admin_listing_request_inbound_completed",
            target_type="listing_request",
            target_id=str(lr.id),
            payload={"stage": lr.stage, "inbound_status": inbound.status},
        )
        return Response(AdminListingRequestSerializer(lr, context={"request": request}).data)


class ProductVariationViewSet(viewsets.ModelViewSet):
    serializer_class = ProductVariationSerializer

    def get_queryset(self):
        qs = ProductVariation.objects.select_related("product", "product__seller").filter(deleted_at__isnull=True)
        product_id = self.request.query_params.get("product")
        if product_id:
            qs = qs.filter(product_id=product_id)
        user = self.request.user
        if user.is_authenticated and user.account_type == "seller":
            return qs.filter(product__seller=user)
        return qs.filter(product__status__in=[Product.Status.APPROVED, Product.Status.ACTIVE])

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [permissions.IsAuthenticated(), IsSeller()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        product = serializer.validated_data["product"]
        if product.seller_id != self.request.user.id:
            raise permissions.PermissionDenied("You do not own this product.")
        serializer.save()


class PricingTierViewSet(viewsets.ModelViewSet):
    serializer_class = PricingTierSerializer

    def get_queryset(self):
        qs = PricingTier.objects.select_related("product", "product__seller", "variation").filter(deleted_at__isnull=True)
        product_id = self.request.query_params.get("product")
        if product_id:
            qs = qs.filter(product_id=product_id)
        user = self.request.user
        if user.is_authenticated and user.account_type == "seller":
            return qs.filter(product__seller=user)
        return qs.filter(product__status__in=[Product.Status.APPROVED, Product.Status.ACTIVE])

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [permissions.IsAuthenticated(), IsSeller()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        product = serializer.validated_data["product"]
        if product.seller_id != self.request.user.id:
            raise permissions.PermissionDenied("You do not own this product.")
        serializer.save()


class ProductMediaViewSet(viewsets.ModelViewSet):
    serializer_class = ProductMediaSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = ProductMedia.objects.select_related("product", "product__seller").filter(deleted_at__isnull=True)
        product_id = self.request.query_params.get("product")
        if product_id:
            qs = qs.filter(product_id=product_id)
        user = self.request.user
        if user.is_authenticated and user.account_type == "seller":
            return qs.filter(product__seller=user)
        return qs.filter(product__status__in=[Product.Status.APPROVED, Product.Status.ACTIVE])

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [permissions.IsAuthenticated(), IsSeller()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        product = serializer.validated_data["product"]
        if product.seller_id != self.request.user.id:
            raise permissions.PermissionDenied("You do not own this product.")
        serializer.save()

    def _serialize(self, obj, request):
        data = ProductMediaSerializer(obj, context={"request": request}).data
        if "url" in data:
            data.pop("url", None)
        if "storage_key" in data:
            data.pop("storage_key", None)
        return data

    def partial_update(self, request, *args, **kwargs):
        obj: ProductMedia = self.get_object()
        if getattr(obj.product, "seller_id", None) != request.user.id:
            raise permissions.PermissionDenied("You do not own this product.")

        data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data or {})
        upload = request.FILES.get("file")
        raw_url = (data.get("url") or "").strip()

        if upload:
            content_type = (getattr(upload, "content_type", "") or "").strip()
            size_bytes = int(getattr(upload, "size", 0) or 0)
            name = getattr(upload, "name", "") or "file"
            safe_name = name.replace("/", "_").replace("\\", "_")
            key = f"product_media/{obj.product_id}/{uuid4()}/{safe_name}"
            new_storage_key = default_storage.save(key, upload)
            old_key = (obj.storage_key or "").strip()
            obj.storage_key = new_storage_key
            obj.url = ""
            obj.content_type = content_type
            obj.size_bytes = size_bytes
            if not (data.get("title") or "").strip():
                obj.title = name
            if old_key and old_key != new_storage_key:
                try:
                    default_storage.delete(old_key)
                except Exception:
                    pass
        elif raw_url:
            old_key = (obj.storage_key or "").strip()
            obj.url = raw_url
            obj.storage_key = ""
            obj.content_type = ""
            obj.size_bytes = 0
            if old_key:
                try:
                    default_storage.delete(old_key)
                except Exception:
                    pass

        title = (data.get("title") or "").strip()
        if title != "":
            obj.title = title

        pos_raw = (data.get("position") or "").strip()
        if pos_raw:
            try:
                obj.position = max(0, int(pos_raw))
            except Exception:
                pass

        var_raw = (data.get("variation") or "").strip()
        if var_raw:
            try:
                var_id = int(var_raw)
            except Exception:
                var_id = None
            if var_id:
                variation = ProductVariation.objects.filter(id=var_id, product_id=obj.product_id, deleted_at__isnull=True).first()
                if not variation:
                    return Response({"detail": "Invalid variation."}, status=status.HTTP_400_BAD_REQUEST)
                obj.variation = variation

        obj.save()
        return Response(self._serialize(obj, request))

    def update(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        obj: ProductMedia = self.get_object()
        if getattr(obj.product, "seller_id", None) != request.user.id:
            raise permissions.PermissionDenied("You do not own this product.")
        obj.deleted_at = timezone.now()
        obj.save(update_fields=["deleted_at"])
        key = (obj.storage_key or "").strip()
        if key:
            try:
                default_storage.delete(key)
            except Exception:
                pass
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["post"], url_path="upload")
    def upload(self, request, *args, **kwargs):
        product_id = (request.data.get("product") or "").strip()
        try:
            pid = int(product_id)
        except Exception:
            pid = None
        if not pid:
            return Response({"detail": "product is required."}, status=status.HTTP_400_BAD_REQUEST)

        product = Product.objects.filter(id=pid, deleted_at__isnull=True).select_related("seller").first()
        if not product:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        if product.seller_id != request.user.id:
            raise permissions.PermissionDenied("You do not own this product.")

        media_type = (request.data.get("media_type") or ProductMedia.MediaType.DOCUMENT).strip()
        if media_type not in {m for (m, _) in ProductMedia.MediaType.choices}:
            return Response({"detail": "Invalid media_type."}, status=status.HTTP_400_BAD_REQUEST)

        upload = request.FILES.get("file")
        raw_url = (request.data.get("url") or "").strip()
        title = (request.data.get("title") or "").strip()
        variation_raw = (request.data.get("variation") or "").strip()
        try:
            variation_id = int(variation_raw) if variation_raw else None
        except Exception:
            variation_id = None

        variation = None
        if variation_id:
            variation = ProductVariation.objects.filter(id=variation_id, product_id=product.id, deleted_at__isnull=True).first()
            if not variation:
                return Response({"detail": "Invalid variation."}, status=status.HTTP_400_BAD_REQUEST)

        if not upload and not raw_url:
            return Response({"detail": "Either file or url is required."}, status=status.HTTP_400_BAD_REQUEST)

        url = ""
        storage_key = ""
        content_type = ""
        size_bytes = 0
        if upload:
            content_type = (getattr(upload, "content_type", "") or "").strip()
            size_bytes = int(getattr(upload, "size", 0) or 0)
            name = getattr(upload, "name", "") or "file"
            safe_name = name.replace("/", "_").replace("\\", "_")
            key = f"product_media/{product.id}/{uuid4()}/{safe_name}"
            storage_key = default_storage.save(key, upload)
            if not title:
                title = name
        else:
            url = raw_url

        last = (
            ProductMedia.objects.filter(product_id=product.id, deleted_at__isnull=True)
            .order_by("-position", "-id")
            .values_list("position", flat=True)
            .first()
        )
        position = int(last or 0) + 1

        obj = ProductMedia.objects.create(
            product=product,
            variation=variation,
            media_type=media_type,
            url=url,
            storage_key=storage_key,
            title=title,
            content_type=content_type,
            size_bytes=size_bytes,
            position=position,
        )
        return Response(self._serialize(obj, request), status=status.HTTP_201_CREATED)


class WarehouseStockViewSet(viewsets.ModelViewSet):
    serializer_class = WarehouseStockSerializer

    def get_queryset(self):
        qs = WarehouseStock.objects.select_related("warehouse", "product", "variation", "seller").filter(deleted_at__isnull=True)
        product_id = (self.request.query_params.get("product") or "").strip()
        warehouse_id = (self.request.query_params.get("warehouse") or "").strip()
        if product_id:
            try:
                qs = qs.filter(product_id=int(product_id))
            except Exception:
                qs = qs.none()
        if warehouse_id:
            try:
                qs = qs.filter(warehouse_id=int(warehouse_id))
            except Exception:
                qs = qs.none()
        user = self.request.user
        if user.is_authenticated and (user.is_staff or user.is_superuser or getattr(user, "role", None) == "admin"):
            return qs
        if user.is_authenticated and getattr(user, "account_type", "") == "seller":
            return qs.filter(seller=user)
        return qs.none()

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsSeller()]

    def perform_create(self, serializer):
        user = self.request.user
        product = serializer.validated_data["product"]
        if product.seller_id != user.id:
            raise permissions.PermissionDenied("You do not own this product.")
        serializer.save(seller=user)

    def perform_update(self, serializer):
        user = self.request.user
        obj = serializer.instance
        product = serializer.validated_data.get("product") or getattr(obj, "product", None)
        if not product or getattr(product, "seller_id", None) != user.id:
            raise permissions.PermissionDenied("You do not own this product.")
        serializer.save()


class TrademarkViewSet(viewsets.ModelViewSet):
    serializer_class = TrademarkSerializer

    def get_queryset(self):
        qs = Trademark.objects.select_related("product", "seller").filter(deleted_at__isnull=True)
        user = self.request.user
        if user.is_authenticated and user.account_type == "seller":
            return qs.filter(seller=user)
        if user.is_authenticated and (user.is_staff or user.is_superuser or getattr(user, "role", None) == "admin"):
            return qs
        return qs.none()

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsSeller()]

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)


class ComplianceRuleViewSet(viewsets.ModelViewSet):
    queryset = ComplianceRule.objects.filter(deleted_at__isnull=True).select_related("category")
    serializer_class = ComplianceRuleSerializer

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [permissions.IsAuthenticated(), IsAdmin()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        obj = serializer.save()
        audit(
            self.request.user,
            action="admin_compliance_rule_created",
            target_type="compliance_rule",
            target_id=str(obj.id),
            payload={"category_id": str(getattr(obj, "category_id", ""))},
        )

    def perform_update(self, serializer):
        obj = serializer.save()
        audit(
            self.request.user,
            action="admin_compliance_rule_updated",
            target_type="compliance_rule",
            target_id=str(obj.id),
            payload={"fields": list((self.request.data or {}).keys())},
        )

    def perform_destroy(self, instance):
        obj_id = getattr(instance, "id", "")
        audit(self.request.user, action="admin_compliance_rule_deleted", target_type="compliance_rule", target_id=str(obj_id), payload={})
        super().perform_destroy(instance)


class AdminProductViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = AdminProductListSerializer
    pagination_class = AdminPageNumberPagination

    def _low_stock_threshold(self) -> int:
        raw = (self.request.query_params.get("low_stock_threshold") or "").strip()
        try:
            v = int(raw)
            return v if v > 0 else 50
        except Exception:
            return 50

    def get_queryset(self):
        threshold = self._low_stock_threshold()
        qs = (
            Product.objects.filter(deleted_at__isnull=True)
            .select_related("category", "category__parent", "seller", "seller__seller_profile")
            .annotate(
                stock_units=Coalesce(Sum("samples__available_quantity"), Value(0), output_field=IntegerField()),
                vehsl_rating_num=Coalesce("vehsl_rating", Value(0), output_field=DecimalField(max_digits=4, decimal_places=2)),
                seller_name=Coalesce(
                    "seller__seller_profile__business_name",
                    "seller__email",
                    "seller__phone",
                    Value(""),
                    output_field=CharField(),
                ),
            )
            .annotate(
                images_count=Count(
                    "media",
                    filter=Q(media__deleted_at__isnull=True, media__media_type=ProductMedia.MediaType.IMAGE),
                    distinct=True,
                ),
                hero_images=Count(
                    "media",
                    filter=Q(
                        media__deleted_at__isnull=True,
                        media__media_type=ProductMedia.MediaType.IMAGE,
                        media__position=0,
                    ),
                    distinct=True,
                ),
                compliance_rules_count=Count(
                    "category__compliance_rules",
                    filter=Q(category__compliance_rules__deleted_at__isnull=True),
                    distinct=True,
                ),
                compliance_docs_required_count=Count(
                    "category__compliance_rules",
                    filter=Q(
                        category__compliance_rules__deleted_at__isnull=True,
                        category__compliance_rules__rule_type__in=[
                            ComplianceRule.RuleType.PERMIT,
                            ComplianceRule.RuleType.REGISTRATION,
                            ComplianceRule.RuleType.LABEL,
                        ],
                    ),
                    distinct=True,
                ),
                compliance_destination_rules_count=Count(
                    "category__compliance_rules",
                    filter=Q(
                        category__compliance_rules__deleted_at__isnull=True,
                        category__compliance_rules__rule_type__in=[
                            ComplianceRule.RuleType.SHIPPING,
                            ComplianceRule.RuleType.LOGISTICS,
                        ],
                    ),
                    distinct=True,
                ),
            )
            .annotate(
                missing_hs_code=Case(
                    When(Q(hs_code__isnull=True) | Q(hs_code=""), then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField(),
                )
            )
            .annotate(
                missing_media=Case(
                    When(images_count__lte=0, then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField(),
                ),
                missing_hero_image=Case(
                    When(hero_images__lte=0, then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField(),
                ),
            )
            .annotate(
                compliance_score=ExpressionWrapper(
                    F("missing_hs_code") * Value(100)
                    + F("missing_media") * Value(50)
                    + F("missing_hero_image") * Value(10)
                    + Case(
                        When(compliance_docs_required_count__gt=0, then=Value(5)),
                        default=Value(0),
                        output_field=IntegerField(),
                    ),
                    output_field=IntegerField(),
                )
            )
            .annotate(
                needs_compliance=Case(
                    When(compliance_score__gt=0, then=Value(True)),
                    default=Value(False),
                    output_field=BooleanField(),
                )
            )
        )

        q = (self.request.query_params.get("q") or "").strip()
        if q:
            qv = q.strip()
            qn = qv.lower()
            is_email = "@" in qn and "." in qn
            phoneish = qn.replace("+", "").replace(" ", "").replace("-", "").isdigit()
            is_numeric = qn.isdigit()
            skuish = len(qn) >= 3 and qn.replace("-", "").replace("_", "").isalnum()

            if is_email:
                qs = qs.filter(seller__email__icontains=qv)
            elif phoneish:
                qs = qs.filter(seller__phone__icontains=qv)
            elif is_numeric:
                qs = qs.filter(
                    Q(hs_code__istartswith=qv) | Q(sku__istartswith=qv) | Q(name__icontains=qv) | Q(title__icontains=qv)
                )
            elif skuish:
                qs = qs.filter(Q(sku__istartswith=qv) | Q(name__icontains=qv) | Q(title__icontains=qv) | Q(hs_code__istartswith=qv))
            else:
                qs = qs.filter(
                    Q(name__icontains=qv)
                    | Q(title__icontains=qv)
                    | Q(description__icontains=qv)
                    | Q(sku__istartswith=qv)
                    | Q(hs_code__istartswith=qv)
                    | Q(seller__email__icontains=qv)
                    | Q(seller__phone__icontains=qv)
                )

        category = (self.request.query_params.get("category") or "").strip()
        if category:
            if category.isdigit():
                qs = qs.filter(category_id=int(category))
            else:
                qs = qs.filter(category__slug=category)

        admin_status = (self.request.query_params.get("admin_status") or "").strip().lower()
        if admin_status == "review":
            qs = qs.filter(status__in=[Product.Status.DRAFT, Product.Status.PENDING, Product.Status.REJECTED])
        elif admin_status == "out":
            qs = qs.filter(stock_units__lte=0).exclude(
                status__in=[Product.Status.DRAFT, Product.Status.PENDING, Product.Status.REJECTED]
            )
        elif admin_status == "low_stock":
            qs = qs.filter(stock_units__gt=0, stock_units__lt=threshold).exclude(
                status__in=[Product.Status.DRAFT, Product.Status.PENDING, Product.Status.REJECTED]
            )
        elif admin_status == "active":
            qs = qs.filter(status__in=[Product.Status.APPROVED, Product.Status.ACTIVE])
        elif admin_status == "compliance":
            qs = qs.filter(
                Q(missing_hs_code=1) | Q(missing_media=1) | Q(missing_hero_image=1) | Q(compliance_docs_required_count__gt=0)
            )

        status_param = (self.request.query_params.get("status") or "").strip().lower()
        if status_param:
            raw = [s.strip().lower() for s in status_param.split(",") if s.strip()]
            allowed = {str(v).lower() for v, _ in Product.Status.choices}
            statuses = [s for s in raw if s in allowed]
            if statuses:
                qs = qs.filter(status__in=statuses)

        missing_hs_code = (self.request.query_params.get("missing_hs_code") or "").strip().lower()
        if missing_hs_code in {"1", "true", "yes", "y"}:
            qs = qs.filter(missing_hs_code=1)

        missing_media = (self.request.query_params.get("missing_media") or "").strip().lower()
        if missing_media in {"1", "true", "yes", "y"}:
            qs = qs.filter(missing_media=1)

        missing_documents = (self.request.query_params.get("missing_documents") or "").strip().lower()
        if missing_documents in {"1", "true", "yes", "y"}:
            qs = qs.filter(compliance_docs_required_count__gt=0)

        rejected_with_reason = (self.request.query_params.get("rejected_with_reason") or "").strip().lower()
        if rejected_with_reason in {"1", "true", "yes", "y"}:
            qs = qs.filter(status=Product.Status.REJECTED, detail_config__review__rejection_reason__gt="")

        needs_compliance = (self.request.query_params.get("needs_compliance") or "").strip().lower()
        if needs_compliance in {"1", "true", "yes", "y"}:
            qs = qs.filter(
                Q(missing_hs_code=1) | Q(missing_media=1) | Q(missing_hero_image=1) | Q(compliance_docs_required_count__gt=0)
            )

        ordering_raw = (self.request.query_params.get("ordering") or "").strip()
        allowed = {
            "created_at",
            "price",
            "stock_units",
            "vehsl_rating_num",
            "name",
            "images_count",
            "missing_hs_code",
            "compliance_score",
        }
        ordering: list[str] = []
        if ordering_raw:
            for part in ordering_raw.split(","):
                p = (part or "").strip()
                if not p:
                    continue
                desc = p.startswith("-")
                field = p[1:] if desc else p
                if field == "vehsl_rating":
                    field = "vehsl_rating_num"
                if field == "needs_compliance":
                    field = "compliance_score"
                if field in allowed:
                    ordering.append(("-" if desc else "") + field)
        if not ordering:
            ordering = ["-created_at"]
        qs = qs.order_by(*ordering)

        return qs

    def list(self, request):
        threshold = self._low_stock_threshold()
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        if page is not None:
            ser = AdminProductListSerializer(page, many=True, context={"low_stock_threshold": threshold})
            return self.get_paginated_response(ser.data)
        ser = AdminProductListSerializer(qs, many=True, context={"low_stock_threshold": threshold})
        return Response({"count": len(ser.data), "next": None, "previous": None, "results": ser.data})

    def retrieve(self, request, pk=None):
        threshold = self._low_stock_threshold()
        obj = self.get_queryset().get(pk=pk)
        return Response(AdminProductListSerializer(obj, context={"low_stock_threshold": threshold}).data)

    def create(self, request):
        threshold = self._low_stock_threshold()
        ser = AdminProductWriteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        seller = None
        if data.get("seller_id"):
            seller = User.objects.filter(id=data["seller_id"]).first()
        else:
            email = (data.get("seller_email") or "").strip().lower()
            seller = User.objects.filter(email__iexact=email).first()
        if not seller:
            return Response({"seller_email": "Seller not found."}, status=status.HTTP_400_BAD_REQUEST)

        category = Category.objects.get(id=data["category_id"])
        product = Product(
            seller=seller,
            category=category,
            name=(data.get("name") or "").strip(),
            currency=data.get("currency") or "USD",
            price=data.get("price"),
            status=data.get("status") or Product.Status.ACTIVE,
            hs_code=(data.get("hs_code") or "").strip(),
            vehsl_rating=data.get("vehsl_rating"),
        )
        product.full_clean()
        product.save()

        if "stock_units" in data:
            from apps.inventory.models import Sample

            qty = int(data.get("stock_units") or 0)
            sample, _ = Sample.objects.get_or_create(product=product, defaults={"seller": seller})
            Sample.objects.filter(id=sample.id).update(
                seller=seller,
                available_quantity=qty,
                low_stock_flag=(0 < qty < threshold),
            )

        obj = self.get_queryset().get(id=product.id)
        audit(
            request.user,
            action="admin_product_created",
            target_type="product",
            target_id=str(product.id),
            payload={"fields": list(data.keys())},
        )
        return Response(AdminProductListSerializer(obj, context={"low_stock_threshold": threshold}).data, status=201)

    def partial_update(self, request, pk=None):
        threshold = self._low_stock_threshold()
        product = Product.objects.filter(id=pk, deleted_at__isnull=True).select_related("seller").first()
        if not product:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        ser = AdminProductWriteSerializer(data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        if "name" in data:
            product.name = (data.get("name") or "").strip()
        if "category_id" in data:
            product.category_id = data["category_id"]
        if "currency" in data:
            product.currency = data.get("currency") or "USD"
        if "price" in data:
            product.price = data.get("price")
        if "status" in data:
            product.status = data.get("status")
        if "hs_code" in data:
            product.hs_code = (data.get("hs_code") or "").strip()
        if "vehsl_rating" in data:
            product.vehsl_rating = data.get("vehsl_rating")

        product.full_clean()
        product.save()

        if "stock_units" in data:
            from apps.inventory.models import Sample

            qty = int(data.get("stock_units") or 0)
            sample, _ = Sample.objects.get_or_create(product=product, defaults={"seller": product.seller})
            Sample.objects.filter(id=sample.id).update(
                seller=product.seller,
                available_quantity=qty,
                low_stock_flag=(0 < qty < threshold),
            )

        obj = self.get_queryset().get(id=product.id)
        audit(
            request.user,
            action="admin_product_updated",
            target_type="product",
            target_id=str(product.id),
            payload={"fields": list((request.data or {}).keys())},
        )
        return Response(AdminProductListSerializer(obj, context={"low_stock_threshold": threshold}).data)

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        threshold = self._low_stock_threshold()
        base = Product.objects.filter(deleted_at__isnull=True).annotate(
            stock_units=Coalesce(Sum("samples__available_quantity"), Value(0), output_field=IntegerField())
        )

        total_products = base.count()
        active_listings = base.filter(status__in=[Product.Status.APPROVED, Product.Status.ACTIVE]).count()
        pending_review = base.filter(status__in=[Product.Status.DRAFT, Product.Status.PENDING, Product.Status.REJECTED]).count()
        low_stock = base.filter(status__in=[Product.Status.APPROVED, Product.Status.ACTIVE], stock_units__gt=0, stock_units__lt=threshold).count()
        out_of_stock = base.filter(status__in=[Product.Status.APPROVED, Product.Status.ACTIVE], stock_units__lte=0).count()

        return Response(
            {
                "total_products": total_products,
                "active_listings": active_listings,
                "low_stock": low_stock,
                "pending_review": pending_review,
                "out_of_stock": out_of_stock,
            }
        )

    @action(detail=True, methods=["get"], url_path="detail")
    def product_detail(self, request, pk=None):
        threshold = self._low_stock_threshold()
        obj = self.get_queryset().filter(id=pk).first()
        if not obj:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            from apps.inventory.models import Sample, SampleRequest, QualityInspection
        except Exception:
            Sample = None
            SampleRequest = None
            QualityInspection = None
        try:
            from apps.orders.models import OrderItem
        except Exception:
            OrderItem = None

        product = AdminProductListSerializer(obj, context={"low_stock_threshold": threshold}).data

        media = []
        try:
            media = ProductMediaSerializer(ProductMedia.objects.filter(product_id=obj.id, deleted_at__isnull=True).order_by("position", "id"), many=True).data
        except Exception:
            media = []

        variations = []
        try:
            variations = ProductVariationSerializer(ProductVariation.objects.filter(product_id=obj.id, deleted_at__isnull=True).order_by("id"), many=True).data
        except Exception:
            variations = []

        pricing_tiers = []
        try:
            pricing_tiers = PricingTierSerializer(PricingTier.objects.filter(product_id=obj.id, deleted_at__isnull=True).order_by("min_quantity", "id"), many=True).data
        except Exception:
            pricing_tiers = []

        warehouse_stocks = []
        try:
            warehouse_stocks = WarehouseStockSerializer(
                WarehouseStock.objects.filter(product_id=obj.id, deleted_at__isnull=True).select_related("warehouse", "variation", "seller").order_by("warehouse_id", "variation_id", "id")[:500],
                many=True,
            ).data
        except Exception:
            warehouse_stocks = []

        compliance_rules = []
        try:
            compliance_rules = ComplianceRuleSerializer(ComplianceRule.objects.filter(category_id=obj.category_id, deleted_at__isnull=True).order_by("-created_at")[:50], many=True).data
        except Exception:
            compliance_rules = []

        sample = None
        sample_requests = {"requested": 0, "shipped": 0, "delivered": 0, "total": 0}
        if Sample is not None:
            s = Sample.objects.filter(product_id=obj.id, deleted_at__isnull=True).order_by("-last_updated").first()
            if s:
                sample = {
                    "available_quantity": int(getattr(s, "available_quantity", 0) or 0),
                    "low_stock_flag": bool(getattr(s, "low_stock_flag", False)),
                    "last_updated": getattr(s, "last_updated", None),
                }
        if SampleRequest is not None:
            qs = SampleRequest.objects.filter(product_id=obj.id, deleted_at__isnull=True)
            sample_requests = {
                "requested": qs.filter(status=SampleRequest.Status.REQUESTED).count(),
                "shipped": qs.filter(status=SampleRequest.Status.SHIPPED).count(),
                "delivered": qs.filter(status=SampleRequest.Status.DELIVERED).count(),
                "total": qs.count(),
            }

        inspections = {"in_progress": 0, "passed": 0, "failed": 0, "last": None}
        if QualityInspection is not None:
            q = QualityInspection.objects.filter(product_id=obj.id, deleted_at__isnull=True)
            inspections = {
                "in_progress": q.filter(status=QualityInspection.Status.IN_PROGRESS).count(),
                "passed": q.filter(status=QualityInspection.Status.PASSED).count(),
                "failed": q.filter(status=QualityInspection.Status.FAILED).count(),
                "last": None,
            }
            last = q.select_related("inspector").order_by("-created_at").first()
            if last:
                inspections["last"] = {
                    "id": last.id,
                    "status": last.status,
                    "score": int(getattr(last, "score", 0) or 0),
                    "created_at": last.created_at,
                    "inspected_at": getattr(last, "inspected_at", None),
                }

        recent_orders = []
        if OrderItem is not None:
            items = (
                OrderItem.objects.filter(product_id=obj.id, deleted_at__isnull=True)
                .select_related("order", "order__buyer")
                .order_by("-order__created_at")[:10]
            )
            for it in items:
                o = it.order
                buyer = getattr(o, "buyer", None)
                buyer_name = ""
                if buyer:
                    buyer_name = f"{(buyer.first_name or '').strip()} {(buyer.last_name or '').strip()}".strip() or (buyer.email or buyer.phone or "")
                recent_orders.append(
                    {
                        "order_id": o.id,
                        "order_status": o.status,
                        "order_created_at": o.created_at,
                        "buyer": buyer_name or "—",
                        "quantity": int(getattr(it, "quantity", 0) or 0),
                        "unit_price": str(getattr(it, "unit_price", "") or ""),
                    }
                )

        images_count = int(getattr(obj, "images_count", 0) or 0)
        hero_images = int(getattr(obj, "hero_images", 0) or 0)
        missing_hs_code = bool(int(getattr(obj, "missing_hs_code", 0) or 0))
        missing_media = bool(int(getattr(obj, "missing_media", 0) or 0))
        missing_hero_image = bool(int(getattr(obj, "missing_hero_image", 0) or 0))
        compliance_score = int(getattr(obj, "compliance_score", 0) or 0)
        needs_compliance = bool(getattr(obj, "needs_compliance", False))
        docs_required_count = int(getattr(obj, "compliance_docs_required_count", 0) or 0)
        destination_rules_count = int(getattr(obj, "compliance_destination_rules_count", 0) or 0)

        legal_review_status = "ok"
        status_val = (getattr(obj, "status", "") or "").lower()
        if status_val in {"draft", "pending", "rejected"}:
            legal_review_status = "needs_review"
        elif status_val == "archived":
            legal_review_status = "archived"

        blocked_destinations: set[str] = set()
        required_documents: set[str] = set()
        try:
            rules = list(ComplianceRule.objects.filter(category_id=obj.category_id, deleted_at__isnull=True).order_by("-created_at")[:200])
            for r in rules:
                payload = getattr(r, "payload", None) or {}
                if isinstance(payload, dict):
                    for k in ("blocked_countries", "blocked_destinations", "blocked_destinations_countries"):
                        val = payload.get(k)
                        if isinstance(val, list):
                            for item in val:
                                s = str(item or "").strip()
                                if s:
                                    blocked_destinations.add(s.upper())
                    docs = payload.get("required_documents") or payload.get("required_certifications") or payload.get("certifications")
                    if isinstance(docs, list):
                        for item in docs:
                            s = str(item or "").strip()
                            if s:
                                required_documents.add(s)
                    elif isinstance(docs, str):
                        s = docs.strip()
                        if s:
                            required_documents.add(s)

                if r.rule_type in {ComplianceRule.RuleType.SHIPPING, ComplianceRule.RuleType.LOGISTICS} and isinstance(r.countries, list) and r.countries:
                    for c in r.countries:
                        s = str(c or "").strip()
                        if s:
                            blocked_destinations.add(s.upper())
        except Exception:
            blocked_destinations = set()
            required_documents = set()

        listing_request = None
        try:
            lr = ListingRequest.objects.filter(created_product_id=obj.id).order_by("-created_at").first()
            if lr:
                listing_request = {
                    "id": lr.id,
                    "stage": lr.stage,
                    "rating": str(getattr(lr, "rating", "") or ""),
                    "created_at": lr.created_at,
                    "updated_at": lr.updated_at,
                    "folder_uuid": str(getattr(lr, "folder_uuid", "") or ""),
                }
        except Exception:
            listing_request = None

        payload = {
            "product": product,
            "seller": {
                "id": obj.seller_id,
                "email": getattr(obj.seller, "email", "") if getattr(obj, "seller", None) else "",
                "phone": getattr(obj.seller, "phone", "") if getattr(obj, "seller", None) else "",
                "name": getattr(obj, "seller_name", "") or "",
            },
            "media": media,
            "variations": variations,
            "pricing_tiers": pricing_tiers,
            "warehouse_stocks": warehouse_stocks,
            "compliance_rules": compliance_rules,
            "sample": sample,
            "sample_requests": sample_requests,
            "quality": inspections,
            "recent_orders": recent_orders,
            "readiness": {
                "needs_compliance": needs_compliance,
                "compliance_score": compliance_score,
                "missing_hs_code": missing_hs_code,
                "missing_media": missing_media,
                "missing_hero_image": missing_hero_image,
                "images_count": images_count,
                "has_hero_image": hero_images > 0,
                "blocked_destinations_count": len(blocked_destinations),
                "blocked_destinations": sorted(list(blocked_destinations))[:80],
                "certifications_required_count": max(docs_required_count, len(required_documents)),
                "required_documents": sorted(list(required_documents))[:80],
                "missing_certifications": bool(docs_required_count > 0 or required_documents),
                "destination_rules_count": destination_rules_count,
                "legal_review_status": legal_review_status,
            },
            "listing_request": listing_request,
            "links": {
                "listing_pipeline": f"/admin/management/listings?product={obj.id}",
                "inspector_portal": f"/admin/inspector?product={obj.id}",
                "trade_compliance": f"/admin/legal/trade-compliance?product={obj.id}",
            },
        }
        return Response(payload)

    @action(detail=True, methods=["post"], url_path="request-media")
    def request_media(self, request, pk=None):
        product = Product.objects.filter(id=pk, deleted_at__isnull=True).select_related("seller").first()
        if not product:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        seller = getattr(product, "seller", None)
        msg = (request.data.get("message") or "").strip()
        try:
            Notification.objects.create(
                user=seller,
                channel=Notification.Channel.IN_APP,
                event_type="product_media_requested",
                payload={"product_id": product.id, "message": msg, "requested_by": request.user.id},
                status=Notification.Status.QUEUED,
            )
        except Exception:
            pass
        audit(request.user, action="admin_product_media_requested", target_type="product", target_id=str(product.id), payload={})
        return Response({"ok": True})

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        product = Product.objects.filter(id=pk, deleted_at__isnull=True).first()
        if not product:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        product.status = Product.Status.APPROVED
        try:
            cfg = product.detail_config if isinstance(product.detail_config, dict) else {}
        except Exception:
            cfg = {}
        if isinstance(cfg, dict) and "review" in cfg:
            cfg = dict(cfg)
            cfg.pop("review", None)
            product.detail_config = cfg
            product.save(update_fields=["status", "detail_config", "updated_at"])
        else:
            product.save(update_fields=["status", "updated_at"])
        audit(request.user, action="admin_product_approved", target_type="product", target_id=str(product.id), payload={})
        return self.retrieve(request, pk=pk)

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        product = Product.objects.filter(id=pk, deleted_at__isnull=True).first()
        if not product:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        reason = (request.data.get("reason") or request.data.get("rejection_reason") or request.data.get("rejectionReason") or "").strip()
        raw_photos = request.data.get("rejection_photos") or request.data.get("rejectionPhotos") or []
        raw_suggestions = request.data.get("improvement_suggestions") or request.data.get("improvementSuggestions") or []

        photos: list[dict] = []
        try:
            if isinstance(raw_photos, list):
                for it in raw_photos[:20]:
                    if isinstance(it, str):
                        u = it.strip()
                        if u:
                            photos.append({"url": u, "caption": ""})
                    elif isinstance(it, dict):
                        u = str(it.get("url") or "").strip()
                        if not u:
                            continue
                        cap = str(it.get("caption") or "").strip()
                        photos.append({"url": u, "caption": cap})
        except Exception:
            photos = []

        suggestions: list[dict] = []
        try:
            if isinstance(raw_suggestions, list):
                for s in raw_suggestions[:10]:
                    if not isinstance(s, dict):
                        continue
                    text = str(s.get("text") or "").strip()
                    tip = str(s.get("tip") or "").strip()
                    if not text:
                        continue
                    step_photos: list[dict] = []
                    sp = s.get("photos") or []
                    if isinstance(sp, list):
                        for p in sp[:10]:
                            if isinstance(p, str):
                                u = p.strip()
                                if u:
                                    step_photos.append({"url": u, "caption": ""})
                            elif isinstance(p, dict):
                                u = str(p.get("url") or "").strip()
                                if not u:
                                    continue
                                cap = str(p.get("caption") or "").strip()
                                step_photos.append({"url": u, "caption": cap})
                    entry = {"text": text}
                    if tip:
                        entry["tip"] = tip
                    if step_photos:
                        entry["photos"] = step_photos
                    suggestions.append(entry)
        except Exception:
            suggestions = []

        try:
            cfg = product.detail_config if isinstance(product.detail_config, dict) else {}
        except Exception:
            cfg = {}
        if not isinstance(cfg, dict):
            cfg = {}
        cfg = dict(cfg)
        cfg["review"] = {
            "rejection_reason": reason,
            "rejection_photos": photos,
            "improvement_suggestions": suggestions,
            "rejected_by": getattr(request.user, "id", None),
            "rejected_at": timezone.now().isoformat(),
        }
        product.detail_config = cfg
        product.status = Product.Status.REJECTED
        product.save(update_fields=["status", "detail_config", "updated_at"])
        audit(
            request.user,
            action="admin_product_rejected",
            target_type="product",
            target_id=str(product.id),
            payload={"reason": reason, "photos_count": len(photos), "suggestions_count": len(suggestions)},
        )
        return self.retrieve(request, pk=pk)

    @action(detail=True, methods=["post"], url_path="archive")
    def archive(self, request, pk=None):
        product = Product.objects.filter(id=pk, deleted_at__isnull=True).first()
        if not product:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        product.status = Product.Status.ARCHIVED
        product.save(update_fields=["status", "updated_at"])
        audit(request.user, action="admin_product_archived", target_type="product", target_id=str(product.id), payload={})
        return self.retrieve(request, pk=pk)

    @action(detail=True, methods=["post"], url_path="activate")
    def activate(self, request, pk=None):
        product = Product.objects.filter(id=pk, deleted_at__isnull=True).first()
        if not product:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        product.status = Product.Status.ACTIVE
        try:
            cfg = product.detail_config if isinstance(product.detail_config, dict) else {}
        except Exception:
            cfg = {}
        if isinstance(cfg, dict) and "review" in cfg:
            cfg = dict(cfg)
            cfg.pop("review", None)
            product.detail_config = cfg
            product.save(update_fields=["status", "detail_config", "updated_at"])
        else:
            product.save(update_fields=["status", "updated_at"])
        audit(request.user, action="admin_product_activated", target_type="product", target_id=str(product.id), payload={})
        return self.retrieve(request, pk=pk)

    @action(detail=True, methods=["post"], url_path="stock")
    def set_stock(self, request, pk=None):
        threshold = self._low_stock_threshold()
        product = Product.objects.filter(id=pk, deleted_at__isnull=True).select_related("seller").first()
        if not product:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        try:
            qty = int(request.data.get("stock_units"))
        except Exception:
            return Response({"stock_units": "stock_units must be an integer."}, status=status.HTTP_400_BAD_REQUEST)
        if qty < 0:
            return Response({"stock_units": "stock_units must be >= 0."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            from apps.inventory.models import Sample
        except Exception:
            Sample = None
        if Sample is None:
            return Response({"detail": "Inventory not available."}, status=status.HTTP_400_BAD_REQUEST)
        sample, _ = Sample.objects.get_or_create(product=product, defaults={"seller": product.seller})
        Sample.objects.filter(id=sample.id).update(
            seller=product.seller,
            available_quantity=qty,
            low_stock_flag=(0 < qty < threshold),
        )
        audit(request.user, action="admin_product_stock_set", target_type="product", target_id=str(product.id), payload={"stock_units": qty})
        return self.retrieve(request, pk=pk)

    @action(detail=True, methods=["get"], url_path="export")
    def export_one(self, request, pk=None):
        threshold = self._low_stock_threshold()
        obj = self.get_queryset().filter(id=pk).first()
        if not obj:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        audit(request.user, action="admin_product_exported", target_type="product", target_id=str(obj.id), payload={})
        resp = HttpResponse(content_type="text/csv")
        resp["Content-Disposition"] = f'attachment; filename="admin_product_{obj.id}.csv"'
        w = csv.writer(resp)
        w.writerow(
            [
                "id",
                "name",
                "seller",
                "category",
                "sku",
                "hs_code",
                "currency",
                "price",
                "stock_units",
                "status",
                "admin_status",
                "vehsl_rating",
            ]
        )
        admin_status = AdminProductListSerializer(obj, context={"low_stock_threshold": threshold}).data.get("admin_status")
        w.writerow(
            [
                obj.id,
                obj.name,
                getattr(obj, "seller_name", ""),
                getattr(obj.category, "name", ""),
                obj.sku,
                obj.hs_code,
                obj.currency,
                obj.price,
                getattr(obj, "stock_units", 0),
                obj.status,
                admin_status,
                obj.vehsl_rating or "",
            ]
        )
        return resp

    @action(detail=False, methods=["post"], url_path="bulk/status")
    def bulk_status(self, request):
        ids = request.data.get("ids") or []
        next_status = (request.data.get("status") or "").strip().lower()
        allowed = {
            Product.Status.DRAFT,
            Product.Status.PENDING,
            Product.Status.APPROVED,
            Product.Status.REJECTED,
            Product.Status.ACTIVE,
            Product.Status.ARCHIVED,
        }
        if next_status not in allowed:
            return Response({"status": "Invalid status."}, status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(ids, list) or not ids:
            return Response({"ids": "ids must be a non-empty list."}, status=status.HTTP_400_BAD_REQUEST)
        qs = Product.objects.filter(deleted_at__isnull=True, id__in=ids)
        updated = qs.update(status=next_status)
        audit(
            request.user,
            action="admin_products_bulk_status",
            target_type="product_bulk",
            target_id="",
            payload={"count": updated, "status": next_status},
        )
        return Response({"updated": updated})

    @action(detail=False, methods=["post"], url_path="bulk/category")
    def bulk_category(self, request):
        ids = request.data.get("ids") or []
        try:
            category_id = int(request.data.get("category_id"))
        except Exception:
            return Response({"category_id": "category_id must be an integer."}, status=status.HTTP_400_BAD_REQUEST)
        if not Category.objects.filter(id=category_id, deleted_at__isnull=True).exists():
            return Response({"category_id": "Category not found."}, status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(ids, list) or not ids:
            return Response({"ids": "ids must be a non-empty list."}, status=status.HTTP_400_BAD_REQUEST)
        updated = Product.objects.filter(deleted_at__isnull=True, id__in=ids).update(category_id=category_id)
        audit(
            request.user,
            action="admin_products_bulk_category",
            target_type="product_bulk",
            target_id="",
            payload={"count": updated, "category_id": category_id},
        )
        return Response({"updated": updated})

    @action(detail=False, methods=["post"], url_path="bulk/hs-code")
    def bulk_hs_code(self, request):
        ids = request.data.get("ids") or []
        hs_code = (request.data.get("hs_code") or "").strip()
        if not isinstance(ids, list) or not ids:
            return Response({"ids": "ids must be a non-empty list."}, status=status.HTTP_400_BAD_REQUEST)
        updated = Product.objects.filter(deleted_at__isnull=True, id__in=ids).update(hs_code=hs_code)
        audit(
            request.user,
            action="admin_products_bulk_hs_code",
            target_type="product_bulk",
            target_id="",
            payload={"count": updated, "hs_code": hs_code},
        )
        return Response({"updated": updated})

    @action(detail=False, methods=["post"], url_path="bulk/stock")
    def bulk_stock(self, request):
        threshold = self._low_stock_threshold()
        ids = request.data.get("ids") or []
        try:
            qty = int(request.data.get("stock_units"))
        except Exception:
            return Response({"stock_units": "stock_units must be an integer."}, status=status.HTTP_400_BAD_REQUEST)
        if qty < 0:
            return Response({"stock_units": "stock_units must be >= 0."}, status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(ids, list) or not ids:
            return Response({"ids": "ids must be a non-empty list."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            from apps.inventory.models import Sample
        except Exception:
            Sample = None
        if Sample is None:
            return Response({"detail": "Inventory not available."}, status=status.HTTP_400_BAD_REQUEST)
        products = list(Product.objects.filter(deleted_at__isnull=True, id__in=ids).select_related("seller"))
        updated = 0
        for p in products:
            sample, _ = Sample.objects.get_or_create(product=p, defaults={"seller": p.seller})
            Sample.objects.filter(id=sample.id).update(
                seller=p.seller,
                available_quantity=qty,
                low_stock_flag=(0 < qty < threshold),
            )
            updated += 1
        audit(
            request.user,
            action="admin_products_bulk_stock",
            target_type="product_bulk",
            target_id="",
            payload={"count": updated, "stock_units": qty},
        )
        return Response({"updated": updated})

    @action(detail=False, methods=["post"], url_path="bulk/export")
    def bulk_export(self, request):
        threshold = self._low_stock_threshold()
        ids = request.data.get("ids") or []
        if not isinstance(ids, list) or not ids:
            return Response({"ids": "ids must be a non-empty list."}, status=status.HTTP_400_BAD_REQUEST)
        qs = self.get_queryset().filter(id__in=ids)
        audit(
            request.user,
            action="admin_products_bulk_exported",
            target_type="product_bulk",
            target_id="",
            payload={"count": qs.count()},
        )
        resp = HttpResponse(content_type="text/csv")
        resp["Content-Disposition"] = 'attachment; filename="admin_products_selected.csv"'
        w = csv.writer(resp)
        w.writerow(
            [
                "id",
                "name",
                "seller",
                "category",
                "sku",
                "hs_code",
                "currency",
                "price",
                "stock_units",
                "status",
                "admin_status",
                "vehsl_rating",
            ]
        )
        for p in qs.iterator():
            admin_status = AdminProductListSerializer(p, context={"low_stock_threshold": threshold}).data.get("admin_status")
            w.writerow(
                [
                    p.id,
                    p.name,
                    getattr(p, "seller_name", ""),
                    getattr(p.category, "name", ""),
                    p.sku,
                    p.hs_code,
                    p.currency,
                    p.price,
                    getattr(p, "stock_units", 0),
                    p.status,
                    admin_status,
                    p.vehsl_rating or "",
                ]
            )
        return resp

    @action(detail=False, methods=["get"], url_path="categories")
    def categories(self, request):
        qs = (
            Category.objects.filter(deleted_at__isnull=True)
            .select_related("parent")
            .annotate(products_count=Count("products", filter=Q(products__deleted_at__isnull=True)))
            .filter(products_count__gt=0)
            .order_by("name")
        )
        out = []
        for c in qs:
            parent = getattr(c, "parent", None)
            label = c.name
            if parent and getattr(parent, "name", ""):
                label = f"{parent.name} / {c.name}"
            out.append(
                {
                    "id": c.id,
                    "name": c.name,
                    "slug": c.slug,
                    "count": c.products_count,
                    "parent_id": getattr(c, "parent_id", None),
                    "parent_name": getattr(parent, "name", "") if parent else "",
                    "label": label,
                }
            )
        return Response(out)

    @action(detail=False, methods=["get"], url_path="export")
    def export(self, request):
        threshold = self._low_stock_threshold()
        qs = self.get_queryset()
        audit(
            request.user,
            action="admin_products_exported",
            target_type="admin_products",
            target_id="",
            payload={
                "filters": {
                    "q": (request.query_params.get("q") or "").strip(),
                    "category": (request.query_params.get("category") or "").strip(),
                    "admin_status": (request.query_params.get("admin_status") or "").strip(),
                    "ordering": (request.query_params.get("ordering") or "").strip(),
                }
            },
        )

        resp = HttpResponse(content_type="text/csv")
        resp["Content-Disposition"] = 'attachment; filename="admin_products.csv"'
        w = csv.writer(resp)
        w.writerow(
            [
                "id",
                "name",
                "seller",
                "category",
                "sku",
                "hs_code",
                "currency",
                "price",
                "stock_units",
                "status",
                "admin_status",
                "vehsl_rating",
            ]
        )
        for p in qs.iterator():
            admin_status = AdminProductListSerializer(p, context={"low_stock_threshold": threshold}).data.get("admin_status")
            w.writerow(
                [
                    p.id,
                    p.name,
                    getattr(p, "seller_name", ""),
                    getattr(p.category, "name", ""),
                    p.sku,
                    p.hs_code,
                    p.currency,
                    p.price,
                    getattr(p, "stock_units", 0),
                    p.status,
                    admin_status,
                    p.vehsl_rating or "",
                ]
            )
        return resp


class InboundRequestViewSet(viewsets.ModelViewSet):
    serializer_class = InboundRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = InboundRequest.objects.select_related("seller", "warehouse").prefetch_related("items", "items__product")
        if user.is_staff or user.is_superuser or getattr(user, "role", None) == "admin":
            return qs
        if getattr(user, "account_type", "") == "seller":
            return qs.filter(seller=user)
        return qs.none()

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    def create(self, request, *args, **kwargs):
        data = request.data
        items_data = data.pop("items", []) if "items" in data else []

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        inbound = serializer.save(seller=request.user)

        for item_data in items_data:
            try:
                InboundRequestItem.objects.create(
                    inbound_request=inbound,
                    product_id=item_data.get("product"),
                    variation_id=item_data.get("variation"),
                    quantity_expected=int(item_data.get("quantity_expected") or 0),
                )
            except Exception:
                continue

        return Response(self.get_serializer(inbound).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="ship")
    def ship(self, request, pk=None):
        obj = self.get_object()
        if obj.seller_id != request.user.id:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        if obj.status != InboundRequest.Status.PENDING:
            return Response({"detail": "Only pending requests can be shipped."}, status=status.HTTP_400_BAD_REQUEST)

        obj.tracking_number = (request.data.get("tracking_number") or "").strip()
        obj.status = InboundRequest.Status.SHIPPED
        obj.save(update_fields=["status", "tracking_number", "updated_at"])
        return Response(self.get_serializer(obj).data)

    @action(detail=True, methods=["post"], url_path="receive")
    def receive(self, request, pk=None):
        user_role = getattr(request.user, "role", None)
        if not (request.user.is_staff or user_role in ["admin", "logistics"]):
            return Response({"detail": "Only admins or logistics staff can mark as received."}, status=status.HTTP_403_FORBIDDEN)

        obj = self.get_object()
        if obj.status != InboundRequest.Status.SHIPPED:
            return Response({"detail": "Only shipped requests can be received."}, status=status.HTTP_400_BAD_REQUEST)

        items_data = request.data.get("items") or []
        if not isinstance(items_data, list):
            return Response({"detail": "items must be a list."}, status=status.HTTP_400_BAD_REQUEST)

        # Update received quantities and actual stock
        for item_update in items_data:
            item_id = item_update.get("id")
            received = int(item_update.get("quantity_received") or 0)
            item = obj.items.filter(id=item_id).first()
            if item:
                item.quantity_received = received
                item.save(update_fields=["quantity_received"])

                # Update WarehouseStock
                stock, _ = WarehouseStock.objects.get_or_create(
                    warehouse=obj.warehouse,
                    seller=obj.seller,
                    product=item.product,
                    variation=item.variation,
                )
                stock.quantity_units = (stock.quantity_units or 0) + received
                stock.save()

        obj.status = InboundRequest.Status.RECEIVED
        obj.save(update_fields=["status", "updated_at"])
        return Response(self.get_serializer(obj).data)

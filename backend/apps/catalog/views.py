import csv

from django.db.models import BooleanField, Case, CharField, Count, DecimalField, ExpressionWrapper, F, IntegerField, Q, Sum, Value, When
from django.db.models.functions import Coalesce
from django.http import HttpResponse
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from apps.accounts.admin_utils import AdminPageNumberPagination, audit
from apps.accounts.permissions import IsAdmin, IsSeller
from apps.accounts.models import Notification, User

from .models import Category, ComplianceRule, ListingRequest, ListingRequestPhoto, PricingTier, Product, ProductMedia, ProductVariation, Trademark
from .serializers import (
    AdminProductListSerializer,
    AdminProductWriteSerializer,
    CategorySerializer,
    ComplianceRuleSerializer,
    ListingRequestCreateSerializer,
    ListingRequestSerializer,
    PricingTierSerializer,
    ProductMediaSerializer,
    ProductSerializer,
    ProductVariationSerializer,
    TrademarkSerializer,
)


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
        base_qs = Category.objects.filter(deleted_at__isnull=True).exclude(Q(slug__iexact="other") | Q(name__iexact="other"))
        top = list(base_qs.filter(parent__isnull=True).order_by("display_order", "sort_order", "name"))
        if not top:
            return Response({"categories": [], "total_products": 0})

        top_ids = [c.id for c in top]
        children = list(base_qs.filter(parent_id__in=top_ids).order_by("display_order", "sort_order", "name"))
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
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "sku", "description"]
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
                out = out.filter(category__slug__iexact=cat)
        return out

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [permissions.IsAuthenticated(), IsSeller()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)


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
        out = ListingRequestSerializer(lr, context={"request": request}).data
        return Response(out, status=status.HTTP_201_CREATED)

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
        return Response(ListingRequestSerializer(lr, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="advance")
    def advance(self, request, pk=None):
        lr = self.get_queryset().filter(pk=pk).first()
        if not lr:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if lr.stage == ListingRequest.Stage.SAMPLES:
            return Response({"detail": "Save sample pickup details first."}, status=status.HTTP_400_BAD_REQUEST)

        if lr.stage == ListingRequest.Stage.INSPECTION:
            try:
                rating = float(request.data.get("rating") or 4.8)
            except Exception:
                rating = 4.8
            rating = max(0.0, min(5.0, rating))
            lr.rating = rating
            lr.stage = ListingRequest.Stage.LIVE
            lr.save()
            return Response(ListingRequestSerializer(lr, context={"request": request}).data)

        return Response(ListingRequestSerializer(lr, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="publish")
    def publish(self, request, pk=None):
        lr = self.get_queryset().filter(pk=pk).first()
        if not lr:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if lr.stage not in {ListingRequest.Stage.LIVE, ListingRequest.Stage.DONE}:
            return Response({"detail": "Listing is not ready to publish."}, status=status.HTTP_400_BAD_REQUEST)

        if lr.created_product_id:
            lr.stage = ListingRequest.Stage.DONE
            lr.save(update_fields=["stage", "updated_at"])
            return Response(ListingRequestSerializer(lr, context={"request": request}).data)

        category = lr.category
        if category is None:
            category = Category.objects.filter(Q(name__iexact="Other") | Q(slug__iexact="other")).first()
        if category is None:
            category = Category.objects.first()
        if category is None:
            category, _ = Category.objects.get_or_create(name="Other")

        p = Product.objects.create(
            seller=request.user,
            category=category,
            name=lr.product_name,
            title=lr.product_name,
            description=lr.description or "",
            currency=(lr.currency or "USD").upper(),
            price=lr.unit_price,
            status=Product.Status.ACTIVE,
            vehsl_rating=lr.rating,
        )
        photos = list(lr.photos.all())
        for idx, ph in enumerate(photos[:10]):
            try:
                url = ph.file.url
            except Exception:
                continue
            ProductMedia.objects.create(product=p, media_type=ProductMedia.MediaType.IMAGE, url=url, position=idx)

        lr.created_product = p
        lr.stage = ListingRequest.Stage.DONE
        lr.save(update_fields=["created_product", "stage", "updated_at"])
        return Response(ListingRequestSerializer(lr, context={"request": request}).data)


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
            .select_related("category", "seller", "seller__seller_profile")
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
        product.save(update_fields=["status", "updated_at"])
        audit(request.user, action="admin_product_approved", target_type="product", target_id=str(product.id), payload={})
        return self.retrieve(request, pk=pk)

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        product = Product.objects.filter(id=pk, deleted_at__isnull=True).first()
        if not product:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        product.status = Product.Status.REJECTED
        product.save(update_fields=["status", "updated_at"])
        audit(request.user, action="admin_product_rejected", target_type="product", target_id=str(product.id), payload={})
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
        allowed = {Product.Status.DRAFT, Product.Status.PENDING, Product.Status.APPROVED, Product.Status.REJECTED, Product.Status.ACTIVE, Product.Status.ARCHIVED}
        if next_status not in allowed:
            return Response({"status": "Invalid status."}, status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(ids, list) or not ids:
            return Response({"ids": "ids must be a non-empty list."}, status=status.HTTP_400_BAD_REQUEST)
        qs = Product.objects.filter(deleted_at__isnull=True, id__in=ids)
        updated = qs.update(status=next_status)
        audit(request.user, action="admin_products_bulk_status", target_type="product_bulk", target_id="", payload={"count": updated, "status": next_status})
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
        audit(request.user, action="admin_products_bulk_category", target_type="product_bulk", target_id="", payload={"count": updated, "category_id": category_id})
        return Response({"updated": updated})

    @action(detail=False, methods=["post"], url_path="bulk/hs-code")
    def bulk_hs_code(self, request):
        ids = request.data.get("ids") or []
        hs_code = (request.data.get("hs_code") or "").strip()
        if not isinstance(ids, list) or not ids:
            return Response({"ids": "ids must be a non-empty list."}, status=status.HTTP_400_BAD_REQUEST)
        updated = Product.objects.filter(deleted_at__isnull=True, id__in=ids).update(hs_code=hs_code)
        audit(request.user, action="admin_products_bulk_hs_code", target_type="product_bulk", target_id="", payload={"count": updated, "hs_code": hs_code})
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
        audit(request.user, action="admin_products_bulk_stock", target_type="product_bulk", target_id="", payload={"count": updated, "stock_units": qty})
        return Response({"updated": updated})

    @action(detail=False, methods=["post"], url_path="bulk/export")
    def bulk_export(self, request):
        threshold = self._low_stock_threshold()
        ids = request.data.get("ids") or []
        if not isinstance(ids, list) or not ids:
            return Response({"ids": "ids must be a non-empty list."}, status=status.HTTP_400_BAD_REQUEST)
        qs = self.get_queryset().filter(id__in=ids)
        audit(request.user, action="admin_products_bulk_exported", target_type="product_bulk", target_id="", payload={"count": qs.count()})
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
            .annotate(products_count=Count("products", filter=Q(products__deleted_at__isnull=True)))
            .filter(products_count__gt=0)
            .order_by("name")
        )
        return Response([{"id": c.id, "name": c.name, "slug": c.slug, "count": c.products_count} for c in qs])

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

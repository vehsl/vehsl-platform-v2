import csv

from django.db.models import CharField, Count, IntegerField, Q, Sum, Value
from django.db.models.functions import Coalesce
from django.http import HttpResponse
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from apps.accounts.permissions import IsAdmin, IsSeller
from apps.accounts.models import User

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


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "sku", "description"]
    ordering_fields = ["created_at", "price"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = Product.objects.select_related("category", "seller").filter(deleted_at__isnull=True)
        user = self.request.user
        if user.is_authenticated and user.account_type == "seller":
            return qs.filter(seller=user)
        return qs.filter(status__in=[Product.Status.APPROVED, Product.Status.ACTIVE])

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


class AdminProductViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = AdminProductListSerializer

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
                seller_name=Coalesce(
                    "seller__seller_profile__business_name",
                    "seller__email",
                    "seller__phone",
                    Value(""),
                    output_field=CharField(),
                ),
            )
            .order_by("-created_at")
        )

        q = (self.request.query_params.get("q") or "").strip()
        if q:
            qs = qs.filter(
                Q(name__icontains=q)
                | Q(title__icontains=q)
                | Q(sku__icontains=q)
                | Q(hs_code__icontains=q)
                | Q(description__icontains=q)
                | Q(seller__email__icontains=q)
                | Q(seller__phone__icontains=q)
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

        return qs

    def list(self, request):
        threshold = self._low_stock_threshold()
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        if page is not None:
            ser = AdminProductListSerializer(page, many=True, context={"low_stock_threshold": threshold})
            return self.get_paginated_response(ser.data)
        ser = AdminProductListSerializer(qs, many=True, context={"low_stock_threshold": threshold})
        return Response(ser.data)

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

        return Response(
            {
                "total_products": total_products,
                "active_listings": active_listings,
                "low_stock": low_stock,
                "pending_review": pending_review,
            }
        )

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

        resp = HttpResponse(content_type="text/csv")
        resp["Content-Disposition"] = 'attachment; filename="admin_products.csv"'
        w = csv.writer(resp)
        w.writerow(
            [
                "id",
                "name",
                "seller",
                "category",
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

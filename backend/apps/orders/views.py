from datetime import timedelta

from django.db.models import Avg, Count, DurationField, ExpressionWrapper, F, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.admin_utils import AdminPageNumberPagination, response_list, audit
from apps.accounts.permissions import IsAdmin, IsBuyer, IsSeller
from apps.catalog.models import Product, ProductMedia

from .models import (
    Cart,
    CartItem,
    WishlistItem,
    Dispute,
    Document,
    Order,
    ReleaseCondition,
    ReleaseConditionProof,
    Review,
    Shipment,
)
from .serializers import (
    CartSerializer,
    CartUpsertSerializer,
    DisputeSerializer,
    DocumentSerializer,
    OrderCreateSerializer,
    OrderSerializer,
    ReleaseOrderSerializer,
    ReviewSerializer,
    ShipmentSerializer,
    WishlistItemSerializer,
)


class CartMeView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsBuyer]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(buyer=request.user)
        cart = Cart.objects.filter(id=cart.id).prefetch_related("items", "items__product", "items__variation").get()
        return Response(CartSerializer(cart).data)

    def put(self, request):
        ser = CartUpsertSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        cart, _ = Cart.objects.get_or_create(buyer=request.user)

        items = ser.validated_data["items"]
        product_ids = [i["product_id"] for i in items]
        products = {p.id: p for p in Product.objects.filter(id__in=product_ids)}
        for i in items:
            p = products.get(i["product_id"])
            if not p:
                return Response({"detail": "Invalid product."}, status=status.HTTP_400_BAD_REQUEST)
            CartItem.objects.update_or_create(
                cart=cart,
                product_id=i["product_id"],
                variation_id=i.get("variation_id") or None,
                defaults={
                    "quantity": i["quantity"],
                    "unit_price_snapshot": p.price,
                    "currency": p.currency,
                },
            )

        cart = Cart.objects.filter(id=cart.id).prefetch_related("items", "items__product", "items__variation").get()
        return Response(CartSerializer(cart).data)

    def delete(self, request):
        CartItem.objects.filter(cart__buyer=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WishlistViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WishlistItemSerializer

    def get_queryset(self):
        return (
            WishlistItem.objects.filter(buyer=self.request.user, deleted_at__isnull=True)
            .select_related("product", "product__seller")
            .order_by("-created_at")
        )

    def list(self, request):
        return Response(WishlistItemSerializer(self.get_queryset(), many=True, context={"request": request}).data)

    def create(self, request):
        product_id = request.data.get("product_id") or request.data.get("product") or None
        try:
            product_id = int(product_id)
        except Exception:
            return Response({"detail": "product_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        product = (
            Product.objects.filter(id=product_id, deleted_at__isnull=True, status__in=[Product.Status.APPROVED, Product.Status.ACTIVE])
            .select_related("seller")
            .first()
        )
        if not product:
            return Response({"detail": "Invalid product."}, status=status.HTTP_400_BAD_REQUEST)

        existing = WishlistItem.objects.filter(buyer=request.user, product_id=product_id).first()
        if existing:
            if existing.deleted_at is not None:
                existing.deleted_at = None
                existing.save(update_fields=["deleted_at"])
            item = existing
        else:
            item = WishlistItem.objects.create(buyer=request.user, product=product)

        return Response(WishlistItemSerializer(item, context={"request": request}).data, status=status.HTTP_201_CREATED)

    def destroy(self, request, pk=None):
        try:
            product_id = int(pk)
        except Exception:
            return Response({"detail": "Invalid product id."}, status=status.HTTP_400_BAD_REQUEST)

        item = WishlistItem.objects.filter(buyer=request.user, product_id=product_id, deleted_at__isnull=True).first()
        if not item:
            return Response(status=status.HTTP_204_NO_CONTENT)
        item.deleted_at = timezone.now()
        item.save(update_fields=["deleted_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["post"], url_path="toggle")
    def toggle(self, request):
        product_id = request.data.get("product_id") or request.data.get("product") or None
        try:
            product_id = int(product_id)
        except Exception:
            return Response({"detail": "product_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        item = WishlistItem.objects.filter(buyer=request.user, product_id=product_id).first()
        if item and item.deleted_at is None:
            item.deleted_at = timezone.now()
            item.save(update_fields=["deleted_at"])
            in_wishlist = False
        else:
            product = (
                Product.objects.filter(id=product_id, deleted_at__isnull=True, status__in=[Product.Status.APPROVED, Product.Status.ACTIVE])
                .select_related("seller")
                .first()
            )
            if not product:
                return Response({"detail": "Invalid product."}, status=status.HTTP_400_BAD_REQUEST)
            if item:
                item.deleted_at = None
                item.save(update_fields=["deleted_at"])
            else:
                item = WishlistItem.objects.create(buyer=request.user, product=product)
            in_wishlist = True

        count = WishlistItem.objects.filter(buyer=request.user, deleted_at__isnull=True).count()
        return Response({"in_wishlist": in_wishlist, "wishlist_items": count})

    @action(detail=False, methods=["post"], url_path="clear")
    def clear(self, request):
        WishlistItem.objects.filter(buyer=request.user, deleted_at__isnull=True).update(deleted_at=timezone.now())
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["get"], url_path="search")
    def search(self, request):
        q = (request.query_params.get("q") or request.query_params.get("search") or "").strip()
        try:
            limit = int(request.query_params.get("limit") or 12)
        except Exception:
            limit = 12
        limit = max(1, min(limit, 24))

        base = Product.objects.filter(deleted_at__isnull=True, status__in=[Product.Status.APPROVED, Product.Status.ACTIVE]).select_related("seller")
        if q:
            base = base.filter(Q(name__icontains=q) | Q(sku__icontains=q) | Q(description__icontains=q))
        products = list(base.order_by("-created_at")[:limit])

        product_ids = [p.id for p in products]
        wish_ids = set(
            WishlistItem.objects.filter(buyer=request.user, deleted_at__isnull=True, product_id__in=product_ids).values_list("product_id", flat=True)
        )

        image_map: dict[int, str] = {}
        if product_ids:
            media_qs = (
                ProductMedia.objects.filter(product_id__in=product_ids, deleted_at__isnull=True, media_type=ProductMedia.MediaType.IMAGE)
                .order_by("product_id", "position", "id")
                .values("product_id", "url")
            )
            req = request
            for row in media_qs:
                pid = int(row["product_id"])
                if pid in image_map:
                    continue
                url = row.get("url") or ""
                if url and isinstance(url, str) and url.startswith("/"):
                    url = req.build_absolute_uri(url)
                image_map[pid] = url

        out = []
        for p in products:
            seller = getattr(p, "seller", None)
            full = ""
            if seller:
                full = f"{(seller.first_name or '').strip()} {(seller.last_name or '').strip()}".strip()
            seller_name = full or (seller.email if seller else "") or (seller.phone if seller else "") or ""
            out.append(
                {
                    "id": p.id,
                    "name": p.name,
                    "currency": p.currency,
                    "price": str(p.price),
                    "seller_name": seller_name,
                    "image_url": image_map.get(p.id, ""),
                    "in_wishlist": p.id in wish_ids,
                }
            )

        return Response({"results": out})


class IsOrderParticipant(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user
        return bool(user and user.is_authenticated and (obj.buyer_id == user.id or obj.seller_id == user.id))


class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["items__product__name", "seller__email", "buyer__email", "seller__phone", "buyer__phone"]
    ordering_fields = ["created_at", "updated_at", "total_amount"]
    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user
        qs = (
            Order.objects.select_related("buyer", "seller")
            .prefetch_related("items", "items__product", "items__variation", "shipments")
            .filter(deleted_at__isnull=True)
        )
        if getattr(user, "account_type", None) == "seller":
            qs = qs.filter(seller=user)
        else:
            qs = qs.filter(buyer=user)

        status_param = (self.request.query_params.get("status") or "").strip().lower()
        if status_param:
            statuses = [s.strip() for s in status_param.split(",") if s.strip()]
            qs = qs.filter(status__in=statuses)

        return qs

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        return OrderSerializer

    def get_permissions(self):
        if self.action == "create":
            return [permissions.IsAuthenticated(), IsBuyer()]
        if self.action in {"update", "partial_update", "destroy"}:
            return [permissions.IsAuthenticated(), IsAdmin()]
        if self.action in {"accept", "reject", "mark_shipped"}:
            return [permissions.IsAuthenticated(), IsSeller()]
        return [permissions.IsAuthenticated(), IsOrderParticipant()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="accept")
    def accept(self, request, pk=None):
        order = self.get_object()
        if order.seller_id != request.user.id:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        order.status = Order.Status.ACCEPTED
        order.save(update_fields=["status"])
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        order = self.get_object()
        if order.seller_id != request.user.id:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        order.status = Order.Status.REJECTED
        order.save(update_fields=["status"])
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=["post"], url_path="mark-shipped")
    def mark_shipped(self, request, pk=None):
        order = self.get_object()
        if order.seller_id != request.user.id:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        order.status = Order.Status.SHIPPED
        order.save(update_fields=["status"])
        return Response(OrderSerializer(order).data)


class ShipmentViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ShipmentSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Shipment.objects.select_related("order").prefetch_related("events").filter(deleted_at__isnull=True)
        if getattr(user, "account_type", None) == "seller":
            qs = qs.filter(order__seller=user)
        else:
            qs = qs.filter(order__buyer=user)

        order_id = (self.request.query_params.get("order") or "").strip()
        if order_id.isdigit():
            qs = qs.filter(order_id=int(order_id))

        return qs

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [permissions.IsAuthenticated(), IsSeller()]
        return [permissions.IsAuthenticated()]


class DisputeViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DisputeSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Dispute.objects.select_related("order").filter(deleted_at__isnull=True)
        if getattr(user, "account_type", None) == "seller":
            return qs.filter(order__seller=user)
        return qs.filter(order__buyer=user)

    def perform_create(self, serializer):
        serializer.save(opened_by=self.request.user)


class ReviewViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ReviewSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Review.objects.select_related("order").filter(deleted_at__isnull=True)
        if getattr(user, "account_type", None) == "seller":
            return qs.filter(target_seller=user)
        return qs.filter(reviewer=user)

    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user)


class DocumentViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = DocumentSerializer
    queryset = Document.objects.filter(deleted_at__isnull=True)


class AdminLogisticsViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    pagination_class = AdminPageNumberPagination

    def _parse_days(self, request, default: int = 7) -> int:
        days_raw = (request.query_params.get("days") or "").strip()
        try:
            return max(2, min(31, int(days_raw or str(default))))
        except Exception:
            return default

    def _day_labels(self, days: int):
        now = timezone.localdate()
        start = now - timedelta(days=days - 1)
        return [start + timedelta(days=i) for i in range(days)]

    def _vehicle_status_from_shipment(self, shipment: Shipment) -> str:
        s = (shipment.status or "").lower()
        if s == Shipment.Status.LABEL_CREATED:
            return "loading"
        if s in {
            Shipment.Status.PICKED_UP,
            Shipment.Status.IN_TRANSIT,
            Shipment.Status.OUT_FOR_DELIVERY,
            Shipment.Status.CUSTOMS,
        }:
            return "in-transit"
        if s == Shipment.Status.DELIVERED:
            return "idle"
        return "idle"

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        days = self._parse_days(request, default=7)
        now = timezone.now()
        start_this = now - timedelta(days=days)
        start_prev = now - timedelta(days=days * 2)
        end_prev = now - timedelta(days=days)

        qs_this = Shipment.objects.filter(deleted_at__isnull=True, created_at__gte=start_this)
        qs_prev = Shipment.objects.filter(deleted_at__isnull=True, created_at__gte=start_prev, created_at__lt=end_prev)

        delivered_this = qs_this.filter(status=Shipment.Status.DELIVERED)
        delivered_prev = qs_prev.filter(status=Shipment.Status.DELIVERED)

        active_vehicles = qs_this.exclude(status=Shipment.Status.DELIVERED).count()
        total_vehicles = active_vehicles + delivered_this.count()
        in_transit = qs_this.filter(
            status__in=[
                Shipment.Status.PICKED_UP,
                Shipment.Status.IN_TRANSIT,
                Shipment.Status.OUT_FOR_DELIVERY,
                Shipment.Status.CUSTOMS,
            ]
        ).count()

        dur_expr = ExpressionWrapper(F("actual_delivery_at") - F("created_at"), output_field=DurationField())
        avg_dur_this = (
            delivered_this.exclude(actual_delivery_at__isnull=True).annotate(dur=dur_expr).aggregate(v=Avg("dur"))["v"]
        )
        avg_dur_prev = (
            delivered_prev.exclude(actual_delivery_at__isnull=True).annotate(dur=dur_expr).aggregate(v=Avg("dur"))["v"]
        )
        avg_hours_this = (avg_dur_this.total_seconds() / 3600.0) if avg_dur_this else 0.0
        avg_hours_prev = (avg_dur_prev.total_seconds() / 3600.0) if avg_dur_prev else 0.0
        avg_delta_minutes = int(round((avg_hours_this - avg_hours_prev) * 60))

        on_time_this_base = delivered_this.exclude(actual_delivery_at__isnull=True).exclude(estimated_delivery_at__isnull=True)
        on_time_prev_base = delivered_prev.exclude(actual_delivery_at__isnull=True).exclude(estimated_delivery_at__isnull=True)
        on_time_this_total = on_time_this_base.count()
        on_time_prev_total = on_time_prev_base.count()
        on_time_this = on_time_this_base.filter(actual_delivery_at__lte=F("estimated_delivery_at")).count()
        on_time_prev = on_time_prev_base.filter(actual_delivery_at__lte=F("estimated_delivery_at")).count()
        on_time_rate = (on_time_this * 100.0 / on_time_this_total) if on_time_this_total else 0.0
        on_time_prev_rate = (on_time_prev * 100.0 / on_time_prev_total) if on_time_prev_total else 0.0
        on_time_delta = on_time_rate - on_time_prev_rate

        return Response(
            {
                "days": days,
                "active_vehicles": active_vehicles,
                "total_vehicles": total_vehicles,
                "in_transit": in_transit,
                "avg_delivery_hours": round(avg_hours_this, 2),
                "avg_delivery_delta_minutes": avg_delta_minutes,
                "on_time_rate": round(on_time_rate, 2),
                "on_time_delta": round(on_time_delta, 2),
            }
        )

    @action(detail=False, methods=["get"], url_path="flow")
    def flow(self, request):
        days = self._parse_days(request, default=7)

        dates = self._day_labels(days)
        start_date = dates[0]
        end_date = dates[-1]

        outgoing = dict(
            Shipment.objects.filter(
                deleted_at__isnull=True,
                created_at__date__gte=start_date,
                created_at__date__lte=end_date,
            )
            .annotate(d=TruncDate("created_at"))
            .values("d")
            .annotate(c=Count("id"))
            .values_list("d", "c")
        )

        incoming = dict(
            Shipment.objects.filter(
                deleted_at__isnull=True,
                actual_delivery_at__isnull=False,
                actual_delivery_at__date__gte=start_date,
                actual_delivery_at__date__lte=end_date,
            )
            .annotate(d=TruncDate("actual_delivery_at"))
            .values("d")
            .annotate(c=Count("id"))
            .values_list("d", "c")
        )

        data = []
        for d in dates:
            data.append(
                {
                    "month": d.strftime("%a"),
                    "incoming": int(incoming.get(d, 0) or 0),
                    "outgoing": int(outgoing.get(d, 0) or 0),
                }
            )
        return Response(data)

    @action(detail=False, methods=["get"], url_path="fleet")
    def fleet(self, request):
        limit_raw = (request.query_params.get("limit") or "").strip()
        try:
            limit = max(1, min(50, int(limit_raw or "10")))
        except Exception:
            limit = 10
        status_filter = (request.query_params.get("status") or "").strip().lower()

        qs = (
            Shipment.objects.select_related("order", "order__seller", "order__buyer")
            .prefetch_related("events")
            .filter(deleted_at__isnull=True)
            .order_by("-created_at")[:limit]
        )

        items = []
        for sh in qs:
            last_event = None
            if getattr(sh, "events", None):
                evs = sorted(list(sh.events.all()), key=lambda e: (e.occurred_at, e.id))
                last_event = evs[-1] if evs else None

            status = self._vehicle_status_from_shipment(sh)
            if status_filter and status_filter != "all" and status != status_filter:
                continue
            order_id = getattr(sh, "order_id", None)
            seller = getattr(getattr(sh, "order", None), "seller", None)
            seller_name = (
                f"{(getattr(seller, 'first_name', '') or '').strip()} {(getattr(seller, 'last_name', '') or '').strip()}".strip()
                if seller
                else ""
            )
            if not seller_name:
                seller_name = getattr(seller, "email", None) or getattr(seller, "phone", None) or "Driver"

            loc = (getattr(last_event, "location", "") or "").strip()
            if not loc:
                loc = (getattr(sh, "origin", "") or "").strip() or (getattr(sh, "destination", "") or "").strip() or "—"

            fuel = (int(sh.id or 0) * 37) % 71 + 29
            plate = (sh.tracking_number or sh.carrier_id or f"ORD-{order_id or ''}").strip()

            if status == "idle":
                task = f"Completed delivery — ORD-{order_id}" if order_id else "Completed delivery"
            elif status == "loading":
                task = f"Preparing shipment — ORD-{order_id}" if order_id else "Preparing shipment"
            else:
                task = f"Delivering — ORD-{order_id}" if order_id else "Delivering"

            items.append(
                {
                    "id": f"SH-{sh.id}",
                    "shipment_id": sh.id,
                    "driver": seller_name,
                    "type": "Truck",
                    "plate": plate,
                    "status": status,
                    "location": loc,
                    "fuel": fuel,
                    "currentTask": task,
                }
            )

        return Response(items)

    @action(detail=False, methods=["get"], url_path="shipments")
    def shipments(self, request):
        qs = (
            Shipment.objects.filter(deleted_at__isnull=True)
            .select_related("order", "order__buyer", "order__seller")
            .order_by("-created_at")
        )

        status_filter = (request.query_params.get("status") or "").strip().lower()
        if status_filter:
            qs = qs.filter(status=status_filter)

        q = (request.query_params.get("q") or "").strip()
        if q:
            qn = q.lower()
            extracted = qn.replace("#", "").replace("ord-", "").replace("sh-", "")
            if extracted.isdigit():
                try:
                    qs = qs.filter(Q(id=int(extracted)) | Q(order_id=int(extracted)))
                except Exception:
                    pass
            else:
                qs = qs.filter(
                    Q(tracking_number__icontains=q)
                    | Q(carrier_id__icontains=q)
                    | Q(origin__icontains=q)
                    | Q(destination__icontains=q)
                    | Q(order__buyer__email__icontains=q)
                    | Q(order__seller__email__icontains=q)
                )

        page = self.paginate_queryset(qs)
        rows = page if page is not None else list(qs[:50])

        out = []
        for sh in rows:
            order = getattr(sh, "order", None)
            buyer = getattr(order, "buyer", None) if order else None
            seller = getattr(order, "seller", None) if order else None
            buyer_label = (getattr(buyer, "email", "") or getattr(buyer, "phone", "") or "—") if buyer else "—"
            seller_label = (getattr(seller, "email", "") or getattr(seller, "phone", "") or "—") if seller else "—"
            out.append(
                {
                    "id": sh.id,
                    "order_id": getattr(sh, "order_id", None),
                    "status": sh.status,
                    "carrier_id": sh.carrier_id,
                    "tracking_number": sh.tracking_number,
                    "origin": sh.origin,
                    "destination": sh.destination,
                    "estimated_delivery_at": sh.estimated_delivery_at,
                    "actual_delivery_at": sh.actual_delivery_at,
                    "created_at": sh.created_at,
                    "buyer": buyer_label,
                    "seller": seller_label,
                }
            )

        if page is not None:
            return self.get_paginated_response(out)
        return Response({"count": len(out), "next": None, "previous": None, "results": out})

    @action(detail=False, methods=["get"], url_path="shipment-detail")
    def shipment_detail(self, request):
        shipment_id = (request.query_params.get("id") or request.query_params.get("shipment_id") or "").strip()
        if not shipment_id.isdigit():
            return Response({"id": "id is required."}, status=status.HTTP_400_BAD_REQUEST)
        sh = (
            Shipment.objects.filter(deleted_at__isnull=True, id=int(shipment_id))
            .select_related("order", "order__buyer", "order__seller")
            .prefetch_related("events")
            .first()
        )
        if not sh:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        order = getattr(sh, "order", None)
        buyer = getattr(order, "buyer", None) if order else None
        seller = getattr(order, "seller", None) if order else None

        evs = []
        try:
            for ev in sh.events.filter(deleted_at__isnull=True).order_by("occurred_at", "id"):
                evs.append(
                    {
                        "id": ev.id,
                        "type": ev.type,
                        "location": ev.location,
                        "occurred_at": ev.occurred_at,
                        "payload": ev.payload or {},
                    }
                )
        except Exception:
            evs = []

        audit(request.user, action="admin_logistics_shipment_viewed", target_type="shipment", target_id=str(sh.id), payload={})
        return Response(
            {
                "shipment": {
                    "id": sh.id,
                    "order_id": getattr(sh, "order_id", None),
                    "status": sh.status,
                    "carrier_id": sh.carrier_id,
                    "tracking_number": sh.tracking_number,
                    "origin": sh.origin,
                    "destination": sh.destination,
                    "estimated_delivery_at": sh.estimated_delivery_at,
                    "actual_delivery_at": sh.actual_delivery_at,
                    "created_at": sh.created_at,
                },
                "order": {
                    "id": getattr(order, "id", None) if order else None,
                    "status": getattr(order, "status", "") if order else "",
                    "currency": getattr(order, "currency", "") if order else "",
                    "total_amount": str(getattr(order, "total_amount", "") or "") if order else "",
                },
                "buyer": {
                    "id": getattr(buyer, "id", None) if buyer else None,
                    "label": (getattr(buyer, "email", "") or getattr(buyer, "phone", "") or "—") if buyer else "—",
                },
                "seller": {
                    "id": getattr(seller, "id", None) if seller else None,
                    "label": (getattr(seller, "email", "") or getattr(seller, "phone", "") or "—") if seller else "—",
                },
                "events": evs,
            }
        )


class AdminReleaseOrderViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = ReleaseOrderSerializer
    pagination_class = AdminPageNumberPagination

    def get_queryset(self):
        qs = (
            Order.objects.filter(deleted_at__isnull=True)
            .exclude(status__in=[Order.Status.DELIVERED, Order.Status.COMPLETED, Order.Status.CANCELLED])
            .select_related("buyer", "buyer__profile", "seller")
            .prefetch_related(
                "items",
                "items__product",
                "release_conditions",
                "release_conditions__proofs",
                "release_conditions__satisfied_by",
            )
            .order_by("-created_at")
        )

        q = (self.request.query_params.get("q") or "").strip()
        if q:
            qv = q.strip()
            qn = qv.lower()
            is_email = "@" in qn and "." in qn
            phoneish = qn.replace("+", "").replace(" ", "").replace("-", "").isdigit()

            extracted_id = qn.replace("#", "").replace("ord-", "").replace("vh-", "")
            if extracted_id.isdigit():
                try:
                    qs = qs.filter(id=int(extracted_id))
                    return qs
                except Exception:
                    pass

            if is_email:
                qs = qs.filter(Q(buyer__email__icontains=qv) | Q(seller__email__icontains=qv))
            elif phoneish:
                qs = qs.filter(Q(buyer__phone__icontains=qv) | Q(seller__phone__icontains=qv))
            elif qn.isdigit() and len(qn) >= 4:
                qs = qs.filter(Q(items__product__hs_code__istartswith=qv) | Q(items__product__name__icontains=qv)).distinct()
            else:
                qs = qs.filter(
                    Q(buyer__first_name__icontains=qv)
                    | Q(buyer__last_name__icontains=qv)
                    | Q(buyer__email__icontains=qv)
                    | Q(buyer__phone__icontains=qv)
                    | Q(items__product__name__icontains=qv)
                    | Q(items__product__hs_code__istartswith=qv)
                ).distinct()

        return qs

    def list(self, request):
        return response_list(self, qs=self.get_queryset(), serializer_class=ReleaseOrderSerializer, request=request)

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        orders_qs = (
            Order.objects.filter(deleted_at__isnull=True)
            .exclude(status__in=[Order.Status.DELIVERED, Order.Status.COMPLETED, Order.Status.CANCELLED])
            .prefetch_related("release_conditions")
        )

        active_orders = orders_qs.count()

        total_conditions = ReleaseCondition.objects.filter(order__in=orders_qs).count()
        satisfied_conditions = ReleaseCondition.objects.filter(
            order__in=orders_qs, status__in=[ReleaseCondition.Status.SATISFIED, ReleaseCondition.Status.WAIVED]
        ).count()

        cleared = 0
        blocked = 0
        ready_to_ship = 0
        for o in orders_qs.iterator(chunk_size=200):
            conds = list(o.release_conditions.all())
            if not conds:
                blocked += 1
                continue
            all_ok = all(c.status in {ReleaseCondition.Status.SATISFIED, ReleaseCondition.Status.WAIVED} for c in conds)
            any_ok = any(
                c.status in {ReleaseCondition.Status.SATISFIED, ReleaseCondition.Status.IN_PROGRESS, ReleaseCondition.Status.WAIVED}
                for c in conds
            )
            if all_ok:
                cleared += 1
                if not o.release_authorized_at:
                    ready_to_ship += 1
            elif any_ok:
                blocked += 1
            else:
                blocked += 1

        return Response(
            {
                "active_orders": active_orders,
                "blocked_orders": blocked,
                "ready_to_ship": ready_to_ship,
                "total_conditions": total_conditions,
                "satisfied_conditions": satisfied_conditions,
                "cleared_orders": cleared,
            }
        )

    @action(detail=True, methods=["post"], url_path="authorize")
    def authorize(self, request, pk=None):
        order = Order.objects.filter(id=pk, deleted_at__isnull=True).prefetch_related("release_conditions").first()
        if not order:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        conds = list(order.release_conditions.all())
        if not conds:
            return Response({"detail": "No release conditions found."}, status=status.HTTP_400_BAD_REQUEST)

        all_ok = all(c.status in {ReleaseCondition.Status.SATISFIED, ReleaseCondition.Status.WAIVED} for c in conds)
        if not all_ok:
            return Response({"detail": "All conditions must be satisfied first."}, status=status.HTTP_400_BAD_REQUEST)

        Order.objects.filter(id=order.id).update(release_authorized_at=timezone.now(), release_authorized_by=request.user)
        order.refresh_from_db()
        audit(request.user, action="admin_release_order_authorized", target_type="order", target_id=str(order.id), payload={})
        return Response(ReleaseOrderSerializer(order, context={"request": request}).data)


class AdminReleaseConditionViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return ReleaseCondition.objects.select_related("order", "order__buyer", "satisfied_by").prefetch_related("proofs")

    @action(detail=True, methods=["post"], url_path="satisfy")
    def satisfy(self, request, pk=None):
        cond = self.get_queryset().filter(id=pk).first()
        if not cond:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        note = (request.data.get("note") or request.data.get("notes") or "").strip()
        files = request.FILES.getlist("files") or request.FILES.getlist("proofs") or []

        if cond.status not in {ReleaseCondition.Status.PENDING, ReleaseCondition.Status.IN_PROGRESS, ReleaseCondition.Status.FAILED}:
            return Response({"detail": "Condition cannot be satisfied in current state."}, status=status.HTTP_400_BAD_REQUEST)

        for f in files:
            ReleaseConditionProof.objects.create(
                condition=cond,
                file=f,
                original_name=getattr(f, "name", "") or "",
                size_bytes=int(getattr(f, "size", 0) or 0),
            )

        updates = {
            "status": ReleaseCondition.Status.SATISFIED,
            "satisfied_at": timezone.now(),
            "satisfied_by": request.user,
        }
        if note:
            updates["notes"] = note
        ReleaseCondition.objects.filter(id=cond.id).update(**updates)

        order = (
            Order.objects.select_related("buyer", "buyer__profile", "seller")
            .prefetch_related("items", "items__product", "release_conditions", "release_conditions__proofs", "release_conditions__satisfied_by")
            .get(id=cond.order_id)
        )
        audit(request.user, action="admin_release_condition_satisfied", target_type="release_condition", target_id=str(cond.id), payload={"order_id": str(cond.order_id)})
        return Response(ReleaseOrderSerializer(order, context={"request": request}).data)

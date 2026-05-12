from datetime import timedelta

from django.db.models import Avg, Count, DurationField, ExpressionWrapper, F, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdmin, IsBuyer, IsSeller
from apps.catalog.models import Product

from .models import Cart, CartItem, Dispute, Document, Order, Review, Shipment
from .serializers import (
    CartSerializer,
    CartUpsertSerializer,
    DisputeSerializer,
    DocumentSerializer,
    OrderCreateSerializer,
    OrderSerializer,
    ReviewSerializer,
    ShipmentSerializer,
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


class IsOrderParticipant(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user
        return bool(user and user.is_authenticated and (obj.buyer_id == user.id or obj.seller_id == user.id))


class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Order.objects.prefetch_related("items", "items__product", "items__variation").filter(deleted_at__isnull=True)
        if getattr(user, "account_type", None) == "seller":
            return qs.filter(seller=user)
        return qs.filter(buyer=user)

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
            return qs.filter(order__seller=user)
        return qs.filter(order__buyer=user)

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
        now = timezone.now()
        start_this = now - timedelta(days=7)
        start_prev = now - timedelta(days=14)
        end_prev = now - timedelta(days=7)

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
        days_raw = (request.query_params.get("days") or "").strip()
        try:
            days = max(2, min(31, int(days_raw or "7")))
        except Exception:
            days = 7

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

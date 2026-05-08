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

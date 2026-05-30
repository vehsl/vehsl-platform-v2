import base64
import hashlib
import hmac
import time
from datetime import datetime, timedelta, time as dt_time
from decimal import Decimal, ROUND_HALF_UP

from django.core.cache import cache
from django.db.models import Avg, Count, DurationField, ExpressionWrapper, F, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from django.contrib.auth.hashers import check_password
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.admin_utils import AdminPageNumberPagination, response_list, audit
from apps.accounts.models import UserSettings
from apps.accounts.permissions import IsAdmin, IsBuyer, IsSeller
from apps.catalog.models import Product, ProductMedia, ProductVariation, resolve_unit_price

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
    ShipmentEvent,
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
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(buyer=request.user)
        cart = (
            Cart.objects.filter(id=cart.id)
            .prefetch_related("items", "items__product", "items__product__seller", "items__variation")
            .get()
        )
        return Response(CartSerializer(cart, context={"request": request}).data)

    def put(self, request):
        ser = CartUpsertSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        cart, _ = Cart.objects.get_or_create(buyer=request.user)

        items = ser.validated_data["items"]
        product_ids = [i["product_id"] for i in items]
        products = {p.id: p for p in Product.objects.filter(id__in=product_ids)}
        variation_ids = [i.get("variation_id") for i in items if i.get("variation_id")]
        variation_map = {}
        if variation_ids:
            vars = ProductVariation.objects.filter(id__in=variation_ids, deleted_at__isnull=True)
            variation_map = {v.id: v for v in vars}
        for i in items:
            p = products.get(i["product_id"])
            if not p:
                return Response({"detail": "Invalid product."}, status=status.HTTP_400_BAD_REQUEST)
            var_id = i.get("variation_id") or None
            var = variation_map.get(var_id) if var_id else None
            if var and getattr(var, "product_id", None) != getattr(p, "id", None):
                return Response({"detail": "Invalid variation."}, status=status.HTTP_400_BAD_REQUEST)
            unit_price, currency = resolve_unit_price(p, var, i["quantity"])
            if unit_price is None:
                return Response({"detail": "Could not resolve price."}, status=status.HTTP_400_BAD_REQUEST)
            CartItem.objects.update_or_create(
                cart=cart,
                product_id=i["product_id"],
                variation_id=var_id,
                defaults={
                    "quantity": i["quantity"],
                    "unit_price_snapshot": unit_price,
                    "currency": currency or (p.currency or "USD"),
                },
            )

        cart = (
            Cart.objects.filter(id=cart.id)
            .prefetch_related("items", "items__product", "items__product__seller", "items__variation")
            .get()
        )
        return Response(CartSerializer(cart, context={"request": request}).data)

    def delete(self, request):
        CartItem.objects.filter(cart__buyer=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CartItemMeDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk: int):
        try:
            pk = int(pk)
        except Exception:
            return Response({"detail": "Invalid item."}, status=status.HTTP_400_BAD_REQUEST)

        item = (
            CartItem.objects.filter(id=pk, cart__buyer=request.user)
            .select_related("product", "product__seller", "variation")
            .first()
        )
        if not item:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        qty = request.data.get("quantity")
        try:
            qty = int(qty)
        except Exception:
            return Response({"detail": "quantity is required."}, status=status.HTTP_400_BAD_REQUEST)
        if qty < 1:
            return Response({"detail": "quantity must be >= 1."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            p = item.product
            var = item.variation if item.variation_id else None
            unit_price, currency = resolve_unit_price(p, var, qty)
            if unit_price is None:
                return Response({"detail": "Could not resolve price."}, status=status.HTTP_400_BAD_REQUEST)
            item.unit_price_snapshot = unit_price
            item.currency = currency or (getattr(p, "currency", "") or "USD")
        except Exception:
            pass
        item.quantity = qty
        item.save(update_fields=["quantity", "unit_price_snapshot", "currency"])
        cart = (
            Cart.objects.filter(id=item.cart_id)
            .prefetch_related("items", "items__product", "items__product__seller", "items__variation")
            .get()
        )
        return Response(CartSerializer(cart, context={"request": request}).data)

    def delete(self, request, pk: int):
        try:
            pk = int(pk)
        except Exception:
            return Response({"detail": "Invalid item."}, status=status.HTTP_400_BAD_REQUEST)
        CartItem.objects.filter(id=pk, cart__buyer=request.user).delete()
        cart, _ = Cart.objects.get_or_create(buyer=request.user)
        cart = (
            Cart.objects.filter(id=cart.id)
            .prefetch_related("items", "items__product", "items__product__seller", "items__variation")
            .get()
        )
        return Response(CartSerializer(cart, context={"request": request}).data)


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


def _totp_valid(base32_secret: str, code: str) -> bool:
    secret = (base32_secret or "").strip()
    code = (code or "").strip()
    if not secret or not code:
        return False

    def _totp(for_counter: int, digits: int = 6) -> str:
        key = base64.b32decode(secret.upper().encode("utf-8") + b"=" * ((8 - len(secret) % 8) % 8))
        msg = for_counter.to_bytes(8, "big")
        digest = hmac.new(key, msg, hashlib.sha1).digest()
        offset = digest[-1] & 0x0F
        code_int = int.from_bytes(digest[offset : offset + 4], "big") & 0x7FFFFFFF
        return str(code_int % (10**digits)).zfill(digits)

    counter = int(time.time() // 30)
    return any(_totp(counter + w) == code for w in (-1, 0, 1))


def _require_order_verification(user, data: dict) -> tuple[bool, str]:
    try:
        settings = UserSettings.objects.filter(user=user).first()
    except Exception:
        settings = None
    sec = dict(getattr(settings, "security", None) or {})

    if not bool(sec.get("cancelVerifyEnabled", True)):
        return (True, "")

    totp_enabled = bool(sec.get("totp_enabled")) or bool(getattr(user, "two_factor_enabled", False))
    payout_pin_set = bool(sec.get("payoutPinSet")) and bool(sec.get("payoutPinHash"))

    password = str((data or {}).get("password") or "").strip()
    payout_pin = str((data or {}).get("payout_pin") or (data or {}).get("payoutPin") or "").strip()
    code = str((data or {}).get("totp_code") or (data or {}).get("code") or "").strip()
    recovery_code = str((data or {}).get("recovery_code") or (data or {}).get("recoveryCode") or "").strip()

    if totp_enabled:
        if recovery_code:
            hashes = sec.get("recoveryCodes") or []
            if isinstance(hashes, list) and any(check_password(recovery_code, h) for h in hashes if isinstance(h, str) and h):
                return (True, "")
        secret = str(sec.get("totp_secret") or "").strip()
        if secret and code and _totp_valid(secret, code):
            return (True, "")
        return (False, "OTP or recovery code required.")

    if payout_pin_set:
        if payout_pin and check_password(payout_pin, str(sec.get("payoutPinHash") or "")):
            return (True, "")
        return (False, "Payout PIN required.")

    if password and user.check_password(password):
        return (True, "")
    return (False, "Password required.")


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
            return [permissions.IsAuthenticated()]
        if self.action in {"update", "partial_update", "destroy"}:
            return [permissions.IsAuthenticated(), IsAdmin()]
        if self.action in {"accept", "reject", "cancel", "extend_deadline", "sample_ready", "confirm_ready", "mark_shipped", "mark_delivered", "mark_completed"}:
            return [permissions.IsAuthenticated(), IsSeller()]
        return [permissions.IsAuthenticated(), IsOrderParticipant()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        audit(
            request.user,
            action="order_created",
            target_type="order",
            target_id=str(order.id),
            payload={
                "buyer_id": str(getattr(order, "buyer_id", "") or ""),
                "seller_id": str(getattr(order, "seller_id", "") or ""),
                "status": str(getattr(order, "status", "") or ""),
                "total_amount": str(getattr(order, "total_amount", "") or ""),
                "currency": str(getattr(order, "currency", "") or ""),
            },
        )
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="accept")
    def accept(self, request, pk=None):
        order = self.get_object()
        if order.seller_id != request.user.id:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        prev = order.status
        order.status = Order.Status.ACCEPTED
        order.save(update_fields=["status"])
        audit(
            request.user,
            action="order_status_changed",
            target_type="order",
            target_id=str(order.id),
            payload={"from": str(prev or ""), "to": str(order.status or "")},
        )
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        order = self.get_object()
        if order.seller_id != request.user.id:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        prev = order.status
        order.status = Order.Status.REJECTED
        order.save(update_fields=["status"])
        audit(
            request.user,
            action="order_status_changed",
            target_type="order",
            target_id=str(order.id),
            payload={"from": str(prev or ""), "to": str(order.status or "")},
        )
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        order = self.get_object()
        user = request.user
        is_seller = bool(getattr(user, "account_type", None) == "seller" or getattr(user, "role", None) == "seller")
        if is_seller:
            if order.seller_id != user.id:
                return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        else:
            if order.buyer_id != user.id:
                return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        if order.status in {Order.Status.CANCELLED, Order.Status.COMPLETED, Order.Status.REJECTED}:
            return Response({"detail": "Order cannot be cancelled."}, status=status.HTTP_400_BAD_REQUEST)
        if order.status in {Order.Status.SHIPPED, Order.Status.DELIVERED}:
            return Response({"detail": "Order already shipped."}, status=status.HTTP_400_BAD_REQUEST)

        if is_seller:
            ok, msg = _require_order_verification(user, request.data if isinstance(request.data, dict) else {})
            if not ok:
                return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)

        prev = order.status
        order.status = Order.Status.CANCELLED
        order.save(update_fields=["status"])
        audit(
            request.user,
            action="order_status_changed",
            target_type="order",
            target_id=str(order.id),
            payload={"from": str(prev or ""), "to": str(order.status or "")},
        )
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=["post"], url_path="extend-deadline")
    def extend_deadline(self, request, pk=None):
        order = self.get_object()
        if order.seller_id != request.user.id:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        if order.status in {Order.Status.CANCELLED, Order.Status.COMPLETED, Order.Status.REJECTED}:
            return Response({"detail": "Order cannot be updated."}, status=status.HTTP_400_BAD_REQUEST)

        raw_days = (request.data.get("days") if isinstance(request.data, dict) else None) or 0
        try:
            days = int(raw_days)
        except Exception:
            return Response({"detail": "days must be an integer."}, status=status.HTTP_400_BAD_REQUEST)
        if days == 0:
            return Response({"detail": "days is required."}, status=status.HTTP_400_BAD_REQUEST)
        if days < -30 or days > 90:
            return Response({"detail": "days out of allowed range."}, status=status.HTTP_400_BAD_REQUEST)

        reason = str((request.data.get("reason") if isinstance(request.data, dict) else "") or "").strip()

        DAILY_RATE_PCT = Decimal("0.19")
        MAX_BONUS_PCT = Decimal("1.5")
        MAX_FEE_PCT = Decimal("9.0")

        base_total = Decimal(order.total_amount or 0)
        per_day = (base_total * DAILY_RATE_PCT) / Decimal("100")
        fee = per_day * Decimal(abs(days))
        if days < 0:
            max_bonus = (base_total * MAX_BONUS_PCT) / Decimal("100")
            fee = min(fee, max_bonus) * Decimal("-1")
        else:
            max_fee = (base_total * MAX_FEE_PCT) / Decimal("100")
            fee = min(fee, max_fee)
        fee = fee.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        current = order.deadline_at or timezone.now()
        order.deadline_at = current + timedelta(days=days)
        order.extension_reason = reason
        try:
            order.extension_fee = fee
        except Exception:
            pass
        order.save(update_fields=["deadline_at", "extension_reason", "extension_fee"])

        return Response(
            {
                "deadline_at": order.deadline_at,
                "extension_reason": order.extension_reason,
                "extension_fee": order.extension_fee,
            }
        )

    def _ensure_shipment(self, order: Order) -> Shipment:
        existing = Shipment.objects.filter(order=order, deleted_at__isnull=True).order_by("-created_at").first()
        if existing:
            return existing
        ship_addr = order.shipping_address or {}
        city = (ship_addr.get("city") or "").strip()
        country = (ship_addr.get("country") or ship_addr.get("country_name") or "").strip()
        destination = ", ".join([p for p in [city, country] if p]).strip()
        return Shipment.objects.create(
            order=order,
            status=Shipment.Status.LABEL_CREATED,
            origin="",
            destination=destination,
        )

    @action(detail=True, methods=["post"], url_path="sample-ready")
    def sample_ready(self, request, pk=None):
        order = self.get_object()
        if order.seller_id != request.user.id:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        if order.status in {Order.Status.CANCELLED, Order.Status.COMPLETED, Order.Status.REJECTED}:
            return Response({"detail": "Order cannot be updated."}, status=status.HTTP_400_BAD_REQUEST)

        shipment = self._ensure_shipment(order)
        prev_ship = shipment.status
        if shipment.status == Shipment.Status.LABEL_CREATED:
            Shipment.objects.filter(id=shipment.id).update(status=Shipment.Status.PICKED_UP)
            shipment.refresh_from_db()
        if shipment.status != prev_ship:
            audit(
                request.user,
                action="shipment_status_changed",
                target_type="shipment",
                target_id=str(shipment.id),
                payload={"order_id": str(order.id), "from": str(prev_ship or ""), "to": str(shipment.status or "")},
            )

        if order.status != Order.Status.SHIPPED:
            prev = order.status
            order.status = Order.Status.SHIPPED
            order.save(update_fields=["status"])
            audit(
                request.user,
                action="order_status_changed",
                target_type="order",
                target_id=str(order.id),
                payload={"from": str(prev or ""), "to": str(order.status or "")},
            )

        return Response({"order": OrderSerializer(order).data, "shipment": ShipmentSerializer(shipment).data})

    @action(detail=True, methods=["post"], url_path="confirm-ready")
    def confirm_ready(self, request, pk=None):
        order = self.get_object()
        if order.seller_id != request.user.id:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        if order.status in {Order.Status.CANCELLED, Order.Status.COMPLETED, Order.Status.REJECTED}:
            return Response({"detail": "Order cannot be updated."}, status=status.HTTP_400_BAD_REQUEST)

        shipment = self._ensure_shipment(order)
        prev_ship = shipment.status
        if shipment.status in {Shipment.Status.LABEL_CREATED, Shipment.Status.PICKED_UP}:
            Shipment.objects.filter(id=shipment.id).update(status=Shipment.Status.IN_TRANSIT)
            shipment.refresh_from_db()
        if shipment.status != prev_ship:
            audit(
                request.user,
                action="shipment_status_changed",
                target_type="shipment",
                target_id=str(shipment.id),
                payload={"order_id": str(order.id), "from": str(prev_ship or ""), "to": str(shipment.status or "")},
            )

        if order.status != Order.Status.SHIPPED:
            prev = order.status
            order.status = Order.Status.SHIPPED
            order.save(update_fields=["status"])
            audit(
                request.user,
                action="order_status_changed",
                target_type="order",
                target_id=str(order.id),
                payload={"from": str(prev or ""), "to": str(order.status or "")},
            )

        return Response({"order": OrderSerializer(order).data, "shipment": ShipmentSerializer(shipment).data})

    @action(detail=True, methods=["post"], url_path="mark-shipped")
    def mark_shipped(self, request, pk=None):
        order = self.get_object()
        if order.seller_id != request.user.id:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        prev = order.status
        order.status = Order.Status.SHIPPED
        order.save(update_fields=["status"])
        audit(
            request.user,
            action="order_status_changed",
            target_type="order",
            target_id=str(order.id),
            payload={"from": str(prev or ""), "to": str(order.status or "")},
        )
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=["post"], url_path="mark-delivered")
    def mark_delivered(self, request, pk=None):
        order = self.get_object()
        if order.seller_id != request.user.id:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        if order.status not in {Order.Status.SHIPPED, Order.Status.DELIVERED}:
            return Response({"detail": "Order must be shipped first."}, status=status.HTTP_400_BAD_REQUEST)
        prev = order.status
        order.status = Order.Status.DELIVERED
        order.save(update_fields=["status"])
        audit(
            request.user,
            action="order_status_changed",
            target_type="order",
            target_id=str(order.id),
            payload={"from": str(prev or ""), "to": str(order.status or "")},
        )
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=["post"], url_path="mark-completed")
    def mark_completed(self, request, pk=None):
        order = self.get_object()
        if order.seller_id != request.user.id:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        if order.status not in {Order.Status.DELIVERED, Order.Status.COMPLETED}:
            return Response({"detail": "Order must be delivered first."}, status=status.HTTP_400_BAD_REQUEST)
        prev = order.status
        order.status = Order.Status.COMPLETED
        order.save(update_fields=["status"])
        audit(
            request.user,
            action="order_status_changed",
            target_type="order",
            target_id=str(order.id),
            payload={"from": str(prev or ""), "to": str(order.status or "")},
        )
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

    def perform_update(self, serializer):
        instance = serializer.instance
        prev_status = getattr(instance, "status", "")
        prev_tracking = getattr(instance, "tracking_number", "")
        obj = serializer.save()
        if (getattr(obj, "status", "") or "") != (prev_status or ""):
            audit(
                self.request.user,
                action="shipment_status_changed",
                target_type="shipment",
                target_id=str(getattr(obj, "id", "") or ""),
                payload={
                    "order_id": str(getattr(obj, "order_id", "") or ""),
                    "from": str(prev_status or ""),
                    "to": str(getattr(obj, "status", "") or ""),
                },
            )
        if (getattr(obj, "tracking_number", "") or "") != (prev_tracking or ""):
            audit(
                self.request.user,
                action="shipment_tracking_updated",
                target_type="shipment",
                target_id=str(getattr(obj, "id", "") or ""),
                payload={"order_id": str(getattr(obj, "order_id", "") or ""), "tracking_number": str(getattr(obj, "tracking_number", "") or "")},
            )


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
        dispute = serializer.save(opened_by=self.request.user)
        audit(
            self.request.user,
            action="dispute_opened",
            target_type="dispute",
            target_id=str(getattr(dispute, "id", "") or ""),
            payload={"order_id": str(getattr(dispute, "order_id", "") or ""), "status": str(getattr(dispute, "status", "") or "")},
        )

    def perform_update(self, serializer):
        instance = serializer.instance
        prev_status = getattr(instance, "status", "")
        dispute = serializer.save()
        new_status = getattr(dispute, "status", "")
        if (new_status or "") != (prev_status or ""):
            action = "dispute_resolved" if str(new_status or "").lower() == Dispute.Status.RESOLVED else "dispute_status_changed"
            audit(
                self.request.user,
                action=action,
                target_type="dispute",
                target_id=str(getattr(dispute, "id", "") or ""),
                payload={"order_id": str(getattr(dispute, "order_id", "") or ""), "from": str(prev_status or ""), "to": str(new_status or "")},
            )


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

    def _user_label(self, u):
        if not u:
            return "—"
        seller_prof = getattr(u, "seller_profile", None)
        buyer_prof = getattr(u, "buyer_profile", None)
        seller_name = (getattr(seller_prof, "business_name", "") or "").strip() if seller_prof else ""
        buyer_name = (getattr(buyer_prof, "name", "") or "").strip() if buyer_prof else ""
        return seller_name or buyer_name or (getattr(u, "email", "") or "").strip() or (getattr(u, "phone", "") or "").strip() or f"user:{getattr(u, 'id', '')}"

    def _user_contact(self, u):
        if not u:
            return {"email": "", "phone": ""}
        return {"email": (getattr(u, "email", "") or "").strip(), "phone": (getattr(u, "phone", "") or "").strip()}

    def _parse_dt(self, raw):
        if not raw:
            return None
        s = str(raw).strip()
        if not s:
            return None
        dt = parse_datetime(s)
        if dt is None:
            d = parse_date(s)
            if d is None:
                return None
            dt = datetime.combine(d, dt_time.min)
        if timezone.is_naive(dt):
            try:
                dt = timezone.make_aware(dt, timezone.get_current_timezone())
            except Exception:
                pass
        return dt

    def _parse_dt_end(self, raw):
        if not raw:
            return None
        s = str(raw).strip()
        if not s:
            return None
        dt = parse_datetime(s)
        if dt is None:
            d = parse_date(s)
            if d is None:
                return None
            dt = datetime.combine(d, dt_time.max)
        if timezone.is_naive(dt):
            try:
                dt = timezone.make_aware(dt, timezone.get_current_timezone())
            except Exception:
                pass
        return dt

    def _tracking_exists_q(self):
        return ~(Q(tracking_number__isnull=True) | Q(tracking_number="")) | ~(Q(carrier_id__isnull=True) | Q(carrier_id=""))

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        days = self._parse_days(request, default=7)
        cache_key = f"admin_logistics_stats:{days}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)
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

        payload = {
            "days": days,
            "active_vehicles": active_vehicles,
            "total_vehicles": total_vehicles,
            "in_transit": in_transit,
            "avg_delivery_hours": round(avg_hours_this, 2),
            "avg_delivery_delta_minutes": avg_delta_minutes,
            "on_time_rate": round(on_time_rate, 2),
            "on_time_delta": round(on_time_delta, 2),
        }
        cache.set(cache_key, payload, timeout=60)
        return Response(payload)

    @action(detail=False, methods=["get"], url_path="flow")
    def flow(self, request):
        days = self._parse_days(request, default=7)
        cache_key = f"admin_logistics_flow:{days}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

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

        late_delivered = dict(
            Shipment.objects.filter(
                deleted_at__isnull=True,
                actual_delivery_at__isnull=False,
                estimated_delivery_at__isnull=False,
                actual_delivery_at__date__gte=start_date,
                actual_delivery_at__date__lte=end_date,
                actual_delivery_at__gt=F("estimated_delivery_at"),
            )
            .annotate(d=TruncDate("actual_delivery_at"))
            .values("d")
            .annotate(c=Count("id"))
            .values_list("d", "c")
        )

        late_open = dict(
            Shipment.objects.filter(
                deleted_at__isnull=True,
                actual_delivery_at__isnull=True,
                estimated_delivery_at__isnull=False,
                estimated_delivery_at__date__gte=start_date,
                estimated_delivery_at__date__lte=end_date,
                estimated_delivery_at__lt=timezone.now(),
            )
            .annotate(d=TruncDate("estimated_delivery_at"))
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
                    "late": int((late_delivered.get(d, 0) or 0) + (late_open.get(d, 0) or 0)),
                }
            )
        cache.set(cache_key, data, timeout=60)
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
            Shipment.objects.select_related(
                "order",
                "order__seller",
                "order__seller__seller_profile",
                "order__buyer",
                "order__buyer__buyer_profile",
            )
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
            order = getattr(sh, "order", None)
            seller = getattr(order, "seller", None) if order else None
            buyer = getattr(order, "buyer", None) if order else None
            loc = (getattr(last_event, "location", "") or "").strip()
            if not loc:
                loc = (getattr(sh, "origin", "") or "").strip() or (getattr(sh, "destination", "") or "").strip() or "—"

            items.append(
                {
                    "shipment_id": sh.id,
                    "status": status,
                    "shipment_status": getattr(sh, "status", "") or "",
                    "order_id": order_id,
                    "origin": getattr(sh, "origin", "") or "",
                    "destination": getattr(sh, "destination", "") or "",
                    "tracking_number": getattr(sh, "tracking_number", "") or "",
                    "carrier_id": getattr(sh, "carrier_id", "") or "",
                    "last_location": loc,
                    "seller": {"label": self._user_label(seller), **self._user_contact(seller)},
                    "buyer": {"label": self._user_label(buyer), **self._user_contact(buyer)},
                }
            )

        return Response(items)

    @action(detail=False, methods=["get"], url_path="shipments")
    def shipments(self, request):
        qs = (
            Shipment.objects.filter(deleted_at__isnull=True)
            .select_related(
                "order",
                "order__buyer",
                "order__buyer__buyer_profile",
                "order__seller",
                "order__seller__seller_profile",
            )
            .order_by("-created_at")
        )

        seller_id_raw = (request.query_params.get("seller_id") or "").strip()
        if seller_id_raw.isdigit():
            qs = qs.filter(order__seller_id=int(seller_id_raw))

        buyer_id_raw = (request.query_params.get("buyer_id") or "").strip()
        if buyer_id_raw.isdigit():
            qs = qs.filter(order__buyer_id=int(buyer_id_raw))

        status_filter = (request.query_params.get("status") or "").strip().lower()
        if status_filter:
            statuses = [s.strip() for s in status_filter.split(",") if s.strip()]
            if len(statuses) > 1:
                qs = qs.filter(status__in=statuses)
            else:
                qs = qs.filter(status=statuses[0] if statuses else status_filter)

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

        seller_q = (request.query_params.get("seller") or request.query_params.get("seller_q") or "").strip()
        if seller_q:
            sq = seller_q.strip()
            if sq.isdigit():
                qs = qs.filter(order__seller_id=int(sq))
            else:
                qs = qs.filter(
                    Q(order__seller__email__icontains=sq)
                    | Q(order__seller__phone__icontains=sq)
                    | Q(order__seller__seller_profile__business_name__icontains=sq)
                )

        buyer_q = (request.query_params.get("buyer") or request.query_params.get("buyer_q") or "").strip()
        if buyer_q:
            bq = buyer_q.strip()
            if bq.isdigit():
                qs = qs.filter(order__buyer_id=int(bq))
            else:
                qs = qs.filter(
                    Q(order__buyer__email__icontains=bq)
                    | Q(order__buyer__phone__icontains=bq)
                    | Q(order__buyer__buyer_profile__name__icontains=bq)
                )

        origin_contains = (request.query_params.get("origin_contains") or "").strip()
        if origin_contains:
            qs = qs.filter(origin__icontains=origin_contains)

        destination_contains = (request.query_params.get("destination_contains") or "").strip()
        if destination_contains:
            qs = qs.filter(destination__icontains=destination_contains)

        route_q = (request.query_params.get("route") or request.query_params.get("route_q") or "").strip()
        if route_q:
            rq = route_q.strip()
            qs = qs.filter(Q(origin__icontains=rq) | Q(destination__icontains=rq))

        has_tracking = (request.query_params.get("has_tracking") or "").strip().lower()
        if has_tracking in {"1", "true", "yes", "y"}:
            qs = qs.filter(self._tracking_exists_q())
        elif has_tracking in {"0", "false", "no", "n"}:
            qs = qs.exclude(self._tracking_exists_q())

        late = (request.query_params.get("late") or "").strip().lower()
        if late in {"1", "true", "yes", "y"}:
            now = timezone.now()
            qs = qs.exclude(status=Shipment.Status.DELIVERED).filter(actual_delivery_at__isnull=True).filter(estimated_delivery_at__isnull=False, estimated_delivery_at__lt=now)

        created_from = self._parse_dt(request.query_params.get("created_from"))
        if created_from is not None:
            qs = qs.filter(created_at__gte=created_from)

        created_to = self._parse_dt_end(request.query_params.get("created_to"))
        if created_to is not None:
            qs = qs.filter(created_at__lte=created_to)

        days_raw = (request.query_params.get("days") or "").strip()
        if days_raw.isdigit():
            try:
                days = max(1, min(365, int(days_raw)))
                qs = qs.filter(created_at__gte=timezone.now() - timedelta(days=days))
            except Exception:
                pass

        delivered_only = (request.query_params.get("delivered_only") or "").strip().lower()
        if delivered_only in {"1", "true", "yes", "y"}:
            qs = qs.filter(status=Shipment.Status.DELIVERED)

        late_only = (request.query_params.get("late_only") or "").strip().lower()
        if late_only in {"1", "true", "yes", "y"}:
            now = timezone.now()
            qs = qs.filter(estimated_delivery_at__isnull=False).filter(
                Q(actual_delivery_at__isnull=True, estimated_delivery_at__lt=now)
                | Q(actual_delivery_at__isnull=False, actual_delivery_at__gt=F("estimated_delivery_at"))
            )

        page = self.paginate_queryset(qs)
        rows = page if page is not None else list(qs[:50])

        out = []
        now = timezone.now()
        for sh in rows:
            order = getattr(sh, "order", None)
            buyer = getattr(order, "buyer", None) if order else None
            seller = getattr(order, "seller", None) if order else None
            buyer_label = self._user_label(buyer)
            seller_label = self._user_label(seller)
            eta = getattr(sh, "estimated_delivery_at", None)
            actual = getattr(sh, "actual_delivery_at", None)
            is_delivered = (getattr(sh, "status", "") or "") == Shipment.Status.DELIVERED
            is_late = bool(
                eta
                and (
                    (actual and actual > eta)
                    or ((not actual) and (not is_delivered) and (eta < now))
                )
            )
            created_at = getattr(sh, "created_at", None)
            end_at = actual or now
            days_in_transit = 0
            try:
                if created_at:
                    days_in_transit = max(0, int((end_at - created_at).total_seconds() // 86400))
            except Exception:
                days_in_transit = 0
            eta_status = "unknown"
            if not eta:
                eta_status = "unknown"
            elif is_delivered:
                if actual and actual > eta:
                    eta_status = "delivered_late"
                else:
                    eta_status = "delivered_on_time"
            else:
                eta_status = "late" if eta < now else "on_track"
            tracking_exists = bool((getattr(sh, "tracking_number", "") or "").strip() or (getattr(sh, "carrier_id", "") or "").strip())
            out.append(
                {
                    "id": sh.id,
                    "order_id": getattr(sh, "order_id", None),
                    "status": sh.status,
                    "carrier_id": sh.carrier_id,
                    "carrier_name": (sh.carrier_id or "").strip(),
                    "tracking_number": sh.tracking_number,
                    "tracking_exists": tracking_exists,
                    "origin": sh.origin,
                    "destination": sh.destination,
                    "estimated_delivery_at": sh.estimated_delivery_at,
                    "actual_delivery_at": sh.actual_delivery_at,
                    "created_at": sh.created_at,
                    "buyer_id": getattr(buyer, "id", None) if buyer else None,
                    "seller_id": getattr(seller, "id", None) if seller else None,
                    "buyer": buyer_label,
                    "seller": seller_label,
                    "buyer_label": buyer_label,
                    "seller_label": seller_label,
                    "buyer_contact": self._user_contact(buyer),
                    "seller_contact": self._user_contact(seller),
                    "is_late": is_late,
                    "days_in_transit": days_in_transit,
                    "eta_status": eta_status,
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
            .select_related(
                "order",
                "order__buyer",
                "order__buyer__buyer_profile",
                "order__seller",
                "order__seller__seller_profile",
            )
            .prefetch_related("events")
            .first()
        )
        if not sh:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        order = getattr(sh, "order", None)
        buyer = getattr(order, "buyer", None) if order else None
        seller = getattr(order, "seller", None) if order else None

        evs = []
        last_event_type = ""
        last_event_at = None
        last_location = ""
        try:
            events_qs = sh.events.filter(deleted_at__isnull=True).order_by("occurred_at", "id")
            for ev in events_qs:
                evs.append({"id": ev.id, "type": ev.type, "location": ev.location, "occurred_at": ev.occurred_at, "payload": ev.payload or {}})
            last = events_qs.order_by("-occurred_at", "-id").first()
            if last:
                last_event_type = getattr(last, "type", "") or ""
                last_event_at = getattr(last, "occurred_at", None)
                last_location = (getattr(last, "location", "") or "").strip()
        except Exception:
            evs = []
            last_event_type = ""
            last_event_at = None
            last_location = ""

        audit(request.user, action="admin_logistics_shipment_viewed", target_type="shipment", target_id=str(sh.id), payload={})
        tracking_exists = bool((getattr(sh, "tracking_number", "") or "").strip() or (getattr(sh, "carrier_id", "") or "").strip())
        return Response(
            {
                "shipment": {
                    "id": sh.id,
                    "order_id": getattr(sh, "order_id", None),
                    "status": sh.status,
                    "carrier_id": sh.carrier_id,
                    "carrier_name": (sh.carrier_id or "").strip(),
                    "tracking_number": sh.tracking_number,
                    "tracking_exists": tracking_exists,
                    "origin": sh.origin,
                    "destination": sh.destination,
                    "estimated_delivery_at": sh.estimated_delivery_at,
                    "actual_delivery_at": sh.actual_delivery_at,
                    "created_at": sh.created_at,
                    "last_event_type": last_event_type,
                    "last_event_at": last_event_at,
                    "last_location": last_location,
                },
                "order": {
                    "id": getattr(order, "id", None) if order else None,
                    "status": getattr(order, "status", "") if order else "",
                    "currency": getattr(order, "currency", "") if order else "",
                    "total_amount": str(getattr(order, "total_amount", "") or "") if order else "",
                },
                "buyer": {
                    "id": getattr(buyer, "id", None) if buyer else None,
                    "label": self._user_label(buyer),
                    **self._user_contact(buyer),
                },
                "seller": {
                    "id": getattr(seller, "id", None) if seller else None,
                    "label": self._user_label(seller),
                    **self._user_contact(seller),
                },
                "events": evs,
            }
        )

    @action(detail=False, methods=["post"], url_path="shipments/set-tracking")
    def shipments_set_tracking(self, request):
        try:
            shipment_id = int((request.data or {}).get("shipment_id") or 0)
        except Exception:
            shipment_id = 0
        if shipment_id <= 0:
            return Response({"shipment_id": "shipment_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        sh = Shipment.objects.filter(deleted_at__isnull=True, id=shipment_id).select_related("order").first()
        if not sh:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        tracking_number = str((request.data or {}).get("tracking_number") or "").strip()
        carrier_id = str((request.data or {}).get("carrier_id") or "").strip()
        Shipment.objects.filter(id=sh.id).update(tracking_number=tracking_number, carrier_id=carrier_id)
        audit(
            request.user,
            action="shipment_tracking_updated",
            target_type="shipment",
            target_id=str(sh.id),
            payload={"order_id": str(getattr(sh, "order_id", "") or ""), "tracking_number": tracking_number},
        )
        return Response({"ok": True})

    @action(detail=False, methods=["post"], url_path="shipments/set-status")
    def shipments_set_status(self, request):
        try:
            shipment_id = int((request.data or {}).get("shipment_id") or 0)
        except Exception:
            shipment_id = 0
        if shipment_id <= 0:
            return Response({"shipment_id": "shipment_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        new_status = str((request.data or {}).get("status") or "").strip().lower()
        allowed = {str(v).lower() for v, _ in Shipment.Status.choices}
        if new_status not in allowed:
            return Response({"status": "Invalid status."}, status=status.HTTP_400_BAD_REQUEST)
        sh = Shipment.objects.filter(deleted_at__isnull=True, id=shipment_id).select_related("order").first()
        if not sh:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        prev = getattr(sh, "status", "") or ""
        if prev != new_status:
            Shipment.objects.filter(id=sh.id).update(status=new_status)
            audit(
                request.user,
                action="shipment_status_changed",
                target_type="shipment",
                target_id=str(sh.id),
                payload={"order_id": str(getattr(sh, "order_id", "") or ""), "from": str(prev or ""), "to": str(new_status or "")},
            )
        return Response({"ok": True})

    @action(detail=False, methods=["post"], url_path="shipments/set-eta")
    def shipments_set_eta(self, request):
        try:
            shipment_id = int((request.data or {}).get("shipment_id") or 0)
        except Exception:
            shipment_id = 0
        if shipment_id <= 0:
            return Response({"shipment_id": "shipment_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        eta_raw = (request.data or {}).get("estimated_delivery_at")
        if not eta_raw:
            return Response({"estimated_delivery_at": "estimated_delivery_at is required."}, status=status.HTTP_400_BAD_REQUEST)
        eta = parse_datetime(str(eta_raw))
        if eta is None:
            return Response({"estimated_delivery_at": "Invalid datetime."}, status=status.HTTP_400_BAD_REQUEST)
        sh = Shipment.objects.filter(deleted_at__isnull=True, id=shipment_id).select_related("order").first()
        if not sh:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        Shipment.objects.filter(id=sh.id).update(estimated_delivery_at=eta)
        audit(
            request.user,
            action="admin_logistics_eta_set",
            target_type="shipment",
            target_id=str(sh.id),
            payload={"order_id": str(getattr(sh, "order_id", "") or ""), "estimated_delivery_at": eta.isoformat()},
        )
        return Response({"ok": True})

    @action(detail=False, methods=["post"], url_path="shipments/mark-delivered")
    def shipments_mark_delivered(self, request):
        try:
            shipment_id = int((request.data or {}).get("shipment_id") or 0)
        except Exception:
            shipment_id = 0
        if shipment_id <= 0:
            return Response({"shipment_id": "shipment_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        sh = Shipment.objects.filter(deleted_at__isnull=True, id=shipment_id).select_related("order").first()
        if not sh:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        prev = getattr(sh, "status", "") or ""
        now = timezone.now()
        Shipment.objects.filter(id=sh.id).update(status=Shipment.Status.DELIVERED, actual_delivery_at=now)
        if prev != Shipment.Status.DELIVERED:
            audit(
                request.user,
                action="shipment_status_changed",
                target_type="shipment",
                target_id=str(sh.id),
                payload={"order_id": str(getattr(sh, "order_id", "") or ""), "from": str(prev or ""), "to": Shipment.Status.DELIVERED},
            )
        audit(
            request.user,
            action="admin_logistics_mark_delivered",
            target_type="shipment",
            target_id=str(sh.id),
            payload={"order_id": str(getattr(sh, "order_id", "") or "")},
        )
        return Response({"ok": True})

    @action(detail=False, methods=["post"], url_path=r"shipments/(?P<shipment_id>[^/.]+)/set-tracking")
    def shipments_set_tracking_by_id(self, request, shipment_id=None):
        try:
            sid = int(shipment_id or 0)
        except Exception:
            sid = 0
        if sid <= 0:
            return Response({"shipment_id": "Invalid shipment id."}, status=status.HTTP_400_BAD_REQUEST)
        sh = Shipment.objects.filter(deleted_at__isnull=True, id=sid).select_related("order").first()
        if not sh:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        tracking_number = str((request.data or {}).get("tracking_number") or "").strip()
        carrier_id = str((request.data or {}).get("carrier_id") or "").strip()
        Shipment.objects.filter(id=sh.id).update(tracking_number=tracking_number, carrier_id=carrier_id)
        audit(
            request.user,
            action="shipment_tracking_updated",
            target_type="shipment",
            target_id=str(sh.id),
            payload={"order_id": str(getattr(sh, "order_id", "") or ""), "tracking_number": tracking_number},
        )
        return Response({"ok": True})

    @action(detail=False, methods=["post"], url_path=r"shipments/(?P<shipment_id>[^/.]+)/set-status")
    def shipments_set_status_by_id(self, request, shipment_id=None):
        try:
            sid = int(shipment_id or 0)
        except Exception:
            sid = 0
        if sid <= 0:
            return Response({"shipment_id": "Invalid shipment id."}, status=status.HTTP_400_BAD_REQUEST)
        new_status = str((request.data or {}).get("status") or "").strip().lower()
        allowed = {str(v).lower() for v, _ in Shipment.Status.choices}
        if new_status not in allowed:
            return Response({"status": "Invalid status."}, status=status.HTTP_400_BAD_REQUEST)
        sh = Shipment.objects.filter(deleted_at__isnull=True, id=sid).select_related("order").first()
        if not sh:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        prev = getattr(sh, "status", "") or ""
        if prev != new_status:
            Shipment.objects.filter(id=sh.id).update(status=new_status)
            audit(
                request.user,
                action="shipment_status_changed",
                target_type="shipment",
                target_id=str(sh.id),
                payload={"order_id": str(getattr(sh, "order_id", "") or ""), "from": str(prev or ""), "to": str(new_status or "")},
            )
        return Response({"ok": True})

    @action(detail=False, methods=["post"], url_path=r"shipments/(?P<shipment_id>[^/.]+)/set-eta")
    def shipments_set_eta_by_id(self, request, shipment_id=None):
        try:
            sid = int(shipment_id or 0)
        except Exception:
            sid = 0
        if sid <= 0:
            return Response({"shipment_id": "Invalid shipment id."}, status=status.HTTP_400_BAD_REQUEST)
        eta_raw = (request.data or {}).get("estimated_delivery_at")
        if not eta_raw:
            return Response({"estimated_delivery_at": "estimated_delivery_at is required."}, status=status.HTTP_400_BAD_REQUEST)
        eta = parse_datetime(str(eta_raw))
        if eta is None:
            return Response({"estimated_delivery_at": "Invalid datetime."}, status=status.HTTP_400_BAD_REQUEST)
        sh = Shipment.objects.filter(deleted_at__isnull=True, id=sid).select_related("order").first()
        if not sh:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        Shipment.objects.filter(id=sh.id).update(estimated_delivery_at=eta)
        audit(
            request.user,
            action="admin_logistics_eta_set",
            target_type="shipment",
            target_id=str(sh.id),
            payload={"order_id": str(getattr(sh, "order_id", "") or ""), "estimated_delivery_at": eta.isoformat()},
        )
        return Response({"ok": True})

    @action(detail=False, methods=["post"], url_path=r"shipments/(?P<shipment_id>[^/.]+)/add-event")
    def shipments_add_event_by_id(self, request, shipment_id=None):
        try:
            sid = int(shipment_id or 0)
        except Exception:
            sid = 0
        if sid <= 0:
            return Response({"shipment_id": "Invalid shipment id."}, status=status.HTTP_400_BAD_REQUEST)
        sh = Shipment.objects.filter(deleted_at__isnull=True, id=sid).select_related("order").first()
        if not sh:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        event_type = str((request.data or {}).get("type") or "").strip()
        if not event_type:
            return Response({"type": "type is required."}, status=status.HTTP_400_BAD_REQUEST)
        location = str((request.data or {}).get("location") or "").strip()
        occurred_at_raw = (request.data or {}).get("occurred_at")
        occurred_at = parse_datetime(str(occurred_at_raw)) if occurred_at_raw else timezone.now()
        if occurred_at is None:
            return Response({"occurred_at": "Invalid datetime."}, status=status.HTTP_400_BAD_REQUEST)
        payload = (request.data or {}).get("payload") or {}
        if not isinstance(payload, dict):
            payload = {}
        ev = ShipmentEvent.objects.create(shipment=sh, type=event_type, location=location, occurred_at=occurred_at, payload=payload)
        audit(
            request.user,
            action="admin_logistics_event_added",
            target_type="shipment",
            target_id=str(sh.id),
            payload={"order_id": str(getattr(sh, "order_id", "") or ""), "event_id": str(getattr(ev, "id", "") or ""), "type": event_type},
        )
        return Response({"ok": True, "event_id": ev.id})


class AdminOrderViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    pagination_class = AdminPageNumberPagination

    def get_queryset(self):
        qs = (
            Order.objects.filter(deleted_at__isnull=True)
            .select_related("buyer", "seller")
            .prefetch_related("items", "items__product")
            .annotate(item_count=Count("items"))
            .order_by("-created_at")
        )

        status_filter = (self.request.query_params.get("status") or "").strip().lower()
        if status_filter:
            statuses = [s.strip() for s in status_filter.split(",") if s.strip()]
            qs = qs.filter(status__in=statuses)

        overdue_deadline = (self.request.query_params.get("overdue_deadline") or "").strip().lower()
        if overdue_deadline in {"1", "true", "yes", "y"}:
            qs = (
                qs.filter(deadline_at__isnull=False, deadline_at__lt=timezone.now())
                .exclude(status__in=[Order.Status.DELIVERED, Order.Status.COMPLETED, Order.Status.CANCELLED, Order.Status.REJECTED])
            )

        q = (self.request.query_params.get("q") or "").strip()
        if q:
            qv = q.strip()
            qn = qv.lower()
            extracted = qn.replace("#", "").replace("ord-", "").replace("vh-", "")
            if extracted.isdigit():
                try:
                    return qs.filter(id=int(extracted))
                except Exception:
                    pass
            qs = qs.filter(
                Q(buyer__email__icontains=qv)
                | Q(buyer__phone__icontains=qv)
                | Q(seller__email__icontains=qv)
                | Q(seller__phone__icontains=qv)
                | Q(items__product__name__icontains=qv)
                | Q(items__product__sku__icontains=qv)
            ).distinct()

        return qs

    def list(self, request):
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        rows = page if page is not None else list(qs[:50])

        out = []
        for o in rows:
            buyer = getattr(o, "buyer", None)
            seller = getattr(o, "seller", None)
            out.append(
                {
                    "id": o.id,
                    "status": o.status,
                    "currency": o.currency,
                    "total_amount": str(getattr(o, "total_amount", "") or ""),
                    "payment_status": getattr(o, "payment_status", ""),
                    "payment_method": getattr(o, "payment_method", ""),
                    "deadline_at": getattr(o, "deadline_at", None),
                    "created_at": o.created_at,
                    "updated_at": getattr(o, "updated_at", None),
                    "item_count": int(getattr(o, "item_count", 0) or 0),
                    "buyer": (getattr(buyer, "email", "") or getattr(buyer, "phone", "") or "—") if buyer else "—",
                    "seller": (getattr(seller, "email", "") or getattr(seller, "phone", "") or "—") if seller else "—",
                }
            )

        if page is not None:
            return self.get_paginated_response(out)
        return Response({"count": len(out), "next": None, "previous": None, "results": out})


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

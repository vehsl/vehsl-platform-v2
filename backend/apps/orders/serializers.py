from decimal import Decimal

from django.db.models import F, Sum, Value, IntegerField
from django.db.models.functions import Coalesce
from rest_framework import serializers

from apps.catalog.models import Product, ProductMedia, ProductVariation, resolve_unit_price, WarehouseStock
from apps.catalog.serializers import ProductMediaSerializer

from .models import (
    Cart,
    CartItem,
    WishlistItem,
    Dispute,
    Document,
    Order,
    OrderItem,
    ReleaseCondition,
    ReleaseConditionProof,
    Review,
    Shipment,
    ShipmentEvent,
)


class CartItemSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source="product.id", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_title = serializers.CharField(source="product.title", read_only=True)
    seller_id = serializers.IntegerField(source="product.seller_id", read_only=True)
    seller_name = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            "id",
            "product_id",
            "product",
            "variation",
            "product_name",
            "product_title",
            "seller_id",
            "seller_name",
            "image_url",
            "quantity",
            "unit_price_snapshot",
            "currency",
        ]

    def get_seller_name(self, obj: CartItem):
        seller = getattr(getattr(obj, "product", None), "seller", None)
        if not seller:
            return ""
        full = f"{(seller.first_name or '').strip()} {(seller.last_name or '').strip()}".strip()
        return full or seller.email or seller.phone or ""

    def get_image_url(self, obj: CartItem):
        product = getattr(obj, "product", None)
        if not product:
            return ""
        try:
            media = (
                ProductMedia.objects.filter(product=product, deleted_at__isnull=True, media_type=ProductMedia.MediaType.IMAGE)
                .order_by("position", "id")
                .first()
            )
            if media:
                req = self.context.get("request")
                return (ProductMediaSerializer(media, context={"request": req}).data.get("public_url") or "").strip()
        except Exception:
            pass
        return ""


class CartSerializer(serializers.ModelSerializer):
    buyer_id = serializers.IntegerField(read_only=True)
    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = ["id", "buyer_id", "created_at", "updated_at", "items"]


class CartUpsertItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    variation_id = serializers.IntegerField(required=False, allow_null=True)
    quantity = serializers.IntegerField(min_value=1)


class CartUpsertSerializer(serializers.Serializer):
    items = serializers.ListField(child=CartUpsertItemSerializer(), allow_empty=False)


class WishlistItemSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source="product.id", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    currency = serializers.CharField(source="product.currency", read_only=True)
    price = serializers.DecimalField(source="product.price", max_digits=12, decimal_places=2, read_only=True)
    seller_name = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = WishlistItem
        fields = ["id", "product_id", "product_name", "currency", "price", "seller_name", "image_url", "created_at"]

    def get_seller_name(self, obj: WishlistItem):
        seller = getattr(getattr(obj, "product", None), "seller", None)
        if not seller:
            return ""
        full = f"{(seller.first_name or '').strip()} {(seller.last_name or '').strip()}".strip()
        return full or seller.email or seller.phone or ""

    def get_image_url(self, obj: WishlistItem):
        product = getattr(obj, "product", None)
        if not product:
            return ""
        try:
            media = (
                ProductMedia.objects.filter(product=product, deleted_at__isnull=True, media_type=ProductMedia.MediaType.IMAGE)
                .order_by("position", "id")
                .first()
            )
            if media:
                req = self.context.get("request")
                return (ProductMediaSerializer(media, context={"request": req}).data.get("public_url") or "").strip()
        except Exception:
            pass
        return ""


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    variation_attributes = serializers.JSONField(source="variation.attributes", read_only=True)
    image_url = serializers.SerializerMethodField()
    specs = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "variation",
            "product_name",
            "variation_attributes",
            "specs",
            "image_url",
            "quantity",
            "unit_price",
            "line_total",
        ]

    def get_image_url(self, obj: OrderItem):
        product = getattr(obj, "product", None)
        if not product:
            return ""
        req = self.context.get("request")
        media = (
            ProductMedia.objects.filter(product=product, deleted_at__isnull=True, media_type=ProductMedia.MediaType.IMAGE)
            .order_by("position", "id")
            .first()
        )
        if not media:
            return ""
        return (ProductMediaSerializer(media, context={"request": req}).data.get("public_url") or "").strip()

    def get_specs(self, obj: OrderItem):
        attrs = getattr(getattr(obj, "variation", None), "attributes", None) or {}
        if not isinstance(attrs, dict) or not attrs:
            return ""
        parts = []
        for k in sorted(list(attrs.keys())):
            v = attrs.get(k)
            if v is None or v == "":
                continue
            parts.append(f"{k}: {v}")
        return " · ".join(parts)


class OrderCreateItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    variation_id = serializers.IntegerField(required=False, allow_null=True)
    quantity = serializers.IntegerField(min_value=1)


class OrderCreateSerializer(serializers.Serializer):
    items = serializers.ListField(child=OrderCreateItemInputSerializer(), allow_empty=False)
    payment_method = serializers.ChoiceField(choices=Order.PaymentMethod.choices, required=False)
    address_id = serializers.IntegerField(required=False)
    shipping_method = serializers.CharField(required=False, allow_blank=True)
    shipping_cost = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)

    def validate_items(self, items):
        seen = set()
        for item in items:
            key = (item.get("product_id"), item.get("variation_id") or None)
            if key in seen:
                raise serializers.ValidationError("Duplicate (product_id, variation_id) in items.")
            seen.add(key)
        return items

    def create(self, validated_data):
        buyer = self.context["request"].user
        items_data = validated_data["items"]
        payment_method = validated_data.get("payment_method") or Order.PaymentMethod.CARD
        raw_address_id = validated_data.get("address_id")
        if raw_address_id is None:
            raise serializers.ValidationError({"address_id": "address_id is required."})
        try:
            address_id = int(raw_address_id)
        except Exception:
            raise serializers.ValidationError({"address_id": "Invalid address_id."})
        if address_id <= 0:
            raise serializers.ValidationError({"address_id": "Invalid address_id."})

        from apps.accounts.models import BuyerAddress

        addr = BuyerAddress.objects.filter(id=address_id, user=buyer).first()
        if not addr:
            raise serializers.ValidationError({"address_id": "Address not found."})
        shipping_address = {
            "kind": getattr(addr, "kind", "") or "",
            "contact_name": getattr(addr, "contact_name", "") or "",
            "phone": getattr(addr, "phone", "") or "",
            "country": getattr(addr, "country", "") or "",
            "region": getattr(addr, "region", "") or "",
            "city": getattr(addr, "city", "") or "",
            "street1": getattr(addr, "street1", "") or "",
            "street2": getattr(addr, "street2", "") or "",
            "postal_code": getattr(addr, "postal_code", "") or "",
        }
        payment_status = Order.PaymentStatus.COD_PENDING if payment_method == Order.PaymentMethod.COD else Order.PaymentStatus.UNPAID

        products = Product.objects.filter(
            id__in=[i["product_id"] for i in items_data],
            deleted_at__isnull=True,
            status__in=[Product.Status.APPROVED, Product.Status.ACTIVE],
        ).select_related("seller")
        product_map = {p.id: p for p in products}
        if len(product_map) != len(items_data):
            raise serializers.ValidationError("One or more products are invalid or not available.")

        seller_id = next(iter(product_map.values())).seller_id
        if any(p.seller_id != seller_id for p in product_map.values()):
            raise serializers.ValidationError("All items must be from the same seller.")

        currency = next(iter(product_map.values())).currency
        if any(p.currency != currency for p in product_map.values()):
            raise serializers.ValidationError("All items must have the same currency.")

        variation_ids = [i.get("variation_id") for i in items_data if i.get("variation_id")]
        variation_map = {}
        if variation_ids:
            vars = ProductVariation.objects.filter(id__in=variation_ids, deleted_at__isnull=True)
            variation_map = {v.id: v for v in vars}
            if len(variation_map) != len(set(variation_ids)):
                raise serializers.ValidationError("One or more variations are invalid.")

        order = Order.objects.create(
            buyer=buyer,
            seller_id=seller_id,
            currency=currency,
            status=Order.Status.CREATED,
            payment_method=payment_method,
            payment_status=payment_status,
            shipping_address=shipping_address,
            shipping_method=validated_data.get("shipping_method") or "",
            shipping_cost=validated_data.get("shipping_cost") or Decimal("0"),
        )

        total = Decimal("0")
        for item in items_data:
            p = product_map[item["product_id"]]
            qty = int(item["quantity"])
            var_id = item.get("variation_id") or None
            var = variation_map.get(var_id) if var_id else None
            if var and var.product_id != p.id:
                raise serializers.ValidationError("Variation does not belong to the product.")
            unit_price, resolved_currency = resolve_unit_price(p, var, qty)
            if unit_price is None:
                raise serializers.ValidationError("Could not resolve unit price.")

            # Real-time stock check
            stock_qs = WarehouseStock.objects.filter(product=p, variation=var, deleted_at__isnull=True)
            available = stock_qs.aggregate(
                total=Coalesce(Sum(F("quantity_units") - F("reserved_units")), Value(0), output_field=IntegerField())
            )["total"]

            if qty > available:
                raise serializers.ValidationError(f"Not enough stock for {p.name}. Available: {available}")

            if resolved_currency and resolved_currency != currency:
                raise serializers.ValidationError("Pricing tier currency mismatch.")
            OrderItem.objects.create(order=order, product=p, variation=var, quantity=qty, unit_price=unit_price)
            total += unit_price * qty

        order.total_amount = total
        order.save(update_fields=["total_amount"])
        return order


class OrderSerializer(serializers.ModelSerializer):
    buyer_id = serializers.IntegerField(read_only=True)
    seller_id = serializers.IntegerField(read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    item_count = serializers.SerializerMethodField()
    primary_item_name = serializers.SerializerMethodField()
    counterparty = serializers.SerializerMethodField()
    latest_shipment = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "buyer_id",
            "seller_id",
            "status",
            "currency",
            "total_amount",
            "payment_method",
            "payment_status",
            "shipping_address",
            "shipping_method",
            "shipping_cost",
            "deadline_at",
            "extension_reason",
            "extension_fee",
            "created_at",
            "updated_at",
            "item_count",
            "primary_item_name",
            "counterparty",
            "latest_shipment",
            "items",
        ]

    def get_item_count(self, obj: Order):
        try:
            return obj.items.count()
        except Exception:
            return len(getattr(obj, "items", []) or [])

    def get_primary_item_name(self, obj: Order):
        first = None
        try:
            first = obj.items.all().first()
        except Exception:
            items = getattr(obj, "items", None)
            if items:
                first = items[0]
        if not first:
            return ""
        product = getattr(first, "product", None)
        return getattr(product, "name", "") or getattr(first, "product_name", "") or ""

    def get_counterparty(self, obj: Order):
        req = self.context.get("request")
        user = getattr(req, "user", None) if req else None
        is_seller_view = bool(user and user.is_authenticated and (getattr(user, "account_type", None) == "seller" or getattr(user, "role", None) == "seller"))
        other = getattr(obj, "buyer", None) if is_seller_view else getattr(obj, "seller", None)
        if not other:
            other_id = obj.buyer_id if is_seller_view else obj.seller_id
            return {"id": other_id, "name": ""}
        full = f"{(other.first_name or '').strip()} {(other.last_name or '').strip()}".strip()
        name = full or other.email or other.phone or ""
        return {"id": other.id, "name": name}

    def get_latest_shipment(self, obj: Order):
        shipment = None
        try:
            shipment = obj.shipments.order_by("-created_at").first()
        except Exception:
            shipment = None
        if not shipment:
            return None
        return {
            "id": shipment.id,
            "status": shipment.status,
            "tracking_number": shipment.tracking_number,
            "estimated_delivery_at": shipment.estimated_delivery_at,
            "actual_delivery_at": shipment.actual_delivery_at,
        }


class ShipmentEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShipmentEvent
        fields = ["id", "shipment", "type", "location", "occurred_at", "payload"]


class ShipmentSerializer(serializers.ModelSerializer):
    events = ShipmentEventSerializer(many=True, read_only=True)

    class Meta:
        model = Shipment
        fields = [
            "id",
            "order",
            "carrier_id",
            "tracking_number",
            "status",
            "origin",
            "destination",
            "estimated_delivery_at",
            "actual_delivery_at",
            "created_at",
            "events",
        ]


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ["id", "owner_type", "owner_id", "document_type", "url", "generated_by_ai", "created_at"]


class DisputeSerializer(serializers.ModelSerializer):
    opened_by_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Dispute
        fields = ["id", "order", "opened_by_id", "reason", "status", "resolution", "opened_at", "resolved_at"]


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "order",
            "reviewer_id",
            "target_type",
            "target_seller",
            "target_product",
            "rating",
            "text",
            "created_at",
        ]


class ReleaseConditionProofSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="original_name", read_only=True)
    size = serializers.SerializerMethodField()
    uploadedAt = serializers.DateTimeField(source="uploaded_at", read_only=True)
    url = serializers.SerializerMethodField()

    class Meta:
        model = ReleaseConditionProof
        fields = ["id", "name", "size", "uploadedAt", "url"]

    def get_size(self, obj: ReleaseConditionProof):
        size = int(getattr(obj, "size_bytes", 0) or 0)
        if size < 1024 * 1024:
            return f"{size / 1024.0:.1f} KB"
        return f"{size / (1024.0 * 1024.0):.1f} MB"

    def get_url(self, obj: ReleaseConditionProof):
        try:
            url = obj.file.url
        except Exception:
            return ""
        req = self.context.get("request")
        return req.build_absolute_uri(url) if req else url


class ReleaseConditionSerializer(serializers.ModelSerializer):
    requiredBy = serializers.SerializerMethodField()
    orderRef = serializers.SerializerMethodField()
    dueDate = serializers.DateField(source="due_at", allow_null=True, read_only=True)
    satisfiedAt = serializers.DateTimeField(source="satisfied_at", allow_null=True, read_only=True)
    satisfiedBy = serializers.SerializerMethodField()
    proofDocs = ReleaseConditionProofSerializer(source="proofs", many=True, read_only=True)

    class Meta:
        model = ReleaseCondition
        fields = [
            "id",
            "type",
            "title",
            "description",
            "status",
            "requiredBy",
            "orderRef",
            "dueDate",
            "satisfiedAt",
            "satisfiedBy",
            "proofDocs",
            "notes",
            "priority",
        ]

    def get_requiredBy(self, obj: ReleaseCondition):
        buyer = getattr(getattr(obj, "order", None), "buyer", None)
        if not buyer:
            return ""
        full = f"{(buyer.first_name or '').strip()} {(buyer.last_name or '').strip()}".strip()
        return full or buyer.email or buyer.phone or ""

    def get_orderRef(self, obj: ReleaseCondition):
        return f"ORD-{obj.order_id}" if obj.order_id else ""

    def get_satisfiedBy(self, obj: ReleaseCondition):
        u = getattr(obj, "satisfied_by", None)
        if not u:
            return ""
        full = f"{(u.first_name or '').strip()} {(u.last_name or '').strip()}".strip()
        return full or u.email or u.phone or ""


class ReleaseOrderSerializer(serializers.ModelSerializer):
    orderRef = serializers.SerializerMethodField()
    buyerName = serializers.SerializerMethodField()
    buyerAvatar = serializers.SerializerMethodField()
    buyerCountry = serializers.SerializerMethodField()
    buyerCountryCode = serializers.SerializerMethodField()
    productName = serializers.SerializerMethodField()
    hsCode = serializers.SerializerMethodField()
    quantity = serializers.SerializerMethodField()
    conditions = ReleaseConditionSerializer(source="release_conditions", many=True, read_only=True)
    overallStatus = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "orderRef",
            "buyerName",
            "buyerAvatar",
            "buyerCountry",
            "buyerCountryCode",
            "productName",
            "hsCode",
            "quantity",
            "conditions",
            "overallStatus",
            "createdAt",
        ]

    def get_orderRef(self, obj: Order):
        return f"ORD-{obj.id}"

    def get_buyerName(self, obj: Order):
        b = getattr(obj, "buyer", None)
        if not b:
            return ""
        full = f"{(b.first_name or '').strip()} {(b.last_name or '').strip()}".strip()
        return full or b.email or b.phone or ""

    def get_buyerAvatar(self, obj: Order):
        b = getattr(obj, "buyer", None)
        if not b:
            return "U"
        first = (b.first_name or "").strip()
        last = (b.last_name or "").strip()
        if first and last:
            return (first[0] + last[0]).upper()
        base = (b.email or b.phone or "U").strip()
        return (base[:2] or "U").upper()

    def get_buyerCountry(self, obj: Order):
        prof = getattr(getattr(obj, "buyer", None), "profile", None)
        return (getattr(prof, "country", "") or "").strip()

    def get_buyerCountryCode(self, obj: Order):
        prof = getattr(getattr(obj, "buyer", None), "profile", None)
        raw = (getattr(prof, "country", "") or "").strip().lower()
        if len(raw) == 2 and raw.isalpha():
            return raw
        return "us"

    def get_productName(self, obj: Order):
        items = list(getattr(obj, "items", []).all()) if hasattr(obj, "items") else []
        if not items:
            return ""
        p = getattr(items[0], "product", None)
        return getattr(p, "name", "") if p else ""

    def get_hsCode(self, obj: Order):
        items = list(getattr(obj, "items", []).all()) if hasattr(obj, "items") else []
        if not items:
            return ""
        p = getattr(items[0], "product", None)
        return getattr(p, "hs_code", "") if p else ""

    def get_quantity(self, obj: Order):
        items = list(getattr(obj, "items", []).all()) if hasattr(obj, "items") else []
        return sum(int(getattr(i, "quantity", 0) or 0) for i in items)

    def get_overallStatus(self, obj: Order):
        conditions = list(getattr(obj, "release_conditions", []).all()) if hasattr(obj, "release_conditions") else []
        if not conditions:
            return "blocked"
        all_ok = all(c.status in {ReleaseCondition.Status.SATISFIED, ReleaseCondition.Status.WAIVED} for c in conditions)
        any_ok = any(c.status in {ReleaseCondition.Status.SATISFIED, ReleaseCondition.Status.IN_PROGRESS, ReleaseCondition.Status.WAIVED} for c in conditions)
        if all_ok and getattr(obj, "release_authorized_at", None):
            return "released"
        if all_ok:
            return "cleared"
        if any_ok:
            return "partial"
        return "blocked"

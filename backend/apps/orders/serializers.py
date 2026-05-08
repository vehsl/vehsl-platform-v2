from decimal import Decimal

from rest_framework import serializers

from apps.catalog.models import Product, ProductVariation

from .models import (
    Cart,
    CartItem,
    Dispute,
    Document,
    Order,
    OrderItem,
    Review,
    Shipment,
    ShipmentEvent,
)


class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = CartItem
        fields = ["id", "product", "variation", "product_name", "quantity", "unit_price_snapshot", "currency"]


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


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    variation_attributes = serializers.JSONField(source="variation.attributes", read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product", "variation", "product_name", "variation_attributes", "quantity", "unit_price", "line_total"]


class OrderCreateItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    variation_id = serializers.IntegerField(required=False, allow_null=True)
    quantity = serializers.IntegerField(min_value=1)


class OrderCreateSerializer(serializers.Serializer):
    items = serializers.ListField(child=OrderCreateItemInputSerializer(), allow_empty=False)

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

        order = Order.objects.create(buyer=buyer, seller_id=seller_id, currency=currency, status=Order.Status.CREATED)

        total = Decimal("0")
        for item in items_data:
            p = product_map[item["product_id"]]
            qty = int(item["quantity"])
            var_id = item.get("variation_id") or None
            var = variation_map.get(var_id) if var_id else None
            if var and var.product_id != p.id:
                raise serializers.ValidationError("Variation does not belong to the product.")
            OrderItem.objects.create(order=order, product=p, variation=var, quantity=qty, unit_price=p.price)
            total += p.price * qty

        order.total_amount = total
        order.save(update_fields=["total_amount"])
        return order


class OrderSerializer(serializers.ModelSerializer):
    buyer_id = serializers.IntegerField(read_only=True)
    seller_id = serializers.IntegerField(read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ["id", "buyer_id", "seller_id", "status", "currency", "total_amount", "deadline_at", "created_at", "updated_at", "items"]


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

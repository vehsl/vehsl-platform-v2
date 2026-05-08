from decimal import Decimal

from rest_framework import serializers

from apps.catalog.models import Product

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_name", "quantity", "unit_price"]


class OrderCreateItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class OrderCreateSerializer(serializers.Serializer):
    items = serializers.ListField(child=OrderCreateItemInputSerializer(), allow_empty=False)

    def validate_items(self, items):
        seen = set()
        for item in items:
            pid = item.get("product_id")
            if pid in seen:
                raise serializers.ValidationError("Duplicate product_id in items.")
            seen.add(pid)
        return items

    def create(self, validated_data):
        buyer = self.context["request"].user
        items_data = validated_data["items"]

        products = Product.objects.filter(id__in=[i["product_id"] for i in items_data], status=Product.Status.ACTIVE)
        product_map = {p.id: p for p in products}

        if len(product_map) != len(items_data):
            raise serializers.ValidationError("One or more products are invalid or inactive.")

        currency = next(iter(product_map.values())).currency
        if any(p.currency != currency for p in product_map.values()):
            raise serializers.ValidationError("All items must have the same currency.")

        order = Order.objects.create(buyer=buyer, currency=currency, status=Order.Status.SUBMITTED)

        total = Decimal("0")
        for item in items_data:
            p = product_map[item["product_id"]]
            qty = int(item["quantity"])
            OrderItem.objects.create(order=order, product=p, quantity=qty, unit_price=p.price)
            total += p.price * qty

        order.total_amount = total
        order.save(update_fields=["total_amount"])
        return order


class OrderSerializer(serializers.ModelSerializer):
    buyer_id = serializers.IntegerField(read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ["id", "buyer_id", "status", "currency", "total_amount", "created_at", "updated_at", "items"]

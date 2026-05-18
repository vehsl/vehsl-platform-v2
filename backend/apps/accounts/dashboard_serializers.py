from rest_framework import serializers
from apps.accounts.models import User, Notification
from apps.orders.models import Order, OrderItem, Shipment
from apps.catalog.models import Product, ListingRequest
from django.db.models import Sum

class SellerDashboardMetricsSerializer(serializers.Serializer):
    total_pending = serializers.DecimalField(max_digits=14, decimal_places=2)
    last_paid = serializers.DecimalField(max_digits=14, decimal_places=2)
    unread_messages_count = serializers.IntegerField()
    active_orders_count = serializers.IntegerField()
    protection_score = serializers.IntegerField()

class SellerActionOrderSerializer(serializers.Serializer):
    id = serializers.CharField()
    product = serializers.CharField()
    image = serializers.URLField()
    type = serializers.CharField()
    deadline = serializers.CharField()
    deadline_urgent = serializers.BooleanField()
    order_number = serializers.CharField()
    qty = serializers.IntegerField()
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    buyer = serializers.CharField()
    destination = serializers.CharField()
    message = serializers.CharField(required=False, allow_null=True)
    capacity_pct = serializers.IntegerField(required=False, allow_null=True)
    available_by = serializers.CharField(required=False, allow_null=True)
    production_step = serializers.IntegerField(required=False, allow_null=True)
    timeline_step = serializers.IntegerField(required=False, allow_null=True)

class SellerActivitySerializer(serializers.ModelSerializer):
    kind = serializers.SerializerMethodField()
    sentence = serializers.SerializerMethodField()
    moment = serializers.SerializerMethodField()
    tint = serializers.SerializerMethodField()
    icon = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'kind', 'sentence', 'moment', 'tint', 'icon']

    def get_kind(self, obj):
        return obj.payload.get('kind', 'deal')

    def get_sentence(self, obj):
        return obj.payload.get('title') or obj.event_type

    def get_moment(self, obj):
        from django.utils import timezone
        diff = timezone.now() - obj.created_at
        if diff.days > 0:
            return f"{diff.days}d ago"
        hours = diff.seconds // 3600
        if hours > 0:
            return f"{hours}h ago"
        minutes = (diff.seconds % 3600) // 60
        return f"{minutes}m ago"

    def get_tint(self, obj):
        return obj.payload.get('tint', '#0071e3')

    def get_icon(self, obj):
        return obj.payload.get('icon', '📦')

class SellerProductSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    in_warehouse = serializers.IntegerField(default=0)
    in_transit = serializers.IntegerField(default=0)
    sold = serializers.IntegerField(default=0)

    class Meta:
        model = Product
        fields = ['id', 'name', 'image', 'price', 'status', 'sold', 'in_warehouse', 'in_transit', 'vehsl_rating']

    def get_image(self, obj):
        media = obj.media.filter(media_type='image').first()
        return media.url if media else None

class WarehouseSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    address = serializers.CharField()
    distance = serializers.CharField()
    price_per_week = serializers.FloatField()
    rating = serializers.CharField()
    features = serializers.ListField(child=serializers.CharField())
    manager_name = serializers.CharField()
    manager_phone = serializers.CharField()
    hours = serializers.JSONField()

class WarehouseInventorySerializer(serializers.Serializer):
    id = serializers.CharField()
    product_name = serializers.CharField()
    sku = serializers.CharField()
    image = serializers.URLField()
    total_boxes = serializers.IntegerField()
    released_boxes = serializers.IntegerField()
    pallets_count = serializers.IntegerField()
    unit_price = serializers.FloatField()
    warehouse_id = serializers.CharField()

class WarehouseReleaseRequestSerializer(serializers.Serializer):
    id = serializers.CharField()
    inventory_item_id = serializers.CharField()
    requester_name = serializers.CharField()
    id_card_number = serializers.CharField()
    vehicle_number = serializers.CharField()
    boxes_requested = serializers.IntegerField()
    payment_amount = serializers.FloatField()
    requested_date = serializers.CharField()
    note = serializers.CharField(required=False, allow_blank=True)

class WarehouseReleaseRecordSerializer(serializers.Serializer):
    id = serializers.CharField()
    inventory_item_id = serializers.CharField()
    recipient_name = serializers.CharField()
    id_card_number = serializers.CharField()
    vehicle_number = serializers.CharField()
    boxes_released = serializers.IntegerField()
    payment_amount = serializers.FloatField()
    date = serializers.CharField()
    status = serializers.CharField()

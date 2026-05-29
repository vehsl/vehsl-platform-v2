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
    subtitle = serializers.SerializerMethodField()
    detail = serializers.SerializerMethodField()
    action_kind = serializers.SerializerMethodField()
    action_label = serializers.SerializerMethodField()
    order_id = serializers.SerializerMethodField()
    order_ref = serializers.SerializerMethodField()
    product_name = serializers.SerializerMethodField()
    client_comment = serializers.SerializerMethodField()
    tracking_number = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id",
            "kind",
            "sentence",
            "moment",
            "tint",
            "icon",
            "subtitle",
            "detail",
            "action_kind",
            "action_label",
            "order_id",
            "order_ref",
            "product_name",
            "client_comment",
            "tracking_number",
        ]

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

    def get_subtitle(self, obj):
        return obj.payload.get("subtitle") or ""

    def get_detail(self, obj):
        return obj.payload.get("detail") or ""

    def get_action_kind(self, obj):
        return obj.payload.get("action_kind") or obj.payload.get("actionKind") or "none"

    def get_action_label(self, obj):
        return obj.payload.get("action_label") or obj.payload.get("actionLabel") or ""

    def get_order_id(self, obj):
        oid = obj.payload.get("order_id") or obj.payload.get("orderId") or ""
        try:
            return int(oid)
        except Exception:
            return None

    def get_order_ref(self, obj):
        ref = (obj.payload.get("order_ref") or obj.payload.get("orderRef") or "").strip()
        if ref:
            return ref
        oid = self.get_order_id(obj)
        if oid:
            return f"#VH-{oid}"
        return ""

    def get_product_name(self, obj):
        return obj.payload.get("product_name") or obj.payload.get("productName") or ""

    def get_client_comment(self, obj):
        return obj.payload.get("client_comment") or obj.payload.get("clientComment") or ""

    def get_tracking_number(self, obj):
        return obj.payload.get("tracking_number") or obj.payload.get("trackingNumber") or ""

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

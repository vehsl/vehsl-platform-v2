from rest_framework import serializers
from apps.accounts.models import User, Notification
from apps.orders.models import Order, OrderItem, Shipment
from apps.catalog.models import Product, ListingRequest
from apps.catalog.serializers import ProductMediaSerializer
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
        try:
            media = obj.media.filter(deleted_at__isnull=True, media_type='image').order_by("position", "id").first()
        except Exception:
            media = None
        if not media:
            return None
        req = self.context.get("request")
        url = (ProductMediaSerializer(media, context={"request": req}).data.get("public_url") or "").strip()
        return url or None

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


class CommandCenterMetaSerializer(serializers.Serializer):
    period = serializers.CharField()
    generated_at = serializers.DateTimeField()
    last_updated = serializers.DateTimeField()
    cache_ttl_seconds = serializers.IntegerField()
    generated_from_cache = serializers.BooleanField()
    is_partial = serializers.BooleanField()
    warnings = serializers.ListField(child=serializers.CharField(), required=False)
    data_sources = serializers.ListField(child=serializers.CharField(), required=False)
    paths = serializers.DictField(child=serializers.CharField())


class CommandCenterActiveOrdersSerializer(serializers.Serializer):
    snapshot_total = serializers.IntegerField()
    snapshot_b2b = serializers.IntegerField()
    snapshot_b2c = serializers.IntegerField()
    sparkline = serializers.ListField(child=serializers.IntegerField(), required=False)
    path = serializers.CharField()


class CommandCenterQualityScoreSerializer(serializers.Serializer):
    total = serializers.FloatField()
    pass_rate = serializers.FloatField()
    pending = serializers.IntegerField()
    inspections = serializers.IntegerField()
    delta = serializers.FloatField()
    sparkline = serializers.ListField(child=serializers.FloatField(), required=False)
    path = serializers.CharField()


class CommandCenterUsersOnlineSerializer(serializers.Serializer):
    snapshot_total = serializers.IntegerField()
    snapshot_buyers = serializers.IntegerField()
    snapshot_sellers = serializers.IntegerField()
    snapshot_workers = serializers.IntegerField()
    sparkline = serializers.ListField(child=serializers.IntegerField(), required=False)
    path = serializers.CharField()


class CommandCenterShipmentsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    on_time_rate = serializers.FloatField()
    delta = serializers.FloatField()
    path = serializers.CharField()


class CommandCenterHeroSerializer(serializers.Serializer):
    active_orders = CommandCenterActiveOrdersSerializer()
    quality_score = CommandCenterQualityScoreSerializer()
    users_online = CommandCenterUsersOnlineSerializer()
    shipments_in_transit = CommandCenterShipmentsSerializer()


class CommandCenterPipelineItemSerializer(serializers.Serializer):
    key = serializers.CharField()
    label = serializers.CharField()
    count = serializers.IntegerField()
    path = serializers.CharField()


class CommandCenterPipelineSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    items = CommandCenterPipelineItemSerializer(many=True)


class CommandCenterPipelinesSerializer(serializers.Serializer):
    listings = CommandCenterPipelineSerializer()
    orders = CommandCenterPipelineSerializer()


class CommandCenterSummarySerializer(serializers.Serializer):
    meta = CommandCenterMetaSerializer()
    hero = CommandCenterHeroSerializer()
    pipelines = CommandCenterPipelinesSerializer()


class SellerTrendsOptionSerializer(serializers.Serializer):
    value = serializers.CharField(required=False)
    label = serializers.CharField(required=False)
    code = serializers.CharField(required=False)
    name = serializers.CharField(required=False)
    flag = serializers.CharField(required=False)


class SellerTrendsSummaryMetricsSerializer(serializers.Serializer):
    total_sales_value = serializers.FloatField()
    total_orders = serializers.IntegerField()
    units_sold = serializers.IntegerField(required=False)
    total_views = serializers.IntegerField()
    unique_viewers = serializers.IntegerField(required=False)
    active_sellers = serializers.IntegerField()
    avg_order_value = serializers.FloatField()
    buy_rate = serializers.FloatField(required=False, allow_null=True)
    views_source = serializers.CharField(required=False)
    buy_rate_source = serializers.CharField(required=False)


class SellerTrendsSummaryFiltersSerializer(serializers.Serializer):
    industry_options = SellerTrendsOptionSerializer(many=True)
    country_options = SellerTrendsOptionSerializer(many=True)


class SellerTrendsSummarySerializer(serializers.Serializer):
    period = serializers.CharField()
    generated_at = serializers.DateTimeField()
    is_partial = serializers.BooleanField()
    warnings = serializers.ListField(child=serializers.CharField(), required=False)
    data_sources = serializers.ListField(child=serializers.CharField(), required=False)
    metrics = SellerTrendsSummaryMetricsSerializer()
    filters = SellerTrendsSummaryFiltersSerializer()


class SellerTrendsMarketSerializer(serializers.Serializer):
    code = serializers.CharField(required=False)
    name = serializers.CharField()
    flag = serializers.CharField()
    orders = serializers.IntegerField()
    revenue = serializers.FloatField()


class SellerTrendsWeeklyPointSerializer(serializers.Serializer):
    day = serializers.CharField()
    orders = serializers.IntegerField()
    revenue = serializers.FloatField()
    views = serializers.IntegerField(required=False)


class SellerTrendsProductInfoSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    category = serializers.CharField()
    industry = serializers.CharField()
    hero_image = serializers.CharField(allow_blank=True)
    path = serializers.CharField()


class SellerTrendsProductSerializer(serializers.Serializer):
    id = serializers.CharField()
    product_id = serializers.CharField()
    product = SellerTrendsProductInfoSerializer(required=False)
    rank = serializers.IntegerField()
    name = serializers.CharField()
    image = serializers.CharField(allow_blank=True)
    hero_image = serializers.CharField(allow_blank=True, required=False)
    category = serializers.CharField()
    industry = serializers.CharField()
    popularityScore = serializers.IntegerField()
    change = serializers.IntegerField()
    change_pct = serializers.IntegerField(required=False)
    badge = serializers.CharField()
    sparkline = serializers.ListField(child=serializers.IntegerField())
    orders7d = serializers.IntegerField()
    orders = serializers.IntegerField(required=False)
    views7d = serializers.IntegerField()
    revenue7d = serializers.FloatField()
    revenue = serializers.FloatField(required=False)
    avgPrice = serializers.FloatField()
    avg_price = serializers.FloatField()
    topMarkets = SellerTrendsMarketSerializer(many=True)
    top_markets = SellerTrendsMarketSerializer(many=True, required=False)
    buyerInterest = serializers.IntegerField()
    competitorCount = serializers.IntegerField()
    relatedKeywords = serializers.ListField(child=serializers.CharField())
    related_keywords = serializers.ListField(child=serializers.CharField(), required=False)
    weeklyData = SellerTrendsWeeklyPointSerializer(many=True)
    weekly_data = SellerTrendsWeeklyPointSerializer(many=True, required=False)
    sellers = serializers.IntegerField()
    seller_count = serializers.IntegerField(required=False)
    views_source = serializers.CharField()
    path = serializers.CharField()


class SellerTrendsTopProductSerializer(serializers.Serializer):
    name = serializers.CharField()
    image = serializers.CharField(allow_blank=True)
    orders = serializers.IntegerField()
    revenue = serializers.FloatField()


class SellerTrendsMonthlySalesSerializer(serializers.Serializer):
    month = serializers.CharField()
    orders = serializers.IntegerField()
    revenue = serializers.FloatField()


class SellerTrendsSellerMetricsSourceSerializer(serializers.Serializer):
    return_rate = serializers.CharField()


class SellerTrendsSellerSerializer(serializers.Serializer):
    id = serializers.CharField()
    seller_id = serializers.CharField()
    rank = serializers.IntegerField()
    name = serializers.CharField()
    avatar = serializers.CharField()
    orders = serializers.IntegerField()
    revenue = serializers.FloatField()
    products = serializers.IntegerField()
    product_count = serializers.IntegerField(required=False)
    rating = serializers.FloatField()
    change = serializers.IntegerField()
    growth_pct = serializers.IntegerField(required=False)
    avgOrderValue = serializers.FloatField()
    avg_order_value = serializers.FloatField(required=False)
    joinedMonthsAgo = serializers.IntegerField()
    joined_months_ago = serializers.IntegerField(required=False)
    joined_at = serializers.DateTimeField(required=False)
    topProducts = SellerTrendsTopProductSerializer(many=True)
    top_products_preview = SellerTrendsTopProductSerializer(many=True, required=False)
    monthlySales = SellerTrendsMonthlySalesSerializer(many=True)
    monthly_sales = SellerTrendsMonthlySalesSerializer(many=True, required=False)
    topMarkets = SellerTrendsMarketSerializer(many=True)
    top_markets = SellerTrendsMarketSerializer(many=True, required=False)
    returnRate = serializers.FloatField()
    refund_or_return_rate = serializers.FloatField(required=False)
    repeatBuyerRate = serializers.IntegerField()
    repeat_buyer_rate = serializers.IntegerField(required=False)
    rating_count = serializers.IntegerField()
    path = serializers.CharField()
    metrics_source = SellerTrendsSellerMetricsSourceSerializer()


class SellerTrendsKeywordSerializer(serializers.Serializer):
    keyword = serializers.CharField()
    product = serializers.CharField()
    top_product = serializers.CharField(required=False)
    volume = serializers.IntegerField()
    change = serializers.IntegerField()
    change_pct = serializers.IntegerField(required=False)
    competition = serializers.CharField()
    source_type = serializers.CharField()


class SellerTrendsReelSerializer(serializers.Serializer):
    id = serializers.CharField()
    video_id = serializers.CharField()
    thumbnail = serializers.CharField(allow_blank=True)
    caption = serializers.CharField()
    title = serializers.CharField()
    product = serializers.CharField()
    productId = serializers.CharField()
    product_id = serializers.CharField()
    product_name = serializers.CharField(required=False)
    seller_id = serializers.CharField()
    seller_name = serializers.CharField()
    status = serializers.CharField()
    views = serializers.IntegerField()
    likes = serializers.IntegerField()
    comments = serializers.IntegerField()
    shares = serializers.IntegerField()
    duration = serializers.CharField()
    postedAt = serializers.CharField()
    published_at = serializers.DateTimeField(allow_null=True)
    hashtags = serializers.ListField(child=serializers.CharField())
    visibility = serializers.CharField()
    stats_source = serializers.CharField()


class SellerTrendsListMetaSerializer(serializers.Serializer):
    period = serializers.CharField()
    generated_at = serializers.DateTimeField()
    count = serializers.IntegerField()
    page = serializers.IntegerField()
    page_size = serializers.IntegerField()
    total_pages = serializers.IntegerField()
    has_next = serializers.BooleanField()
    has_previous = serializers.BooleanField()
    sort = serializers.CharField(required=False)
    breakout = serializers.BooleanField(required=False)
    is_partial = serializers.BooleanField(required=False)
    warnings = serializers.ListField(child=serializers.CharField(), required=False)


class SellerTrendsProductListSerializer(serializers.Serializer):
    meta = SellerTrendsListMetaSerializer()
    results = SellerTrendsProductSerializer(many=True)


class SellerTrendsSellerListSerializer(serializers.Serializer):
    meta = SellerTrendsListMetaSerializer()
    results = SellerTrendsSellerSerializer(many=True)


class SellerTrendsKeywordListSerializer(serializers.Serializer):
    meta = SellerTrendsListMetaSerializer()
    results = SellerTrendsKeywordSerializer(many=True)


class SellerTrendsReelListSerializer(serializers.Serializer):
    meta = SellerTrendsListMetaSerializer()
    results = SellerTrendsReelSerializer(many=True)


class SellerTrendsSellerDetailSerializer(serializers.Serializer):
    seller_id = serializers.CharField()
    name = serializers.CharField()
    avatar = serializers.CharField()
    rating = serializers.FloatField()
    joined_at = serializers.DateTimeField()
    joined_months_ago = serializers.IntegerField()
    monthly_sales = SellerTrendsMonthlySalesSerializer(many=True)
    top_products = SellerTrendsTopProductSerializer(many=True)
    top_markets = SellerTrendsMarketSerializer(many=True)
    repeat_buyer_rate = serializers.IntegerField()
    refund_or_return_rate = serializers.FloatField()
    avg_order_value = serializers.FloatField()
    summary = serializers.CharField()
    metrics_source = SellerTrendsSellerMetricsSourceSerializer()
    path = serializers.CharField()

from rest_framework import serializers

from django.db.models import Q
from django.core.files.storage import default_storage

from .models import Category, ComplianceRule, ListingRequest, ListingRequestPhoto, PricingTier, Product, ProductMedia, ProductVariation, Trademark


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "accent", "sort_order", "parent", "icon", "display_order"]


class ProductVariationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariation
        fields = ["id", "product", "attributes", "sku"]


class PricingTierSerializer(serializers.ModelSerializer):
    class Meta:
        model = PricingTier
        fields = ["id", "product", "variation", "min_quantity", "max_quantity", "unit_price", "currency"]


class ProductMediaSerializer(serializers.ModelSerializer):
    public_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductMedia
        fields = [
            "id",
            "product",
            "variation",
            "media_type",
            "title",
            "content_type",
            "size_bytes",
            "url",
            "storage_key",
            "position",
            "public_url",
        ]

    def get_public_url(self, obj: ProductMedia):
        raw = (getattr(obj, "url", "") or "").strip()
        if raw:
            req = self.context.get("request")
            if req and raw.startswith("/"):
                try:
                    return req.build_absolute_uri(raw)
                except Exception:
                    return raw
            return raw

        key = (getattr(obj, "storage_key", "") or "").strip()
        if not key:
            return ""
        try:
            url = default_storage.url(key)
        except Exception:
            url = key
        req = self.context.get("request")
        if req and isinstance(url, str) and url.startswith("/"):
            try:
                return req.build_absolute_uri(url)
            except Exception:
                return url
        return url

    def validate(self, attrs):
        data = super().validate(attrs)
        url = (data.get("url") or "").strip()
        storage_key = (data.get("storage_key") or "").strip()
        if not url and not storage_key:
            raise serializers.ValidationError("Either url or storage_key is required.")
        variation = data.get("variation")
        product = data.get("product")
        if variation and product and getattr(variation, "product_id", None) != getattr(product, "id", None):
            raise serializers.ValidationError("Variation must belong to the given product.")
        return data

    def create(self, validated_data):
        product = validated_data.get("product")
        media_type = validated_data.get("media_type")
        if product and media_type == ProductMedia.MediaType.IMAGE:
            existing = ProductMedia.objects.filter(
                product=product, deleted_at__isnull=True, media_type=ProductMedia.MediaType.IMAGE
            ).count()
            if existing >= 8:
                raise serializers.ValidationError("A product can have at most 8 images.")

        if "position" not in validated_data or validated_data.get("position") is None:
            if product:
                last = (
                    ProductMedia.objects.filter(product=product, deleted_at__isnull=True)
                    .order_by("-position", "-id")
                    .values_list("position", flat=True)
                    .first()
                )
                validated_data["position"] = int(last or 0) + 1
            else:
                validated_data["position"] = 0

        return super().create(validated_data)


class TrademarkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trademark
        fields = ["id", "seller", "product", "registration_number", "status", "similar_product_risk_score"]
        read_only_fields = ["seller"]


class ComplianceRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplianceRule
        fields = ["id", "category", "rule_type", "countries", "payload", "created_at", "updated_at"]


class ProductSerializer(serializers.ModelSerializer):
    seller_id = serializers.IntegerField(read_only=True)
    seller_name = serializers.SerializerMethodField()
    category_name = serializers.CharField(source="category.name", read_only=True)
    hero_image_url = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    media = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    variations = ProductVariationSerializer(many=True, read_only=True)
    pricing_tiers = PricingTierSerializer(many=True, read_only=True)
    detail_config = serializers.JSONField(required=False)

    class Meta:
        model = Product
        fields = [
            "id",
            "seller_id",
            "seller_name",
            "category",
            "category_name",
            "name",
            "title",
            "sku",
            "hs_code",
            "description",
            "currency",
            "price",
            "review_count",
            "average_rating",
            "hero_image_url",
            "images",
            "media",
            "variations",
            "pricing_tiers",
            "detail_config",
            "status",
            "origin_location",
            "lead_time_days",
            "weight_grams",
            "ship_time_min_days",
            "ship_time_max_days",
            "sample_available",
            "sample_ship_days",
            "vehsl_rating",
            "seller_rating",
            "ip_protection_level",
            "created_at",
            "updated_at",
        ]

    def get_seller_name(self, obj: Product):
        s = getattr(obj, "seller", None)
        if not s:
            return ""
        full = f"{(getattr(s, 'first_name', '') or '').strip()} {(getattr(s, 'last_name', '') or '').strip()}".strip()
        return full or getattr(s, "email", "") or getattr(s, "phone", "") or f"seller:{getattr(s, 'id', '')}"

    def get_hero_image_url(self, obj: Product):
        try:
            media = list(getattr(obj, "media", []).all()) if hasattr(obj, "media") else []
        except Exception:
            media = []
        for m in media:
            try:
                if (getattr(m, "deleted_at", None) is not None) or (getattr(m, "media_type", "") or "") != "image":
                    continue
                ser = ProductMediaSerializer(m, context=self.context).data
                u = (ser.get("public_url") or "").strip()
                if u:
                    return u
            except Exception:
                continue
        return ""

    def get_images(self, obj: Product):
        try:
            qs = obj.media.filter(deleted_at__isnull=True, media_type=ProductMedia.MediaType.IMAGE).order_by("position", "id")
        except Exception:
            return []
        out = []
        for m in qs[:8]:
            u = (ProductMediaSerializer(m, context=self.context).data.get("public_url") or "").strip()
            if u:
                out.append(u)
        return out

    def get_media(self, obj: Product):
        try:
            qs = obj.media.filter(deleted_at__isnull=True).order_by("position", "id")
        except Exception:
            return []
        data = ProductMediaSerializer(qs, many=True, context=self.context).data
        for row in data:
            if "url" in row:
                row.pop("url", None)
            if "storage_key" in row:
                row.pop("storage_key", None)
        return data

    def get_review_count(self, obj: Product):
        val = getattr(obj, "review_count", None)
        try:
            n = int(val)
            return max(0, n)
        except Exception:
            return 0

    def get_average_rating(self, obj: Product):
        val = getattr(obj, "average_rating", None)
        if val is None:
            return None
        try:
            num = float(val)
        except Exception:
            return None
        if not (0.0 <= num <= 5.0):
            return None
        return round(num, 2)

    def validate_currency(self, value: str):
        if not value or len(value) != 3:
            raise serializers.ValidationError("Currency must be a 3-letter code.")
        return value.upper()

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Price must be >= 0.")
        return value

    def validate_weight_grams(self, value):
        try:
            n = int(value)
        except Exception:
            raise serializers.ValidationError("weight_grams must be an integer.")
        if n <= 0:
            raise serializers.ValidationError("weight_grams must be > 0.")
        return n

    def validate_ship_time_min_days(self, value):
        try:
            n = int(value)
        except Exception:
            raise serializers.ValidationError("ship_time_min_days must be an integer.")
        if n < 0:
            raise serializers.ValidationError("ship_time_min_days must be >= 0.")
        return n

    def validate_ship_time_max_days(self, value):
        try:
            n = int(value)
        except Exception:
            raise serializers.ValidationError("ship_time_max_days must be an integer.")
        if n < 0:
            raise serializers.ValidationError("ship_time_max_days must be >= 0.")
        return n

    def validate_sample_ship_days(self, value):
        try:
            n = int(value)
        except Exception:
            raise serializers.ValidationError("sample_ship_days must be an integer.")
        if n < 0:
            raise serializers.ValidationError("sample_ship_days must be >= 0.")
        return n

    def validate(self, attrs):
        data = super().validate(attrs)
        mn = data.get("ship_time_min_days")
        mx = data.get("ship_time_max_days")
        if mn is not None and mx is not None and int(mx) < int(mn):
            raise serializers.ValidationError({"ship_time_max_days": "ship_time_max_days must be >= ship_time_min_days."})
        return data

    def validate_detail_config(self, value):
        if value is None:
            return {}
        if not isinstance(value, dict):
            raise serializers.ValidationError("detail_config must be an object.")

        specs = value.get("specifications")
        if specs is None:
            return value
        if not isinstance(specs, list):
            raise serializers.ValidationError("detail_config.specifications must be a list.")

        if len(specs) > 20:
            raise serializers.ValidationError("detail_config.specifications can have at most 20 groups.")

        total_items = 0
        cleaned_groups = []
        for g in specs:
            if not isinstance(g, dict):
                raise serializers.ValidationError("Each specification group must be an object.")
            title = str(g.get("title") or "").strip()
            if not title:
                raise serializers.ValidationError("Each specification group requires a title.")
            if len(title) > 80:
                raise serializers.ValidationError("Specification group title too long (max 80).")

            collapsed = bool(g.get("collapsed")) if "collapsed" in g else False
            items = g.get("items") or []
            if not isinstance(items, list):
                raise serializers.ValidationError(f'Specification group "{title}" items must be a list.')

            if len(items) > 60:
                raise serializers.ValidationError(f'Specification group "{title}" can have at most 60 items.')

            cleaned_items = []
            for it in items:
                if not isinstance(it, dict):
                    raise serializers.ValidationError(f'Specification group "{title}" items must be objects.')
                label = str(it.get("label") or "").strip()
                val = str(it.get("value") or "").strip()
                if not label or not val:
                    raise serializers.ValidationError(f'Specification group "{title}" items require label and value.')
                if len(label) > 120 or len(val) > 220:
                    raise serializers.ValidationError(f'Specification group "{title}" item too long.')
                cleaned_items.append({"label": label, "value": val})
                total_items += 1

            cleaned_groups.append({"title": title, "collapsed": collapsed, "items": cleaned_items})

        if total_items > 250:
            raise serializers.ValidationError("detail_config.specifications can have at most 250 items total.")

        value = {**value, "specifications": cleaned_groups}
        return value


class ListingRequestPhotoSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ListingRequestPhoto
        fields = ["id", "file_url", "original_name", "content_type", "size_bytes", "created_at"]

    def get_file_url(self, obj: ListingRequestPhoto):
        try:
            url = obj.file.url
        except Exception:
            return ""
        req = self.context.get("request")
        return req.build_absolute_uri(url) if req else url


class ListingRequestSerializer(serializers.ModelSerializer):
    photos = ListingRequestPhotoSerializer(many=True, read_only=True)

    class Meta:
        model = ListingRequest
        fields = [
            "id",
            "stage",
            "rating",
            "product_name",
            "company_name",
            "description",
            "monthly_capacity",
            "currency",
            "unit_price",
            "moq",
            "category",
            "category_label",
            "pickup_type",
            "pickup_address",
            "pickup_contact_name",
            "pickup_phone",
            "created_product",
            "created_at",
            "updated_at",
            "photos",
        ]


class ListingRequestCreateSerializer(serializers.Serializer):
    product_name = serializers.CharField(required=True, allow_blank=False)
    company_name = serializers.CharField(required=False, allow_blank=True)
    category = serializers.CharField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    monthly_capacity = serializers.CharField(required=False, allow_blank=True)
    currency = serializers.CharField(required=False, allow_blank=True)
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=2, required=True)
    moq = serializers.IntegerField(required=False, min_value=1)
    photo = serializers.FileField(required=False, allow_null=True)

    def validate_currency(self, value: str):
        val = (value or "").strip()
        if val == "":
            return "USD"
        if len(val) != 3:
            raise serializers.ValidationError("Currency must be a 3-letter code.")
        return val.upper()

    def create(self, validated_data):
        user = self.context["request"].user

        category_text = (validated_data.pop("category", "") or "").strip()
        category_obj = None
        if category_text:
            category_obj = Category.objects.filter(Q(name__iexact=category_text) | Q(slug__iexact=category_text)).first()
        if category_obj is None:
            category_obj = Category.objects.filter(Q(name__iexact="Other") | Q(slug__iexact="other")).first()

        photo_file = validated_data.pop("photo", None)
        moq = validated_data.pop("moq", None)

        lr = ListingRequest.objects.create(
            seller=user,
            category=category_obj,
            category_label=category_text if not category_obj else "",
            product_name=(validated_data.get("product_name") or "").strip(),
            company_name=(validated_data.get("company_name") or "").strip(),
            description=(validated_data.get("description") or "").strip(),
            monthly_capacity=(validated_data.get("monthly_capacity") or "").strip(),
            currency=validated_data.get("currency") or "USD",
            unit_price=validated_data.get("unit_price"),
            moq=int(moq or 1),
            stage=ListingRequest.Stage.SAMPLES,
        )

        if photo_file:
            ListingRequestPhoto.objects.create(
                listing_request=lr,
                file=photo_file,
                original_name=getattr(photo_file, "name", "") or "",
                content_type=getattr(photo_file, "content_type", "") or "",
                size_bytes=int(getattr(photo_file, "size", 0) or 0),
            )

        return lr


class AdminProductListSerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)
    stock_units = serializers.IntegerField(read_only=True)
    admin_status = serializers.SerializerMethodField()
    images_count = serializers.IntegerField(read_only=True)
    missing_hs_code = serializers.IntegerField(read_only=True)
    missing_media = serializers.IntegerField(read_only=True)
    missing_hero_image = serializers.IntegerField(read_only=True)
    needs_compliance = serializers.BooleanField(read_only=True)
    compliance_score = serializers.IntegerField(read_only=True)
    compliance_rules_count = serializers.IntegerField(read_only=True)
    compliance_docs_required_count = serializers.IntegerField(read_only=True)
    compliance_destination_rules_count = serializers.IntegerField(read_only=True)
    legal_review_status = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "sku",
            "hs_code",
            "currency",
            "price",
            "status",
            "vehsl_rating",
            "seller_name",
            "category",
            "category_name",
            "category_slug",
            "stock_units",
            "admin_status",
            "images_count",
            "missing_hs_code",
            "missing_media",
            "missing_hero_image",
            "needs_compliance",
            "compliance_score",
            "compliance_rules_count",
            "compliance_docs_required_count",
            "compliance_destination_rules_count",
            "legal_review_status",
        ]

    def get_admin_status(self, obj: Product):
        threshold = int(self.context.get("low_stock_threshold") or 50)
        stock = getattr(obj, "stock_units", None)
        try:
            stock_val = int(stock)
        except Exception:
            stock_val = 0

        if (obj.status or "").lower() in {"pending", "draft", "rejected"}:
            return "review"
        if stock_val <= 0:
            return "out"
        if 0 < stock_val < threshold:
            return "low_stock"
        return "active"

    def get_legal_review_status(self, obj: Product):
        s = (getattr(obj, "status", "") or "").lower()
        if s in {"draft", "pending", "rejected"}:
            return "needs_review"
        if s == "archived":
            return "archived"
        return "ok"


class AdminProductWriteSerializer(serializers.Serializer):
    name = serializers.CharField(required=True, allow_blank=False)
    category_id = serializers.IntegerField(required=True)
    seller_id = serializers.IntegerField(required=False)
    seller_email = serializers.EmailField(required=False, allow_blank=True)
    currency = serializers.CharField(required=False, allow_blank=True)
    price = serializers.DecimalField(max_digits=12, decimal_places=2, required=True)
    status = serializers.ChoiceField(choices=Product.Status.choices, required=False)
    hs_code = serializers.CharField(required=False, allow_blank=True)
    vehsl_rating = serializers.DecimalField(max_digits=4, decimal_places=2, required=False, allow_null=True)
    stock_units = serializers.IntegerField(required=False, min_value=0)

    def validate_currency(self, value: str):
        val = (value or "").strip()
        if val == "":
            return "USD"
        if len(val) != 3:
            raise serializers.ValidationError("Currency must be a 3-letter code.")
        return val.upper()

    def validate(self, attrs):
        if not getattr(self, "partial", False):
            seller_id = attrs.get("seller_id")
            seller_email = (attrs.get("seller_email") or "").strip().lower()
            if not seller_id and not seller_email:
                raise serializers.ValidationError({"seller_email": "seller_email or seller_id is required."})

        if "category_id" in attrs:
            category_id = attrs.get("category_id")
            if not Category.objects.filter(id=category_id).exists():
                raise serializers.ValidationError({"category_id": "Category not found."})

        attrs["hs_code"] = (attrs.get("hs_code") or "").strip()

        return attrs

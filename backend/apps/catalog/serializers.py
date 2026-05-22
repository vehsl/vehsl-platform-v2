from rest_framework import serializers

from django.db.models import Q

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
    class Meta:
        model = ProductMedia
        fields = ["id", "product", "media_type", "url", "position"]


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

    class Meta:
        model = Product
        fields = [
            "id",
            "seller_id",
            "category",
            "name",
            "title",
            "sku",
            "hs_code",
            "description",
            "currency",
            "price",
            "status",
            "origin_location",
            "lead_time_days",
            "vehsl_rating",
            "seller_rating",
            "ip_protection_level",
            "created_at",
            "updated_at",
        ]

    def validate_currency(self, value: str):
        if not value or len(value) != 3:
            raise serializers.ValidationError("Currency must be a 3-letter code.")
        return value.upper()

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Price must be >= 0.")
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

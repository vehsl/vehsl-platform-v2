from rest_framework import serializers

from .models import Category, ComplianceRule, PricingTier, Product, ProductMedia, ProductVariation, Trademark


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


class AdminProductListSerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)
    stock_units = serializers.IntegerField(read_only=True)
    admin_status = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
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

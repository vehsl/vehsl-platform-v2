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

from rest_framework import serializers

from apps.catalog.models import Product

from .models import QualityInspection, Sample, SampleRequest


class SampleSerializer(serializers.ModelSerializer):
    seller_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Sample
        fields = ["id", "product", "seller_id", "available_quantity", "low_stock_flag", "last_updated"]


class SampleRequestSerializer(serializers.ModelSerializer):
    buyer_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = SampleRequest
        fields = [
            "id",
            "buyer_id",
            "product",
            "status",
            "feedback_rating",
            "feedback_text",
            "requested_at",
        ]


class AdminQualityInspectionListSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    seller_name = serializers.SerializerMethodField()
    inspector_display = serializers.SerializerMethodField()

    class Meta:
        model = QualityInspection
        fields = [
            "id",
            "product",
            "product_name",
            "seller_name",
            "inspector_display",
            "status",
            "score",
            "inspected_at",
            "created_at",
        ]

    def get_seller_name(self, obj: QualityInspection):
        seller = getattr(obj, "seller", None)
        if not seller:
            return "—"
        full = f"{(getattr(seller, 'first_name', '') or '').strip()} {(getattr(seller, 'last_name', '') or '').strip()}".strip()
        return full or getattr(seller, "email", None) or getattr(seller, "phone", None) or "—"

    def get_inspector_display(self, obj: QualityInspection):
        if (obj.inspector_name or "").strip():
            return obj.inspector_name.strip()
        ins = getattr(obj, "inspector", None)
        if ins:
            full = f"{(getattr(ins, 'first_name', '') or '').strip()} {(getattr(ins, 'last_name', '') or '').strip()}".strip()
            return full or getattr(ins, "email", None) or getattr(ins, "phone", None) or "—"
        return "—"


class AdminQualityInspectionDetailSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    seller_id = serializers.IntegerField(source="seller_id", read_only=True)
    inspector_id = serializers.IntegerField(source="inspector_id", read_only=True)
    seller_name = serializers.SerializerMethodField()
    inspector_display = serializers.SerializerMethodField()

    class Meta:
        model = QualityInspection
        fields = [
            "id",
            "product",
            "product_name",
            "seller_id",
            "seller_name",
            "inspector_id",
            "inspector_name",
            "inspector_display",
            "status",
            "score",
            "inspected_at",
            "created_at",
        ]

    def get_seller_name(self, obj: QualityInspection):
        return AdminQualityInspectionListSerializer().get_seller_name(obj)

    def get_inspector_display(self, obj: QualityInspection):
        return AdminQualityInspectionListSerializer().get_inspector_display(obj)


class AdminQualityInspectionWriteSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(required=True)
    seller_id = serializers.IntegerField(required=True)
    inspector_id = serializers.IntegerField(required=False, allow_null=True)
    inspector_name = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=QualityInspection.Status.choices, required=False)
    score = serializers.IntegerField(required=False, min_value=0, max_value=100)
    inspected_at = serializers.DateTimeField(required=False, allow_null=True)

    def validate_product_id(self, value):
        if not Product.objects.filter(id=value, deleted_at__isnull=True).exists():
            raise serializers.ValidationError("Invalid product.")
        return value

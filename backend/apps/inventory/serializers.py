from rest_framework import serializers

from .models import Sample, SampleRequest


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

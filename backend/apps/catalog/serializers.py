from rest_framework import serializers

import json

from django.db.models import Q
from django.core.files.storage import default_storage

from .models import Category, ComplianceRule, ListingRequest, ListingRequestPhoto, PricingTier, Product, ProductMedia, ProductVariation, Trademark, Warehouse, WarehouseStock


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

    def validate(self, attrs):
        data = super().validate(attrs)
        product = data.get("product") or getattr(self.instance, "product", None)
        variation = data.get("variation") if "variation" in data else getattr(self.instance, "variation", None)
        currency = (data.get("currency") or getattr(self.instance, "currency", "") or "").upper()
        if product:
            product_currency = (getattr(product, "currency", "") or "").upper()
            if product_currency and currency and product_currency != currency:
                raise serializers.ValidationError("Pricing tier currency must match product currency.")
        if variation and product and getattr(variation, "product_id", None) != getattr(product, "id", None):
            raise serializers.ValidationError("Variation must belong to the given product.")
        min_q = data.get("min_quantity") if "min_quantity" in data else getattr(self.instance, "min_quantity", 1)
        max_q = data.get("max_quantity") if "max_quantity" in data else getattr(self.instance, "max_quantity", None)
        try:
            min_q = int(min_q or 1)
        except Exception:
            min_q = 1
        if max_q is not None:
            try:
                max_q = int(max_q)
            except Exception:
                max_q = None
        if max_q is not None and max_q < min_q:
            raise serializers.ValidationError("max_quantity must be >= min_quantity or empty.")
        return data


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


class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = [
            "id",
            "name",
            "code",
            "country",
            "region",
            "city",
            "street1",
            "street2",
            "postal_code",
            "active",
        ]


class WarehouseStockSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    warehouse_code = serializers.CharField(source="warehouse.code", read_only=True)
    variation_attributes = serializers.SerializerMethodField()
    available_units = serializers.SerializerMethodField()

    class Meta:
        model = WarehouseStock
        fields = [
            "id",
            "warehouse",
            "warehouse_name",
            "warehouse_code",
            "seller",
            "product",
            "variation",
            "variation_attributes",
            "quantity_units",
            "reserved_units",
            "available_units",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["seller", "created_at", "updated_at"]

    def get_variation_attributes(self, obj: WarehouseStock):
        v = getattr(obj, "variation", None)
        if not v:
            return {}
        a = getattr(v, "attributes", None)
        return a if isinstance(a, dict) else {}

    def get_available_units(self, obj: WarehouseStock):
        try:
            q = int(getattr(obj, "quantity_units", 0) or 0)
        except Exception:
            q = 0
        try:
            r = int(getattr(obj, "reserved_units", 0) or 0)
        except Exception:
            r = 0
        return max(0, q - r)

    def validate(self, attrs):
        data = super().validate(attrs)
        q = data.get("quantity_units") if "quantity_units" in data else getattr(self.instance, "quantity_units", 0)
        r = data.get("reserved_units") if "reserved_units" in data else getattr(self.instance, "reserved_units", 0)
        try:
            qv = int(q or 0)
        except Exception:
            qv = 0
        try:
            rv = int(r or 0)
        except Exception:
            rv = 0
        if rv < 0 or qv < 0:
            raise serializers.ValidationError("quantity_units and reserved_units must be >= 0.")
        if rv > qv:
            raise serializers.ValidationError({"reserved_units": "reserved_units must be <= quantity_units."})
        return data


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
            qs = obj.media.filter(deleted_at__isnull=True, media_type=ProductMedia.MediaType.IMAGE).order_by("position", "id")
        except Exception:
            return ""
        m = qs.first()
        if not m:
            return ""
        u = (ProductMediaSerializer(m, context=self.context).data.get("public_url") or "").strip()
        return u

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
            "product_meta",
            "created_product",
            "created_at",
            "updated_at",
            "photos",
        ]


class AdminListingRequestSerializer(ListingRequestSerializer):
    seller_id = serializers.IntegerField(source="seller_id", read_only=True)
    seller_email = serializers.CharField(source="seller.email", read_only=True)
    seller_label = serializers.SerializerMethodField()

    class Meta(ListingRequestSerializer.Meta):
        fields = ["seller_id", "seller_email", "seller_label"] + list(ListingRequestSerializer.Meta.fields)

    def get_seller_label(self, obj: ListingRequest):
        seller = getattr(obj, "seller", None)
        if not seller:
            return ""
        full_name = f"{(getattr(seller, 'first_name', '') or '').strip()} {(getattr(seller, 'last_name', '') or '').strip()}".strip()
        return full_name or (getattr(seller, "email", "") or "")


class ListingRequestCreateSerializer(serializers.Serializer):
    product_name = serializers.CharField(required=True, allow_blank=False)
    company_name = serializers.CharField(required=False, allow_blank=True)
    category = serializers.CharField(required=False, allow_blank=True)
    category_id = serializers.IntegerField(required=False, allow_null=True)
    description = serializers.CharField(required=False, allow_blank=True)
    monthly_capacity = serializers.CharField(required=False, allow_blank=True)
    currency = serializers.CharField(required=False, allow_blank=True)
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=2, required=True)
    moq = serializers.IntegerField(required=False, min_value=1)
    photo = serializers.FileField(required=False, allow_null=True)

    sku = serializers.CharField(required=False, allow_blank=True)
    hs_code = serializers.CharField(required=False, allow_blank=True)
    origin_country = serializers.CharField(required=False, allow_blank=True)
    origin_region = serializers.CharField(required=False, allow_blank=True)
    origin_city = serializers.CharField(required=False, allow_blank=True)
    lead_time_days = serializers.IntegerField(required=False, allow_null=True)
    weight_grams = serializers.IntegerField(required=False, allow_null=True)
    ship_time_min_days = serializers.IntegerField(required=False, allow_null=True)
    ship_time_max_days = serializers.IntegerField(required=False, allow_null=True)
    sample_available = serializers.BooleanField(required=False)
    sample_ship_days = serializers.IntegerField(required=False, allow_null=True)
    detail_config = serializers.JSONField(required=False)
    variations = serializers.CharField(required=False, allow_blank=True)
    pricing_tiers = serializers.CharField(required=False, allow_blank=True)
    ip_protection_level = serializers.CharField(required=False, allow_blank=True)
    trademark_registration_number = serializers.CharField(required=False, allow_blank=True)

    def validate_currency(self, value: str):
        val = (value or "").strip()
        if val == "":
            return "USD"
        if len(val) != 3:
            raise serializers.ValidationError("Currency must be a 3-letter code.")
        return val.upper()

    def _parse_json_payload(self, raw: object):
        if raw is None or raw == "":
            return None
        if isinstance(raw, (list, dict)):
            return raw
        if not isinstance(raw, str):
            return None
        s = raw.strip()
        if not s:
            return None
        try:
            return json.loads(s)
        except Exception:
            return None

    def _clean_variations(self, raw: object):
        data = self._parse_json_payload(raw)
        if data is None:
            return []
        if not isinstance(data, list):
            raise serializers.ValidationError({"variations": "variations must be a JSON array."})
        if len(data) > 40:
            raise serializers.ValidationError({"variations": "variations can have at most 40 entries."})
        out = []
        for v in data:
            if not isinstance(v, dict):
                raise serializers.ValidationError({"variations": "Each variation must be an object."})
            attrs = v.get("attributes")
            if attrs is None:
                attrs = {}
            if not isinstance(attrs, dict):
                raise serializers.ValidationError({"variations": "variation.attributes must be an object."})
            cleaned_attrs = {}
            for k, val in list(attrs.items())[:30]:
                kk = str(k or "").strip()
                if not kk:
                    continue
                vv = str(val or "").strip()
                if not vv:
                    continue
                if len(kk) > 40 or len(vv) > 80:
                    continue
                cleaned_attrs[kk] = vv
            sku = str(v.get("sku") or "").strip()
            out.append({"attributes": cleaned_attrs, "sku": sku[:64]})
        return out

    def _clean_pricing_tiers(self, raw: object, default_currency: str):
        data = self._parse_json_payload(raw)
        if data is None:
            return []
        if not isinstance(data, list):
            raise serializers.ValidationError({"pricing_tiers": "pricing_tiers must be a JSON array."})
        if len(data) > 120:
            raise serializers.ValidationError({"pricing_tiers": "pricing_tiers can have at most 120 entries."})
        out = []
        for t in data:
            if not isinstance(t, dict):
                raise serializers.ValidationError({"pricing_tiers": "Each pricing tier must be an object."})
            try:
                min_q = int(t.get("min_quantity") or 1)
            except Exception:
                min_q = 1
            try:
                mx = t.get("max_quantity", None)
                max_q = int(mx) if mx is not None and str(mx).strip() != "" else None
            except Exception:
                max_q = None
            if max_q is not None and max_q < min_q:
                raise serializers.ValidationError({"pricing_tiers": "max_quantity must be >= min_quantity or null."})
            cur = str(t.get("currency") or default_currency or "USD").strip().upper()
            if len(cur) != 3:
                raise serializers.ValidationError({"pricing_tiers": "currency must be a 3-letter code."})
            try:
                unit_price = str(t.get("unit_price") or "").strip()
                if unit_price == "":
                    raise Exception()
                _ = float(unit_price)
            except Exception:
                raise serializers.ValidationError({"pricing_tiers": "unit_price is required and must be numeric."})
            var = t.get("variation", None)
            if var is None or var == "":
                var_idx = None
            else:
                try:
                    var_idx = int(var)
                except Exception:
                    raise serializers.ValidationError({"pricing_tiers": "variation must be an integer index or null."})
                if var_idx < 0:
                    raise serializers.ValidationError({"pricing_tiers": "variation index must be >= 0."})
            out.append(
                {
                    "variation": var_idx,
                    "min_quantity": max(1, min_q),
                    "max_quantity": max_q,
                    "unit_price": unit_price,
                    "currency": cur,
                }
            )
        out.sort(key=lambda x: (x["variation"] is None, x["variation"] if x["variation"] is not None else -1, x["min_quantity"]))
        return out

    def validate(self, attrs):
        data = super().validate(attrs)
        category_text = (data.get("category") or "").strip()
        category_id = data.get("category_id")
        try:
            category_id = int(category_id) if category_id is not None else None
        except Exception:
            category_id = None

        ip_level = (data.get("ip_protection_level") or "").strip().lower()
        if ip_level:
            allowed = {c[0] for c in Product.IpProtectionLevel.choices}
            if ip_level not in allowed:
                raise serializers.ValidationError({"ip_protection_level": "Invalid ip_protection_level."})

        currency = (data.get("currency") or "USD").strip().upper()
        self._clean_variations(data.get("variations"))
        self._clean_pricing_tiers(data.get("pricing_tiers"), currency)

        if category_id:
            if not Category.objects.filter(id=category_id, deleted_at__isnull=True).exists():
                raise serializers.ValidationError({"category_id": "Category not found."})
            return data

        if category_text and category_text.lower() not in {"other"}:
            exists = Category.objects.filter(
                Q(name__iexact=category_text) | Q(slug__iexact=category_text),
                deleted_at__isnull=True,
            ).exists()
            if not exists:
                raise serializers.ValidationError({"category": "Invalid category. Please choose from the list."})

        return data

    def create(self, validated_data):
        user = self.context["request"].user

        category_obj = None
        category_text = (validated_data.pop("category", "") or "").strip()
        category_id = validated_data.pop("category_id", None)
        try:
            category_id = int(category_id) if category_id is not None else None
        except Exception:
            category_id = None

        if category_id:
            category_obj = Category.objects.filter(id=category_id, deleted_at__isnull=True).first()
        if category_obj is None and category_text:
            category_obj = Category.objects.filter(Q(name__iexact=category_text) | Q(slug__iexact=category_text), deleted_at__isnull=True).first()
        if category_obj is None:
            category_obj = Category.objects.filter(Q(name__iexact="Other") | Q(slug__iexact="other"), deleted_at__isnull=True).first()

        photo_file = validated_data.pop("photo", None)
        moq = validated_data.pop("moq", None)

        detail_cfg = validated_data.pop("detail_config", None)
        if isinstance(detail_cfg, str) and detail_cfg.strip():
            try:
                detail_cfg = json.loads(detail_cfg)
            except Exception:
                detail_cfg = None
        if not isinstance(detail_cfg, dict):
            detail_cfg = None
        if isinstance(detail_cfg, dict):
            detail_cfg = ProductSerializer().validate_detail_config(detail_cfg)

        currency = (validated_data.get("currency") or "USD").strip().upper()
        variations_clean = self._clean_variations(validated_data.pop("variations", None))
        pricing_tiers_clean = self._clean_pricing_tiers(validated_data.pop("pricing_tiers", None), currency)
        ip_level = (validated_data.pop("ip_protection_level", "") or "").strip().lower()
        trademark_reg = (validated_data.pop("trademark_registration_number", "") or "").strip()

        meta = {
            "sku": (validated_data.pop("sku", "") or "").strip(),
            "hs_code": (validated_data.pop("hs_code", "") or "").strip(),
            "origin_location": {
                "country": (validated_data.pop("origin_country", "") or "").strip(),
                "region": (validated_data.pop("origin_region", "") or "").strip(),
                "city": (validated_data.pop("origin_city", "") or "").strip(),
            },
            "lead_time_days": validated_data.pop("lead_time_days", None),
            "weight_grams": validated_data.pop("weight_grams", None),
            "ship_time_min_days": validated_data.pop("ship_time_min_days", None),
            "ship_time_max_days": validated_data.pop("ship_time_max_days", None),
            "sample_available": bool(validated_data.pop("sample_available", False)),
            "sample_ship_days": validated_data.pop("sample_ship_days", None),
        }
        if detail_cfg is not None:
            meta["detail_config"] = detail_cfg
        if variations_clean:
            meta["variations"] = variations_clean
        if pricing_tiers_clean:
            meta["pricing_tiers"] = pricing_tiers_clean
        if ip_level:
            meta["ip_protection_level"] = ip_level
        if trademark_reg:
            meta["trademark_registration_number"] = trademark_reg[:128]

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
            product_meta=meta,
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
    category_display = serializers.SerializerMethodField()
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
            "category_display",
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

    def get_category_display(self, obj: Product):
        cat = getattr(obj, "category", None)
        if not cat:
            return ""
        parts = []
        cur = cat
        i = 0
        while cur is not None and i < 3:
            nm = (getattr(cur, "name", "") or "").strip()
            if nm:
                parts.append(nm)
            cur = getattr(cur, "parent", None)
            i += 1
        parts = list(reversed(parts))
        return " / ".join(parts)

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

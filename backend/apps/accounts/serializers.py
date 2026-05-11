import re
import json

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Q
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import (
    AdminProfile,
    BuyerProfile,
    ChatMessage,
    ChatThread,
    KycDocument,
    Notification,
    SellerProfile,
    Subscription,
    User,
    UserProfile,
)


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            "country",
            "province",
            "city",
            "street",
            "address",
            "nationality",
            "gender",
            "date_of_birth",
            "employment_statuses",
            "work_details",
            "bank_details",
            "pep_status",
        ]


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(required=False)
    buyer_profile = serializers.SerializerMethodField()
    seller_profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "phone",
            "first_name",
            "last_name",
            "role",
            "account_type",
            "two_factor_enabled",
            "status",
            "profile",
            "buyer_profile",
            "seller_profile",
        ]

    def get_buyer_profile(self, obj: User):
        if getattr(obj, "account_type", None) != User.AccountType.BUYER:
            return None
        prof = getattr(obj, "buyer_profile", None)
        return BuyerProfileSerializer(prof).data if prof else None

    def get_seller_profile(self, obj: User):
        if getattr(obj, "account_type", None) != User.AccountType.SELLER:
            return None
        prof = getattr(obj, "seller_profile", None)
        return SellerProfileSerializer(prof).data if prof else None


class BuyerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = BuyerProfile
        fields = [
            "name",
            "business_type",
            "default_location",
            "currency_preference",
            "language_preference",
        ]


class SellerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerProfile
        fields = [
            "business_name",
            "business_license_url",
            "tax_id",
            "verification_status",
            "country",
            "region",
            "vehsl_rating",
            "sample_low_threshold",
        ]


class AdminProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminProfile
        fields = ["admin_role", "department"]


class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = ["id", "plan", "status", "trial_ends_at", "current_period_end", "created_at", "updated_at"]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "channel", "event_type", "payload", "status", "sent_at", "created_at"]


class ChatThreadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatThread
        fields = ["id", "type", "participants", "created_at", "updated_at"]


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = ChatMessage
        fields = ["id", "thread", "sender_id", "content", "attachments", "sent_at", "read_by"]


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False, allow_null=True, allow_blank=True)
    phone = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    account_type = serializers.ChoiceField(choices=User.AccountType.choices, required=True)
    password = serializers.CharField(write_only=True, min_length=10)

    country = serializers.CharField(required=False, allow_blank=True)
    province = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, allow_blank=True)
    street = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    nationality = serializers.CharField(required=False, allow_blank=True)
    gender = serializers.CharField(required=False, allow_blank=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)

    employment_statuses = serializers.JSONField(required=False)
    work_details = serializers.JSONField(required=False)
    bank_details = serializers.JSONField(required=False)

    pep_status = serializers.BooleanField(required=False, allow_null=True)
    pep_check = serializers.ChoiceField(choices=["Yes", "No"], required=False)

    id_doc_1 = serializers.FileField(required=False, allow_null=True)
    id_doc_1_type = serializers.CharField(required=False, allow_blank=True)
    id_doc_2 = serializers.FileField(required=False, allow_null=True)
    id_doc_2_type = serializers.CharField(required=False, allow_blank=True)
    proof_of_address = serializers.FileField(required=False, allow_null=True)
    proof_of_address_type = serializers.CharField(required=False, allow_blank=True)
    business_doc_1 = serializers.FileField(required=False, allow_null=True)
    business_doc_1_type = serializers.CharField(required=False, allow_blank=True)
    business_doc_2 = serializers.FileField(required=False, allow_null=True)
    business_doc_2_type = serializers.CharField(required=False, allow_blank=True)

    def validate_phone(self, value):
        value = (value or "").strip()
        if not value:
            return value
        value = re.sub(r"\s+", "", value)
        if not re.match(r"^\+?[1-9]\d{7,14}$", value):
            raise serializers.ValidationError("Phone must be a valid E.164 number.")
        return value

    def validate_password(self, value):
        checks = [
            (len(value) >= 10, "Password must be at least 10 characters."),
            (re.search(r"[A-Z]", value) is not None, "Password must include an uppercase letter."),
            (re.search(r"[a-z]", value) is not None, "Password must include a lowercase letter."),
            (re.search(r"[0-9]", value) is not None, "Password must include a number."),
            (re.search(r"[^A-Za-z0-9]", value) is not None, "Password must include a special character."),
        ]
        for ok, message in checks:
            if not ok:
                raise serializers.ValidationError(message)

        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))

        return value

    def validate(self, attrs):
        email = (attrs.get("email") or "").strip() or None
        phone = (attrs.get("phone") or "").strip() or None
        if not email and not phone:
            raise serializers.ValidationError("Email or phone is required.")
        if email and User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({"email": "Email already in use."})
        if phone and User.objects.filter(phone=phone).exists():
            raise serializers.ValidationError({"phone": "Phone already in use."})
        attrs["email"] = email
        attrs["phone"] = phone
        if "pep_status" not in attrs and attrs.get("pep_check") in {"Yes", "No"}:
            attrs["pep_status"] = attrs.get("pep_check") == "Yes"
        emp = attrs.get("employment_statuses")
        if isinstance(emp, str):
            try:
                emp = json.loads(emp)
            except Exception:
                emp = emp
        if emp is not None:
            if not isinstance(emp, list):
                raise serializers.ValidationError({"employment_statuses": "Must be a list."})
            attrs["employment_statuses"] = emp
        if isinstance(attrs.get("work_details"), str):
            try:
                attrs["work_details"] = json.loads(attrs["work_details"])
            except Exception:
                pass
        if isinstance(attrs.get("bank_details"), str):
            try:
                attrs["bank_details"] = json.loads(attrs["bank_details"])
            except Exception:
                pass
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        account_type = validated_data.get("account_type")
        validated_data["role"] = account_type

        profile_fields = {
            "country": validated_data.pop("country", ""),
            "province": validated_data.pop("province", ""),
            "city": validated_data.pop("city", ""),
            "street": validated_data.pop("street", ""),
            "address": validated_data.pop("address", ""),
            "nationality": validated_data.pop("nationality", ""),
            "gender": validated_data.pop("gender", ""),
            "date_of_birth": validated_data.pop("date_of_birth", None),
            "employment_statuses": validated_data.pop("employment_statuses", []),
            "work_details": validated_data.pop("work_details", {}),
            "bank_details": validated_data.pop("bank_details", {}),
            "pep_status": validated_data.pop("pep_status", None),
        }
        validated_data.pop("pep_check", None)

        id_doc_1 = validated_data.pop("id_doc_1", None)
        id_doc_1_type = validated_data.pop("id_doc_1_type", "")
        id_doc_2 = validated_data.pop("id_doc_2", None)
        id_doc_2_type = validated_data.pop("id_doc_2_type", "")
        proof = validated_data.pop("proof_of_address", None)
        proof_type = validated_data.pop("proof_of_address_type", "")
        biz_1 = validated_data.pop("business_doc_1", None)
        biz_1_type = validated_data.pop("business_doc_1_type", "")
        biz_2 = validated_data.pop("business_doc_2", None)
        biz_2_type = validated_data.pop("business_doc_2_type", "")

        user = User.objects.create_user(password=password, **validated_data)
        profile, _ = UserProfile.objects.get_or_create(user=user)
        for k, v in profile_fields.items():
            if v is None:
                continue
            setattr(profile, k, v)
        profile.save()
        if account_type == User.AccountType.BUYER:
            BuyerProfile.objects.get_or_create(user=user)
        elif account_type == User.AccountType.SELLER:
            SellerProfile.objects.get_or_create(user=user)

        uploads = [
            (KycDocument.Kind.ID_DOC_1, id_doc_1, id_doc_1_type),
            (KycDocument.Kind.ID_DOC_2, id_doc_2, id_doc_2_type),
            (KycDocument.Kind.PROOF_OF_ADDRESS, proof, proof_type),
            (KycDocument.Kind.BUSINESS_DOC_1, biz_1, biz_1_type),
            (KycDocument.Kind.BUSINESS_DOC_2, biz_2, biz_2_type),
        ]
        for kind, f, doc_type in uploads:
            if not f:
                continue
            KycDocument.objects.create(
                user=user,
                kind=kind,
                doc_type=(doc_type or ""),
                file=f,
                original_name=getattr(f, "name", "") or "",
                content_type=getattr(f, "content_type", "") or "",
                size_bytes=int(getattr(f, "size", 0) or 0),
            )

        return user


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField()
    password = serializers.CharField(write_only=True)


class VehslTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "identifier"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["identifier"] = serializers.CharField()
        if "username" in self.fields:
            self.fields.pop("username")

    def validate(self, attrs):
        identifier = (attrs.get("identifier") or "").strip()
        password = attrs.get("password")

        user = (
            User.objects.filter(Q(email__iexact=identifier) | Q(phone=identifier)).first()
            if identifier
            else None
        )
        if not user:
            raise serializers.ValidationError("Invalid credentials.")

        if not user.check_password(password):
            raise serializers.ValidationError("Invalid credentials.")

        if not user.is_active:
            raise serializers.ValidationError("User is inactive.")

        refresh = self.get_token(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": UserSerializer(user).data,
        }

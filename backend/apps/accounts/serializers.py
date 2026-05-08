import re

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Q
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User, UserProfile


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
        ]


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(required=False)

    class Meta:
        model = User
        fields = ["id", "email", "phone", "first_name", "last_name", "account_type", "profile"]


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False, allow_null=True, allow_blank=True)
    phone = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    account_type = serializers.ChoiceField(choices=User.AccountType.choices, required=True)
    password = serializers.CharField(write_only=True, min_length=10)

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
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)
        UserProfile.objects.get_or_create(user=user)
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

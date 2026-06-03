import re
import json
import base64
import hashlib
import hmac
import time

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.files.storage import default_storage
from django.db.models import Q
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import (
    AdminProfile,
    BuyerAddress,
    BuyerProfile,
    ChatMessage,
    ChatThread,
    HelpArticle,
    KycDocument,
    Notification,
    SellerProfile,
    Subscription,
    User,
    UserProfile,
    UserSettings,
    get_admin_platform_password_policy,
)


def validate_password_for_platform(password: str) -> str:
    value = str(password or "")
    policy = (get_admin_platform_password_policy() or "").strip() or "strong_10_chars"

    if policy == "strong_12_chars":
        min_len = 12
        require_upper = True
        require_lower = True
        require_number = True
        require_special = True
    elif policy == "standard_8_chars":
        min_len = 8
        require_upper = False
        require_lower = False
        require_number = True
        require_special = False
    else:
        min_len = 10
        require_upper = True
        require_lower = True
        require_number = True
        require_special = True

    checks = [(len(value) >= min_len, f"Password must be at least {min_len} characters.")]
    if require_upper:
        checks.append((re.search(r"[A-Z]", value) is not None, "Password must include an uppercase letter."))
    if require_lower:
        checks.append((re.search(r"[a-z]", value) is not None, "Password must include a lowercase letter."))
    if require_number:
        checks.append((re.search(r"[0-9]", value) is not None, "Password must include a number."))
    if require_special:
        checks.append((re.search(r"[^A-Za-z0-9]", value) is not None, "Password must include a special character."))

    for ok, message in checks:
        if not ok:
            raise serializers.ValidationError(message)

    try:
        validate_password(value)
    except DjangoValidationError as e:
        raise serializers.ValidationError(list(e.messages))

    return value

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            "country",
            "province",
            "city",
            "street",
            "address",
            "language_preference",
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
    admin_profile = serializers.SerializerMethodField()
    admin_portals = serializers.SerializerMethodField()

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
            "admin_profile",
            "admin_portals",
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

    def get_admin_profile(self, obj: User):
        if getattr(obj, "role", None) != User.Role.ADMIN and not getattr(obj, "is_staff", False) and not getattr(obj, "is_superuser", False):
            return None
        prof = getattr(obj, "admin_profile", None)
        return AdminProfileSerializer(prof).data if prof else None

    def get_admin_portals(self, obj: User):
        is_admin = bool(
            getattr(obj, "role", None) == User.Role.ADMIN or getattr(obj, "is_staff", False) or getattr(obj, "is_superuser", False)
        )
        if not is_admin:
            return []

        prof = getattr(obj, "admin_profile", None)
        admin_role = (getattr(prof, "admin_role", "") or "").lower() if prof else ""
        if getattr(obj, "is_superuser", False) or admin_role in {"", "super_admin"}:
            return ["admin", "management", "workers", "legal", "support", "inspector"]
        if admin_role in {"logistics", "finance"}:
            return ["management", "workers"]
        if admin_role in {"compliance"}:
            return ["legal", "workers"]
        if admin_role in {"support"}:
            return ["support", "workers"]
        if admin_role in {"inspector"}:
            return ["inspector", "workers"]
        return ["workers"]


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
            "warehouse_location",
            "vehsl_rating",
            "sample_low_threshold",
        ]


class BuyerAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = BuyerAddress
        fields = [
            "id",
            "kind",
            "contact_name",
            "phone",
            "country",
            "region",
            "city",
            "street1",
            "street2",
            "postal_code",
            "created_at",
            "updated_at",
        ]


class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = ["display", "notifications", "order_settings", "security", "business", "updated_at"]


class AdminProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminProfile
        fields = ["admin_role", "department"]


class AdminProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminProfile
        fields = ["admin_role", "department"]
        read_only_fields = ["admin_role"]


class MeUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    country = serializers.CharField(required=False, allow_blank=True)
    province = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, allow_blank=True)
    street = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    language_preference = serializers.ChoiceField(choices=["en", "zh"], required=False)
    nationality = serializers.CharField(required=False, allow_blank=True)
    gender = serializers.CharField(required=False, allow_blank=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)

    def validate_phone(self, value):
        value = (value or "").strip()
        if value == "":
            return ""
        value = re.sub(r"\s+", "", value)
        if not re.match(r"^\+?[1-9]\d{7,14}$", value):
            raise serializers.ValidationError("Phone must be a valid E.164 number.")

        user = self.context.get("user")
        if user and User.objects.exclude(id=user.id).filter(phone=value).exists():
            raise serializers.ValidationError("Phone is already in use.")
        return value


class AdminUserListSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    last_active_at = serializers.DateTimeField(source="last_login", read_only=True)
    orders_count = serializers.IntegerField(read_only=True)
    admin_status = serializers.SerializerMethodField()
    admin_role = serializers.SerializerMethodField()

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
            "status",
            "display_name",
            "avatar",
            "last_active_at",
            "orders_count",
            "admin_status",
            "admin_role",
        ]

    def get_display_name(self, obj: User):
        full = f"{(obj.first_name or '').strip()} {(obj.last_name or '').strip()}".strip()
        return full or (obj.email or obj.phone or f"user:{obj.pk}")

    def get_avatar(self, obj: User):
        first = (obj.first_name or "").strip()
        last = (obj.last_name or "").strip()
        if first and last:
            return (first[0] + last[0]).upper()
        base = ((obj.email or obj.phone) or "U").strip()
        return (base[0] or "U").upper()

    def get_admin_status(self, obj: User):
        if (obj.status or "").lower() == "suspended":
            return "suspended"
        seller_prof = getattr(obj, "seller_profile", None)
        ver = getattr(seller_prof, "verification_status", "") if seller_prof else ""
        if ver == "pending":
            return "pending"
        if ver == "rejected":
            return "review"
        return "active"

    def get_admin_role(self, obj: User):
        prof = getattr(obj, "admin_profile", None)
        return getattr(prof, "admin_role", None) if prof else None


class AdminUserWriteSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False, allow_null=True, allow_blank=True)
    phone = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=User.Role.choices, required=True)
    account_type = serializers.ChoiceField(choices=User.AccountType.choices, required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=User.Status.choices, required=False)
    password = serializers.CharField(required=False, allow_blank=True, write_only=True)
    admin_role = serializers.ChoiceField(choices=AdminProfile.AdminRole.choices, required=False, allow_blank=True)
    department = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        email = (attrs.get("email") or "").strip()
        phone = (attrs.get("phone") or "").strip()
        if not email and not phone:
            if getattr(self, "partial", False):
                if "email" in attrs or "phone" in attrs:
                    raise serializers.ValidationError({"email": "Email or phone is required."})
            else:
                raise serializers.ValidationError({"email": "Email or phone is required."})

        role = attrs.get("role")
        account_type = (attrs.get("account_type") or "").strip()
        if role == User.Role.BUYER:
            attrs["account_type"] = User.AccountType.BUYER
        elif role == User.Role.SELLER:
            attrs["account_type"] = User.AccountType.SELLER
        elif role in {User.Role.ADMIN, User.Role.PARTNER}:
            attrs["account_type"] = account_type

        admin_role = (attrs.get("admin_role") or "").strip()
        if role != User.Role.ADMIN:
            attrs.pop("admin_role", None)
            attrs.pop("department", None)
        else:
            if admin_role == "":
                attrs.pop("admin_role", None)

        return attrs


class AdminKycDocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    uploaded_at = serializers.DateTimeField(read_only=True)
    reviewed_at = serializers.DateTimeField(read_only=True)
    expires_at = serializers.DateField(allow_null=True, read_only=True)
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = KycDocument
        fields = [
            "id",
            "kind",
            "doc_type",
            "original_name",
            "size_bytes",
            "uploaded_at",
            "review_status",
            "reviewed_at",
            "reviewed_by_name",
            "rejection_reason",
            "expires_at",
            "file_url",
        ]

    def get_file_url(self, obj: KycDocument):
        try:
            name = getattr(obj.file, "name", "") or ""
            if not name or not default_storage.exists(name):
                return ""
            url = obj.file.url
        except Exception:
            return ""
        req = self.context.get("request")
        return req.build_absolute_uri(url) if req else url

    def get_reviewed_by_name(self, obj: KycDocument):
        u = getattr(obj, "reviewed_by", None)
        if not u:
            return ""
        full = f"{(u.first_name or '').strip()} {(u.last_name or '').strip()}".strip()
        return full or u.email or u.phone or ""


class KycDocumentSelfSerializer(AdminKycDocumentSerializer):
    class Meta(AdminKycDocumentSerializer.Meta):
        model = KycDocument
        fields = AdminKycDocumentSerializer.Meta.fields


class KycDocumentUploadSerializer(serializers.Serializer):
    kind = serializers.ChoiceField(
        choices=[
            KycDocument.Kind.PASSPORT,
            KycDocument.Kind.DRIVING_LICENSE,
            KycDocument.Kind.ID_CARD,
            KycDocument.Kind.BANK_STATEMENT,
            KycDocument.Kind.UTILITY_BILL,
            KycDocument.Kind.BUSINESS_LICENSE,
            KycDocument.Kind.BUSINESS_REGISTRATION,
            KycDocument.Kind.ISO_9001,
            KycDocument.Kind.GMP,
            KycDocument.Kind.EXPORT_LICENSE,
            KycDocument.Kind.PRODUCT_SAFETY,
        ]
    )
    doc_type = serializers.CharField(required=False, allow_blank=True)
    expires_at = serializers.DateField(required=False, allow_null=True)
    file = serializers.FileField()

    def validate(self, attrs):
        user = self.context.get("user")
        if not user or not getattr(user, "is_authenticated", False):
            raise serializers.ValidationError("Authentication required.")
        return attrs


class AdminVerificationUserSerializer(serializers.ModelSerializer):
    type = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    companyName = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    overallStatus = serializers.SerializerMethodField()
    kycLevel = serializers.SerializerMethodField()
    documents = serializers.SerializerMethodField()
    biometrics = serializers.SerializerMethodField()
    joinedAt = serializers.DateTimeField(source="date_joined", read_only=True)
    lastActiveAt = serializers.DateTimeField(source="last_login", allow_null=True, read_only=True)
    trustScore = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "type",
            "name",
            "avatar",
            "companyName",
            "location",
            "email",
            "phone",
            "overallStatus",
            "kycLevel",
            "documents",
            "biometrics",
            "joinedAt",
            "lastActiveAt",
            "trustScore",
        ]

    def _full_name(self, u: User):
        return f"{(u.first_name or '').strip()} {(u.last_name or '').strip()}".strip()

    def _valid_kyc_docs(self, obj: User):
        docs = list(getattr(obj, "kyc_documents", []).all()) if hasattr(obj, "kyc_documents") else []
        out = []
        for doc in docs:
            try:
                name = getattr(doc.file, "name", "") or ""
                if name and default_storage.exists(name):
                    out.append(doc)
            except Exception:
                continue
        return out

    def get_type(self, obj: User):
        role = (getattr(obj, "account_type", "") or getattr(obj, "role", "") or "").lower()
        return "seller" if role == "seller" else "buyer"

    def get_name(self, obj: User):
        return self._full_name(obj) or obj.email or obj.phone or f"user:{obj.pk}"

    def get_avatar(self, obj: User):
        full = self._full_name(obj)
        if full:
            parts = [p for p in full.split() if p]
            letters = "".join(p[0] for p in parts[:2]).upper()
            return letters or "U"
        base = (obj.email or obj.phone or "U").strip()
        return (base[:2] or "U").upper()

    def get_companyName(self, obj: User):
        seller = getattr(obj, "seller_profile", None)
        return getattr(seller, "business_name", "") if seller else ""

    def get_location(self, obj: User):
        prof = getattr(obj, "profile", None)
        parts = []
        for f in ["city", "province", "country"]:
            v = (getattr(prof, f, "") or "").strip()
            if v:
                parts.append(v)
        return ", ".join(parts) if parts else "—"

    def get_documents(self, obj: User):
        docs = self._valid_kyc_docs(obj)
        out = []
        for d in docs:
            kind = (d.kind or "").lower()

            def _title(s: str) -> str:
                s = (s or "").replace("_", " ").replace("-", " ").strip()
                return " ".join((w[:1].upper() + w[1:]) if w else "" for w in s.split())

            if kind in {"passport"}:
                dtype = "passport"
                label = "Passport"
            elif kind in {"driving_license"}:
                dtype = "driving_license"
                label = "Driving License"
            elif kind in {"id_card"}:
                dtype = "id_card"
                label = "ID Card"
            elif kind in {"bank_statement"}:
                dtype = "bank_statement"
                label = "Bank Statement"
            elif kind in {"utility_bill"}:
                dtype = "utility_bill"
                label = "Utility Bill"
            elif kind in {"business_license"}:
                dtype = "business_license"
                label = "Business License"
            elif kind in {"business_registration"}:
                dtype = "business_registration"
                label = "Business Registration"
            else:
                dtype = "id_card"
                label = "Document"

            out.append(
                {
                    "id": str(d.id),
                    "type": dtype,
                    "label": label,
                    "status": d.review_status,
                    "originalName": d.original_name,
                    "contentType": d.content_type,
                    "uploadedAt": d.uploaded_at,
                    "verifiedAt": d.reviewed_at,
                    "expiresAt": d.expires_at,
                    "verifiedBy": self.context.get("request") and AdminKycDocumentSerializer(d, context=self.context).data.get("reviewed_by_name") or "",
                    "rejectionReason": d.rejection_reason,
                    "imageUrl": AdminKycDocumentSerializer(d, context=self.context).data.get("file_url") or "",
                }
            )
        return out

    def get_overallStatus(self, obj: User):
        docs = self._valid_kyc_docs(obj)
        seller = getattr(obj, "seller_profile", None)
        seller_status = (getattr(seller, "verification_status", "") or "").lower() if seller else ""
        if seller_status == SellerProfile.VerificationStatus.APPROVED and docs and all(
            d.review_status == KycDocument.ReviewStatus.VERIFIED for d in docs
        ):
            return "verified"
        if seller_status == SellerProfile.VerificationStatus.REJECTED:
            return "rejected"
        if seller_status == SellerProfile.VerificationStatus.PENDING:
            return "pending"
        if any(d.review_status == KycDocument.ReviewStatus.REJECTED for d in docs):
            return "rejected"
        if any(d.review_status == KycDocument.ReviewStatus.UNDER_REVIEW for d in docs):
            return "under_review"
        if any(d.review_status == KycDocument.ReviewStatus.PENDING for d in docs):
            return "pending"
        if docs and all(d.review_status == KycDocument.ReviewStatus.VERIFIED for d in docs):
            return "verified"
        return "pending"

    def get_kycLevel(self, obj: User):
        docs = self._valid_kyc_docs(obj)
        verified = sum(1 for d in docs if d.review_status == KycDocument.ReviewStatus.VERIFIED)
        if verified >= 3:
            return 3
        if verified >= 2:
            return 2
        if verified >= 1:
            return 1
        return 1 if docs else 0

    def get_biometrics(self, obj: User):
        # enabled = bool(getattr(obj, "two_factor_enabled", False))
        # status = "verified" if enabled else "pending"
        # return [{"type": "fingerprint", "status": status}, {"type": "face_id", "status": "pending"}]
        return []

    def get_trustScore(self, obj: User):
        base = 50
        level = self.get_kycLevel(obj)
        base += level * 10
        status = self.get_overallStatus(obj)
        if status == "verified":
            base += 20
        elif status == "under_review":
            base -= 5
        elif status == "rejected":
            base -= 20
        return max(0, min(100, int(base)))

class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = ["id", "plan", "status", "trial_ends_at", "current_period_end", "created_at", "updated_at"]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "channel", "event_type", "payload", "status", "sent_at", "created_at"]


class HelpArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = HelpArticle
        fields = ["id", "category", "title", "description", "body", "steps", "tip"]


class ChatThreadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatThread
        fields = ["id", "type", "participants", "created_at", "updated_at"]


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(read_only=True)
    sender_name = serializers.SerializerMethodField()
    deleted_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = ChatMessage
        fields = ["id", "thread", "sender_id", "sender_name", "content", "attachments", "sent_at", "read_by", "deleted_at"]

    def get_sender_name(self, obj: ChatMessage):
        sender = getattr(obj, "sender", None)
        if not sender:
            return ""
        full = f"{(sender.first_name or '').strip()} {(sender.last_name or '').strip()}".strip()
        return full or (sender.email or "") or (sender.phone or "")


class ChatThreadListSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    other_participants = serializers.SerializerMethodField()

    class Meta:
        model = ChatThread
        fields = ["id", "type", "participants", "created_at", "updated_at", "last_message", "unread_count", "other_participants"]

    def _uid(self):
        req = self.context.get("request")
        u = getattr(req, "user", None) if req else None
        return getattr(u, "id", None)

    def get_last_message(self, obj: ChatThread):
        msg = getattr(obj, "_last_message_obj", None)
        if msg is None:
            try:
                msg = obj.messages.filter(deleted_at__isnull=True).select_related("sender").order_by("-sent_at").first()
            except Exception:
                msg = None
        if not msg:
            return None
        return ChatMessageSerializer(msg, context=self.context).data

    def get_unread_count(self, obj: ChatThread):
        uid = self._uid()
        try:
            return int(getattr(obj, "_unread_count", None) or 0)
        except Exception:
            pass
        if not uid:
            return 0
        try:
            return (
                obj.messages.filter(deleted_at__isnull=True)
                .exclude(sender_id=uid)
                .exclude(read_by__contains=[uid])
                .count()
            )
        except Exception:
            return 0

    def get_other_participants(self, obj: ChatThread):
        uid = self._uid()
        ids = [int(x) for x in (obj.participants or []) if isinstance(x, int) or (isinstance(x, str) and str(x).isdigit())]
        if uid:
            ids = [i for i in ids if i != uid]
        from .models import User

        users = list(User.objects.filter(id__in=ids).only("id", "first_name", "last_name", "email", "phone", "role", "account_type"))
        out = []
        for u in users:
            full = f"{(u.first_name or '').strip()} {(u.last_name or '').strip()}".strip()
            out.append(
                {
                    "id": u.id,
                    "name": full or (u.email or "") or (u.phone or ""),
                    "role": getattr(u, "role", None),
                    "account_type": getattr(u, "account_type", None),
                    "email": u.email,
                    "phone": u.phone,
                }
            )
        return out



class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False, allow_null=True, allow_blank=True)
    phone = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    account_type = serializers.ChoiceField(choices=User.AccountType.choices, required=True)
    password = serializers.CharField(write_only=True, min_length=8)

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

    # New field aliases (preferred names)
    passport = serializers.FileField(required=False, allow_null=True)
    driving_license = serializers.FileField(required=False, allow_null=True)
    id_card = serializers.FileField(required=False, allow_null=True)
    bank_statement = serializers.FileField(required=False, allow_null=True)
    business_license = serializers.FileField(required=False, allow_null=True)
    business_registration = serializers.FileField(required=False, allow_null=True)
    utility_bill = serializers.FileField(required=False, allow_null=True)

    def validate_phone(self, value):
        value = (value or "").strip()
        if not value:
            return value
        value = re.sub(r"\s+", "", value)
        if not re.match(r"^\+?[1-9]\d{7,14}$", value):
            raise serializers.ValidationError("Phone must be a valid E.164 number.")
        return value

    def validate_password(self, value):
        return validate_password_for_platform(value)

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

        passport_file = validated_data.pop("passport", None)
        driving_license_file = validated_data.pop("driving_license", None)
        id_card_file = validated_data.pop("id_card", None)
        bank_statement_file = validated_data.pop("bank_statement", None)
        business_license_file = validated_data.pop("business_license", None)
        business_registration_file = validated_data.pop("business_registration", None)
        utility_bill_file = validated_data.pop("utility_bill", None)

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
            (KycDocument.Kind.PASSPORT, passport_file, "passport"),
            (KycDocument.Kind.DRIVING_LICENSE, driving_license_file, "driving_license"),
            (KycDocument.Kind.ID_CARD, id_card_file, "id_card"),
            (KycDocument.Kind.BANK_STATEMENT, bank_statement_file, "bank_statement"),
            (KycDocument.Kind.UTILITY_BILL, utility_bill_file, "utility_bill"),
            (KycDocument.Kind.BUSINESS_LICENSE, business_license_file, "business_license"),
            (KycDocument.Kind.BUSINESS_REGISTRATION, business_registration_file, "business_registration"),
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
        self.fields["otp"] = serializers.CharField(required=False, allow_blank=True)
        if "username" in self.fields:
            self.fields.pop("username")

    def validate(self, attrs):
        identifier = (attrs.get("identifier") or "").strip()
        password = attrs.get("password")
        otp = (attrs.get("otp") or "").strip()

        user = (
            User.objects.filter(Q(email__iexact=identifier) | Q(phone=identifier)).first()
            if identifier
            else None
        )
        if not user:
            raise serializers.ValidationError({"detail": "Invalid credentials."})

        if not user.check_password(password):
            raise serializers.ValidationError({"detail": "Invalid credentials."})

        if not user.is_active:
            raise serializers.ValidationError("User is inactive.")

        if bool(getattr(user, "two_factor_enabled", False)):
            settings = getattr(user, "settings", None)
            if settings is None:
                settings, _ = UserSettings.objects.get_or_create(user=user)
            sec = settings.security or {}
            secret = (sec.get("totp_secret") or "").strip()
            enabled = bool(sec.get("totp_enabled"))
            if not secret or not enabled:
                raise serializers.ValidationError({"detail": "Two-factor setup incomplete.", "otp_required": True})
            if not otp:
                raise serializers.ValidationError({"detail": "OTP required.", "otp_required": True})

            def _totp_now(base32_secret: str, for_counter: int, digits: int = 6) -> str:
                key = base64.b32decode(base32_secret.upper().encode("utf-8") + b"=" * ((8 - len(base32_secret) % 8) % 8))
                msg = for_counter.to_bytes(8, "big")
                digest = hmac.new(key, msg, hashlib.sha1).digest()
                offset = digest[-1] & 0x0F
                code_int = int.from_bytes(digest[offset : offset + 4], "big") & 0x7FFFFFFF
                return str(code_int % (10**digits)).zfill(digits)

            counter = int(time.time() // 30)
            ok = False
            for w in (-1, 0, 1):
                if _totp_now(secret, counter + w) == otp:
                    ok = True
                    break
            if not ok:
                raise serializers.ValidationError({"detail": "Invalid OTP.", "otp_required": True})

        refresh = self.get_token(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": UserSerializer(user).data,
        }

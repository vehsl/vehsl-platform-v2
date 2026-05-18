import re

from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.core.validators import RegexValidator
from django.db import models
from django.utils import timezone
from uuid import uuid4


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, password: str | None, **extra_fields):
        email = extra_fields.get("email")
        phone = extra_fields.get("phone")
        if not email and not phone:
            raise ValueError("User must have either email or phone.")

        if email:
            extra_fields["email"] = self.normalize_email(email)

        user = self.model(**extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.full_clean()
        user.save(using=self._db)
        return user

    def create_user(self, email: str | None = None, phone: str | None = None, password: str | None = None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        extra_fields.setdefault("is_active", True)
        extra_fields["email"] = email
        extra_fields["phone"] = phone
        return self._create_user(password=password, **extra_fields)

    def create_superuser(self, email: str, password: str, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields["email"] = email
        return self._create_user(password=password, **extra_fields)


phone_validator = RegexValidator(regex=r"^\+?[1-9]\d{7,14}$", message="Phone must be a valid E.164 number.")


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        BUYER = "buyer", "Buyer"
        SELLER = "seller", "Seller"
        ADMIN = "admin", "Admin"
        PARTNER = "partner", "Partner"

    class AccountType(models.TextChoices):
        BUYER = "buyer", "Buyer"
        SELLER = "seller", "Seller"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        SUSPENDED = "suspended", "Suspended"
        DELETED = "deleted", "Deleted"

    email = models.EmailField(unique=True, null=True, blank=True)
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True, validators=[phone_validator])

    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)

    role = models.CharField(max_length=16, choices=Role.choices, default=Role.BUYER)
    account_type = models.CharField(max_length=16, choices=AccountType.choices, blank=True)

    two_factor_enabled = models.BooleanField(default=False)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []

    def clean(self):
        super().clean()
        if not self.email and not self.phone:
            raise models.ValidationError({"email": "Email or phone is required."})
        if self.email:
            self.email = self.__class__.objects.normalize_email(self.email)
        if self.phone:
            self.phone = re.sub(r"\s+", "", self.phone)

    def __str__(self):
        return self.email or self.phone or f"user:{self.pk}"


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")

    country = models.CharField(max_length=64, blank=True)
    province = models.CharField(max_length=64, blank=True)
    city = models.CharField(max_length=64, blank=True)
    street = models.CharField(max_length=128, blank=True)
    address = models.CharField(max_length=256, blank=True)

    nationality = models.CharField(max_length=64, blank=True)
    gender = models.CharField(max_length=32, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)

    employment_statuses = models.JSONField(default=list, blank=True)
    work_details = models.JSONField(default=dict, blank=True)
    bank_details = models.JSONField(default=dict, blank=True)
    pep_status = models.BooleanField(null=True, blank=True)
    kyc_folder_uuid = models.UUIDField(default=uuid4, editable=False, unique=True)

    def __str__(self):
        return f"profile:{self.user_id}"


def _safe_user_segment(user: User) -> str:
    email = (user.email or "").strip()
    if email and "@" in email:
        local = email.split("@", 1)[0]
        parts = re.findall(r"[A-Za-z0-9]+", local)
        initials = "".join((p[0] for p in parts[:3] if p)).lower()
        if len(initials) < 2 and parts and len(parts[0]) >= 2:
            initials = parts[0][:2].lower()
        return initials or "u"

    phone = re.sub(r"\D+", "", user.phone or "")
    if phone:
        return f"p{phone[-4:]}" if len(phone) >= 4 else f"p{phone}"

    return f"u{user.pk or 0}"


def _kyc_upload_to(instance: "KycDocument", filename: str) -> str:
    base_name = re.sub(r"[\\/]+", "_", filename).strip()
    base_name = re.sub(r"[^a-zA-Z0-9._-]+", "_", base_name).strip("_") or "document"
    profile = getattr(instance.user, "profile", None)
    bucket = getattr(profile, "kyc_folder_uuid", None) or instance.id
    folder = f"{_safe_user_segment(instance.user)}_{bucket}"
    return f"kyc/{folder}/{base_name}"


class KycDocument(models.Model):
    class Kind(models.TextChoices):
        PASSPORT = "passport", "Passport"
        DRIVING_LICENSE = "driving_license", "Driving License"
        ID_CARD = "id_card", "ID Card"
        BANK_STATEMENT = "bank_statement", "Bank Statement"
        BUSINESS_LICENSE = "business_license", "Business License"
        BUSINESS_REGISTRATION = "business_registration", "Business Registration"
        UTILITY_BILL = "utility_bill", "Utility Bill"

        # Legacy values (kept for backward compatibility)
        ID_DOC_1 = "id_doc_1", "ID Document 1"
        ID_DOC_2 = "id_doc_2", "ID Document 2"
        PROOF_OF_ADDRESS = "proof_of_address", "Proof of Address"
        BUSINESS_DOC_1 = "business_doc_1", "Business Document 1"
        BUSINESS_DOC_2 = "business_doc_2", "Business Document 2"

    class ReviewStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        UNDER_REVIEW = "under_review", "Under Review"
        VERIFIED = "verified", "Verified"
        REJECTED = "rejected", "Rejected"
        EXPIRED = "expired", "Expired"

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="kyc_documents")
    kind = models.CharField(max_length=32, choices=Kind.choices)
    doc_type = models.CharField(max_length=64, blank=True)
    file = models.FileField(upload_to=_kyc_upload_to)
    original_name = models.CharField(max_length=255, blank=True)
    content_type = models.CharField(max_length=128, blank=True)
    size_bytes = models.PositiveIntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    review_status = models.CharField(max_length=24, choices=ReviewStatus.choices, default=ReviewStatus.PENDING)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="kyc_documents_reviewed"
    )
    rejection_reason = models.CharField(max_length=255, blank=True)
    expires_at = models.DateField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "kind", "uploaded_at"]),
        ]

    def __str__(self):
        return f"kyc:{self.user_id}:{self.kind}:{self.id}"


class BuyerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="buyer_profile")
    name = models.CharField(max_length=255, blank=True)
    business_type = models.CharField(max_length=64, blank=True)
    default_location = models.JSONField(default=dict, blank=True)
    currency_preference = models.CharField(max_length=3, blank=True)
    language_preference = models.CharField(max_length=16, blank=True)

    def __str__(self):
        return f"buyer_profile:{self.user_id}"


class SellerProfile(models.Model):
    class VerificationStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="seller_profile")
    business_name = models.CharField(max_length=255, blank=True)
    business_license_url = models.URLField(blank=True)
    tax_id = models.CharField(max_length=64, blank=True)
    verification_status = models.CharField(max_length=16, choices=VerificationStatus.choices, default=VerificationStatus.PENDING)
    country = models.CharField(max_length=64, blank=True)
    region = models.CharField(max_length=64, blank=True)
    vehsl_rating = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    sample_low_threshold = models.PositiveIntegerField(default=0)

    class Meta:
        indexes = [
            models.Index(fields=["verification_status"]),
        ]
        constraints = [
            models.UniqueConstraint(fields=["tax_id"], condition=~models.Q(tax_id=""), name="uniq_seller_tax_id_nonempty"),
        ]

    def __str__(self):
        return f"seller_profile:{self.user_id}"


class UserSettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="settings")
    display = models.JSONField(default=dict, blank=True)
    notifications = models.JSONField(default=dict, blank=True)
    order_settings = models.JSONField(default=dict, blank=True)
    security = models.JSONField(default=dict, blank=True)
    business = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"settings:{self.user_id}"


class AdminProfile(models.Model):
    class AdminRole(models.TextChoices):
        SUPER_ADMIN = "super_admin", "Super Admin"
        COMPLIANCE = "compliance", "Compliance"
        FINANCE = "finance", "Finance"
        SUPPORT = "support", "Support"
        LOGISTICS = "logistics", "Logistics"
        INSPECTOR = "inspector", "Inspector"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="admin_profile")
    admin_role = models.CharField(max_length=32, choices=AdminRole.choices)
    department = models.CharField(max_length=64, blank=True)

    def __str__(self):
        return f"admin_profile:{self.user_id}"


class Subscription(models.Model):
    class Plan(models.TextChoices):
        FREE = "free", "Free"
        PRO = "pro", "Pro"
        ENTERPRISE = "enterprise", "Enterprise"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        PAST_DUE = "past_due", "Past Due"
        CANCELED = "canceled", "Canceled"
        TRIALING = "trialing", "Trialing"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="subscriptions")
    plan = models.CharField(max_length=16, choices=Plan.choices, default=Plan.FREE)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)
    trial_ends_at = models.DateTimeField(null=True, blank=True)
    current_period_end = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "status"]),
        ]

    def __str__(self):
        return f"subscription:{self.pk}"


class Notification(models.Model):
    class Channel(models.TextChoices):
        IN_APP = "in_app", "In App"
        EMAIL = "email", "Email"
        SMS = "sms", "SMS"
        PUSH = "push", "Push"

    class Status(models.TextChoices):
        QUEUED = "queued", "Queued"
        SENT = "sent", "Sent"
        FAILED = "failed", "Failed"
        READ = "read", "Read"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    channel = models.CharField(max_length=16, choices=Channel.choices)
    event_type = models.CharField(max_length=64)
    payload = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.QUEUED)
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "status", "created_at"]),
        ]

    def __str__(self):
        return f"notification:{self.pk}"


class AdminUiNotificationState(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="admin_ui_notification_states")
    key = models.CharField(max_length=64)
    seen_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "key"]),
            models.Index(fields=["user", "seen_at"]),
        ]
        constraints = [
            models.UniqueConstraint(fields=["user", "key"], name="uniq_admin_ui_notification_state_user_key"),
        ]

    def __str__(self):
        return f"admin_ui_notif_state:{self.user_id}:{self.key}"


class AdminPlatformSettings(models.Model):
    key = models.CharField(max_length=32, unique=True, default="global")
    general = models.JSONField(default=dict, blank=True)
    notifications = models.JSONField(default=dict, blank=True)
    security = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="admin_platform_settings_updated",
    )

    def __str__(self):
        return f"admin_platform_settings:{self.key}"


class AuditLog(models.Model):
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="audit_logs")
    actor_role = models.CharField(max_length=32, blank=True)
    action = models.CharField(max_length=64)
    target_type = models.CharField(max_length=64)
    target_id = models.CharField(max_length=64, blank=True)
    payload = models.JSONField(default=dict, blank=True)
    occurred_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["occurred_at"]),
            models.Index(fields=["actor", "occurred_at"]),
            models.Index(fields=["target_type", "target_id"]),
        ]

    def __str__(self):
        return f"audit:{self.pk}"


class ChatThread(models.Model):
    class ThreadType(models.TextChoices):
        BUYER_SELLER = "buyer_seller", "Buyer/Seller"
        BUYER_VEHSL = "buyer_vehsl", "Buyer/Vehsl"
        SELLER_VEHSL = "seller_vehsl", "Seller/Vehsl"

    type = models.CharField(max_length=24, choices=ThreadType.choices)
    participants = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["type"]),
        ]

    def __str__(self):
        return f"thread:{self.pk}"


class ChatMessage(models.Model):
    thread = models.ForeignKey(ChatThread, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.PROTECT, related_name="chat_messages")
    content = models.TextField(blank=True)
    attachments = models.JSONField(default=list, blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)
    read_by = models.JSONField(default=list, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["thread", "sent_at"]),
        ]

    def __str__(self):
        return f"message:{self.pk}"

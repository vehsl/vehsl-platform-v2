import re

from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.core.validators import RegexValidator
from django.db import models
from django.utils import timezone


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
    class AccountType(models.TextChoices):
        BUYER = "buyer", "Buyer"
        SELLER = "seller", "Seller"

    email = models.EmailField(unique=True, null=True, blank=True)
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True, validators=[phone_validator])

    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)

    account_type = models.CharField(max_length=16, choices=AccountType.choices, blank=True)

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

    def __str__(self):
        return f"profile:{self.user_id}"

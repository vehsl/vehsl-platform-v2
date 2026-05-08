from rest_framework.permissions import BasePermission


class IsBuyer(BasePermission):
    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        return bool(user and user.is_authenticated and (getattr(user, "account_type", None) == "buyer" or getattr(user, "role", None) == "buyer"))


class IsSeller(BasePermission):
    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        return bool(user and user.is_authenticated and (getattr(user, "account_type", None) == "seller" or getattr(user, "role", None) == "seller"))


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        return bool(getattr(user, "is_staff", False) or getattr(user, "is_superuser", False) or getattr(user, "role", None) == "admin")

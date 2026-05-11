from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminUserViewSet,
    BuyerProfileMeView,
    ChatThreadViewSet,
    LoginView,
    LogoutView,
    AdminProfileMeView,
    MeView,
    NotificationViewSet,
    RefreshView,
    RegisterView,
    SellerProfileMeView,
    SubscriptionViewSet,
)

router = DefaultRouter()
router.register(r"admin/users", AdminUserViewSet, basename="admin-user")
router.register(r"chat/threads", ChatThreadViewSet, basename="chat-thread")
router.register(r"notifications", NotificationViewSet, basename="notification")
router.register(r"subscriptions", SubscriptionViewSet, basename="subscription")

urlpatterns = [
    path("auth/register", RegisterView.as_view()),
    path("auth/login", LoginView.as_view()),
    path("auth/logout", LogoutView.as_view()),
    path("auth/refresh", RefreshView.as_view()),
    path("auth/me", MeView.as_view()),
    path("profiles/admin/me", AdminProfileMeView.as_view()),
    path("profiles/buyer/me", BuyerProfileMeView.as_view()),
    path("profiles/seller/me", SellerProfileMeView.as_view()),
    path("", include(router.urls)),
]

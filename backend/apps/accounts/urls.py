from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminKycDocumentViewSet,
    AdminPlatformOverviewView,
    AdminPlatformSettingsView,
    AdminUserViewSet,
    AdminVerificationUserViewSet,
    BuyerProfileMeView,
    ChatThreadViewSet,
    KycDocumentsMeView,
    KycRequirementsView,
    LoginView,
    LogoutView,
    AdminProfileMeView,
    AdminUiNotificationsMarkAllReadView,
    AdminUiNotificationsMarkReadView,
    AdminUiNotificationsView,
    MeView,
    NotificationViewSet,
    RefreshView,
    RegisterView,
    SellerProfileMeView,
    SubscriptionViewSet,
)

router = DefaultRouter()
router.register(r"admin/users", AdminUserViewSet, basename="admin-user")
router.register(r"admin/verification/users", AdminVerificationUserViewSet, basename="admin-verification-user")
router.register(r"admin/verification/kyc-documents", AdminKycDocumentViewSet, basename="admin-kyc-document")
router.register(r"chat/threads", ChatThreadViewSet, basename="chat-thread")
router.register(r"notifications", NotificationViewSet, basename="notification")
router.register(r"subscriptions", SubscriptionViewSet, basename="subscription")

urlpatterns = [
    path("auth/register", RegisterView.as_view()),
    path("auth/login", LoginView.as_view()),
    path("auth/logout", LogoutView.as_view()),
    path("auth/refresh", RefreshView.as_view()),
    path("auth/me", MeView.as_view()),
    path("kyc/requirements", KycRequirementsView.as_view()),
    path("kyc/documents", KycDocumentsMeView.as_view()),
    path("profiles/admin/me", AdminProfileMeView.as_view()),
    path("profiles/buyer/me", BuyerProfileMeView.as_view()),
    path("profiles/seller/me", SellerProfileMeView.as_view()),
    path("admin/overview", AdminPlatformOverviewView.as_view()),
    path("admin/settings", AdminPlatformSettingsView.as_view()),
    path("admin/ui/notifications", AdminUiNotificationsView.as_view()),
    path("admin/ui/notifications/mark-all-read", AdminUiNotificationsMarkAllReadView.as_view()),
    path("admin/ui/notifications/<str:key>/mark-read", AdminUiNotificationsMarkReadView.as_view()),
    path("", include(router.urls)),
]

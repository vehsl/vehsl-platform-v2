from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminKycDocumentViewSet,
    AdminIntegrationTestView,
    AdminNotificationTestView,
    AdminCommandCenterView,
    AdminSellerTrendsKeywordsView,
    AdminSellerTrendsProductsView,
    AdminSellerTrendsReelsView,
    AdminSellerTrendsSellersView,
    AdminSellerTrendsSummaryView,
    AdminPlatformOverviewView,
    AdminPlatformSettingsView,
    AdminUserViewSet,
    AdminVerificationUserViewSet,
    BuyerProfileMeView,
    ChatMessageViewSet,
    ChatThreadViewSet,
    KycDocumentsMeView,
    KycDocumentMeDetailView,
    KycRequirementsView,
    HelpArticleViewSet,
    LoginView,
    LogoutView,
    PasswordResetConfirmView,
    AdminProfileMeView,
    AdminUiNotificationsMarkAllReadView,
    AdminUiNotificationsMarkReadView,
    AdminUiNotificationsView,
    BuyerAddressViewSet,
    MeView,
    MeMenuView,
    MeSwitchAccountTypeView,
    NotificationViewSet,
    RefreshView,
    RegisterView,
    SellerProfileMeView,
    SellerDashboardViewSet,
    WarehouseDashboardViewSet,
    UserSettingsMeView,
    SubscriptionViewSet,
    RecoveryCodesMeView,
    TotpSetupMeView,
    TotpEnableMeView,
    TotpDisableMeView,
    DeactivateMeView,
    EmailVerificationRequestView,
    EmailVerificationVerifyView,
    MarketingPromisesView,
    MarketingAssetUploadView,
)

router = DefaultRouter()
router.register(r"admin/users", AdminUserViewSet, basename="admin-user")
router.register(r"admin/verification/users", AdminVerificationUserViewSet, basename="admin-verification-user")
router.register(r"admin/verification/kyc-documents", AdminKycDocumentViewSet, basename="admin-kyc-document")
router.register(r"auth/addresses", BuyerAddressViewSet, basename="buyer-address")
router.register(r"chat/threads", ChatThreadViewSet, basename="chat-thread")
router.register(r"chat/messages", ChatMessageViewSet, basename="chat-message")
router.register(r"help/articles", HelpArticleViewSet, basename="help-article")
router.register(r"notifications", NotificationViewSet, basename="notification")
router.register(r"seller/dashboard", SellerDashboardViewSet, basename="seller-dashboard")
router.register(r"warehouse/dashboard", WarehouseDashboardViewSet, basename="warehouse-dashboard")
router.register(r"subscriptions", SubscriptionViewSet, basename="subscription")

urlpatterns = [
    path("auth/email-verification/request", EmailVerificationRequestView.as_view()),
    path("auth/email-verification/verify", EmailVerificationVerifyView.as_view()),
    path("auth/register", RegisterView.as_view()),
    path("auth/login", LoginView.as_view()),
    path("auth/logout", LogoutView.as_view()),
    path("auth/refresh", RefreshView.as_view()),
    path("auth/password-reset/confirm", PasswordResetConfirmView.as_view()),
    path("auth/me", MeView.as_view()),
    path("auth/deactivate", DeactivateMeView.as_view()),
    path("me/menu", MeMenuView.as_view()),
    path("me/switch-account-type", MeSwitchAccountTypeView.as_view()),
    path("kyc/requirements", KycRequirementsView.as_view()),
    path("kyc/documents", KycDocumentsMeView.as_view()),
    path("kyc/documents/<uuid:pk>", KycDocumentMeDetailView.as_view()),
    path("security/recovery-codes", RecoveryCodesMeView.as_view()),
    path("security/totp/setup", TotpSetupMeView.as_view()),
    path("security/totp/enable", TotpEnableMeView.as_view()),
    path("security/totp/disable", TotpDisableMeView.as_view()),
    path("profiles/admin/me", AdminProfileMeView.as_view()),
    path("profiles/buyer/me", BuyerProfileMeView.as_view()),
    path("profiles/seller/me", SellerProfileMeView.as_view()),
    path("settings/me", UserSettingsMeView.as_view()),
    path("admin/overview", AdminPlatformOverviewView.as_view()),
    path("admin/command-center", AdminCommandCenterView.as_view()),
    path("admin/seller-trends/summary", AdminSellerTrendsSummaryView.as_view()),
    path("admin/seller-trends/products", AdminSellerTrendsProductsView.as_view()),
    path("admin/seller-trends/sellers", AdminSellerTrendsSellersView.as_view()),
    path("admin/seller-trends/keywords", AdminSellerTrendsKeywordsView.as_view()),
    path("admin/seller-trends/reels", AdminSellerTrendsReelsView.as_view()),
    path("admin/settings", AdminPlatformSettingsView.as_view()),
    path("admin/integrations/<str:key>/test", AdminIntegrationTestView.as_view()),
    path("admin/notifications/test", AdminNotificationTestView.as_view()),
    path("admin/ui/notifications", AdminUiNotificationsView.as_view()),
    path("admin/ui/notifications/mark-all-read", AdminUiNotificationsMarkAllReadView.as_view()),
    path("admin/ui/notifications/<str:key>/mark-read", AdminUiNotificationsMarkReadView.as_view()),
    path("marketing/promises/", MarketingPromisesView.as_view()),
    path("marketing/assets/upload/", MarketingAssetUploadView.as_view()),
    path("", include(router.urls)),
]

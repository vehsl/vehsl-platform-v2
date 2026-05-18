from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminProductViewSet,
    CategoryViewSet,
    ComplianceRuleViewSet,
    PricingTierViewSet,
    ProductMediaViewSet,
    ProductVariationViewSet,
    ProductViewSet,
    SellerListingRequestViewSet,
    TrademarkViewSet,
)

router = DefaultRouter()
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"products", ProductViewSet, basename="product")
router.register(r"seller/listing-requests", SellerListingRequestViewSet, basename="seller-listing-request")
router.register(r"admin/products", AdminProductViewSet, basename="admin-product")
router.register(r"product-variations", ProductVariationViewSet, basename="product-variation")
router.register(r"pricing-tiers", PricingTierViewSet, basename="pricing-tier")
router.register(r"product-media", ProductMediaViewSet, basename="product-media")
router.register(r"trademarks", TrademarkViewSet, basename="trademark")
router.register(r"compliance-rules", ComplianceRuleViewSet, basename="compliance-rule")

urlpatterns = [
    path("", include(router.urls)),
]

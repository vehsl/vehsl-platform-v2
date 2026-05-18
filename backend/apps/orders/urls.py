from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminLogisticsViewSet,
    AdminReleaseConditionViewSet,
    AdminReleaseOrderViewSet,
    CartMeView,
    DisputeViewSet,
    DocumentViewSet,
    OrderViewSet,
    ReviewViewSet,
    ShipmentViewSet,
    WishlistViewSet,
)

router = DefaultRouter()
router.register(r"orders", OrderViewSet, basename="order")
router.register(r"shipments", ShipmentViewSet, basename="shipment")
router.register(r"admin/logistics", AdminLogisticsViewSet, basename="admin-logistics")
router.register(r"admin/verification/release/orders", AdminReleaseOrderViewSet, basename="admin-release-order")
router.register(r"admin/verification/release/conditions", AdminReleaseConditionViewSet, basename="admin-release-condition")
router.register(r"disputes", DisputeViewSet, basename="dispute")
router.register(r"reviews", ReviewViewSet, basename="review")
router.register(r"documents", DocumentViewSet, basename="document")
router.register(r"wishlist", WishlistViewSet, basename="wishlist")

urlpatterns = [
    path("cart", CartMeView.as_view()),
    path("", include(router.urls)),
]

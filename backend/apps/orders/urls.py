from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CartMeView, DisputeViewSet, DocumentViewSet, OrderViewSet, ReviewViewSet, ShipmentViewSet

router = DefaultRouter()
router.register(r"orders", OrderViewSet, basename="order")
router.register(r"shipments", ShipmentViewSet, basename="shipment")
router.register(r"disputes", DisputeViewSet, basename="dispute")
router.register(r"reviews", ReviewViewSet, basename="review")
router.register(r"documents", DocumentViewSet, basename="document")

urlpatterns = [
    path("cart", CartMeView.as_view()),
    path("", include(router.urls)),
]

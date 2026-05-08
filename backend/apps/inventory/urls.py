from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import SampleRequestViewSet, SampleViewSet

router = DefaultRouter()
router.register(r"samples", SampleViewSet, basename="sample")
router.register(r"sample-requests", SampleRequestViewSet, basename="sample-request")

urlpatterns = [
    path("", include(router.urls)),
]

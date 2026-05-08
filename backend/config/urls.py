from django.http import JsonResponse
from django.urls import include, path


def health(_request):
    return JsonResponse({"ok": True})


urlpatterns = [
    path("api/health", health),
    path("api/v1/", include("apps.accounts.urls")),
    path("api/v1/", include("apps.catalog.urls")),
    path("api/v1/", include("apps.orders.urls")),
    path("api/v1/", include("apps.payments.urls")),
    path("api/v1/", include("apps.inventory.urls")),
]

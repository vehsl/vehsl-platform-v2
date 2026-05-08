from django.http import JsonResponse
from django.urls import include, path

from apps.accounts.admin import admin_site


def health(_request):
    return JsonResponse({"ok": True})


urlpatterns = [
    path("api/health", health),
    path("admin/", admin_site.urls),
    path("api/v1/", include("apps.accounts.urls")),
    path("api/v1/", include("apps.catalog.urls")),
    path("api/v1/", include("apps.orders.urls")),
    path("api/v1/", include("apps.payments.urls")),
    path("api/v1/", include("apps.inventory.urls")),
]

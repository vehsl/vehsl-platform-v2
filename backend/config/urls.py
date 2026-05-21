from django.http import JsonResponse
from django.urls import include, path, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve

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

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    urlpatterns += [
        re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
    ]

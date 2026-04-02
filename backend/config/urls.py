from django.contrib import admin
from django.urls import include, path, re_path

from .frontend_views import frontend_asset, frontend_index

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("academics.urls")),
    path("api/", include("materials.urls")),
    path("api/", include("users.urls")),
    path("api/results/", include("results.urls")),
    re_path(r"^(?P<asset_kind>css|js|assets)/(?P<asset_path>.+)$", frontend_asset),
    path("", frontend_index),
]

"""
Root URL configuration.

In Phase 1 this only includes the health-check endpoint and the admin panel.
API routes for pipelines and executions will be added in Phase 3.
"""
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health_check(request):
    """
    Simple liveness probe used by Docker health checks and load balancers.
    Returns 200 OK with a JSON payload when the application is running.
    """
    return JsonResponse({"status": "ok", "service": "workflow-engine"})


urlpatterns = [
    # Health probe — no authentication required
    path("api/health/", health_check, name="health-check"),

    # Django admin panel
    path("admin/", admin.site.urls),

    # App-level URL namespaces (added in Phase 3)
    # path("api/", include("apps.pipelines.urls")),
    # path("api/", include("apps.executions.urls")),
]

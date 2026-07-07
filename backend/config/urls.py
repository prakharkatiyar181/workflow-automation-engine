"""
Root URL configuration.

Phase 1: health-check + admin.
Phase 3: pipeline and execution REST API routes.
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


def root_view(request):
    return JsonResponse({
        "name": "Workflow Automation Engine",
        "status": "running",
        "docs": "/api/"
    })


urlpatterns = [
    # Root info endpoint
    path("", root_view, name="root"),

    # Health probe — no authentication required
    path("api/health/", health_check, name="health-check"),

    # Django admin panel
    path("admin/", admin.site.urls),

    # Pipelines: list, create, detail, execute
    path("api/", include("apps.pipelines.urls", namespace="pipelines")),

    # Executions: detail
    path("api/", include("apps.executions.urls", namespace="executions")),

    # DRF browsable API login (development only — safe to keep, no auth bypass)
    path("api-auth/", include("rest_framework.urls")),
]

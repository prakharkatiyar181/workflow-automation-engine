"""
Pipelines app URL configuration — Phase 3.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PipelineViewSet

app_name = "pipelines"

router = DefaultRouter(trailing_slash=True)
router.register(r"pipelines", PipelineViewSet, basename="pipeline")

urlpatterns = [
    path("", include(router.urls)),
]

"""
Executions app URL configuration — Phase 3.
"""
from django.urls import path

from .views import ExecutionDetailView

app_name = "executions"

urlpatterns = [
    path(
        "executions/<uuid:id>/",
        ExecutionDetailView.as_view(),
        name="execution-detail",
    ),
]

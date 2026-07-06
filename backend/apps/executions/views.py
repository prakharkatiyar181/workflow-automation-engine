"""
Execution API views.
"""
from __future__ import annotations

from rest_framework.generics import RetrieveAPIView

from .models import PipelineExecution
from .serializers import PipelineExecutionDetailSerializer


class ExecutionDetailView(RetrieveAPIView):
    """
    GET /api/executions/{id}/

    Returns the full execution state including per-task status, timestamps,
    duration, and any error messages.  Optimised with select_related and
    prefetch_related to avoid N+1 queries.
    """

    serializer_class = PipelineExecutionDetailSerializer
    lookup_field = "id"

    def get_queryset(self):
        return (
            PipelineExecution.objects.select_related("pipeline")
            .prefetch_related("task_executions__task")
            .all()
        )

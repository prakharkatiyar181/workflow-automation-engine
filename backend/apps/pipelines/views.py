"""
Pipeline API views.

Thin views — all business logic lives in services.py.
"""
from __future__ import annotations

from django.db.models import Count, Prefetch
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.mixins import CreateModelMixin, ListModelMixin, RetrieveModelMixin
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from apps.executions.models import PipelineExecution
from apps.executions.serializers import ExecutionCreateResponseSerializer
from apps.executions.services import create_execution

from .models import Pipeline, TaskDependency
from .serializers import (
    PipelineCreateSerializer,
    PipelineDetailSerializer,
    PipelineListSerializer,
)
from .services import create_pipeline


class PipelineViewSet(GenericViewSet):
    """
    Endpoints:
      POST   /api/pipelines/          → create pipeline
      GET    /api/pipelines/          → list pipelines
      GET    /api/pipelines/{id}/     → pipeline DAG detail
      POST   /api/pipelines/{id}/execute/ → queue a new execution
    """

    lookup_field = "id"

    # ── Queryset helpers ──────────────────────────────────────────────────────

    def get_queryset(self):
        """
        Base queryset — overridden per action to attach the right
        annotations and prefetches.
        """
        return Pipeline.objects.all()

    def get_list_queryset(self):
        """
        GET /api/pipelines/ — annotate task count, prefetch latest execution.
        Results in exactly 2 SQL queries regardless of list size (no N+1).
        """
        return (
            Pipeline.objects.annotate(task_count=Count("tasks", distinct=True))
            .prefetch_related(
                Prefetch(
                    "executions",
                    queryset=PipelineExecution.objects.order_by("-created_at").only(
                        "id", "status", "pipeline_id"
                    ),
                    to_attr="latest_executions",
                )
            )
            .order_by("-created_at")
        )

    def get_detail_queryset(self):
        """
        GET /api/pipelines/{id}/ — prefetch tasks and their dependency edges.
        Results in 3 SQL queries total.
        """
        return Pipeline.objects.prefetch_related(
            "tasks",
            Prefetch(
                "tasks__upstream_dependencies",
                queryset=TaskDependency.objects.only(
                    "id", "task_id", "depends_on_id"
                ),
            ),
        )

    # ── Action: list ──────────────────────────────────────────────────────────

    def list(self, request: Request) -> Response:
        queryset = self.get_list_queryset()
        serializer = PipelineListSerializer(queryset, many=True)
        return Response(serializer.data)

    # ── Action: create ────────────────────────────────────────────────────────

    def create(self, request: Request) -> Response:
        serializer = PipelineCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            pipeline = create_pipeline(serializer.validated_data)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        # Return the full DAG detail for the newly created pipeline
        detail_qs = self.get_detail_queryset()
        pipeline = detail_qs.get(id=pipeline.id)
        return Response(
            PipelineDetailSerializer(pipeline).data,
            status=status.HTTP_201_CREATED,
        )

    # ── Action: retrieve ──────────────────────────────────────────────────────

    def retrieve(self, request: Request, id=None) -> Response:
        try:
            pipeline = self.get_detail_queryset().get(id=id)
        except Pipeline.DoesNotExist:
            return Response({"error": "Pipeline not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = PipelineDetailSerializer(pipeline)
        return Response(serializer.data)

    # ── Action: execute ───────────────────────────────────────────────────────

    @action(detail=True, methods=["post"], url_path="execute")
    def execute(self, request: Request, id=None) -> Response:
        """
        POST /api/pipelines/{id}/execute/

        Creates a QUEUED PipelineExecution + PENDING TaskExecution for every
        task in the pipeline.  Does NOT start Celery workers (Phase 4).
        """
        try:
            pipeline = Pipeline.objects.prefetch_related("tasks").get(id=id)
        except Pipeline.DoesNotExist:
            return Response({"error": "Pipeline not found."}, status=status.HTTP_404_NOT_FOUND)

        if not pipeline.tasks.exists():
            return Response(
                {"error": "Cannot execute a pipeline with no tasks."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        execution = create_execution(pipeline)
        serializer = ExecutionCreateResponseSerializer(execution)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

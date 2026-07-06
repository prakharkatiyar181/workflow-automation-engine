"""
Execution serializers.
"""
from __future__ import annotations

from rest_framework import serializers

from .models import PipelineExecution, TaskExecution


class TaskExecutionSerializer(serializers.ModelSerializer):
    """Detailed task execution row — used inside GET /api/executions/{id}/."""
    name = serializers.CharField(source="task.name", read_only=True)

    class Meta:
        model = TaskExecution
        fields = [
            "id",
            "name",
            "status",
            "started_at",
            "completed_at",
            "duration",
            "error_message",
        ]


class PipelineExecutionDetailSerializer(serializers.ModelSerializer):
    """
    Full execution detail returned by GET /api/executions/{id}/.
    """
    pipeline_id = serializers.UUIDField(source="pipeline.id", read_only=True)
    pipeline_name = serializers.CharField(source="pipeline.name", read_only=True)
    tasks = TaskExecutionSerializer(source="task_executions", many=True, read_only=True)

    class Meta:
        model = PipelineExecution
        fields = [
            "id",
            "status",
            "pipeline_id",
            "pipeline_name",
            "started_at",
            "completed_at",
            "created_at",
            "tasks",
        ]


class ExecutionCreateResponseSerializer(serializers.ModelSerializer):
    """
    Minimal response returned immediately after POST /api/pipelines/{id}/execute/.
    Deliberately sparse — the client can poll GET /api/executions/{id}/ for details.
    """
    execution_id = serializers.UUIDField(source="id", read_only=True)

    class Meta:
        model = PipelineExecution
        fields = ["execution_id", "status"]

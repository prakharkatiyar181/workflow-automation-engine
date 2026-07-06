"""
Pipeline serializers.

Separation of concerns:
  - Input serializers  (write-only) — validate and deserialize request bodies.
  - Output serializers (read-only)  — shape API responses.
"""
from __future__ import annotations

from rest_framework import serializers

from .models import Pipeline, PipelineTask, TaskDependency


# ══════════════════════════════════════════════════════════════════════════════
# Input serializers (POST /api/pipelines/)
# ══════════════════════════════════════════════════════════════════════════════

class TaskInputSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, default="", allow_blank=True)
    estimated_duration = serializers.IntegerField(min_value=1)
    failure_probability = serializers.FloatField(required=False, default=0.0, min_value=0.0, max_value=1.0)
    order = serializers.IntegerField(required=False, default=0, min_value=0)


class DependencyInputSerializer(serializers.Serializer):
    """
    References tasks by *name* (not UUID) so that callers can build the full
    pipeline definition in one JSON document without pre-creating tasks first.
    """
    task = serializers.CharField(help_text="Name of the blocked (downstream) task.")
    depends_on = serializers.CharField(help_text="Name of the upstream prerequisite task.")


class PipelineCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, default="", allow_blank=True)
    tasks = TaskInputSerializer(many=True)
    dependencies = DependencyInputSerializer(many=True, required=False, default=list)

    def validate_tasks(self, value):
        if not value:
            raise serializers.ValidationError("A pipeline must have at least one task.")
        names = [t["name"] for t in value]
        if len(names) != len(set(names)):
            raise serializers.ValidationError(
                "Task names must be unique within a pipeline."
            )
        return value


# ══════════════════════════════════════════════════════════════════════════════
# Output serializers
# ══════════════════════════════════════════════════════════════════════════════

class LatestExecutionSerializer(serializers.Serializer):
    """Minimal execution summary embedded inside the pipeline list response."""
    id = serializers.UUIDField()
    status = serializers.CharField()


class PipelineListSerializer(serializers.ModelSerializer):
    """
    Used by GET /api/pipelines/.

    Requires the queryset to be annotated with:
      - task_count        (via Count('tasks'))
      - to_attr='latest_executions' prefetch on 'executions'
    """
    task_count = serializers.IntegerField(read_only=True)
    latest_execution = serializers.SerializerMethodField()

    class Meta:
        model = Pipeline
        fields = ["id", "name", "description", "task_count", "latest_execution", "created_at"]

    def get_latest_execution(self, obj):
        # latest_executions is set as a to_attr on the Prefetch object in the view
        executions = getattr(obj, "latest_executions", [])
        if not executions:
            return None
        return LatestExecutionSerializer(executions[0]).data


class PipelineTaskDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = PipelineTask
        fields = [
            "id",
            "name",
            "description",
            "estimated_duration",
            "failure_probability",
            "order",
        ]


class DependencyOutputSerializer(serializers.ModelSerializer):
    """
    Serialises a TaskDependency edge as {"from": <uuid>, "to": <uuid>}.

    Convention (matches React Flow):
      from → the prerequisite (depends_on)
      to   → the blocked downstream task (task)
    """
    class Meta:
        model = TaskDependency
        fields = []  # populated entirely in to_representation

    def to_representation(self, instance: TaskDependency):
        # "from" is a Python keyword so we cannot use it as a field name —
        # override to_representation instead.
        return {
            "from": str(instance.depends_on_id),
            "to": str(instance.task_id),
        }


class PipelineDetailSerializer(serializers.ModelSerializer):
    """
    Used by GET /api/pipelines/{id}/.

    Requires the queryset to prefetch:
      - 'tasks'
      - 'tasks__upstream_dependencies'
    """
    tasks = PipelineTaskDetailSerializer(many=True, read_only=True)
    dependencies = serializers.SerializerMethodField()

    class Meta:
        model = Pipeline
        fields = ["id", "name", "description", "created_at", "updated_at", "tasks", "dependencies"]

    def get_dependencies(self, obj: Pipeline):
        """
        Flatten all upstream_dependencies from every prefetched task.
        Uses the prefetch cache — no additional queries.
        """
        edges = []
        for task in obj.tasks.all():  # uses 'tasks' prefetch cache
            for dep in task.upstream_dependencies.all():  # uses nested prefetch cache
                edges.append(
                    {"from": str(dep.depends_on_id), "to": str(dep.task_id)}
                )
        return edges

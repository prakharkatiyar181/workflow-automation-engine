import uuid

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Pipeline(models.Model):
    """
    Represents a Directed Acyclic Graph (DAG) pipeline definition.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Pipeline"
        verbose_name_plural = "Pipelines"

    def __str__(self) -> str:
        return f"{self.name} ({self.id})"


class PipelineTask(models.Model):
    """
    Represents a single node (task) within a pipeline's DAG.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pipeline = models.ForeignKey(
        Pipeline,
        on_delete=models.CASCADE,
        related_name="tasks",
        help_text="The pipeline this task belongs to.",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    estimated_duration = models.PositiveIntegerField(
        help_text="Estimated duration in seconds."
    )
    failure_probability = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text="Probability of simulated failure (0.0 to 1.0).",
    )
    order = models.PositiveIntegerField(
        default=0, help_text="Optional ordering for UI display."
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["pipeline", "order", "created_at"]
        verbose_name = "Pipeline Task"
        verbose_name_plural = "Pipeline Tasks"

    def __str__(self) -> str:
        return f"{self.name} [{self.pipeline.name}]"


class TaskDependency(models.Model):
    """
    Represents a directed edge in the DAG (depends_on -> task).
    Meaning: 'task' is blocked until 'depends_on' completes successfully.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(
        PipelineTask,
        on_delete=models.CASCADE,
        related_name="upstream_dependencies",
        help_text="The task that is blocked/waiting.",
    )
    depends_on = models.ForeignKey(
        PipelineTask,
        on_delete=models.CASCADE,
        related_name="downstream_dependencies",
        help_text="The task that must complete first.",
    )

    class Meta:
        verbose_name = "Task Dependency"
        verbose_name_plural = "Task Dependencies"
        constraints = [
            models.UniqueConstraint(
                fields=["task", "depends_on"], name="unique_task_dependency"
            ),
            models.CheckConstraint(
                check=~models.Q(task=models.F("depends_on")),
                name="prevent_self_dependency",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.task.name} depends on {self.depends_on.name}"

import uuid

from django.db import models


class PipelineExecution(models.Model):
    """
    Represents a single runtime execution of a Pipeline.
    """

    class Status(models.TextChoices):
        QUEUED = "QUEUED", "Queued"
        RUNNING = "RUNNING", "Running"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pipeline = models.ForeignKey(
        "pipelines.Pipeline",
        on_delete=models.CASCADE,
        related_name="executions",
        help_text="The pipeline being executed.",
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.QUEUED
    )
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Pipeline Execution"
        verbose_name_plural = "Pipeline Executions"
        indexes = [
            models.Index(fields=["pipeline"]),
            models.Index(fields=["status"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.pipeline.name} Execution ({self.get_status_display()})"


class TaskExecution(models.Model):
    """
    Represents the execution state of a single PipelineTask within a PipelineExecution.
    """

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        RUNNING = "RUNNING", "Running"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"
        SKIPPED = "SKIPPED", "Skipped"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    execution = models.ForeignKey(
        PipelineExecution,
        on_delete=models.CASCADE,
        related_name="task_executions",
        help_text="The parent pipeline execution.",
    )
    task = models.ForeignKey(
        "pipelines.PipelineTask",
        on_delete=models.CASCADE,
        related_name="executions",
        help_text="The specific task being executed.",
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    error_message = models.TextField(blank=True, null=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    duration = models.FloatField(
        null=True, blank=True, help_text="Actual duration in seconds."
    )

    class Meta:
        ordering = ["execution", "started_at"]
        verbose_name = "Task Execution"
        verbose_name_plural = "Task Executions"
        indexes = [
            models.Index(fields=["execution"]),
            models.Index(fields=["task"]),
            models.Index(fields=["status"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["execution", "task"], name="unique_task_per_execution"
            )
        ]

    def __str__(self) -> str:
        return f"{self.task.name} ({self.get_status_display()})"

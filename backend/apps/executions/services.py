"""
Execution business logic.

All writes inside a single atomic transaction.
"""
from __future__ import annotations

from django.db import transaction

from apps.pipelines.models import Pipeline

from .models import PipelineExecution, TaskExecution


def create_execution(pipeline: Pipeline) -> PipelineExecution:
    """
    Create a QUEUED PipelineExecution and a PENDING TaskExecution
    for every task in the pipeline — atomically.

    Args:
        pipeline: Pipeline instance with tasks already prefetched.

    Returns:
        The newly-created PipelineExecution.
    """
    with transaction.atomic():
        execution = PipelineExecution.objects.create(
            pipeline=pipeline,
            status=PipelineExecution.Status.QUEUED,
        )

        # Bulk-create one TaskExecution per pipeline task
        task_executions = [
            TaskExecution(
                execution=execution,
                task=task,
                status=TaskExecution.Status.PENDING,
            )
            for task in pipeline.tasks.all()
        ]
        TaskExecution.objects.bulk_create(task_executions)

        return execution

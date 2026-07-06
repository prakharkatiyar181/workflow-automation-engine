"""
Celery tasks for execution engine.
"""
from __future__ import annotations

import logging
import traceback
import uuid
from typing import Any

from celery import chord, shared_task
from django.db import OperationalError, transaction
from django.utils import timezone
from redis.exceptions import RedisError

from apps.executions.engine import (
    calculate_waves,
    finalize_execution,
    propagate_failure_to_downstream,
)
from apps.executions.events import send_execution_update, send_task_update
from apps.executions.models import PipelineExecution, TaskExecution
from apps.executions.runners.simulated import SimulatedTaskRunner
from apps.pipelines.models import TaskDependency

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    autoretry_for=(OperationalError, RedisError),
    retry_backoff=True,
    max_retries=3,
)
def run_task_execution(self, task_execution_id: uuid.UUID) -> dict[str, Any]:
    """
    Executes a single task. Returns safely (without raising business exceptions)
    so the Celery chord callback is always fired.
    """
    with transaction.atomic():
        try:
            # We select_related("task") to have pipeline_id easily accessible for logging
            task_exec = TaskExecution.objects.select_for_update().select_related("task").get(id=task_execution_id)
        except TaskExecution.DoesNotExist:
            logger.error(f"TaskExecution {task_execution_id} not found.")
            return {"task_execution_id": str(task_execution_id), "status": "FAILED"}
            
        pipeline_id = task_exec.task.pipeline_id
        task_name = task_exec.task.name
        
        logger.info(f"Execution {task_exec.execution_id} | Pipeline {pipeline_id} | Task started: {task_name} ({task_execution_id})")

        if task_exec.status != TaskExecution.Status.PENDING:
            logger.info(f"Task {task_execution_id} is already {task_exec.status}, bypassing execution.")
            return {"task_execution_id": str(task_exec.id), "status": task_exec.status}

        # 1. Re-check dependencies for safety
        # We can optimize this into a single query using a subquery for depends_on_id
        upstream_execs = TaskExecution.objects.filter(
            execution_id=task_exec.execution_id,
            task_id__in=TaskDependency.objects.filter(task=task_exec.task).values("depends_on_id")
        )

        if any(ue.status != TaskExecution.Status.COMPLETED for ue in upstream_execs):
            logger.warning(f"Task {task_execution_id} skipping due to uncompleted dependencies.")
            task_exec.status = TaskExecution.Status.SKIPPED
            task_exec.completed_at = timezone.now()
            task_exec.save(update_fields=["status", "completed_at"])
            
            # Emit WebSocket event: task skipped
            send_task_update(task_exec)
            
            return {"task_execution_id": str(task_exec.id), "status": task_exec.status}

        # 2. Transition to RUNNING
        task_exec.status = TaskExecution.Status.RUNNING
        task_exec.started_at = timezone.now()
        task_exec.save(update_fields=["status", "started_at"])

    # Emit WebSocket event: task is now RUNNING
    send_task_update(task_exec)

    # 3. Execute runner (outside transaction to avoid holding DB locks during sleep/work)
    runner = SimulatedTaskRunner()
    
    error_message = None
    try:
        runner.run(task_exec)
        status = TaskExecution.Status.COMPLETED
    except Exception as e:
        status = TaskExecution.Status.FAILED
        error_message = str(e)
        logger.error(f"Task failed: {task_execution_id} - {error_message}")

    # 4. Finalize state
    with transaction.atomic():
        task_exec = TaskExecution.objects.select_for_update().get(id=task_execution_id)
        task_exec.status = status
        task_exec.completed_at = timezone.now()
        if task_exec.started_at:
            task_exec.duration = (task_exec.completed_at - task_exec.started_at).total_seconds()
        
        if error_message:
            task_exec.error_message = error_message
            
        task_exec.save(update_fields=["status", "completed_at", "duration", "error_message"])

    # Emit WebSocket event: task final state (COMPLETED or FAILED)
    send_task_update(task_exec)

    logger.info(f"Task completed: {task_execution_id} with status {status}")
    return {"task_execution_id": str(task_exec.id), "status": status}


@shared_task
def dispatch_next_wave(
    chord_results: list[dict[str, Any]], 
    execution_id: uuid.UUID, 
    waves_data: list[list[str]], 
    next_wave_index: int
) -> None:
    """
    Chord callback. Examines the results of the previous wave.
    If success, dispatches the next wave. If failure, cascades skips and finalizes.
    """
    logger.info(f"Wave {next_wave_index - 1} finished for execution {execution_id}")

    has_failures = False
    failed_task_exec_ids = []
    
    for result in chord_results:
        # result is like {"task_execution_id": "...", "status": "FAILED"}
        if not result:
            continue
            
        if result.get("status") == TaskExecution.Status.FAILED:
            has_failures = True
            failed_task_exec_ids.append(result.get("task_execution_id"))

    if has_failures:
        logger.info(f"Failures detected in wave {next_wave_index - 1}. Propagating.")
        # Propagate skips recursively downstream
        for failed_id in failed_task_exec_ids:
            if failed_id:
                try:
                    failed_exec = TaskExecution.objects.get(id=failed_id)
                    propagate_failure_to_downstream(failed_exec)
                except TaskExecution.DoesNotExist:
                    pass
        
        # DO NOT finalize_execution or return here! 
        # We MUST dispatch the next wave so independent branches can continue.

    # No failures -> Dispatch next wave if it exists
    if next_wave_index < len(waves_data):
        logger.info(f"Wave started: {next_wave_index} for execution {execution_id}")
        next_wave_task_ids = waves_data[next_wave_index]
        
        tasks_signature = [
            run_task_execution.s(task_id) for task_id in next_wave_task_ids
        ]
        
        callback = dispatch_next_wave.s(
            execution_id, waves_data, next_wave_index + 1
        )
        chord(tasks_signature)(callback)
    else:
        # All waves finished successfully
        logger.info(f"All waves completed for execution {execution_id}. Finalizing.")
        finalize_execution(execution_id)


@shared_task(
    autoretry_for=(OperationalError, RedisError),
    retry_backoff=True,
    max_retries=3,
)
def dispatch_pipeline_execution(execution_id: uuid.UUID) -> None:
    """
    Entry point for pipeline execution.
    Transitions to RUNNING, calculates waves, and dispatches Wave 0.
    """
    logger.info(f"Pipeline execution started: {execution_id}")
    
    with transaction.atomic():
        try:
            execution = PipelineExecution.objects.select_for_update().get(id=execution_id)
        except PipelineExecution.DoesNotExist:
            logger.error(f"PipelineExecution {execution_id} not found.")
            return

        if execution.status != PipelineExecution.Status.QUEUED:
            logger.warning(f"Execution {execution_id} is not QUEUED. Ignoring.")
            return

        execution.status = PipelineExecution.Status.RUNNING
        execution.started_at = timezone.now()
        execution.save(update_fields=["status", "started_at"])

    # Emit WebSocket event: pipeline is now RUNNING
    send_execution_update(execution)

    # Calculate waves (returns list of lists of TaskExecution UUIDs)
    waves = calculate_waves(execution)
    
    # We must serialize UUIDs to strings so Celery can JSON-encode them for the callback arguments
    waves_data = [[str(t_id) for t_id in wave] for wave in waves]

    if not waves_data:
        # Empty pipeline
        finalize_execution(execution.id)
        return

    logger.info(f"Wave started: 0 for execution {execution_id}")
    wave_0_task_ids = waves_data[0]
    
    # Dispatch Wave 0 inside a chord
    tasks_signature = [
        run_task_execution.s(task_id) for task_id in wave_0_task_ids
    ]
    callback = dispatch_next_wave.s(execution.id, waves_data, 1)
    
    chord(tasks_signature)(callback)

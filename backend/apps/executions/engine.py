"""
DAG orchestration engine.

Contains Kahn's Algorithm for calculating execution waves and
state machine handlers for success, failure, and propagation.
"""
from __future__ import annotations

import logging
import uuid
from collections import defaultdict

from django.db import transaction
from django.utils import timezone

from apps.executions.events import send_execution_update, send_task_update
from apps.executions.models import PipelineExecution, TaskExecution
from apps.pipelines.models import TaskDependency

logger = logging.getLogger(__name__)


def calculate_waves(execution: PipelineExecution) -> list[list[uuid.UUID]]:
    """
    Kahn's topological sort to calculate execution waves.
    Each wave is a list of TaskExecution IDs that can run in parallel.
    """
    # 1. Fetch all tasks for this execution
    task_executions = list(execution.task_executions.select_related("task").all())
    task_ids = [te.task_id for te in task_executions]
    task_exec_map = {te.task_id: te.id for te in task_executions}

    # 2. Fetch all dependencies for these tasks
    edges = list(
        TaskDependency.objects.filter(
            task_id__in=task_ids,
            depends_on_id__in=task_ids
        ).values("depends_on_id", "task_id")
    )

    # 3. Build adjacency list and in-degree map
    graph: dict[uuid.UUID, list[uuid.UUID]] = defaultdict(list)
    in_degree: dict[uuid.UUID, int] = {t_id: 0 for t_id in task_ids}

    for edge in edges:
        u = edge["depends_on_id"]
        v = edge["task_id"]
        graph[u].append(v)
        in_degree[v] += 1

    # 4. Initialize Queue (Wave 0) with in_degree == 0
    waves: list[list[uuid.UUID]] = []
    current_wave = [t_id for t_id, deg in in_degree.items() if deg == 0]

    # 5. Process waves
    while current_wave:
        # Convert task IDs to TaskExecution IDs for the current wave
        waves.append([task_exec_map[t_id] for t_id in current_wave])
        
        next_wave = []
        for u in current_wave:
            for v in graph[u]:
                in_degree[v] -= 1
                if in_degree[v] == 0:
                    next_wave.append(v)
        
        current_wave = next_wave

    return waves


def propagate_failure_to_downstream(failed_task_exec: TaskExecution) -> None:
    """
    Recursively marks all downstream dependent TaskExecutions as SKIPPED.
    """
    execution_id = failed_task_exec.execution_id
    
    # Adjacency list: depends_on_id -> list[task_id]
    edges = list(
        TaskDependency.objects.filter(
            task__pipeline_id=failed_task_exec.task.pipeline_id
        ).values("depends_on_id", "task_id")
    )
    graph = defaultdict(list)
    for edge in edges:
        graph[edge["depends_on_id"]].append(edge["task_id"])

    # BFS/DFS to find all downstream task IDs
    queue = [failed_task_exec.task_id]
    visited = set()
    
    while queue:
        curr_task_id = queue.pop(0)
        for child_task_id in graph[curr_task_id]:
            if child_task_id not in visited:
                visited.add(child_task_id)
                queue.append(child_task_id)

    if visited:
        # Update them to SKIPPED in the database
        TaskExecution.objects.filter(
            execution_id=execution_id,
            task_id__in=visited,
            status=TaskExecution.Status.PENDING
        ).update(
            status=TaskExecution.Status.SKIPPED,
            completed_at=timezone.now()
        )
        logger.info(f"[Execution {execution_id}] Skipped {len(visited)} downstream tasks due to failure.")
        
        # Emit WebSocket event for each skipped task
        skipped_tasks = TaskExecution.objects.select_related("task").filter(
            execution_id=execution_id,
            task_id__in=visited
        )
        for t in skipped_tasks:
            send_task_update(t)


@transaction.atomic
def finalize_execution(execution_id: uuid.UUID) -> None:
    """
    Final safety check for PipelineExecution state.
    Evaluates the terminal state of all tasks to mark the pipeline correctly.
    Never leaves it RUNNING forever.
    """
    execution = PipelineExecution.objects.select_for_update().get(id=execution_id)
    
    # If already terminal, do nothing
    if execution.status in (PipelineExecution.Status.COMPLETED, PipelineExecution.Status.FAILED):
        return

    task_statuses = set(execution.task_executions.values_list("status", flat=True))

    has_failed = TaskExecution.Status.FAILED in task_statuses
    has_pending = TaskExecution.Status.PENDING in task_statuses
    has_running = TaskExecution.Status.RUNNING in task_statuses

    if has_running:
        # Still tasks in progress. Keep it running.
        return

    if has_pending:
        logger.warning(f"Execution {execution_id} has leftover PENDING tasks at finalization. Marking as SKIPPED.")
        leftovers = execution.task_executions.filter(status=TaskExecution.Status.PENDING)
        for t in leftovers:
            t.status = TaskExecution.Status.SKIPPED
            t.completed_at = timezone.now()
            t.save(update_fields=["status", "completed_at"])
            send_task_update(t)

    if has_failed:
        # 1. If any task FAILED -> Pipeline FAILED
        execution.status = PipelineExecution.Status.FAILED
        logger.info(f"Pipeline execution {execution.id} finalized as FAILED.")
    else:
        # 2. If no tasks failed -> Pipeline COMPLETED
        execution.status = PipelineExecution.Status.COMPLETED
        logger.info(f"Pipeline execution {execution.id} finalized as COMPLETED.")

    execution.completed_at = timezone.now()
    execution.save(update_fields=["status", "completed_at"])

    # Emit final pipeline state to all connected clients
    send_execution_update(execution)
    from apps.executions.events import send_pipeline_list_update
    send_pipeline_list_update(execution)

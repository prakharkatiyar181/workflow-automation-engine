"""
executions/events.py

Synchronous helper functions that emit WebSocket events to connected clients
via the Redis channel layer.

Design principles:
- Database is the source of truth. These functions only send notifications.
- Failures MUST NOT affect Celery task execution. Every call is wrapped in try/except.
- Called from synchronous Celery workers using async_to_sync.

Event shapes match the frontend contract exactly (camelCase JSON):

    task_update:
        { type, taskId, taskName, status, startedAt, completedAt, duration, error }

    execution_update:
        { type, executionId, status, completedAt }
"""
from __future__ import annotations

import logging
from typing import Any

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from apps.executions.models import PipelineExecution, TaskExecution

logger = logging.getLogger(__name__)


def _group_name(execution_id: Any) -> str:
    """Canonical Redis group name for an execution."""
    return f"execution_{execution_id}"


from django.db import transaction

def _send(group_name: str, payload: dict) -> None:
    """
    Synchronous wrapper around channel_layer.group_send.
    Uses transaction.on_commit to ensure events are only sent AFTER the
    database state has been fully committed. If there is no active
    transaction, the callback executes immediately.
    Raises nothing — failures are logged and swallowed.
    """
    def do_send() -> None:
        try:
            channel_layer = get_channel_layer()
            if not channel_layer:
                logger.warning("Channel layer not configured; skipping WebSocket event.")
                return

            logger.debug(f"[WS] do_send executing for group: {group_name}")
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    # "type" here is the Channels dispatcher method name on the consumer.
                    # "execution.update" → ExecutionConsumer.execution_update()
                    "type": "execution.update",
                    "payload": payload,
                },
            )
        except Exception as exc:
            logger.error(f"WebSocket send failed (group={group_name}): {exc}")

    try:
        transaction.on_commit(do_send)
    except Exception as exc:
        logger.error(f"WebSocket send scheduling failed (group={group_name}): {exc}")


# ── Public API ────────────────────────────────────────────────────────────────


def send_task_update(task_execution: TaskExecution) -> None:
    """
    Emit a task_update event to all clients subscribed to this execution.

    Payload:
        {
            "type": "task_update",
            "taskId": "<uuid>",
            "taskName": "<str>",
            "status": "RUNNING" | "COMPLETED" | "FAILED" | "SKIPPED",
            "startedAt": "<iso8601>" | null,
            "completedAt": "<iso8601>" | null,
            "duration": <float> | null,
            "error": "<str>" | null
        }
    """
    try:
        # All callers use select_related("task"), so task is already loaded.
        # Access via __dict__ to avoid triggering a new DB query if somehow
        # the relation wasn't prefetched.
        task_obj = task_execution.__dict__.get("task_cache") or task_execution.task
        task_name: str = task_obj.name

        started_at = (
            task_execution.started_at.isoformat() if task_execution.started_at else None
        )
        completed_at = (
            task_execution.completed_at.isoformat() if task_execution.completed_at else None
        )

        payload: dict[str, Any] = {
            "type": "task_update",
            "taskId": str(task_execution.id),
            "taskName": task_name,
            "status": task_execution.status,
            "startedAt": started_at,
            "completedAt": completed_at,
            "duration": task_execution.duration,
            "error": task_execution.error_message or None,
        }

        _send(_group_name(task_execution.execution_id), payload)
        logger.debug(
            f"[WS] task_update sent | exec={task_execution.execution_id} "
            f"task={task_execution.id} status={task_execution.status}"
        )
    except Exception as exc:
        logger.error(f"send_task_update failed: {exc}")


def send_execution_update(execution: PipelineExecution) -> None:
    """
    Emit an execution_update event to all clients subscribed to this execution.

    Payload:
        {
            "type": "execution_update",
            "executionId": "<uuid>",
            "status": "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED",
            "completedAt": "<iso8601>" | null
        }
    """
    try:
        completed_at = (
            execution.completed_at.isoformat() if execution.completed_at else None
        )

        payload: dict[str, Any] = {
            "type": "execution_update",
            "executionId": str(execution.id),
            "status": execution.status,
            "completedAt": completed_at,
        }

        _send(_group_name(execution.id), payload)
        logger.debug(
            f"[WS] execution_update sent | exec={execution.id} status={execution.status}"
        )
    except Exception as exc:
        logger.error(f"send_execution_update failed: {exc}")

"""
WebSocket broadcasting utilities.
"""
from __future__ import annotations

import logging
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from apps.executions.models import PipelineExecution, TaskExecution
from apps.executions.serializers import PipelineExecutionDetailSerializer, TaskExecutionSerializer

logger = logging.getLogger(__name__)


def _send_to_group(group_name: str, event_type: str, data: dict) -> None:
    """Helper to synchronously send a message to a Channels group."""
    channel_layer = get_channel_layer()
    if not channel_layer:
        logger.warning("Channel layer not configured; skipping WebSocket broadcast.")
        return

    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "execution.update",  # Must match the method name on ExecutionConsumer
            "event_type": event_type,
            "data": data,
        },
    )


def broadcast_pipeline_update(execution: PipelineExecution) -> None:
    """
    Broadcasts the full pipeline execution state.
    """
    try:
        # We need the full detail including tasks
        # If the execution passed in isn't fully prefetched, we should fetch it
        if not hasattr(execution, "_prefetched_objects_cache") or "task_executions__task" not in getattr(execution, "_prefetched_objects_cache", {}):
            execution = PipelineExecution.objects.select_related("pipeline").prefetch_related("task_executions__task").get(id=execution.id)
            
        data = PipelineExecutionDetailSerializer(execution).data
        _send_to_group(f"execution_{execution.id}", "pipeline_update", data)
    except Exception as e:
        logger.error(f"Failed to broadcast pipeline update: {e}")


def broadcast_task_update(task_execution: TaskExecution) -> None:
    """
    Broadcasts a single task execution state update.
    """
    try:
        data = TaskExecutionSerializer(task_execution).data
        _send_to_group(f"execution_{task_execution.execution_id}", "task_update", data)
    except Exception as e:
        logger.error(f"Failed to broadcast task update: {e}")

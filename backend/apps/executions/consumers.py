"""
WebSocket consumer for live pipeline execution updates.

Route:  /ws/executions/<uuid:execution_id>/

Protocol:
  - Server-push only. Clients do NOT need to send messages.
  - On connect:  client subscribes to execution_{execution_id} group.
  - On event:    consumer forwards the event payload directly to the client as JSON.
  - On disconnect: client is removed from the group automatically.
"""
from __future__ import annotations

import logging
from typing import Any

from channels.generic.websocket import AsyncJsonWebsocketConsumer

logger = logging.getLogger(__name__)


class ExecutionConsumer(AsyncJsonWebsocketConsumer):
    """
    Subscribes a WebSocket client to live updates for one pipeline execution.
    """

    async def connect(self) -> None:
        self.execution_id = self.scope["url_route"]["kwargs"]["execution_id"]
        self.group_name = f"execution_{self.execution_id}"

        # Join the Redis channel group for this execution
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        logger.info(f"[WS] Client connected | group={self.group_name}")

    async def disconnect(self, close_code: int) -> None:
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        logger.info(f"[WS] Client disconnected | group={self.group_name} code={close_code}")

    async def receive_json(self, content: Any, **kwargs: Any) -> None:
        """
        Server-push only — we deliberately ignore any client messages.
        """
        pass

    # ── Channel layer event handlers ──────────────────────────────────────────

    async def execution_update(self, event: dict[str, Any]) -> None:
        """
        Handles channel-layer messages of type "execution.update".
        The 'payload' key holds the frontend-facing JSON object.

        Called by channel_layer.group_send(..., {"type": "execution.update", "payload": {...}})
        """
        await self.send_json(event["payload"])


class PipelineConsumer(AsyncJsonWebsocketConsumer):
    """
    Subscribes a WebSocket client to global pipeline list updates (for the dashboard).
    """

    async def connect(self) -> None:
        self.group_name = "pipelines"

        # Join the global pipelines Redis channel group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        logger.info(f"[WS] Client connected | group={self.group_name}")

    async def disconnect(self, close_code: int) -> None:
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        logger.info(f"[WS] Client disconnected | group={self.group_name} code={close_code}")

    async def receive_json(self, content: Any, **kwargs: Any) -> None:
        """
        Server-push only — we deliberately ignore any client messages.
        """
        pass

    async def pipeline_update(self, event: dict[str, Any]) -> None:
        """
        Handles channel-layer messages of type "pipeline.update".
        The 'payload' key holds the frontend-facing JSON object.
        """
        await self.send_json(event["payload"])

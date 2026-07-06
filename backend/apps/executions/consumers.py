"""
WebSocket consumer for live execution updates.
"""
from __future__ import annotations

import logging
from typing import Any

from channels.generic.websocket import AsyncJsonWebsocketConsumer

logger = logging.getLogger(__name__)


class ExecutionConsumer(AsyncJsonWebsocketConsumer):
    """
    Subscribes a WebSocket client to a specific pipeline execution's event group.
    Forwards JSON events to the client.
    """

    async def connect(self) -> None:
        """
        Called when a client initiates a WebSocket connection.
        Extracts execution_id from the URL and adds the socket to the group.
        """
        # The execution_id is captured in the URL routing pattern
        self.execution_id = self.scope["url_route"]["kwargs"]["execution_id"]
        self.group_name = f"execution_{self.execution_id}"

        # Join room group
        await self.channel_layer.group_add(self.group_name, self.channel_name)

        # Accept the connection
        await self.accept()
        logger.info(f"WebSocket client connected to {self.group_name}")

    async def disconnect(self, close_code: int) -> None:
        """
        Called when the WebSocket closes for any reason.
        """
        # Leave room group
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        logger.info(f"WebSocket client disconnected from {self.group_name} (code: {close_code})")

    async def execution_update(self, event: dict[str, Any]) -> None:
        """
        Handler for "execution.update" events sent via channel_layer.group_send.
        Forwards the payload directly to the client as JSON.
        
        The expected event structure is:
        {
            "type": "execution.update",
            "event_type": "pipeline_update" | "task_update",
            "data": { ... serialized data ... }
        }
        """
        # Send message to WebSocket
        await self.send_json(
            {
                "type": event.get("event_type", "unknown"),
                "data": event.get("data", {}),
            }
        )

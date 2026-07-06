"""
WebSocket URL routing for the executions app.

Phase 1: Empty patterns — consumers will be added in Phase 5.

Expected final pattern:
    ws://host/ws/executions/{execution_id}/
"""
from django.urls import path

from apps.executions.consumers import ExecutionConsumer

websocket_urlpatterns = [
    path("ws/executions/<uuid:execution_id>/", ExecutionConsumer.as_asgi()),
]

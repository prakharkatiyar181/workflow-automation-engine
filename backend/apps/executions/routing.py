"""
WebSocket URL routing for the executions app.

Route:
    ws://host/ws/executions/<uuid:execution_id>/
    → ExecutionConsumer
"""
from django.urls import path

from apps.executions.consumers import ExecutionConsumer

websocket_urlpatterns = [
    path("ws/executions/<uuid:execution_id>/", ExecutionConsumer.as_asgi()),
]

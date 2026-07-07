"""
WebSocket URL routing for the executions app.

Route:
    ws://host/ws/executions/<uuid:execution_id>/
    → ExecutionConsumer
"""
from django.urls import path

from apps.executions.consumers import ExecutionConsumer, PipelineConsumer

websocket_urlpatterns = [
    path("ws/executions/<uuid:execution_id>/", ExecutionConsumer.as_asgi()),
    path("ws/pipelines/", PipelineConsumer.as_asgi()),
]

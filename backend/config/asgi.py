"""
ASGI config for the workflow engine backend.

Routes HTTP requests to Django and WebSocket connections to Channels consumers.
Daphne uses this as the application entry point.

Protocol routing:
  - http  → Django ASGI application (REST API + admin)
  - websocket → Django Channels URL router
"""
import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

# Initialise Django before importing any models or consumers.
django_asgi_app = get_asgi_application()

# Import WebSocket URL patterns after Django is ready.
from apps.executions.routing import websocket_urlpatterns  # noqa: E402

application = ProtocolTypeRouter(
    {
        # Standard HTTP — handles REST API and Django admin
        "http": django_asgi_app,

        # WebSocket — wrapped with auth middleware stack for future JWT support.
        # AllowedHostsOriginValidator is disabled in development (DEBUG=True bypasses it).
        "websocket": AuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        ),
    }
)

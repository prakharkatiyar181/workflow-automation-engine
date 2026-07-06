"""
WSGI config for the workflow engine backend.

Used by traditional HTTP servers (gunicorn) in production.
Daphne uses asgi.py instead — this file is kept for compatibility.
"""
import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

application = get_wsgi_application()

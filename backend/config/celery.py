"""
Celery application configuration.

The app name matches the Django project name so that task module paths
are unambiguous (e.g., apps.executions.tasks.run_task_execution).
"""
import os

from celery import Celery

# Default to development settings; overridden via environment variable in Docker.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

app = Celery("workflow_engine")

# Read Celery configuration from Django settings, using the CELERY_ namespace
# (e.g., CELERY_BROKER_URL, CELERY_RESULT_BACKEND, etc.)
app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto-discover tasks in all INSTALLED_APPS that have a tasks.py module.
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self) -> None:
    """Utility task for verifying Celery worker connectivity."""
    print(f"[debug_task] Request: {self.request!r}")

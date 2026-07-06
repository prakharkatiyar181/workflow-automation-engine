"""
config package initialiser.

Importing the Celery app here ensures it is loaded when Django starts,
so that the @shared_task decorator resolves correctly across all apps.
"""
from .celery import app as celery_app  # noqa: F401

__all__ = ("celery_app",)

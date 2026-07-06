from django.apps import AppConfig


class ExecutionsConfig(AppConfig):
    """
    Application configuration for the executions app.

    Responsible for:
    - PipelineExecution runtime records
    - TaskExecution per-task runtime records
    - Celery task definitions (tasks.py)
    - WebSocket consumers (consumers.py)
    - Pluggable task runners (runners/)
    """

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.executions"
    verbose_name = "Executions"

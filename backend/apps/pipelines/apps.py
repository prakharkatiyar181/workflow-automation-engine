from django.apps import AppConfig


class PipelinesConfig(AppConfig):
    """
    Application configuration for the pipelines app.

    Responsible for:
    - Pipeline definitions (DAG structure)
    - PipelineTask definitions
    - TaskDependency edges
    """

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.pipelines"
    verbose_name = "Pipelines"

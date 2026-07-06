from django.contrib import admin

from .models import PipelineExecution, TaskExecution


class TaskExecutionInline(admin.TabularInline):
    model = TaskExecution
    extra = 0
    fields = ("task", "status", "started_at", "completed_at", "duration", "error_message")
    readonly_fields = ("started_at", "completed_at", "duration", "error_message")


@admin.register(PipelineExecution)
class PipelineExecutionAdmin(admin.ModelAdmin):
    list_display = ("pipeline", "status", "started_at", "completed_at", "created_at", "id")
    search_fields = ("pipeline__name", "id")
    list_filter = ("status", "created_at", "pipeline")
    readonly_fields = ("created_at", "started_at", "completed_at", "id")
    inlines = [TaskExecutionInline]


@admin.register(TaskExecution)
class TaskExecutionAdmin(admin.ModelAdmin):
    list_display = ("task", "execution_pipeline_name", "status", "started_at", "completed_at", "duration")
    search_fields = ("task__name", "execution__pipeline__name", "id")
    list_filter = ("status", "execution__pipeline", "started_at")
    readonly_fields = ("started_at", "completed_at", "duration", "id")
    
    def execution_pipeline_name(self, obj):
        return obj.execution.pipeline.name
    execution_pipeline_name.short_description = "Pipeline"

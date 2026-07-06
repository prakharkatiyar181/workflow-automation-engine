from django.contrib import admin

from .models import Pipeline, PipelineTask, TaskDependency


class PipelineTaskInline(admin.TabularInline):
    model = PipelineTask
    extra = 0
    fields = ("name", "estimated_duration", "failure_probability", "order", "created_at")
    readonly_fields = ("created_at",)


@admin.register(Pipeline)
class PipelineAdmin(admin.ModelAdmin):
    list_display = ("name", "id", "created_at", "updated_at")
    search_fields = ("name", "description", "id")
    list_filter = ("created_at",)
    readonly_fields = ("created_at", "updated_at", "id")
    inlines = [PipelineTaskInline]


@admin.register(PipelineTask)
class PipelineTaskAdmin(admin.ModelAdmin):
    list_display = ("name", "pipeline", "estimated_duration", "failure_probability", "order", "created_at")
    search_fields = ("name", "description", "pipeline__name", "id")
    list_filter = ("pipeline", "created_at")
    readonly_fields = ("created_at", "id")


@admin.register(TaskDependency)
class TaskDependencyAdmin(admin.ModelAdmin):
    list_display = ("task", "depends_on", "id")
    search_fields = ("task__name", "depends_on__name", "id")
    list_filter = ("task__pipeline",)
    readonly_fields = ("id",)

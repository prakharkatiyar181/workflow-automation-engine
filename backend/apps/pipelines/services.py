"""
Pipeline business logic.

Rules:
- Views call services, never models directly.
- All multi-step writes use database transactions.
- Validation (DAG correctness) runs BEFORE any DB writes.
"""
from __future__ import annotations

from typing import Any

from django.db import transaction

from .models import Pipeline, PipelineTask, TaskDependency
from .validators import validate_dag


def create_pipeline(validated_data: dict[str, Any]) -> Pipeline:
    """
    Create a Pipeline with its tasks and dependencies atomically.

    Steps:
      1. Validate task-name uniqueness.
      2. Validate all dependency references resolve to known task names.
      3. Run DFS cycle detection.
      4. Persist everything inside a single transaction.

    Args:
        validated_data: Already-validated data from PipelineCreateSerializer.

    Returns:
        The newly-created Pipeline instance (tasks and dependencies already saved).

    Raises:
        ValueError: If any validation rule is violated.
    """
    tasks_data: list[dict] = validated_data["tasks"]
    deps_data: list[dict] = validated_data.get("dependencies", [])

    task_names = [t["name"] for t in tasks_data]

    # ── Step 1: unique task names ─────────────────────────────────────────────
    if len(task_names) != len(set(task_names)):
        raise ValueError("Task names must be unique within a pipeline.")

    # ── Step 2 & 3: DAG validation ────────────────────────────────────────────
    dep_pairs = [(d["task"], d["depends_on"]) for d in deps_data]
    validate_dag(task_names, dep_pairs)

    # ── Step 4: persist ───────────────────────────────────────────────────────
    with transaction.atomic():
        pipeline = Pipeline.objects.create(
            name=validated_data["name"],
            description=validated_data.get("description", ""),
        )

        # Create all tasks and build a name → instance lookup map
        task_map: dict[str, PipelineTask] = {}
        for idx, task_data in enumerate(tasks_data):
            task = PipelineTask.objects.create(
                pipeline=pipeline,
                name=task_data["name"],
                description=task_data.get("description", ""),
                estimated_duration=task_data["estimated_duration"],
                failure_probability=task_data.get("failure_probability", 0.0),
                order=task_data.get("order", idx),
            )
            task_map[task.name] = task

        # Create dependency edges
        dependency_objs = [
            TaskDependency(
                task=task_map[d["task"]],
                depends_on=task_map[d["depends_on"]],
            )
            for d in deps_data
        ]
        if dependency_objs:
            TaskDependency.objects.bulk_create(dependency_objs)

        return pipeline

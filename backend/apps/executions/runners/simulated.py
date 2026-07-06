"""
Simulated task runner for Phase 4.
"""
from __future__ import annotations

import random
import time

from apps.executions.models import TaskExecution

from .base import BaseTaskRunner


class SimulatedTaskRunner(BaseTaskRunner):
    """
    Simulates task execution by sleeping for the estimated duration.
    Randomly fails based on the failure_probability.
    """

    def run(self, task_execution: TaskExecution) -> None:
        """
        Executes the simulated task.
        """
        task = task_execution.task

        # Sleep to simulate work
        time.sleep(task.estimated_duration)

        # Roll the dice for failure
        if task.failure_probability > 0.0:
            if random.random() < task.failure_probability:
                raise RuntimeError(
                    f"Simulated task failure triggered (probability: {task.failure_probability})"
                )

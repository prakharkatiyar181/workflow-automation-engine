"""
Base task runner interface.
"""
from __future__ import annotations

import abc

from apps.executions.models import TaskExecution


class BaseTaskRunner(abc.ABC):
    """
    Abstract base class for all execution runners.
    Keeps the orchestration engine decoupled from how tasks actually run.
    """

    @abc.abstractmethod
    def run(self, task_execution: TaskExecution) -> None:
        """
        Executes the task.

        Args:
            task_execution: The TaskExecution instance to run.

        Raises:
            Exception: Any raised exception is caught by the Celery worker and
                       treated as a task failure (status -> FAILED).
        """
        pass

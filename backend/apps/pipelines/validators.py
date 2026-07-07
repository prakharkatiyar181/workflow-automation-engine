"""
DAG validation utilities.

Uses DFS with WHITE/GRAY/BLACK node coloring to detect cycles.

  WHITE = unvisited
  GRAY  = currently on the DFS stack (being visited)
  BLACK = fully explored

Encountering a GRAY node during traversal means we found a back-edge — i.e. a cycle.
"""
from __future__ import annotations

from collections import defaultdict
from typing import List, Tuple

WHITE = 0
GRAY = 1
BLACK = 2


def detect_cycle(task_names: List[str], edges: List[Tuple[str, str]]) -> bool:
    """
    Returns True if the directed graph defined by task_names and edges contains a cycle.

    Args:
        task_names:  All node labels (task names).
        edges:       Pairs (task, depends_on) meaning depends_on → task
                     i.e. the edge goes FROM the dependency TO the blocked task.
    """
    # Build adjacency list: dependency → [tasks that are blocked by it]
    graph: dict[str, list[str]] = defaultdict(list)
    for task, depends_on in edges:
        graph[depends_on].append(task)

    color: dict[str, int] = {name: WHITE for name in task_names}

    def _dfs(node: str) -> bool:
        color[node] = GRAY
        for neighbour in graph[node]:
            if color[neighbour] == GRAY:
                # Back-edge detected — cycle confirmed
                return True
            if color[neighbour] == WHITE and _dfs(neighbour):
                return True
        color[node] = BLACK
        return False

    for name in task_names:
        if color[name] == WHITE:
            if _dfs(name):
                return True
    return False


def validate_dag(task_names: List[str], dependency_pairs: List[Tuple[str, str]]) -> None:
    """
    Validates the proposed DAG structure.

    Checks (in order):
      1. All task names referenced in dependencies exist.
      2. No task depends on itself.
      3. No duplicate dependency pairs.
      4. No cycle exists.

    Raises:
        ValueError: with a human-readable message describing the first problem found.
    """
    task_name_set = set(task_names)

    seen_pairs: set = set()
    for task, depends_on in dependency_pairs:
        if task not in task_name_set:
            raise ValueError(f"Dependency references unknown task: '{task}'")
        if depends_on not in task_name_set:
            raise ValueError(f"Dependency references unknown task: '{depends_on}'")
        if task == depends_on:
            raise ValueError(f"Task '{task}' cannot depend on itself")
        pair = (task, depends_on)
        if pair in seen_pairs:
            raise ValueError(
                f"Duplicate dependency detected: '{task}' already depends on '{depends_on}'"
            )
        seen_pairs.add(pair)

    if detect_cycle(task_names, dependency_pairs):
        raise ValueError("Pipeline contains a circular dependency")

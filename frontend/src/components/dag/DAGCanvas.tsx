import { useCallback, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import type { PipelineExecution, TaskExecution } from "@/types/execution";
import TaskNode, { type TaskNodeData } from "./TaskNode";
import TaskDetailPanel from "./TaskDetailPanel";

const nodeTypes = { taskNode: TaskNode };

const STATUS_COLORS: Record<string, string> = {
  PENDING:   "#475569",
  RUNNING:   "#3b82f6",
  COMPLETED: "#10b981",
  FAILED:    "#ef4444",
  SKIPPED:   "#f59e0b",
};

/**
 * Compute a simple top-down layered layout.
 * We do a topological sort using in-degree and assign Y levels.
 */
function computeLayout(
  tasks: TaskExecution[],
  edges: Edge[]
): Record<string, { x: number; y: number }> {
  const NODE_W = 200;
  const NODE_H = 80;
  const H_GAP = 60;
  const V_GAP = 80;

  const idSet = new Set(tasks.map((t) => t.id));
  const inDegree: Record<string, number> = {};
  const adjacency: Record<string, string[]> = {};

  tasks.forEach((t) => {
    inDegree[t.id] = 0;
    adjacency[t.id] = [];
  });

  edges.forEach(({ source, target }) => {
    if (idSet.has(source) && idSet.has(target)) {
      adjacency[source].push(target);
      inDegree[target] = (inDegree[target] ?? 0) + 1;
    }
  });

  // BFS level assignment
  const levels: Record<string, number> = {};
  const queue = tasks.filter((t) => inDegree[t.id] === 0).map((t) => t.id);
  queue.forEach((id) => (levels[id] = 0));

  const visited = new Set<string>();
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    if (visited.has(cur)) continue;
    visited.add(cur);
    adjacency[cur].forEach((next) => {
      const newLevel = (levels[cur] ?? 0) + 1;
      if (levels[next] === undefined || levels[next] < newLevel) {
        levels[next] = newLevel;
      }
      if (!visited.has(next)) queue.push(next);
    });
  }

  // Group by level
  const byLevel: Record<number, string[]> = {};
  Object.entries(levels).forEach(([id, lvl]) => {
    byLevel[lvl] = [...(byLevel[lvl] ?? []), id];
  });

  const positions: Record<string, { x: number; y: number }> = {};
  Object.entries(byLevel).forEach(([lvlStr, ids]) => {
    const lvl = Number(lvlStr);
    const totalWidth = ids.length * NODE_W + (ids.length - 1) * H_GAP;
    ids.forEach((id, i) => {
      positions[id] = {
        x: i * (NODE_W + H_GAP) - totalWidth / 2 + NODE_W / 2,
        y: lvl * (NODE_H + V_GAP),
      };
    });
  });

  return positions;
}

interface DAGCanvasProps {
  execution: PipelineExecution;
  edges: Edge[];
}

export default function DAGCanvas({ execution, edges }: DAGCanvasProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const selectedTask = useMemo(
    () => execution.tasks.find((t) => t.id === selectedTaskId) ?? null,
    [execution.tasks, selectedTaskId]
  );

  const positions = useMemo(
    () => computeLayout(execution.tasks, edges),
    [execution.tasks, edges]
  );

  const nodes: Node<TaskNodeData>[] = useMemo(
    () =>
      execution.tasks.map((te) => ({
        id: te.id,
        type: "taskNode",
        position: positions[te.id] ?? { x: 0, y: 0 },
        data: {
          label: te.name ?? te.id,
          status: te.status,
          duration: te.duration,
        },
        selected: te.id === selectedTaskId,
      })),
    [execution.tasks, positions, selectedTaskId]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedTaskId((prev) => (prev === node.id ? null : node.id));
    },
    []
  );

  const onPaneClick = useCallback(() => setSelectedTaskId(null), []);

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
        className="bg-gray-950"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#374151"
        />
        <Controls showInteractive={false} className="!bg-gray-800 !border-gray-700" />
        <MiniMap
          nodeColor={(n) => STATUS_COLORS[(n.data as TaskNodeData)?.status ?? "PENDING"]}
          maskColor="rgba(0,0,0,0.6)"
          className="!bg-gray-900 !border-gray-700 !rounded-lg"
        />
      </ReactFlow>

      {/* Side panel */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  );
}

import { useCallback, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  BackgroundVariant,
} from "reactflow";
import dagre from "dagre";
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
 * Compute auto-layout using dagre.
 */
function getLayoutedElements(tasks: TaskExecution[], edges: Edge[]) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  // TB = top-to-bottom layout
  dagreGraph.setGraph({ rankdir: "TB", nodesep: 80, ranksep: 120 });

  tasks.forEach((t) => {
    // Approx dimensions of the TaskNode component
    dagreGraph.setNode(t.id, { width: 180, height: 80 });
  });

  edges.forEach((e) => {
    dagreGraph.setEdge(e.source, e.target);
  });

  dagre.layout(dagreGraph);

  const nodes: Node<TaskNodeData>[] = tasks.map((te) => {
    const nodeWithPosition = dagreGraph.node(te.id);
    return {
      id: te.id,
      type: "taskNode",
      targetPosition: "top" as any,
      sourcePosition: "bottom" as any,
      // Shift to center the nodes
      position: {
        x: nodeWithPosition.x - 180 / 2,
        y: nodeWithPosition.y - 80 / 2,
      },
      data: {
        label: te.name ?? te.id,
        status: te.status,
        duration: te.duration,
      },
    };
  });

  return nodes;
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

  const rawNodes = useMemo(
    () => getLayoutedElements(execution.tasks, edges),
    [execution.tasks, edges]
  );

  const nodes: Node<TaskNodeData>[] = useMemo(
    () =>
      rawNodes.map((n) => ({
        ...n,
        selected: n.id === selectedTaskId,
      })),
    [rawNodes, selectedTaskId]
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
        <Controls showInteractive={false} className="!bg-gray-800 !border-gray-700 !fill-gray-300" />
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

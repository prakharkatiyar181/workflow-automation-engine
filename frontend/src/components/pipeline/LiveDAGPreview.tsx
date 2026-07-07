import { useMemo } from "react";
import ReactFlow, { Background, BackgroundVariant, type Node, type Edge } from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";
import { Circle } from "lucide-react";

interface TaskField {
  name: string;
}

interface DependencyField {
  task: string;
  depends_on: string;
}

interface LiveDAGPreviewProps {
  tasks: TaskField[];
  dependencies: DependencyField[];
}

const nodeTypes = {
  previewNode: ({ data }: any) => (
    <div className="min-w-[120px] rounded-lg border-2 border-gray-600 bg-gray-800/90 px-3 py-2 shadow-lg backdrop-blur-sm flex items-center gap-2">
      <Circle className="w-3 h-3 text-gray-400" />
      <span className="text-xs font-semibold text-gray-200 truncate">{data.label}</span>
    </div>
  ),
};

export default function LiveDAGPreview({ tasks, dependencies }: LiveDAGPreviewProps) {
  const { nodes, edges } = useMemo(() => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: "TB", nodesep: 40, ranksep: 60 });

    const computedNodes: Node[] = [];
    const computedEdges: Edge[] = [];
    const validTaskNames = new Set(tasks.map((t) => t.name.trim()).filter(Boolean));

    tasks.forEach((t, i) => {
      const label = t.name.trim() || `Task ${i + 1}`;
      const id = `node-${i}`;
      dagreGraph.setNode(id, { width: 140, height: 40 });
      computedNodes.push({
        id,
        type: "previewNode",
        position: { x: 0, y: 0 },
        data: { label },
      });
    });

    // Map names back to node IDs for edges
    const nameToId = new Map<string, string>();
    tasks.forEach((t, i) => {
      const name = t.name.trim();
      if (name) nameToId.set(name, `node-${i}`);
    });

    dependencies.forEach((d, i) => {
      if (d.task && d.depends_on && validTaskNames.has(d.task) && validTaskNames.has(d.depends_on)) {
        const sourceId = nameToId.get(d.depends_on);
        const targetId = nameToId.get(d.task);
        if (sourceId && targetId) {
          dagreGraph.setEdge(sourceId, targetId);
          computedEdges.push({
            id: `edge-${i}`,
            source: sourceId,
            target: targetId,
            type: "smoothstep",
            style: { stroke: "#64748b", strokeWidth: 2 },
          });
        }
      }
    });

    dagre.layout(dagreGraph);

    computedNodes.forEach((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      if (nodeWithPosition) {
        node.targetPosition = "top" as any;
        node.sourcePosition = "bottom" as any;
        node.position = {
          x: nodeWithPosition.x - 140 / 2,
          y: nodeWithPosition.y - 40 / 2,
        };
      }
    });

    return { nodes: computedNodes, edges: computedEdges };
  }, [tasks, dependencies]);

  if (tasks.length === 0 || (tasks.length === 1 && !tasks[0].name)) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-500">
        Start building your pipeline to see the preview.
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      proOptions={{ hideAttribution: true }}
      className="bg-gray-950/50 rounded-xl"
    >
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#374151" />
    </ReactFlow>
  );
}

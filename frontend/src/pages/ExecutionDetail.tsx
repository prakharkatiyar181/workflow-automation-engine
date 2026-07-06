import { useParams, Link } from "react-router-dom";
import { useExecution } from "@/hooks/useExecution";
import { usePipeline } from "@/hooks/usePipelines";
import { useExecutionWS } from "@/hooks/useExecutionWS";
import Layout from "@/components/layout/Layout";
import DAGCanvas from "@/components/dag/DAGCanvas";
import Badge from "@/components/ui/Badge";
import { type Edge } from "reactflow";
import { useMemo } from "react";

export default function ExecutionDetail() {
  const { id } = useParams<{ id: string }>();

  // Fetch execution details and enable WebSocket updates
  const { data: execution, isLoading: execLoading, isError: execError } = useExecution(id!);
  useExecutionWS(id!);

  // Fetch parent pipeline to get topology (dependencies)
  const pipelineId = execution?.pipeline_id;
  const { data: pipeline, isLoading: pipeLoading } = usePipeline(pipelineId!);

  // Compute edges for React Flow
  const edges = useMemo<Edge[]>(() => {
    if (!pipeline?.dependencies || !pipeline?.tasks || !execution?.tasks) {
      return [];
    }

    // Map pipeline task UUID -> pipeline task name
    const taskIdToName = new Map<string, string>();
    pipeline.tasks.forEach((t) => taskIdToName.set(t.id, t.name));

    // Map task name -> execution task UUID (this is what nodes use)
    const nameToExecId = new Map<string, string>();
    execution.tasks.forEach((t) => nameToExecId.set(t.name, t.id));

    const computedEdges: Edge[] = [];

    pipeline.dependencies.forEach((dep, idx) => {
      const fromName = taskIdToName.get(dep.from);
      const toName = taskIdToName.get(dep.to);
      if (fromName && toName) {
        const sourceExecId = nameToExecId.get(fromName);
        const targetExecId = nameToExecId.get(toName);
        if (sourceExecId && targetExecId) {
          computedEdges.push({
            id: `edge-${idx}`,
            source: sourceExecId,
            target: targetExecId,
            type: "smoothstep",
            animated: execution.tasks.find(t => t.id === sourceExecId)?.status === "RUNNING",
            style: { stroke: "#64748b", strokeWidth: 2 },
          });
        }
      }
    });

    return computedEdges;
  }, [pipeline, execution]);

  if (execLoading || (pipelineId && pipeLoading)) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading execution data...</p>
        </div>
      </Layout>
    );
  }

  if (execError || !execution) {
    return (
      <Layout>
        <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-6 text-center">
          <p className="text-red-400">Failed to load execution details.</p>
          <Link to="/" className="text-blue-400 hover:underline text-sm mt-2 block">
            Return to Dashboard
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {execution.pipeline_name}
              </h1>
              <Badge status={execution.status} />
            </div>
            <p className="text-sm text-gray-500 mt-1 font-mono">
              Execution ID: {execution.id}
            </p>
          </div>
          <div className="flex gap-4 text-xs text-gray-400">
            <div>
              <span className="block text-gray-500">Started</span>
              <span className="font-mono text-gray-300">
                {execution.started_at ? new Date(execution.started_at).toLocaleTimeString() : "—"}
              </span>
            </div>
            <div>
              <span className="block text-gray-500">Completed</span>
              <span className="font-mono text-gray-300">
                {execution.completed_at ? new Date(execution.completed_at).toLocaleTimeString() : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* DAG Canvas */}
        <div className="flex-1 rounded-xl border border-gray-800 overflow-hidden relative">
          <DAGCanvas execution={execution} edges={edges} />
        </div>
      </div>
    </Layout>
  );
}

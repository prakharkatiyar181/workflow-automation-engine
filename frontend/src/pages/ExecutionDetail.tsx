import { useParams, Link } from "react-router-dom";
import { useExecution } from "@/hooks/useExecution";
import { usePipeline } from "@/hooks/usePipelines";
import { useExecutionWS } from "@/hooks/useExecutionWS";
import Layout from "@/components/layout/Layout";
import DAGCanvas from "@/components/dag/DAGCanvas";
import Badge from "@/components/ui/Badge";
import { type Edge } from "reactflow";
import { useMemo } from "react";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import clsx from "clsx";

export default function ExecutionDetail() {
  const { id } = useParams<{ id: string }>();

  // Fetch execution details and enable WebSocket updates
  const { data: execution, isLoading: execLoading, isError: execError } = useExecution(id!);
  const { isConnected, isReconnecting } = useExecutionWS(id!);

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
          const isRunning = execution.tasks.find(t => t.id === sourceExecId)?.status === "RUNNING";
          computedEdges.push({
            id: `edge-${idx}`,
            source: sourceExecId,
            target: targetExecId,
            type: "smoothstep",
            animated: isRunning,
            style: { 
              stroke: isRunning ? "#3b82f6" : "#64748b", 
              strokeWidth: isRunning ? 3 : 2 
            },
          });
        }
      }
    });

    return computedEdges;
  }, [pipeline, execution]);

  // Compute Progress
  const progress = useMemo(() => {
    if (!execution?.tasks || execution.tasks.length === 0) return { completed: 0, total: 0, percentage: 0 };
    const total = execution.tasks.length;
    const completed = execution.tasks.filter(t => t.status === "COMPLETED" || t.status === "SKIPPED").length;
    return {
      completed,
      total,
      percentage: Math.round((completed / total) * 100)
    };
  }, [execution?.tasks]);

  if (execLoading || (pipelineId && pipeLoading)) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-gray-400 text-sm">Loading execution data...</p>
        </div>
      </Layout>
    );
  }

  if (execError || !execution) {
    return (
      <Layout>
        <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-6 text-center max-w-md mx-auto mt-20">
          <WifiOff className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 font-semibold text-lg">Unable to connect to workflow server</p>
          <p className="text-red-300/80 text-sm mt-1">Pipeline execution failed to load or the backend is offline.</p>
          <Link to="/" className="text-blue-400 hover:underline text-sm mt-4 inline-block">
            Return to Dashboard
          </Link>
        </div>
      </Layout>
    );
  }

  // Connection Indicator logic
  let ConnectionIndicator = null;
  if (!["COMPLETED", "FAILED"].includes(execution.status)) {
    if (isConnected) {
      ConnectionIndicator = (
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md border border-emerald-400/20">
          <Wifi className="w-3 h-3" /> Connected
        </div>
      );
    } else if (isReconnecting) {
      ConnectionIndicator = (
        <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md border border-amber-400/20">
          <Loader2 className="w-3 h-3 animate-spin" /> Reconnecting...
        </div>
      );
    } else {
      ConnectionIndicator = (
        <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded-md border border-red-400/20">
          <WifiOff className="w-3 h-3" /> Disconnected
        </div>
      );
    }
  }

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 shrink-0 bg-gray-900/50 p-4 rounded-xl border border-gray-800 backdrop-blur-sm">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {execution.pipeline_name}
              </h1>
              <Badge status={execution.status} />
              {ConnectionIndicator}
            </div>
            
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="font-mono bg-gray-800 px-2 py-0.5 rounded text-gray-400">
                ID: {execution.id}
              </span>
              <div className="flex gap-4">
                <div>
                  <span className="text-gray-500 mr-1">Started:</span>
                  <span className="font-mono text-gray-300">
                    {execution.started_at ? new Date(execution.started_at).toLocaleTimeString() : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 mr-1">Completed:</span>
                  <span className="font-mono text-gray-300">
                    {execution.completed_at ? new Date(execution.completed_at).toLocaleTimeString() : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-64 space-y-2 ml-4">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-gray-400">Pipeline Progress</span>
              <span className="text-blue-400">{progress.completed} / {progress.total} Tasks</span>
            </div>
            <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
              <div 
                className={clsx(
                  "h-full transition-all duration-500",
                  execution.status === "FAILED" ? "bg-red-500" :
                  execution.status === "COMPLETED" ? "bg-emerald-500" : "bg-blue-500"
                )}
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <div className="text-right text-[10px] text-gray-500">
              {progress.percentage}% Completed
            </div>
          </div>
        </div>

        {/* DAG Canvas */}
        <div className="flex-1 rounded-xl border border-gray-800 overflow-hidden relative shadow-xl">
          <DAGCanvas execution={execution} edges={edges} />
        </div>
      </div>
    </Layout>
  );
}

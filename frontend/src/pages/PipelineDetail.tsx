import { useParams, useNavigate, Link } from "react-router-dom";
import { usePipeline, useExecutePipeline } from "@/hooks/usePipelines";
import Layout from "@/components/layout/Layout";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Loader2, Play, Activity, Clock, ChevronLeft, GitBranch } from "lucide-react";

export default function PipelineDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: pipeline, isLoading, isError } = usePipeline(id!);
  const { mutate: execute, isPending } = useExecutePipeline();

  const handleRun = () => {
    execute(id!, {
      onSuccess: (data) => navigate(`/executions/${data.execution_id}`),
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-gray-400 text-sm">Loading pipeline...</p>
        </div>
      </Layout>
    );
  }

  if (isError || !pipeline) {
    return (
      <Layout>
        <div className="card p-10 text-center max-w-md mx-auto mt-20 flex flex-col items-center space-y-4">
          <Activity className="w-10 h-10 text-red-500" />
          <p className="text-red-400 font-semibold text-lg">Pipeline not found</p>
          <p className="text-gray-500 text-sm">This pipeline may have been deleted or the ID is invalid.</p>
          <Link to="/" className="text-blue-400 hover:underline text-sm">
            Return to Dashboard
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        {/* Back */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white tracking-tight">{pipeline.name}</h1>
            </div>
            {pipeline.description ? (
              <p className="text-sm text-gray-400">{pipeline.description}</p>
            ) : (
              <p className="text-sm text-gray-600 italic">No description provided.</p>
            )}
          </div>
          <Button size="lg" onClick={handleRun} loading={isPending} className="shrink-0 shadow-blue-500/20 shadow-lg">
            <Play className="w-4 h-4 fill-current" /> Run Pipeline
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="card p-4 flex items-center gap-3">
            <GitBranch className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Tasks</p>
              <p className="text-xl font-bold text-white">{pipeline.task_count}</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Created</p>
              <p className="text-sm font-semibold text-white">
                {new Date(pipeline.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          {pipeline.latest_execution && (
            <div className="card p-4 flex items-center gap-3">
              <Activity className="w-5 h-5 text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Last Run</p>
                <Badge status={pipeline.latest_execution.status} />
              </div>
            </div>
          )}
        </div>

        {/* No Executions CTA */}
        <div className="card p-12 text-center flex flex-col items-center space-y-4 border border-dashed border-gray-700/50 bg-gray-900/30">
          <div className="w-14 h-14 rounded-2xl bg-gray-800/80 flex items-center justify-center">
            <Play className="w-7 h-7 text-gray-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">This pipeline has not been executed yet</h2>
            <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
              Trigger your first run to see real-time task execution and live DAG updates.
            </p>
          </div>
          <Button size="md" onClick={handleRun} loading={isPending}>
            <Play className="w-4 h-4 fill-current" /> Run Pipeline Now
          </Button>
        </div>
      </div>
    </Layout>
  );
}

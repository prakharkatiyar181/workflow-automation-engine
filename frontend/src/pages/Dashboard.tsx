import { usePipelines } from "@/hooks/usePipelines";
import { usePipelineWS } from "@/hooks/usePipelineWS";
import Layout from "@/components/layout/Layout";
import PipelineCard from "@/components/pipeline/PipelineCard";
import { PipelineCardSkeleton } from "@/components/ui/Skeleton";
import { Link } from "react-router-dom";
import { Activity, PlayCircle, CheckCircle2, XCircle, Wifi } from "lucide-react";
import Button from "@/components/ui/Button";

export default function Dashboard() {
  const { data: pipelines, isLoading, isError, error } = usePipelines();
  const { isConnected } = usePipelineWS();

  const stats = {
    total: pipelines?.length || 0,
    running: pipelines?.filter(p => p.latest_execution?.status === "RUNNING").length || 0,
    completed: pipelines?.filter(p => p.latest_execution?.status === "COMPLETED").length || 0,
    failed: pipelines?.filter(p => p.latest_execution?.status === "FAILED").length || 0,
  };

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Workflow Engine</h1>
            <p className="text-sm text-gray-400 mt-1">Build and monitor automated pipelines</p>
          </div>
          <Link to="/create">
            <Button size="lg" className="w-full sm:w-auto shadow-blue-500/20 shadow-lg">
              + Create Pipeline
            </Button>
          </Link>
        </div>

        {/* Stats Section */}
        {!isError && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-5 border border-gray-800 bg-gray-900/50 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2 text-gray-400">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Total Pipelines</span>
              </div>
              <span className="text-3xl font-bold text-white">{isLoading ? "-" : stats.total}</span>
            </div>
            <div className="card p-5 border border-gray-800 bg-gray-900/50 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2 text-gray-400">
                <PlayCircle className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Running</span>
              </div>
              <span className="text-3xl font-bold text-white">{isLoading ? "-" : stats.running}</span>
            </div>
            <div className="card p-5 border border-gray-800 bg-gray-900/50 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2 text-gray-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-wider">Completed</span>
              </div>
              <span className="text-3xl font-bold text-white">{isLoading ? "-" : stats.completed}</span>
            </div>
            <div className="card p-5 border border-gray-800 bg-gray-900/50 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2 text-gray-400">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-xs font-bold uppercase tracking-wider">Failed</span>
              </div>
              <span className="text-3xl font-bold text-white">{isLoading ? "-" : stats.failed}</span>
            </div>
          </div>
        )}

        {/* Pipelines Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-white tracking-tight">Your Pipelines</h2>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-900 rounded-full border border-gray-800">
                <Wifi className={`w-3.5 h-3.5 ${isConnected ? 'text-green-500' : 'text-gray-500'}`} />
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                  {isConnected ? 'Live' : 'Connecting'}
                </span>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <PipelineCardSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <div className="bg-red-950/30 border border-red-900/50 rounded-2xl p-10 text-center max-w-lg mx-auto mt-12 flex flex-col items-center shadow-2xl">
              <XCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-red-400 font-bold text-lg">Unable to connect to workflow server</p>
              <p className="text-red-300/70 text-sm mt-2">
                {(error as any)?.userMessage || error.message || "Please check if the backend service is running."}
              </p>
            </div>
          ) : !pipelines || pipelines.length === 0 ? (
            <div className="card p-16 text-center flex flex-col items-center justify-center space-y-5 border border-dashed border-gray-700/50 bg-gray-900/30">
              <div className="w-16 h-16 rounded-2xl bg-gray-800/80 flex items-center justify-center shadow-inner">
                <Activity className="w-8 h-8 text-gray-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Create your first workflow</h3>
                <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">
                  Get started by designing a new workflow DAG with tasks and dependencies.
                </p>
              </div>
              <Link to="/create">
                <Button size="md" className="mt-2">
                  Create Pipeline
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {pipelines.map((pipeline) => (
                <PipelineCard key={pipeline.id} pipeline={pipeline} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

import { usePipelines } from "@/hooks/usePipelines";
import Layout from "@/components/layout/Layout";
import PipelineCard from "@/components/pipeline/PipelineCard";
import { PipelineCardSkeleton } from "@/components/ui/Skeleton";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { data: pipelines, isLoading, isError, error } = usePipelines();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Pipelines</h1>
            <p className="text-sm text-gray-400 mt-1">Manage and execute your workflow DAGs</p>
          </div>
          <Link
            to="/create"
            className="btn-primary"
          >
            + Create Pipeline
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <PipelineCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-6 text-center">
            <p className="text-red-400">Failed to load pipelines</p>
            <p className="text-xs text-red-300 mt-1">{(error as any)?.userMessage || error.message}</p>
          </div>
        ) : !pipelines || pipelines.length === 0 ? (
          <div className="card p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">No pipelines yet</h3>
              <p className="text-sm text-gray-400 mt-1">Get started by creating your first workflow DAG.</p>
            </div>
            <Link to="/create" className="btn-secondary mt-2">
              Create Pipeline
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pipelines.map((pipeline) => (
              <PipelineCard key={pipeline.id} pipeline={pipeline} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

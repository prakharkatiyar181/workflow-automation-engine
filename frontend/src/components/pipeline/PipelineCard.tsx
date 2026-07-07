import { useNavigate } from "react-router-dom";
import type { Pipeline } from "@/types/pipeline";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useExecutePipeline } from "@/hooks/usePipelines";
import { clsx } from "clsx";
import { Play, Activity, Clock, ChevronRight } from "lucide-react";

interface PipelineCardProps {
  pipeline: Pipeline;
}

export default function PipelineCard({ pipeline }: PipelineCardProps) {
  const { mutate: execute, isPending } = useExecutePipeline();
  const navigate = useNavigate();

  const latestStatus = pipeline.latest_execution?.status;

  return (
    <div
      className={clsx(
        "card flex flex-col transition-all duration-300",
        "hover:border-gray-600 hover:shadow-xl hover:shadow-black/40 group overflow-hidden bg-gray-900/40 relative"
      )}
    >
      {/* Decorative top border based on status */}
      <div className={clsx(
        "absolute top-0 left-0 w-full h-1",
        latestStatus === "RUNNING" ? "bg-blue-500" :
        latestStatus === "COMPLETED" ? "bg-emerald-500" :
        latestStatus === "FAILED" ? "bg-red-500" :
        "bg-gray-700"
      )} />

      <div className="p-6 flex flex-col h-full gap-5">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3
              className="text-lg font-bold text-white truncate group-hover:text-blue-400 transition-colors cursor-pointer"
              onClick={() => navigate(`/executions/${pipeline.latest_execution?.id || ''}`)}
              title={pipeline.name}
            >
              {pipeline.name}
            </h3>
            {pipeline.description ? (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">{pipeline.description}</p>
            ) : (
              <p className="text-sm text-gray-600 italic mt-1">No description provided.</p>
            )}
          </div>
          {latestStatus && <Badge status={latestStatus} className="shrink-0" />}
        </div>

        <div className="flex-1" />

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
          <span className="flex items-center gap-1.5 bg-gray-800/50 px-2 py-1 rounded-md border border-gray-700/50">
            <Activity className="w-3.5 h-3.5 text-gray-400" />
            {pipeline.task_count} {pipeline.task_count === 1 ? "task" : "tasks"}
          </span>
          <span className="flex items-center gap-1.5 bg-gray-800/50 px-2 py-1 rounded-md border border-gray-700/50">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            {new Date(pipeline.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="bg-gray-950/50 px-6 py-4 border-t border-gray-800 flex items-center justify-between">
        {pipeline.latest_execution ? (
          <button
            className="text-xs font-semibold text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-1 group/btn"
            onClick={() => navigate(`/executions/${pipeline.latest_execution!.id}`)}
          >
            View last run
            <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        ) : (
          <span className="text-xs font-medium text-gray-600">No executions yet</span>
        )}
        <Button
          size="sm"
          variant="primary"
          loading={isPending}
          onClick={() => execute(pipeline.id)}
          className="shadow-blue-500/20"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Run
        </Button>
      </div>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import type { Pipeline } from "@/types/pipeline";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useExecutePipeline } from "@/hooks/usePipelines";
import { clsx } from "clsx";

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
        "card p-5 flex flex-col gap-4 transition-all duration-200",
        "hover:border-gray-700 hover:shadow-lg hover:shadow-black/20 group"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            className="text-sm font-semibold text-white truncate group-hover:text-blue-300 transition-colors cursor-pointer"
            onClick={() =>
              pipeline.latest_execution &&
              navigate(`/executions/${pipeline.latest_execution.id}`)
            }
          >
            {pipeline.name}
          </h3>
          {pipeline.description && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{pipeline.description}</p>
          )}
        </div>
        {latestStatus && <Badge status={latestStatus} />}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          {pipeline.task_count} {pipeline.task_count === 1 ? "task" : "tasks"}
        </span>
        <span>·</span>
        <span>
          Created{" "}
          {new Date(pipeline.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>

      {/* Action */}
      <div className="flex items-center justify-between pt-1">
        {pipeline.latest_execution ? (
          <button
            className="text-xs text-gray-500 hover:text-blue-400 transition-colors"
            onClick={() => navigate(`/executions/${pipeline.latest_execution!.id}`)}
          >
            View last run →
          </button>
        ) : (
          <span className="text-xs text-gray-600">No executions yet</span>
        )}
        <Button
          size="sm"
          loading={isPending}
          onClick={() => execute(pipeline.id)}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-6.586-3.77A1 1 0 006 8.232v7.536a1 1 0 001.166.98l6.586-1.51A1 1 0 0015 14.31v-2.376a1 1 0 00-.248-.766z" />
          </svg>
          Run
        </Button>
      </div>
    </div>
  );
}

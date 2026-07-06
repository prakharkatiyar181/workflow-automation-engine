import type { TaskExecution } from "@/types/execution";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface TaskDetailPanelProps {
  task: TaskExecution;
  onClose: () => void;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(0);
  return `${m}m ${s}s`;
}

function formatTs(ts: string | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function TaskDetailPanel({ task, onClose }: TaskDetailPanelProps) {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Status",    value: "" /* rendered separately */ },
    { label: "Started",   value: formatTs(task.started_at) },
    { label: "Completed", value: formatTs(task.completed_at) },
    { label: "Duration",  value: formatDuration(task.duration) },
    { label: "Task ID",   value: task.id.slice(0, 8) + "…" },
  ];

  return (
    <aside className="absolute top-0 right-0 h-full w-72 card rounded-none rounded-r-none border-l border-gray-800 flex flex-col z-10 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h3 className="text-sm font-semibold text-white truncate">
          {task.name ?? "Task Details"}
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 space-y-4">
        <div className="space-y-3">
          {/* Status separately for badge */}
          <div className="flex items-center justify-between py-2 border-b border-gray-800/60">
            <span className="text-xs text-gray-500">Status</span>
            <Badge status={task.status} />
          </div>

          {rows.slice(1).map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-gray-800/40">
              <span className="text-xs text-gray-500">{label}</span>
              <span className="text-xs text-gray-300 font-mono">{value}</span>
            </div>
          ))}
        </div>

        {/* Error message */}
        {task.error_message && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-1.5">Error</p>
            <div className="bg-red-900/20 border border-red-800/40 rounded-lg p-3">
              <p className="text-xs text-red-300 font-mono break-words leading-relaxed">
                {task.error_message}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

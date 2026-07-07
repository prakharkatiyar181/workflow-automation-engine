import { useEffect } from "react";
import type { TaskExecution } from "@/types/execution";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { X, Clock, Play, CheckCircle2, AlertTriangle, FileText, Hash } from "lucide-react";
import clsx from "clsx";

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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <aside className="absolute top-0 right-0 h-full w-80 bg-gray-900 border-l border-gray-800 flex flex-col z-10 overflow-auto shadow-2xl animate-in slide-in-from-right-10 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-900/95 sticky top-0 backdrop-blur">
        <h3 className="text-sm font-bold text-white truncate flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          {task.name ?? "Task Details"}
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="shrink-0 p-1.5 h-auto text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-5 space-y-6">
        
        <section className="space-y-3">
          <h4 className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Task Information</h4>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-200">{task.name}</p>
            <p className="text-xs text-gray-500">
              No description provided.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
            <Hash className="w-3.5 h-3.5" />
            <span className="font-mono">{task.id}</span>
          </div>
        </section>

        <section className="space-y-3">
          <h4 className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Execution Details</h4>
          <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 space-y-4">
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">Status</span>
              <Badge status={task.status} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-gray-400">
                <Play className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Started</span>
              </div>
              <span className="text-xs text-gray-300 font-mono bg-gray-950 px-1.5 py-0.5 rounded">{formatTs(task.started_at)}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-gray-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Completed</span>
              </div>
              <span className="text-xs text-gray-300 font-mono bg-gray-950 px-1.5 py-0.5 rounded">{formatTs(task.completed_at)}</span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
              <div className="flex items-center gap-1.5 text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Duration</span>
              </div>
              <span className={clsx(
                "text-xs font-mono font-bold",
                task.duration !== null ? "text-blue-400" : "text-gray-500"
              )}>
                {formatDuration(task.duration)}
              </span>
            </div>
          </div>
        </section>

        {/* Error message */}
        {task.status === "FAILED" && task.error_message && (
          <section className="space-y-3">
            <h4 className="text-[10px] font-bold tracking-wider text-red-400/80 uppercase flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" />
              Failure Reason
            </h4>
            <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50" />
              <p className="text-xs text-red-200 font-mono break-words leading-relaxed pl-1">
                {task.error_message}
              </p>
            </div>
          </section>
        )}
      </div>
    </aside>
  );
}

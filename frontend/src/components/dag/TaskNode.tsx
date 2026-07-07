import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import type { TaskExecutionStatus } from "@/types/execution";
import { clsx } from "clsx";
import { Circle, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export interface TaskNodeData {
  label: string;
  status: TaskExecutionStatus;
  duration: number | null;
}

const statusConfig: Record<TaskExecutionStatus, {
  border: string;
  bg: string;
  text: string;
  glow: string;
  pulse: boolean;
  label: string;
}> = {
  PENDING:   { border: "border-slate-600",   bg: "bg-slate-800/80",   text: "text-slate-300",   glow: "",                          pulse: false, label: "Pending" },
  RUNNING:   { border: "border-blue-500",    bg: "bg-blue-900/50",    text: "text-blue-300",    glow: "shadow-blue-500/30",        pulse: true,  label: "Running" },
  COMPLETED: { border: "border-emerald-500", bg: "bg-emerald-900/40", text: "text-emerald-300", glow: "shadow-emerald-500/20",     pulse: false, label: "Completed" },
  FAILED:    { border: "border-red-500",     bg: "bg-red-900/40",     text: "text-red-300",     glow: "shadow-red-500/30",         pulse: false, label: "Failed" },
  SKIPPED:   { border: "border-amber-500",   bg: "bg-amber-900/30",   text: "text-amber-300",   glow: "shadow-amber-500/20",       pulse: false, label: "Skipped" },
};

const StatusIcon = ({ status, className }: { status: TaskExecutionStatus; className?: string }) => {
  switch (status) {
    case "PENDING":   return <Circle className={className} />;
    case "RUNNING":   return <Loader2 className={clsx(className, "animate-spin")} />;
    case "COMPLETED": return <CheckCircle2 className={className} />;
    case "FAILED":    return <XCircle className={className} />;
    case "SKIPPED":   return <AlertCircle className={className} />;
  }
};

function TaskNode({ data, selected }: NodeProps<TaskNodeData>) {
  const cfg = statusConfig[data.status];

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-gray-600 !border-gray-500 !w-3 !h-3" />
      <div
        className={clsx(
          "w-[180px] rounded-xl border-2 px-4 py-3 transition-all duration-300",
          "shadow-lg backdrop-blur-sm cursor-pointer select-none flex flex-col gap-1.5",
          cfg.border, cfg.bg,
          cfg.glow && `shadow-[0_0_12px_2px]`,
          selected && "ring-2 ring-white/30 ring-offset-0 ring-offset-gray-900",
          cfg.pulse && "animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]"
        )}
      >
        {/* Task name */}
        <div className="text-sm font-bold text-gray-100 truncate w-full">
          {data.label}
        </div>

        {/* Status icon + Label */}
        <div className="flex items-center gap-1.5">
          <StatusIcon status={data.status} className={clsx("w-3.5 h-3.5 shrink-0", cfg.text)} />
          <span className={clsx("text-xs font-semibold uppercase tracking-wider", cfg.text)}>
            {cfg.label}
          </span>
        </div>

        {/* Duration */}
        <div className="text-xs text-gray-400 font-mono mt-0.5">
          {data.duration !== null ? `${data.duration.toFixed(1)} sec` : "—"}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-gray-600 !border-gray-500 !w-3 !h-3" />
    </>
  );
}

export default memo(TaskNode);

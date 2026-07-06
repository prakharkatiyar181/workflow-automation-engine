import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import type { TaskExecutionStatus } from "@/types/execution";
import { clsx } from "clsx";

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
}> = {
  PENDING:   { border: "border-slate-600",   bg: "bg-slate-800/80",   text: "text-slate-300",   glow: "",                          pulse: false },
  RUNNING:   { border: "border-blue-500",    bg: "bg-blue-900/50",    text: "text-blue-200",    glow: "shadow-blue-500/30",        pulse: true  },
  COMPLETED: { border: "border-emerald-500", bg: "bg-emerald-900/40", text: "text-emerald-200", glow: "shadow-emerald-500/20",     pulse: false },
  FAILED:    { border: "border-red-500",     bg: "bg-red-900/40",     text: "text-red-200",     glow: "shadow-red-500/30",         pulse: false },
  SKIPPED:   { border: "border-amber-500",   bg: "bg-amber-900/30",   text: "text-amber-200",   glow: "shadow-amber-500/20",       pulse: false },
};

const statusIcon: Record<TaskExecutionStatus, string> = {
  PENDING:   "○",
  RUNNING:   "◎",
  COMPLETED: "✓",
  FAILED:    "✕",
  SKIPPED:   "⊘",
};

function TaskNode({ data, selected }: NodeProps<TaskNodeData>) {
  const cfg = statusConfig[data.status];

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-gray-600 !border-gray-500" />
      <div
        className={clsx(
          "min-w-[140px] max-w-[180px] rounded-xl border-2 px-4 py-3 transition-all duration-300",
          "shadow-lg backdrop-blur-sm cursor-pointer select-none",
          cfg.border, cfg.bg,
          cfg.glow && `shadow-[0_0_12px_2px]`,
          selected && "ring-2 ring-white/30 ring-offset-0",
          cfg.pulse && "animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]"
        )}
      >
        {/* Status icon + name */}
        <div className="flex items-center gap-2">
          <span className={clsx("text-sm font-mono leading-none", cfg.text)}>
            {statusIcon[data.status]}
          </span>
          <span className={clsx("text-xs font-semibold truncate", cfg.text)}>
            {data.label}
          </span>
        </div>

        {/* Duration pill */}
        {data.duration !== null && (
          <div className="mt-2 text-[10px] text-gray-500 font-mono">
            {data.duration.toFixed(1)}s
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-gray-600 !border-gray-500" />
    </>
  );
}

export default memo(TaskNode);

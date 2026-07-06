import type { TaskExecutionStatus, ExecutionStatus } from "@/types/execution";
import { clsx } from "clsx";

type Status = TaskExecutionStatus | ExecutionStatus;

const config: Record<Status, { label: string; classes: string; dot: string }> = {
  PENDING:   { label: "Pending",   classes: "bg-slate-800  text-slate-300  border-slate-700",  dot: "bg-slate-400"  },
  QUEUED:    { label: "Queued",    classes: "bg-violet-900/50 text-violet-300 border-violet-700", dot: "bg-violet-400 animate-pulse" },
  RUNNING:   { label: "Running",   classes: "bg-blue-900/50 text-blue-300   border-blue-700",   dot: "bg-blue-400 animate-pulse"   },
  COMPLETED: { label: "Completed", classes: "bg-emerald-900/50 text-emerald-300 border-emerald-700", dot: "bg-emerald-400" },
  FAILED:    { label: "Failed",    classes: "bg-red-900/50  text-red-300    border-red-700",    dot: "bg-red-400"    },
  SKIPPED:   { label: "Skipped",   classes: "bg-amber-900/50 text-amber-300 border-amber-700",  dot: "bg-amber-400"  },
};

interface BadgeProps {
  status: Status;
  className?: string;
}

export default function Badge({ status, className }: BadgeProps) {
  const { label, classes, dot } = config[status] ?? config["PENDING"];
  return (
    <span className={clsx("badge border", classes, className)}>
      <span className={clsx("w-1.5 h-1.5 rounded-full", dot)} />
      {label}
    </span>
  );
}

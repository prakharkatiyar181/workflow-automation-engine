/**
 * Execution domain types.
 *
 * These interfaces mirror the Django serializer output.
 * Populated with full fields in Phase 3 as APIs are built.
 */

export type ExecutionStatus =
  | "QUEUED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED";

export type TaskExecutionStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "SKIPPED";

export interface TaskExecution {
  id: string;
  name: string;            // task.name — serializer exposes as top-level "name"
  status: TaskExecutionStatus;
  started_at: string | null;   // ISO 8601
  completed_at: string | null;
  duration: number | null;     // seconds (float)
  error_message: string | null;
}

export interface PipelineExecution {
  id: string;
  pipeline_id: string;     // from PipelineExecutionDetailSerializer
  pipeline_name: string;
  status: ExecutionStatus;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  tasks: TaskExecution[];  // serializer field name is "tasks" (source=task_executions)
}


/** WebSocket event payloads (server → client) */
export interface WsTaskUpdateEvent {
  type: "task_update";
  taskId: string;
  taskName: string;
  status: TaskExecutionStatus;
  startedAt: string | null;
  completedAt: string | null;
  duration: number | null;
  error: string | null;
}

export interface WsExecutionUpdateEvent {
  type: "execution_update";
  executionId: string;
  status: ExecutionStatus;
  completedAt: string | null;
}

export type WsEvent = WsTaskUpdateEvent | WsExecutionUpdateEvent;

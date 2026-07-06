/**
 * Pipeline domain types.
 *
 * These interfaces mirror the Django serializer output.
 * Populated with full fields in Phase 3 as APIs are built.
 */

export type PipelineStatus =
  | "QUEUED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED";

export interface PipelineTask {
  id: string;
  name: string;
  description: string;
  estimated_duration: number;   // seconds
  failure_probability: number;  // 0.0 – 1.0
  order: number;
}

export interface TaskDependency {
  task: string;       // PipelineTask.id
  depends_on: string; // PipelineTask.id
}

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  task_count: number;
  created_at: string;  // ISO 8601
  updated_at: string;
  latest_execution: LatestExecution | null;
  tasks?: PipelineTask[];
  dependencies?: Array<{ from: string; to: string }>;
}

export interface LatestExecution {
  id: string;
  status: PipelineStatus;
  started_at: string | null;
}

/** Request payload for POST /api/pipelines/ */
export interface CreatePipelinePayload {
  name: string;
  description: string;
  tasks: Array<{
    name: string;
    description: string;
    estimated_duration: number;
    failure_probability: number;
  }>;
  dependencies: Array<{
    task: string;      // task name (resolved to ID by backend)
    depends_on: string;
  }>;
}

import apiClient from "./client";
import type { PipelineExecution } from "@/types/execution";

export const executionsApi = {
  get: (id: string) =>
    apiClient.get<PipelineExecution>(`/executions/${id}/`).then((r) => r.data),
};

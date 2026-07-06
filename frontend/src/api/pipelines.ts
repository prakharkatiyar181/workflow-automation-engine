import apiClient from "./client";
import type { Pipeline, CreatePipelinePayload } from "@/types/pipeline";

export const pipelinesApi = {
  list: () =>
    apiClient.get<Pipeline[]>("/pipelines/").then((r) => r.data),

  get: (id: string) =>
    apiClient.get<Pipeline>(`/pipelines/${id}/`).then((r) => r.data),

  create: (payload: CreatePipelinePayload) =>
    apiClient.post<Pipeline>("/pipelines/", payload).then((r) => r.data),

  execute: (id: string) =>
    apiClient
      .post<{ execution_id: string; status: string }>(`/pipelines/${id}/execute/`)
      .then((r) => r.data),
};

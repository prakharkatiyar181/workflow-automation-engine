import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { pipelinesApi } from "@/api/pipelines";
import type { CreatePipelinePayload } from "@/types/pipeline";

export const PIPELINES_QUERY_KEY = ["pipelines"] as const;

export function usePipelines() {
  return useQuery({
    queryKey: PIPELINES_QUERY_KEY,
    queryFn: pipelinesApi.list,
  });
}

export function usePipeline(id: string) {
  return useQuery({
    queryKey: ["pipelines", id],
    queryFn: () => pipelinesApi.get(id),
    enabled: Boolean(id),
  });
}

export function useCreatePipeline() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: CreatePipelinePayload) => pipelinesApi.create(payload),
    onSuccess: (pipeline) => {
      queryClient.invalidateQueries({ queryKey: PIPELINES_QUERY_KEY });
      toast.success(`Pipeline "${pipeline.name}" created`);
      navigate("/");
    },
    onError: (err: { userMessage?: string }) => {
      toast.error(err.userMessage ?? "Failed to create pipeline");
    },
  });
}

export function useExecutePipeline() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (pipelineId: string) => pipelinesApi.execute(pipelineId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PIPELINES_QUERY_KEY });
      navigate(`/executions/${data.execution_id}`);
    },
    onError: (err: { userMessage?: string }) => {
      toast.error(err.userMessage ?? "Failed to start execution");
    },
  });
}

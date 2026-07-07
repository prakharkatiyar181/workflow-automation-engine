import { useQuery } from "@tanstack/react-query";
import { executionsApi } from "@/api/executions";

export const executionQueryKey = (id: string) => ["executions", id] as const;

export function useExecution(id: string) {
  return useQuery({
    queryKey: executionQueryKey(id),
    queryFn: () => executionsApi.get(id),
    enabled: Boolean(id),
  });
}

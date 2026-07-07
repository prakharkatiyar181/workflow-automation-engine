import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { WsEvent, WsTaskUpdateEvent, WsExecutionUpdateEvent, PipelineExecution } from "@/types/execution";
import { executionQueryKey } from "./useExecution";
import { PIPELINES_QUERY_KEY } from "./usePipelines";

const WS_BASE = import.meta.env.VITE_WS_URL 
  ? `${import.meta.env.VITE_WS_URL}/ws/executions` 
  : `ws://${window.location.hostname}:8000/ws/executions`;
const RECONNECT_DELAY_MS = 3_000;
const TERMINAL_STATUSES = new Set(["COMPLETED", "FAILED"]);

export function useExecutionWS(executionId: string) {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);

  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    isMounted.current = true;

    function connect() {
      if (!isMounted.current) return;

      const ws = new WebSocket(`${WS_BASE}/${executionId}/`);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsReconnecting(false);
        // Clear any pending reconnect timer on successful connect
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
          reconnectTimer.current = null;
        }
      };

      ws.onmessage = (event: MessageEvent) => {
        let msg: WsEvent;
        try {
          msg = JSON.parse(event.data as string) as WsEvent;
        } catch {
          return;
        }

        if (msg.type === "task_update") {
          handleTaskUpdate(msg);
        } else if (msg.type === "execution_update") {
          handleExecutionUpdate(msg);
        }
      };

      ws.onerror = (e) => {
        // onerror is always followed by onclose; reconnect logic lives there
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        if (!isMounted.current) return;

        // Check if execution is already in a terminal state before reconnecting
        const cached = queryClient.getQueryData<PipelineExecution>(
          executionQueryKey(executionId)
        );
        if (cached && TERMINAL_STATUSES.has(cached.status)) return;

        setIsReconnecting(true);
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
      };
    }

    function handleTaskUpdate(event: WsTaskUpdateEvent) {
      queryClient.setQueryData<PipelineExecution>(
        executionQueryKey(executionId),
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            tasks: prev.tasks.map((te) =>
              te.id === event.taskId
                ? {
                    ...te,
                    status: event.status,
                    started_at: event.startedAt,
                    completed_at: event.completedAt,
                    duration: event.duration,
                    error_message: event.error,
                  }
                : te
            ),
          };
        }
      );
    }

    function handleExecutionUpdate(event: WsExecutionUpdateEvent) {
      queryClient.setQueryData<PipelineExecution>(
        executionQueryKey(executionId),
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: event.status,
            completed_at: event.completedAt,
          };
        }
      );

      // Invalidate pipeline list so Dashboard shows updated latest_execution
      if (TERMINAL_STATUSES.has(event.status)) {
        queryClient.invalidateQueries({ queryKey: PIPELINES_QUERY_KEY });
      }
    }

    connect();

    return () => {
      isMounted.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on intentional close
        wsRef.current.close();
      }
    };
  }, [executionId, queryClient]);

  return { isConnected, isReconnecting };
}

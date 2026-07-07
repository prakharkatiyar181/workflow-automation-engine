import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PIPELINES_QUERY_KEY } from "./usePipelines";
import type { Pipeline } from "@/types/pipeline";
import type { ExecutionStatus } from "@/types/execution";

const WS_BASE = import.meta.env.VITE_WS_URL 
  ? `${import.meta.env.VITE_WS_URL}/ws/pipelines` 
  : `ws://${window.location.hostname}:8000/ws/pipelines`;
const RECONNECT_DELAY_MS = 3_000;

interface WsPipelineUpdateEvent {
  type: "pipeline_update";
  pipelineId: string;
  latestExecution: {
    id: string;
    status: ExecutionStatus;
  };
}

interface WsPipelineCreatedEvent {
  type: "pipeline_created";
  pipeline: Pipeline;
}

type WsPipelineEvent = WsPipelineUpdateEvent | WsPipelineCreatedEvent;

export function usePipelineWS() {
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

      const ws = new WebSocket(`${WS_BASE}/`);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsReconnecting(false);
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
          reconnectTimer.current = null;
        }
      };

      ws.onmessage = (event: MessageEvent) => {
        let msg: WsPipelineEvent;
        try {
          msg = JSON.parse(event.data as string) as WsPipelineEvent;
        } catch {
          return;
        }

        if (msg.type === "pipeline_update") {
          handlePipelineUpdate(msg);
        } else if (msg.type === "pipeline_created") {
          handlePipelineCreated(msg);
        }
      };

      ws.onerror = () => {
        // onerror is always followed by onclose; reconnect logic lives there
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        if (!isMounted.current) return;

        setIsReconnecting(true);
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
      };
    }

    function handlePipelineUpdate(event: WsPipelineUpdateEvent) {
      queryClient.setQueryData<Pipeline[]>(
        PIPELINES_QUERY_KEY,
        (prev) => {
          if (!prev) return prev;
          return prev.map((p) => {
            if (p.id === event.pipelineId) {
              return {
                ...p,
                latest_execution: {
                  id: event.latestExecution.id,
                  status: event.latestExecution.status,
                  started_at: null
                }
              };
            }
            return p;
          });
        }
      );
    }

    function handlePipelineCreated(event: WsPipelineCreatedEvent) {
      queryClient.setQueryData<Pipeline[]>(
        PIPELINES_QUERY_KEY,
        (prev) => {
          if (!prev) return [event.pipeline];
          
          // Check if it already exists (e.g. from a recent mutation that already updated cache)
          const exists = prev.some((p) => p.id === event.pipeline.id);
          if (exists) return prev;

          return [event.pipeline, ...prev];
        }
      );
    }

    connect();

    return () => {
      isMounted.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [queryClient]);

  return { isConnected, isReconnecting };
}

import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./index.css";

/**
 * Global React Query client configuration.
 *
 * - staleTime: 30 s — data is considered fresh for 30 s after a successful fetch
 * - retry: 2 — failed requests are retried twice before showing an error state
 * - refetchOnWindowFocus: false — avoids noisy re-fetches during development
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* Application shell */}
      <App />

      {/* Toast notifications — positioned top-right, dark theme */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1f2937",
            color: "#f9fafb",
            border: "1px solid #374151",
          },
          success: { iconTheme: { primary: "#10b981", secondary: "#f9fafb" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#f9fafb" } },
        }}
      />

      {/* React Query Devtools — only visible in development */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);

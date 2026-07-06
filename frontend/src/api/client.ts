import axios from "axios";

/**
 * Configured Axios instance used by all API modules.
 *
 * Base URL:
 *   - In Docker: Vite proxies /api → http://backend:8000, so baseURL = "/api"
 *   - For non-Docker local dev: set VITE_API_URL in .env.local
 *
 * JWT-ready:
 *   Interceptors are structured to accept a token from a future auth store.
 *   Uncomment the request interceptor block when JWT is implemented.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30_000,
});

// ── Request interceptor (JWT placeholder) ─────────────────────────────────────
// apiClient.interceptors.request.use((config) => {
//   const token = authStore.getState().accessToken;
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// ── Response interceptor — normalise error format ─────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Attach a user-friendly message to every AxiosError
    const message: string =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred";
    (error as any).userMessage = message;
    return Promise.reject(error);
  }
);

export default apiClient;

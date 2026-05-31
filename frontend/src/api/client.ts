/**
 * Central Axios instance.
 *
 * Base URL: "" (empty — uses relative URLs so Vite's /api proxy works in dev,
 * and the same-origin backend works in production).
 * - Automatically attaches the JWT from localStorage on every request.
 * - Redirects to /login on 401 (token expired / invalid).
 */
import axios from "axios";

const TOKEN_KEY = "sv_token";

export const apiClient = axios.create({
  baseURL: "",
  timeout: 60_000,
});

// ── Request interceptor — attach JWT ──────────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers = config.headers ?? {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  } catch {
    // localStorage unavailable — ignore
  }
  return config;
});

// ── Response interceptor — handle 401 ────────────────────────────────────────
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (
      axios.isAxiosError(err) &&
      err.response?.status === 401 &&
      !err.config?.url?.includes("/api/auth/")
    ) {
      try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

/** Extracts a human-readable error message from an Axios error. */
export function extractError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return "Cannot reach the server. Is the backend running on port 8000?";
    return (error.response.data as { detail?: string })?.detail ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

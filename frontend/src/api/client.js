// Thin fetch wrapper for the rPulse backend. All calls go through the Vite
// dev proxy (vite.config.js) as relative URLs, so the same code works in dev
// and when the built app is served behind the same origin as the backend.
const BASE = "/api/v1";

// Influx being down surfaces as 502 (ProblemDetail from InfluxExceptionHandler)
// or 503 (/telemetry/health). Screens use isDataSourceOffline() to show a
// "data source offline" state instead of a blank grid.
export class ApiError extends Error {
  constructor(message, status, detail) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export function isDataSourceOffline(error) {
  return error instanceof ApiError && (error.status === 502 || error.status === 503);
}

export function isNotFound(error) {
  return error instanceof ApiError && error.status === 404;
}

async function request(method, path, { body, query } = {}) {
  let url = `${BASE}${path}`;
  if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") params.set(key, value);
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }
  let response;
  try {
    response = await fetch(url, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (cause) {
    throw new ApiError(`Backend unreachable (${method} ${url})`, 0, String(cause));
  }
  if (!response.ok) {
    let detail = "";
    try {
      const text = await response.text();
      try {
        const parsed = JSON.parse(text);
        detail = parsed.detail || parsed.message || parsed.error || text;
      } catch {
        detail = text;
      }
    } catch {
      // no body
    }
    throw new ApiError(detail || `${method} ${url} failed (${response.status})`, response.status, detail);
  }
  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  get: (path, query) => request("GET", path, { query }),
  post: (path, body, query) => request("POST", path, { body, query }),
  put: (path, body) => request("PUT", path, { body }),
  del: (path) => request("DELETE", path),
};

// --- shared formatting helpers for backend timestamps -----------------------

export function formatDateTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return String(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatTime(iso) {
  const stamp = formatDateTime(iso);
  return stamp ? stamp.slice(11) : "";
}

export function durationLabel(seconds) {
  if (seconds === null || seconds === undefined) return "";
  const minutes = Math.max(0, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hr ${minutes % 60} min`;
}

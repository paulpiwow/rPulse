// Telemetry domain: tag/ctag trend series for charting, Influx connectivity
// health, and latest raw readings.
import { api } from "./client.js";

// The only durations TrendController accepts.
export const TREND_DURATIONS = ["1h", "6h", "24h", "7d", "14d"];

export const TREND_DURATION_OPTIONS = [
  { key: "1h", label: "1 Hour", hours: 1 },
  { key: "6h", label: "6 Hours", hours: 6 },
  { key: "24h", label: "24 Hours", hours: 24 },
  { key: "7d", label: "7 Days", hours: 7 * 24 },
  { key: "14d", label: "14 Days", hours: 14 * 24 },
];

// kind: "Tag" | "CTag" (matches the catalog rows' kind field).
// Returns { id, duration, times: string[], values: number[] }.
export async function fetchTrend(kind, code, duration = "24h") {
  const segment = kind === "CTag" ? "ctag" : "tag";
  const trend = await api.get(`/trends/${segment}/${encodeURIComponent(code)}`, { duration });
  const points = trend.points || [];
  return {
    id: trend.id,
    duration: trend.duration,
    times: points.map((p) => p.time),
    values: points.map((p) => p.value),
  };
}

// Fetch several trends at once; returns a Map of code → trend (codes whose
// fetch fails, e.g. an unknown tag, are omitted rather than failing the batch).
export async function fetchTrends(tags, duration = "24h") {
  const results = await Promise.allSettled(
    tags.map((tag) => fetchTrend(tag.kind, tag.tagId || tag.code, duration)),
  );
  const byCode = new Map();
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      byCode.set(tags[index].tagId || tags[index].code, result.value);
    }
  });
  return byCode;
}

// 200 { status: "up", database } when healthy; 503 when Influx is down
// (surfaces as an ApiError with isDataSourceOffline(error) === true).
export function fetchTelemetryHealth() {
  return api.get("/telemetry/health");
}

// Latest raw readings; all filters optional, limit 1..500 (default 100).
// Returns { database, count, readings: [...] } with raw Influx row maps.
export function fetchLatestReadings({ siteName, lineName, assetName, tagName, limit } = {}) {
  return api.get("/telemetry/readings/latest", { siteName, lineName, assetName, tagName, limit });
}

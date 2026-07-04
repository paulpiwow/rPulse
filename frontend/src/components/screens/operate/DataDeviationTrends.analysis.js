// Pure trend + pre-alarm analysis helpers for the Maintenance Warning Trend
// screen. Extracted from the component so the screen file stays small; these
// take explicit values (fetched trend / tag / warning / baseline rule) instead
// of closing over refs or reading mock data modules.
import { formatNumber } from "../../../lib/format.js";

export const baselineNumber = (value, fallback = 0) => {
  const parsed = Number(String(value || "").match(/-?\d+(\.\d+)?/)?.[0]);
  const fallbackNumber = Number(fallback);
  return Number.isFinite(parsed) ? parsed : Number.isFinite(fallbackNumber) ? fallbackNumber : 0;
};

// First candidate that is a real number (skips null/undefined/"" so that
// Number's null→0 coercion never fabricates a baseline).
export const firstFiniteNumber = (...candidates) => {
  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined || candidate === "") continue;
    const number = Number(candidate);
    if (Number.isFinite(number)) return number;
  }
  return null;
};

export const decimalsForUnit = (unit = "") => (/rpm|state/i.test(unit) ? 0 : 2);

export const constantSeries = (count, value, unit) => {
  const decimals = decimalsForUnit(unit);
  return Array.from({ length: count }, () => (Number.isFinite(value) ? Number(value.toFixed(decimals)) : null));
};

// trend: { times: string[], values: number[] } from fetchTrend.
// baselineRule: numeric baselineLow/Target/High/StdDev row from fetchBaselines
// (preferred); the warning's display strings ("225.00 F") are the fallback.
export const buildTrend = (trend, tag = {}, warning = {}, baselineRule = {}) => {
  const times = trend?.times || [];
  const values = trend?.values || [];
  const unit = tag.unit || warning.unit || "";
  const target = firstFiniteNumber(baselineRule.baselineTarget)
    ?? baselineNumber(warning.baseline, Number(tag.initialValue ?? 0));
  const low = firstFiniteNumber(baselineRule.baselineLow)
    ?? baselineNumber(warning.baselineLow, Number(tag.minValue ?? target));
  const high = firstFiniteNumber(baselineRule.baselineHigh)
    ?? baselineNumber(warning.baselineHigh, Number(tag.maxValue ?? target));
  const stdDev = firstFiniteNumber(baselineRule.baselineStdDev)
    ?? baselineNumber(warning.baselineStdDev, Math.max(Math.abs(high - low) / 4, 0));
  const stdDevLow = target - stdDev;
  const stdDevHigh = target + stdDev;
  const measured = values.map((value) => (Number.isFinite(Number(value)) ? Number(value) : null));
  return {
    times,
    baselineStats: {
      low,
      baseline: target,
      high,
      stdDev,
      stdDevLow,
      stdDevHigh,
      sampleCount: measured.filter((value) => value !== null).length,
      unit,
    },
    series: [
      {
        name: "Measured Tag Data",
        tagId: tag.tagId,
        unit,
        data: measured,
        color: tag.color || "#ea580c",
        showSymbol: true,
      },
      {
        name: "Baseline Low",
        unit,
        data: constantSeries(times.length, low, unit),
        color: "#0f766e",
        baselineLine: true,
        lineType: "dashed",
        width: 1.8,
      },
      {
        name: "Baseline Target",
        unit,
        data: constantSeries(times.length, target, unit),
        color: "#1d4ed8",
        baselineLine: true,
        width: 2,
      },
      {
        name: "Std Dev -1 SD",
        unit,
        data: constantSeries(times.length, stdDevLow, unit),
        color: "#64748b",
        baselineLine: true,
        lineType: "dotted",
        width: 1.5,
      },
      {
        name: "Std Dev +1 SD",
        unit,
        data: constantSeries(times.length, stdDevHigh, unit),
        color: "#64748b",
        baselineLine: true,
        lineType: "dotted",
        width: 1.5,
      },
      {
        name: "Baseline High",
        unit,
        data: constantSeries(times.length, high, unit),
        color: "#c2410c",
        baselineLine: true,
        lineType: "dashed",
        width: 1.8,
      },
    ],
  };
};

export const formatStat = (value, unit = "") => `${formatNumber(value, decimalsForUnit(unit))}${unit ? ` ${unit}` : ""}`;

export const medianValue = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

// Alarm history rows carry display timestamps ("YYYY-MM-DD HH:mm") formatted
// in local time by the API layer, so parse them back as local time.
const parseDisplayTimestamp = (value) => {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})/);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match.map(Number);
  const timeMs = new Date(year, month - 1, day, hour, minute).getTime();
  if (!Number.isFinite(timeMs)) return null;
  return { timeMs, iso: new Date(timeMs).toISOString() };
};

const normalizeSearchText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

// Linked alarm for a maintenance warning: an active alarm watching the same
// tag key wins (real ISO trip time); otherwise the newest history record whose
// alarm name mentions the tag; otherwise null (no linked alarm trip in window).
export const deriveLinkedAlarm = (activeAlarms = [], historyRows = [], warning = {}, tag = {}) => {
  const active = activeAlarms.find(
    (alarm) => alarm.tagKey === warning.tagCode || (tag.tagKey && alarm.tagKey === tag.tagKey)
  );
  if (active) {
    const tripMs = Date.parse(active.tripTimestamp);
    return {
      alarmName: active.alarmName,
      tripTime: active.tripTimestamp || "",
      tripMs: Number.isFinite(tripMs) ? tripMs : null,
      threshold: [active.operator, active.thresholdValue]
        .filter((part) => part !== null && part !== undefined && part !== "")
        .join(" "),
    };
  }
  const needle = normalizeSearchText(tag.tagName || warning.tagName || warning.tagCode);
  if (!needle) return null;
  const history = historyRows.find((row) => normalizeSearchText(row.alarmName).includes(needle));
  if (!history) return null;
  const trip = parseDisplayTimestamp(history.tripTime);
  return {
    alarmName: history.alarmName,
    tripTime: trip?.iso || "",
    tripMs: trip?.timeMs ?? null,
    threshold: history.status || "",
  };
};

export const formatDuration = (ms) => {
  const minutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours && remaining) return `${hours}h ${remaining}m`;
  if (hours) return `${hours}h`;
  return `${remaining}m`;
};

export const formatEventTime = (iso) => {
  if (!iso) return "";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
};

// Typical spacing between fetched samples (the API windows every duration to
// ~120 points, so this scales from ~30s at 1h up to ~2.8h at 14d).
const sampleStepMs = (points) => {
  if (points.length < 2) return 60000;
  const gaps = points.slice(1).map((point, index) => point.timeMs - points[index].timeMs).filter((gap) => gap > 0);
  if (!gaps.length) return 60000;
  gaps.sort((a, b) => a - b);
  return gaps[Math.floor(gaps.length / 2)];
};

// trend: fetched { times, values }; builtTrend: buildTrend() output (baseline
// envelope); alarm: deriveLinkedAlarm() result or null. With no linked alarm,
// out-of-baseline events are still detected across the window but the
// trip-relative metrics (lead time, continuous-before-trip) are skipped.
export const buildPreAlarmAnalysis = (trend, tag = {}, builtTrend = {}, alarm = null) => {
  const times = trend?.times || [];
  const values = trend?.values || [];
  const unit = tag.unit || builtTrend.baselineStats?.unit || "";
  const stats = builtTrend.baselineStats || {};
  const low = Number(stats.low);
  const high = Number(stats.high);
  const mean = Number(stats.baseline);
  const stdDev = Math.max(Number(stats.stdDev) || 0, 0.0001);
  const points = times
    .map((iso, index) => {
      const value = Number(values[index]);
      const timeMs = Date.parse(iso);
      return Number.isFinite(value) && Number.isFinite(timeMs) ? { index, value, iso, timeMs } : null;
    })
    .filter(Boolean);
  const stepMs = sampleStepMs(points);
  const windowEndMs = points.length ? points[points.length - 1].timeMs : Date.now();
  const alarmMs = Number.isFinite(alarm?.tripMs) ? alarm.tripMs : windowEndMs;
  const mergeGapMs = Math.max(10 * 60000, 2 * stepMs);
  const rawEvents = [];
  let activeEvent = null;
  points
    .filter((point) => point.timeMs <= alarmMs)
    .forEach((point) => {
      const outside = Number.isFinite(low) && Number.isFinite(high) && (point.value < low || point.value > high);
      if (!outside) {
        if (activeEvent) rawEvents.push(activeEvent);
        activeEvent = null;
        return;
      }
      const pointDeviation = Math.abs(point.value - mean);
      const peakSigma = pointDeviation / stdDev;
      if (!activeEvent) {
        activeEvent = {
          startMs: point.timeMs,
          endMs: point.timeMs,
          startIso: point.iso,
          endIso: point.iso,
          peakValue: point.value,
          peakDeviation: pointDeviation,
          peakSigma,
          direction: point.value > high ? "High" : "Low",
        };
        return;
      }
      activeEvent.endMs = point.timeMs;
      activeEvent.endIso = point.iso;
      if (pointDeviation > activeEvent.peakDeviation) {
        activeEvent.peakValue = point.value;
        activeEvent.peakDeviation = pointDeviation;
        activeEvent.peakSigma = peakSigma;
        activeEvent.direction = point.value > high ? "High" : "Low";
      }
    });
  if (activeEvent) rawEvents.push(activeEvent);
  const mergedEvents = rawEvents.reduce((events, event) => {
    const previous = events[events.length - 1];
    if (previous && event.startMs - previous.endMs <= mergeGapMs) {
      previous.endMs = event.endMs;
      previous.endIso = event.endIso;
      if (event.peakDeviation > previous.peakDeviation) Object.assign(previous, {
        peakValue: event.peakValue,
        peakDeviation: event.peakDeviation,
        peakSigma: event.peakSigma,
        direction: event.direction,
      });
      return events;
    }
    events.push({ ...event });
    return events;
  }, []);
  const events = mergedEvents.map((event, index) => ({
    ...event,
    id: `prealarm-${index + 1}`,
    durationMs: Math.max(stepMs, Math.min(event.endMs, alarmMs) - event.startMs + stepMs),
  }));
  const firstEvent = events[0];
  const eventAtTrip = alarm
    ? events.find((event) => event.startMs <= alarmMs && event.endMs + stepMs >= alarmMs)
    : null;
  const totalDurationMs = events.reduce((totalDuration, event) => totalDuration + event.durationMs, 0);
  const longestDurationMs = events.reduce((longest, event) => Math.max(longest, event.durationMs), 0);
  const maxSigma = events.reduce((max, event) => Math.max(max, event.peakSigma || 0), 0);
  const leadTimeMs = alarm && firstEvent ? Math.max(0, alarmMs - firstEvent.startMs) : 0;
  const continuousBeforeTripMs = eventAtTrip ? Math.max(0, alarmMs - eventAtTrip.startMs) : 0;
  return {
    alarm,
    low,
    high,
    mean,
    stdDev,
    unit,
    events,
    eventCount: events.length,
    totalDurationMs,
    longestDurationMs,
    maxSigma,
    leadTimeMs,
    continuousBeforeTripMs,
    firstEvent,
    eventAtTrip,
    alarmMs,
    stepMs,
  };
};

// Pure trend + pre-alarm analysis helpers for the Maintenance Warning Trend
// screen. Extracted from the component so the screen file stays small; these
// take explicit values (tag / deviation / trend) instead of closing over refs.
import { data } from "../../../data/index.js";
import { lookbackLabel } from "../../../lib/duration.js";
import { formatNumber } from "../../../lib/format.js";
import { baselineStatsForTagWindow, trendIndexesForHours, trendValuesForTag } from "../../../lib/trends.js";

export const baselineNumber = (value, fallback = 0) => {
  const parsed = Number(String(value || "").match(/-?\d+(\.\d+)?/)?.[0]);
  const fallbackNumber = Number(fallback);
  return Number.isFinite(parsed) ? parsed : Number.isFinite(fallbackNumber) ? fallbackNumber : 0;
};

export const baselineRuleForDeviation = (tag, deviation) =>
  data.baselineRules.find(
    (rule) =>
      (tag?.tagId && rule.tagId === tag.tagId) ||
      (tag?.tagName && rule.tagName === tag.tagName) ||
      (deviation?.tagName && rule.tagName === deviation.tagName)
  ) || {};

export const decimalsForUnit = (unit = "") => (/rpm|state/i.test(unit) ? 0 : 2);

export const constantSeries = (indexes, value, unit) => {
  const decimals = decimalsForUnit(unit);
  return indexes.map(() => (Number.isFinite(value) ? Number(value.toFixed(decimals)) : null));
};

export const buildTrend = (hours, tag, deviation) => {
  const indexes = trendIndexesForHours(hours);
  const values = trendValuesForTag(tag);
  const unit = tag.unit || "";
  const calculatedStats = baselineStatsForTagWindow(tag, hours) || {};
  const baselineRule = baselineRuleForDeviation(tag, deviation);
  const configuredTarget = baselineNumber(baselineRule.baselineTarget || deviation.baseline, Number(tag.initialValue ?? 0));
  const configuredLow = baselineNumber(baselineRule.baselineLow || deviation.baselineLow, Number(tag.minValue ?? configuredTarget));
  const configuredHigh = baselineNumber(baselineRule.baselineHigh || deviation.baselineHigh, Number(tag.maxValue ?? configuredTarget));
  const configuredStdDev = baselineNumber(
    baselineRule.baselineStdDev || deviation.baselineStdDev,
    Math.max(Math.abs(configuredHigh - configuredLow) / 4, 0)
  );
  const target = Number.isFinite(calculatedStats.baseline) ? calculatedStats.baseline : configuredTarget;
  const low = Number.isFinite(calculatedStats.low) ? calculatedStats.low : configuredLow;
  const high = Number.isFinite(calculatedStats.high) ? calculatedStats.high : configuredHigh;
  const stdDev = Number.isFinite(calculatedStats.stdDev) ? calculatedStats.stdDev : configuredStdDev;
  const stdDevLow = target - stdDev;
  const stdDevHigh = target + stdDev;
  const times = indexes.map((valueIndex, index) => data.trendMinuteTimes?.[valueIndex] || lookbackLabel(hours, index, indexes.length));
  return {
    times,
    baselineStats: {
      low,
      baseline: target,
      high,
      stdDev,
      stdDevLow,
      stdDevHigh,
      sampleCount: calculatedStats.sampleCount || indexes.length,
      unit,
    },
    series: [
      {
        name: "Measured Tag Data",
        tagId: tag.tagId,
        unit,
        data: indexes.map((valueIndex) => values[valueIndex] ?? null),
        color: tag.color || data.tagColors?.[tag.tagId] || "#ea580c",
        showSymbol: true,
      },
      {
        name: "Baseline Low",
        unit,
        data: constantSeries(indexes, low, unit),
        color: "#0f766e",
        baselineLine: true,
        lineType: "dashed",
        width: 1.8,
      },
      {
        name: "Baseline Target",
        unit,
        data: constantSeries(indexes, target, unit),
        color: "#1d4ed8",
        baselineLine: true,
        width: 2,
      },
      {
        name: "Std Dev -1 SD",
        unit,
        data: constantSeries(indexes, stdDevLow, unit),
        color: "#64748b",
        baselineLine: true,
        lineType: "dotted",
        width: 1.5,
      },
      {
        name: "Std Dev +1 SD",
        unit,
        data: constantSeries(indexes, stdDevHigh, unit),
        color: "#64748b",
        baselineLine: true,
        lineType: "dotted",
        width: 1.5,
      },
      {
        name: "Baseline High",
        unit,
        data: constantSeries(indexes, high, unit),
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

const parseClockOnTrendDate = (clock) => {
  const match = String(clock || "").match(/^(\d{1,2}):(\d{2})/);
  const trendEnd = new Date(data.trendMinuteTimes?.[data.trendMinuteTimes.length - 1] || Date.now());
  if (!match) return null;
  const timeMs = Date.UTC(
    trendEnd.getUTCFullYear(),
    trendEnd.getUTCMonth(),
    trendEnd.getUTCDate(),
    Number(match[1]),
    Number(match[2])
  );
  return { timeMs, iso: new Date(timeMs).toISOString() };
};

const parseCadreTimestamp = (value) => {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})/);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match.map(Number);
  const timeMs = Date.UTC(year, month - 1, day, hour, minute);
  return { timeMs, iso: new Date(timeMs).toISOString() };
};

const normalizeSearchText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export const linkedAlarmForWarning = (tag, deviation) => {
  const detail =
    data.alarmDetails.find((alarm) => alarm.tagName === tag.tagName || alarm.tagName === deviation.tagName) ||
    data.alarmDetails.find((alarm) => normalizeSearchText(alarm.tagName).includes(normalizeSearchText(deviation.tagName)));
  if (detail) {
    const trip = parseClockOnTrendDate(detail.time);
    return {
      alarmName: `${detail.tagName} ${detail.condition}`,
      tripTime: trip?.iso || "",
      tripMs: trip?.timeMs || null,
      threshold: `${detail.condition} ${formatStat(detail.value, detail.unit)}`,
    };
  }
  const history = data.alarmHistory.find((alarm) =>
    normalizeSearchText(alarm.alarmName).includes(normalizeSearchText(tag.tagName || deviation.tagName))
  );
  const trip = parseCadreTimestamp(history?.tripTime);
  return history
    ? {
        alarmName: history.alarmName,
        tripTime: trip?.iso || "",
        tripMs: trip?.timeMs || null,
        threshold: history.status || "",
      }
    : null;
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

export const buildPreAlarmAnalysis = (hours, tag, deviation, trend) => {
  const values = trendValuesForTag(tag);
  const unit = tag.unit || trend.baselineStats?.unit || "";
  const alarm = linkedAlarmForWarning(tag, deviation);
  const alarmMs = alarm?.tripMs || Date.parse(data.trendMinuteTimes?.[data.trendMinuteTimes.length - 1]);
  const total = values.length;
  const startIndex = Math.max(0, total - Math.round(hours * 60));
  const stats = trend.baselineStats || {};
  const low = Number(stats.low);
  const high = Number(stats.high);
  const mean = Number(stats.baseline);
  const stdDev = Math.max(Number(stats.stdDev) || 0, 0.0001);
  const points = Array.from({ length: Math.max(0, total - startIndex) }, (_, offset) => {
    const index = startIndex + offset;
    const value = Number(values[index]);
    const iso = data.trendMinuteTimes?.[index];
    const timeMs = Date.parse(iso);
    return Number.isFinite(value) && Number.isFinite(timeMs) ? { index, value, iso, timeMs } : null;
  }).filter(Boolean);
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
    if (previous && event.startMs - previous.endMs <= 10 * 60000) {
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
    durationMs: Math.max(60000, Math.min(event.endMs, alarmMs) - event.startMs + 60000),
  }));
  const firstEvent = events[0];
  const eventAtTrip = events.find((event) => event.startMs <= alarmMs && event.endMs + 60000 >= alarmMs);
  const totalDurationMs = events.reduce((totalDuration, event) => totalDuration + event.durationMs, 0);
  const longestDurationMs = events.reduce((longest, event) => Math.max(longest, event.durationMs), 0);
  const maxSigma = events.reduce((max, event) => Math.max(max, event.peakSigma || 0), 0);
  const leadTimeMs = firstEvent ? Math.max(0, alarmMs - firstEvent.startMs) : 0;
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
  };
};

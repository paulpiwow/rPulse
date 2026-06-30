import { data } from "../data/index.js";
import { lookbackLabel } from "./duration.js";

export const trendPalette = ["#3b82f6", "#ea580c", "#6d28d9", "#059669", "#be185d", "#16a34a", "#0284c7", "#a855f7"];

export const lineNameForTag = (tag) => tag?.tagName || tag?.tagId || "Unmapped Tag";

export const trendIndexesForHours = (hours) => {
  const total = data.trendMinuteTimes?.length || 0;
  if (!total) return [];
  const windowPoints = Math.min(total, Math.max(2, Math.round(hours * 60)));
  const start = Math.max(0, total - windowPoints);
  const maxPoints = hours <= 2 ? 121 : hours <= 12 ? 181 : hours <= 24 ? 241 : 361;
  const step = Math.max(1, Math.ceil(windowPoints / Math.max(2, maxPoints - 1)));
  const indexes = [];
  for (let index = start; index < total; index += step) indexes.push(index);
  if (indexes[indexes.length - 1] !== total - 1) indexes.push(total - 1);
  return indexes;
};

export const ctagSeriesValues = (tag) => {
  const sourceTagIds = String(tag?.sourceTagIds || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const sourceSeries = sourceTagIds.map((tagId) => data.influx?.seriesByTagId?.[tagId]).filter((series) => Array.isArray(series));
  if (!sourceSeries.length) return [];
  const expression = String(tag.expression || tag.calculationType || "").toLowerCase();
  return sourceSeries[0].map((_, index) => {
    const values = sourceSeries.map((series) => Number(series[index] ?? 0));
    if (/standarddeviation|standard deviation/.test(expression)) {
      const mean = values.reduce((total, value) => total + value, 0) / values.length;
      const variance = values.reduce((total, value) => total + Math.pow(value - mean, 2), 0) / values.length;
      return Number(Math.sqrt(variance).toFixed(2));
    }
    if (expression.includes("/") && values.length >= 2) return Number((values[0] / Math.max(values[1], 0.0001)).toFixed(2));
    if (expression.includes("-") && values.length >= 2) return Number(values.slice(1).reduce((total, value) => total - value, values[0]).toFixed(2));
    return Number(values.reduce((total, value) => total + value, 0).toFixed(2));
  });
};

export const trendValuesForTag = (tag) => {
  if (!tag) return [];
  const directSeries = data.influx?.seriesByTagId?.[tag.tagId];
  if (Array.isArray(directSeries)) return directSeries;
  return ctagSeriesValues(tag);
};

export const quantileValue = (values, percent) => {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const position = (sorted.length - 1) * percent;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
};

export const baselineStatsForValues = (values) => {
  const numericValues = values.map(Number).filter(Number.isFinite);
  if (!numericValues.length) return null;
  const baseline = numericValues.reduce((total, value) => total + value, 0) / numericValues.length;
  const variance = numericValues.reduce((total, value) => total + (value - baseline) ** 2, 0) / numericValues.length;
  return {
    low: quantileValue(numericValues, 0.1),
    baseline,
    high: quantileValue(numericValues, 0.9),
    stdDev: Math.sqrt(variance),
    sampleCount: numericValues.length,
  };
};

export const baselineStatsForTagWindow = (tag, hours) => {
  const values = trendValuesForTag(tag).map(Number).filter(Number.isFinite);
  if (!values.length) return null;
  const pointCount = Math.min(values.length, Math.max(2, Math.round(hours * 60)));
  return baselineStatsForValues(values.slice(values.length - pointCount));
};

export const trendForTags = (tags, hours, alarmTagIds = new Set()) => {
  const indexes = trendIndexesForHours(hours);
  return {
    times: indexes.map((valueIndex, index) => data.trendMinuteTimes?.[valueIndex] || lookbackLabel(hours, index, indexes.length)),
    series: tags
      .map((tag, index) => {
        const values = trendValuesForTag(tag);
        if (!values.length) return null;
        const baseColor = tag.color || data.tagColors?.[tag.tagId];
        return {
          tagId: tag.tagId,
          name: lineNameForTag(tag),
          unit: tag.unit || "",
          data: indexes.map((valueIndex) => values[valueIndex] ?? null),
          color: baseColor || trendPalette[index % trendPalette.length],
          alarmAssociated: alarmTagIds.has(tag.tagId),
          dataSource: tag.dataSource || "",
        };
      })
      .filter(Boolean),
  };
};

export const trendWindowSeries = (series, drift) =>
  series.map((line) => ({
    ...line,
    data: line.data.map((value, index, values) => {
      const number = Number(value);
      if (!Number.isFinite(number) || /(baseline|mean|limit|std dev|high|low)/i.test(line.name)) return value;
      const progress = values.length <= 1 ? 1 : index / (values.length - 1);
      const offset = (1 - progress) * drift * Math.max(1, Math.abs(number) * 0.08);
      const adjusted = number - offset;
      const places = Math.abs(number) < 1 || String(value).includes(".") ? 2 : 0;
      return Number(adjusted.toFixed(places));
    }),
  }));

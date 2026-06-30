import { durationToken } from "./format.js";

export const durationKeyFromInput = (input, options, fallback) => {
  const token = durationToken(input);
  const match = options.find((option) => durationToken(option.value) === token || durationToken(option.label) === token);
  return match ? match.value : fallback;
};

export const durationLabelFromInput = (input, options, fallback) => {
  const key = durationKeyFromInput(input, options, fallback);
  return options.find((option) => option.value === key)?.label || input;
};

export const plotDurationOptions = [
  { label: "1 Hour", value: "1h" },
  { label: "2 Hours", value: "2h" },
  { label: "4 Hours", value: "4h" },
  { label: "8 Hours", value: "8h" },
  { label: "12 Hours", value: "12h" },
  { label: "24 Hours", value: "24h" },
  { label: "2 Days", value: "2d" },
  { label: "3 Days", value: "3d" },
];

export const plotDurationHours = (input, fallback = "8h") => {
  const key = durationKeyFromInput(input, plotDurationOptions, fallback);
  const match = String(key).match(/^(\d+)([hd])$/);
  if (!match) return 8;
  return Number(match[1]) * (match[2] === "d" ? 24 : 1);
};

export const lookbackLabel = (hours, index, count) => {
  if (index === count - 1) return "Now";
  const remaining = hours - (hours * index) / Math.max(1, count - 1);
  if (remaining < 1) return `-${Math.round(remaining * 60)}m`;
  return Number.isInteger(remaining) ? `-${remaining}h` : `-${remaining.toFixed(1)}h`;
};

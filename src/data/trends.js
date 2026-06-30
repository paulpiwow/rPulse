import { activeAlarms } from "./alarms.js";
import { baselineDeviations } from "./baselines.js";
import { constantLine, tagColors, tagName, timeSlice, trendSlice } from "./tags.js";

export const alarmTrendSeries = [
  { name: tagName("final-dis-temp"), unit: "F", data: trendSlice("final-dis-temp"), color: tagColors["final-dis-temp"] },
  { name: tagName("final-dis-press"), unit: "PSI", data: trendSlice("final-dis-press"), color: tagColors["final-dis-press"] },
  { name: tagName("eng-rpm"), unit: "RPM", data: trendSlice("eng-rpm"), color: tagColors["eng-rpm"] },
  { name: tagName("vib-engine"), unit: "IPS", data: trendSlice("vib-engine"), color: tagColors["vib-engine"] },
];

export const deviationTrendSeries = [
  { name: "Measured Tag Data", unit: "F", data: trendSlice("final-dis-temp", 7, 5), color: tagColors["final-dis-temp"], showSymbol: true },
  { name: "Baseline Low", unit: "F", data: constantLine(180), color: "#0f766e", baselineLine: true, lineType: "dashed" },
  { name: "Baseline Target", unit: "F", data: constantLine(225), color: "#1d4ed8", baselineLine: true },
  { name: "Std Dev -1 SD", unit: "F", data: constantLine(216.08), color: "#64748b", baselineLine: true, lineType: "dotted", width: 1.5 },
  { name: "Std Dev +1 SD", unit: "F", data: constantLine(233.92), color: "#64748b", baselineLine: true, lineType: "dotted", width: 1.5 },
  { name: "Baseline High", unit: "F", data: constantLine(240), color: "#c2410c", baselineLine: true, lineType: "dashed" },
];

export const siteHealthTrendByDuration = {
  "24h": {
    label: "24-Hour Cadre Health Trend",
    times: timeSlice(7, 240),
    series: [
      { name: "Active Alarms", data: [1, 1, 2, 2, 3, 4, activeAlarms.length], color: "#c83d3d" },
      { name: "Maintenance Warnings", data: [2, 2, 3, 4, 5, 6, baselineDeviations.length], color: "#c89a19" },
    ],
  },
  "7d": {
    label: "7-Day Cadre Health Trend",
    times: timeSlice(7, 1440),
    series: [
      { name: "Active Alarms", data: [0, 1, 1, 2, 3, 4, activeAlarms.length], color: "#c83d3d" },
      { name: "Maintenance Warnings", data: [1, 2, 3, 4, 5, 6, baselineDeviations.length], color: "#c89a19" },
    ],
  },
  "14d": {
    label: "14-Day Cadre Health Trend",
    times: timeSlice(13, 720),
    series: [
      { name: "Active Alarms", data: [0, 0, 1, 1, 1, 2, 2, 3, 3, 4, 4, 5, activeAlarms.length], color: "#c83d3d" },
      { name: "Maintenance Warnings", data: [1, 1, 2, 2, 3, 3, 4, 4, 5, 6, 6, 7, baselineDeviations.length], color: "#c89a19" },
    ],
  },
  "30d": {
    label: "30-Day Cadre Health Trend",
    times: timeSlice(8, 1440),
    series: [
      { name: "Active Alarms", data: [0, 1, 1, 2, 2, 3, 4, activeAlarms.length], color: "#c83d3d" },
      { name: "Maintenance Warnings", data: [1, 2, 3, 3, 4, 5, 6, baselineDeviations.length], color: "#c89a19" },
    ],
  },
};

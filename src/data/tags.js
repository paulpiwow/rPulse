import { assetBySourceId, sourceNameById } from "./assets.js";
import { minuteCount, trendMinuteTimes } from "./time.js";

export const tagColors = {
  "suct-press": "#1e3a8a",
  "suct-temp": "#9a3412",
  "stg1-dis-press": "#1d4ed8",
  "final-dis-press": "#3b82f6",
  "final-dis-temp": "#ea580c",
  "comp-oil-press": "#075985",
  "comp-oil-temp": "#b45309",
  "scrub-level": "#166534",
  "recycle-valve-pos": "#16a34a",
  "fuel-press": "#0284c7",
  "unit-run-state": "#475569",
  "eng-rpm": "#6d28d9",
  "eng-load": "#059669",
  "eng-oil-press": "#60a5fa",
  "eng-jw-temp": "#d97706",
  "eng-batt-volt": "#0d9488",
  "eng-hours": "#8b4513",
  "cooler-fan-rpm": "#a855f7",
  "vib-engine": "#be185d",
  "vib-comp": "#ec4899",
};

export const configuredTags = [
  ["suct-press", "Suction Pressure", "cooler-vfd", "VFD", "MODBUS TCP", "1 Minute", "float", "PSI", 0, 300, 58, 51.50206728833905, "raw", "EMIT DCT 'Suction Pressure' - holding register 42030"],
  ["suct-temp", "Suction Temp", "dct-panel", "PLC", "MODBUS TCP", "300 Hz", "float", "F", -20, 150, 74, -18.21641502231628, "feature_window", "EMIT DCT 'Suction Temperature' - holding register 42044"],
  ["stg1-dis-press", "Stage 1 Discharge Press", "dct-panel", "PLC", "MODBUS TCP", "1 Hz", "float", "PSI", 0, 600, 245, 283.1641085885706, "feature_window", "EMIT DCT 'Discharge 1 Pressure' - holding register 42038"],
  ["final-dis-press", "Final Discharge Press", "dct-panel", "PLC", "MODBUS TCP", "1 Hz", "float", "PSI", 0, 1500, 1040, 825.6456058025515, "feature_window", "EMIT DCT 'Final Discharge Pressure' - holding register 42031"],
  ["final-dis-temp", "Final Discharge Temp", "dct-panel", "PLC", "MODBUS TCP", "1 Hz", "float", "F", 0, 350, 262, 248.79218924906667, "feature_window", "EMIT DCT discharge temp block, final stage"],
  ["comp-oil-press", "Compressor Oil Press", "dct-panel", "PLC", "MODBUS TCP", "1 Hz", "float", "PSI", 0, 100, 55, 44.82564184114612, "feature_window", "EMIT DCT 'Compressor Oil Pressure' - holding register 42032"],
  ["comp-oil-temp", "Compressor Oil Temp", "dct-panel", "PLC", "MODBUS TCP", "1 Hz", "float", "F", 0, 250, 168, 74.50672439424481, "feature_window", "EMIT DCT 'Compressor Oil Temp' - holding register 42037"],
  ["scrub-level", "Scrubber Level", "dct-panel", "PLC", "MODBUS TCP", "1 Hz", "float", "%", 0, 100, 18, 21.818387873560305, "feature_window", "Suction scrubber liquid level - DCT Brain analog input"],
  ["recycle-valve-pos", "Recycle Valve Position", "dct-panel", "PLC", "MODBUS TCP", "20 Hz", "float", "%", 0, 100, 12, 56.03207611580873, "raw", "Recycle control valve position - DCT Brain analog input"],
  ["fuel-press", "Fuel Gas Pressure", "dct-panel", "PLC", "MODBUS TCP", "20 Hz", "float", "PSI", 0, 150, 42, 43.25722115153374, "raw", "EMIT DCT 'Fuel Pressure' - holding register 42046"],
  ["unit-run-state", "Unit Run Status", "dct-panel", "PLC", "MODBUS TCP", "1 Hz", "integer", "state", 0, 5, 2, 2, "feature_window", "EMIT Brain Run Status, compressed enum"],
  ["eng-rpm", "Engine Speed", "adem-gateway", "PLC", "OPC UA", "1 Hz", "integer", "RPM", 0, 1400, 1180, 1143, "feature_window", "CAT ADEM 'Engine Speed' via ECU gateway"],
  ["eng-load", "Engine Load", "adem-gateway", "PLC", "OPC UA", "1 Hz", "float", "%", 0, 110, 82, 56.33603341574781, "feature_window", "CAT ADEM 'Engine Pct Load' via ECU gateway"],
  ["eng-oil-press", "Engine Oil Pressure", "adem-gateway", "PLC", "OPC UA", "1 Hz", "float", "PSI", 0, 100, 64, 62.54817881880033, "feature_window", "CAT ADEM 'Engine Oil Pressure' via ECU gateway"],
  ["eng-jw-temp", "Jacket Water Temp", "adem-gateway", "PLC", "OPC UA", "1 Hz", "float", "F", 0, 230, 178, 212.32450679267632, "feature_window", "CAT ADEM 'Jacket Water Temp' via ECU gateway"],
  ["eng-batt-volt", "Battery Voltage", "ple-telematics", "Historian", "MQTT", "1 Hz", "float", "V", 0, 30, 26.1, 24.59566179086181, "feature_window", "Battery Voltage via Product Link Elite"],
  ["eng-hours", "Engine Hours", "ple-telematics", "Historian", "MQTT", "1 Minute", "integer", "Min", 0, 600000, 154320, 154336, "feature_window", "Engine Hours Low/High counter via Product Link Elite"],
  ["cooler-fan-rpm", "Cooler Fan Speed", "cooler-vfd", "VFD", "PROFINET", "1 Hz", "integer", "RPM", 0, 900, 610, 158, "feature_window", "Aerial cooler fan speed from the fan VFD"],
  ["vib-engine", "Engine Vibration", "vib-network", "Sensor", "MODBUS TCP", "1 Minute", "float", "IPS", 0, 2, 0.22, 0.860079185601187, "raw", "Engine Vibration 1 Composite Level - register 43200"],
  ["vib-comp", "Compressor Vibration", "vib-network", "Sensor", "MODBUS TCP", "1 Minute", "float", "IPS", 0, 2, 0.31, 0.38070646186694845, "raw", "Compressor Vibration 1 Composite Level - register 43203"],
];

export const measurementTypeForTag = (name, unit) => {
  if (/Pressure/i.test(name)) return "Pressure";
  if (/Temp/i.test(name)) return "Temperature";
  if (/Level/i.test(name)) return "Level";
  if (/Valve/i.test(name)) return "Position";
  if (/Run Status/i.test(name)) return "State";
  if (/Speed|RPM/i.test(name) || unit === "RPM") return "Speed";
  if (/Load/i.test(name)) return "Load";
  if (/Voltage/i.test(name)) return "Voltage";
  if (/Hours/i.test(name)) return "Counter";
  if (/Vibration/i.test(name)) return "Vibration";
  return "Process Value";
};

export const decimalsForTag = (tag) => {
  if (tag.dataType === "integer" || tag.unit === "RPM" || tag.unit === "Min" || tag.unit === "state") return 0;
  if (tag.unit === "IPS" || tag.unit === "V") return 2;
  return 1;
};

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const tagCatalog = configuredTags.map((row) => {
  const [tagId, tagName, sourceId, sourceType, protocol, samplingRate, dataType, unit, minValue, maxValue, initialValue, latestValue, storageMode, description] = row;
  const measurementType = measurementTypeForTag(tagName, unit);
  return {
    tagId,
    tagName,
    kind: "Tag",
    assetName: assetBySourceId[sourceId] || "Cadre Compressor Skid",
    dataSource: sourceNameById[sourceId] || sourceId,
    sourceId,
    sourceType,
    protocol,
    measurementType,
    unit,
    samplingRate,
    dataType,
    storageMode,
    minValue,
    maxValue,
    initialValue,
    latestValue,
    description,
    samplingClass: samplingRate === "300 Hz" || samplingRate === "20 Hz" ? "High Frequency" : "Standard",
    lastSync: "17:25",
    plot: true,
    color: tagColors[tagId] || "#2d8fff",
    trend: {
      base: initialValue,
      latest: latestValue,
      min: minValue,
      max: maxValue,
      amplitude: Math.max((maxValue - minValue) * (samplingRate === "300 Hz" ? 0.18 : 0.035), Math.abs(initialValue) * 0.02, unit === "IPS" ? 0.04 : 0.2),
      noise: Math.max((maxValue - minValue) * (samplingRate === "300 Hz" ? 0.07 : 0.012), unit === "IPS" ? 0.02 : 0.05),
      decimals: decimalsForTag({ dataType, unit }),
    },
  };
});

export const tagById = Object.fromEntries(tagCatalog.map((tag) => [tag.tagId, tag]));

export const tagName = (tagId) => tagById[tagId]?.tagName || tagId;

export const ctags = [
  { tagId: "ctag-compression-ratio", tagName: "Compression Ratio", kind: "CTag", assetName: "Cadre Compressor Skid", dataSource: "Computed", measurementType: "Ratio", unit: "ratio", samplingRate: "1 Hz", lastSync: "17:25", plot: true, sourceTagIds: "final-dis-press,suct-press", calculationType: "Algebraic", expression: "final-dis-press / suct-press" },
  { tagId: "ctag-thermal-rise", tagName: "Compressor Thermal Rise", kind: "CTag", assetName: "EMIT DCT Panel", dataSource: "Computed", measurementType: "Temperature Rise", unit: "F", samplingRate: "1 Hz", lastSync: "17:25", plot: true, sourceTagIds: "final-dis-temp,suct-temp", calculationType: "Algebraic", expression: "final-dis-temp - suct-temp" },
  { tagId: "ctag-vibration-envelope", tagName: "Vibration Envelope", kind: "CTag", assetName: "Vibration Sensor Network", dataSource: "Computed", measurementType: "Vibration", unit: "IPS", samplingRate: "1/min", lastSync: "17:25", plot: true, sourceTagIds: "vib-engine,vib-comp", calculationType: "Standard Deviation", expression: "StandardDeviation(vib-engine, vib-comp)" },
  { tagId: "ctag-engine-health-index", tagName: "Engine Health Index", kind: "CTag", assetName: "Engine ECU Gateway", dataSource: "Computed", measurementType: "Composite", unit: "%", samplingRate: "1 Hz", lastSync: "17:25", plot: true, sourceTagIds: "eng-load,eng-oil-press,eng-jw-temp", calculationType: "Standard Deviation", expression: "StandardDeviation(eng-load, eng-oil-press, eng-jw-temp)" },
];

export const tags = [...tagCatalog, ...ctags];

export const trendValue = (tag, minuteIndex, tagIndex) => {
  if (minuteIndex === minuteCount - 1) return Number(tag.latestValue.toFixed(tag.trend.decimals));
  if (tag.unit === "state") return 2;
  const progress = minuteIndex / Math.max(1, minuteCount - 1);
  const day = Math.sin((Math.PI * 2 * minuteIndex) / 1440 + tagIndex * 0.33);
  const process = Math.sin((Math.PI * 2 * minuteIndex) / 83 + tagIndex * 0.21);
  const eventStart = Math.floor(minuteCount * 0.955);
  const eventProgress = minuteIndex < eventStart ? 0 : (minuteIndex - eventStart) / Math.max(1, minuteCount - eventStart - 1);
  const drift = (tag.latestValue - tag.initialValue) * progress;
  const eventPull = (tag.latestValue - tag.initialValue) * 0.35 * eventProgress;
  const value = tag.initialValue + drift + eventPull + tag.trend.amplitude * day + tag.trend.noise * process;
  return Number(clamp(value, tag.minValue, tag.maxValue).toFixed(tag.trend.decimals));
};

export const seriesByTagId = Object.fromEntries(
  tagCatalog.map((tag, tagIndex) => [tag.tagId, trendMinuteTimes.map((_, minuteIndex) => trendValue(tag, minuteIndex, tagIndex))])
);

export const latestValue = (tagId) => seriesByTagId[tagId]?.[minuteCount - 1] ?? 0;

export const tagUnit = (tagId) => tagById[tagId]?.unit || "";

export const valueWithUnit = (tagId, decimals = decimalsForTag(tagById[tagId] || {})) => `${Number(latestValue(tagId)).toFixed(decimals)} ${tagUnit(tagId)}`.trim();

export const trendSlice = (tagId, points = 7, stepMinutes = 10) => {
  const values = seriesByTagId[tagId] || [];
  return Array.from({ length: points }, (_, index) => values[values.length - 1 - (points - 1 - index) * stepMinutes] ?? null);
};

export const timeSlice = (points = 7, stepMinutes = 10) =>
  Array.from({ length: points }, (_, index) => {
    const valueIndex = trendMinuteTimes.length - 1 - (points - 1 - index) * stepMinutes;
    return trendMinuteTimes[Math.max(0, valueIndex)];
  });

export const constantLine = (value, points = 7) => Array.from({ length: points }, () => value);

export const trendTimes = timeSlice(7, 10);

export const deviationTrendTimes = timeSlice(7, 5);

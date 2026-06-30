import { data } from "../data/index.js";

export const plcTagTemplates = [
  { name: "Final Discharge Press", measurementType: "Pressure", unit: "PSI", samplingRate: "1 Hz" },
  { name: "Final Discharge Temp", measurementType: "Temperature", unit: "F", samplingRate: "1 Hz" },
  { name: "Engine Speed", measurementType: "Speed", unit: "RPM", samplingRate: "1 Hz" },
  { name: "Engine Load", measurementType: "Load", unit: "%", samplingRate: "1 Hz" },
  { name: "Compressor Oil Press", measurementType: "Pressure", unit: "PSI", samplingRate: "1 Hz" },
  { name: "Recycle Valve Position", measurementType: "Position", unit: "%", samplingRate: "20 Hz" },
  { name: "Suction Temp", measurementType: "Temperature", unit: "F", samplingRate: "300 Hz" },
  { name: "Cooler Fan Speed", measurementType: "Speed", unit: "RPM", samplingRate: "1 Hz" },
  { name: "Engine Vibration", measurementType: "Vibration", unit: "IPS", samplingRate: "1/min" },
  { name: "Compressor Vibration", measurementType: "Vibration", unit: "IPS", samplingRate: "1/min" },
];

export const fallbackSourceNames = data.dataSources?.map((source) => source.sourceName) || ["EMIT DCT Panel"];

export const mockPlcTags = Array.from({ length: 150 }, (_, index) => {
  const template = plcTagTemplates[index % plcTagTemplates.length];
  const bank = Math.floor(index / plcTagTemplates.length) + 1;
  const tagNumber = String(index + 1).padStart(3, "0");
  return {
    tagId: `PLC-TAG-${tagNumber}`,
    tagName: `${template.name} ${bank}`,
    kind: "Tag",
    dataSource: fallbackSourceNames[index % fallbackSourceNames.length],
    measurementType: template.measurementType,
    unit: template.unit,
    samplingRate: template.samplingRate,
    lastSync: "09:42",
    plot: true,
  };
});

export const tagCatalog = [
  ...(Array.isArray(data.tagCatalog) && data.tagCatalog.length ? data.tagCatalog : mockPlcTags),
  ...data.tags.filter((tag) => tag.kind === "CTag"),
];

export const assetTagConnectionStorageKey = "rpulse-asset-tag-connections";

export const assetSourceKey = (machineName, sourceName) => `${String(machineName || "").trim()}::${String(sourceName || "").trim()}`;

export const defaultAssetTagConnections = () =>
  (data.dataSources || []).reduce((connections, source) => {
    const tagIds = tagCatalog
      .filter((tag) => tag.kind !== "CTag" && tag.dataSource === source.sourceName)
      .map((tag) => tag.tagId);
    if (tagIds.length) connections[assetSourceKey(source.machineName, source.sourceName)] = { tagIds, aliases: {} };
    return connections;
  }, {});

export const readAssetTagConnections = () => {
  const defaults = defaultAssetTagConnections();
  try {
    return { ...defaults, ...JSON.parse(window.localStorage.getItem(assetTagConnectionStorageKey) || "{}") };
  } catch (error) {
    return defaults;
  }
};

export const writeAssetTagConnection = (machineName, sourceName, connection) => {
  const connections = readAssetTagConnections();
  connections[assetSourceKey(machineName, sourceName)] = connection;
  window.localStorage.setItem(assetTagConnectionStorageKey, JSON.stringify(connections));
};

if (window.agGrid && window.agGrid.LicenseManager && window.AG_GRID_LICENSE_KEY) {
  window.agGrid.LicenseManager.setLicenseKey(window.AG_GRID_LICENSE_KEY);
}

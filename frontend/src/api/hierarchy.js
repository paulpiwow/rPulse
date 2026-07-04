// Hierarchy domain: sites → assets → machines → datasources → tags, plus
// asset-scoped ctags and baselines. Maps backend entity JSON ({ id, code,
// nested parents, ... }) to the shapes the screens already render.
import { api } from "./client.js";

// --- mappers (backend entity → screen shape) --------------------------------

export function mapSite(site) {
  if (!site) return null;
  return {
    siteCode: site.code,
    siteName: site.siteName,
    location: site.location,
    customerName: site.customerName,
    description: site.description,
  };
}

export function mapAsset(asset) {
  return {
    assetId: asset.code,
    assetName: asset.assetName,
    location: asset.location,
    assetType: asset.assetType,
    assignedTo: asset.assignedTo,
    enabled: asset.enabled,
    baselineRequired: asset.baselineRequired,
    description: asset.description,
    siteCode: asset.site ? asset.site.code : null,
    // rollups (status / activeAlarms / baselineDeviations) come from
    // /site-status — merge via fetchAssetsWithRollups() when a screen needs them
    status: "green",
    activeAlarms: 0,
    baselineDeviations: 0,
    lastUpdate: "",
  };
}

export function mapMachine(machine) {
  return {
    machineId: machine.code,
    machineName: machine.machineName,
    type: machine.machineType,
    location: machine.location,
    description: machine.description,
    assetName: machine.asset ? machine.asset.assetName : "",
    assetCode: machine.asset ? machine.asset.code : null,
  };
}

export function mapDatasource(ds) {
  return {
    dataSourceId: ds.code,
    sourceName: ds.sourceName,
    sourceType: ds.sourceType,
    type: ds.type, // "HISTORIAN" | "PLC" | null
    protocol: ds.protocol,
    networkAddress: ds.networkAddress,
    location: ds.location,
    machineName: ds.machine ? ds.machine.machineName : "",
    machineCode: ds.machine ? ds.machine.code : null,
    status: "green",
  };
}

export function mapTag(tag) {
  return {
    tagId: tag.code,
    tagName: tag.tagName,
    tagKey: tag.tagKey,
    kind: "Tag",
    dataSource: tag.datasource ? tag.datasource.sourceName : "",
    dataSourceCode: tag.datasource ? tag.datasource.code : null,
    sourceType: tag.datasource ? tag.datasource.sourceType : "",
    measurementType: tag.measurementType,
    unit: tag.unit,
    dataType: tag.dataType,
    samplingRate: tag.samplingRate,
    storageMode: tag.storageMode,
    minValue: tag.minValue,
    maxValue: tag.maxValue,
    initialValue: tag.initialValue,
    plot: tag.plot,
    color: tag.color,
    description: tag.description,
  };
}

export function mapCtag(ctag) {
  return {
    tagId: ctag.code,
    tagName: ctag.tagName,
    tagKey: ctag.ctagKey,
    kind: "CTag",
    assetName: ctag.asset ? ctag.asset.assetName : "",
    assetCode: ctag.asset ? ctag.asset.code : null,
    dataSource: "Computed",
    measurementType: ctag.measurementType,
    unit: ctag.unit,
    samplingRate: ctag.samplingRate,
    calculationType: ctag.calculationType,
    expression: ctag.expression,
    sourceTagIds: ctag.sourceTagIds ? ctag.sourceTagIds.split(",").map((s) => s.trim()).filter(Boolean) : [],
    plot: ctag.plot,
  };
}

export function mapBaseline(baseline) {
  const target = baseline.tag || baseline.ctag;
  return {
    baselineId: baseline.code,
    scope: baseline.scope,
    assetName: baseline.asset ? baseline.asset.assetName : "",
    assetCode: baseline.asset ? baseline.asset.code : null,
    tagId: target ? target.code : "",
    tagName: target ? target.tagName : "",
    measurementType: baseline.measurementType,
    unit: baseline.unit,
    baselineLow: baseline.baselineLow,
    baselineTarget: baseline.baselineTarget,
    baselineStdDev: baseline.baselineStdDev,
    baselineHigh: baseline.baselineHigh,
    evaluationWindow: baseline.evaluationWindow,
    warningDelay: baseline.warningDelay,
    enabled: baseline.enabled ? "Yes" : "No",
    owner: baseline.owner,
  };
}

// --- sites -------------------------------------------------------------------

export async function fetchSites() {
  return (await api.get("/sites")).map(mapSite);
}

export function createSite(site) {
  return api.post("/sites", site);
}

// --- assets ------------------------------------------------------------------

export async function fetchAssets() {
  return (await api.get("/assets")).map(mapAsset);
}

// Assets merged with live status/counts from /site-status.
export async function fetchAssetsWithRollups() {
  const [assets, status] = await Promise.all([api.get("/assets"), api.get("/site-status")]);
  const rollups = new Map((status.assets || []).map((a) => [a.assetCode, a]));
  return assets.map((asset) => {
    const mapped = mapAsset(asset);
    const rollup = rollups.get(asset.code);
    if (rollup) {
      mapped.status = (rollup.status || "green").toLowerCase();
      mapped.activeAlarms = rollup.activeAlarms || 0;
      mapped.baselineDeviations = rollup.deviations || 0;
    }
    return mapped;
  });
}

// Full nested tree (machines → datasources → tags, plus ctags + baselines).
export function fetchAssetTree(code) {
  return api.get(`/assets/${encodeURIComponent(code)}`);
}

export function createAsset(asset) {
  return api.post("/assets", asset);
}

export function updateAsset(code, asset) {
  return api.put(`/assets/${encodeURIComponent(code)}`, asset);
}

export function deleteAsset(code) {
  return api.del(`/assets/${encodeURIComponent(code)}`);
}

// --- machines ----------------------------------------------------------------

export async function fetchMachines(assetCode) {
  const path = assetCode ? `/assets/${encodeURIComponent(assetCode)}/machines` : "/machines";
  return (await api.get(path)).map(mapMachine);
}

export function createMachine(assetCode, machine) {
  return api.post(`/assets/${encodeURIComponent(assetCode)}/machines`, machine);
}

export function updateMachine(code, machine) {
  return api.put(`/machines/${encodeURIComponent(code)}`, machine);
}

export function deleteMachine(code) {
  return api.del(`/machines/${encodeURIComponent(code)}`);
}

// --- datasources ---------------------------------------------------------------

export async function fetchDatasources(machineCode) {
  const path = machineCode ? `/machines/${encodeURIComponent(machineCode)}/datasources` : "/datasources";
  return (await api.get(path)).map(mapDatasource);
}

export function createDatasource(machineCode, datasource) {
  return api.post(`/machines/${encodeURIComponent(machineCode)}/datasources`, datasource);
}

export function updateDatasource(code, datasource) {
  return api.put(`/datasources/${encodeURIComponent(code)}`, datasource);
}

export function deleteDatasource(code) {
  return api.del(`/datasources/${encodeURIComponent(code)}`);
}

// Tags discoverable from the source's backing store (HISTORIAN-backed only;
// other source types return []). Response: [{ tagKey, name, unit }]
export async function fetchAvailableTags(datasourceCode) {
  const tags = await api.get(`/datasources/${encodeURIComponent(datasourceCode)}/available-tags`);
  return tags.map((t) => ({ tagId: t.tagKey, tagKey: t.tagKey, tagName: t.name, unit: t.unit }));
}

// --- tags ----------------------------------------------------------------------

export async function fetchTags(datasourceCode) {
  const path = datasourceCode ? `/datasources/${encodeURIComponent(datasourceCode)}/tags` : "/tags";
  return (await api.get(path)).map(mapTag);
}

export function createTag(datasourceCode, tag) {
  return api.post(`/datasources/${encodeURIComponent(datasourceCode)}/tags`, tag);
}

export function updateTag(code, tag) {
  return api.put(`/tags/${encodeURIComponent(code)}`, tag);
}

export function deleteTag(code) {
  return api.del(`/tags/${encodeURIComponent(code)}`);
}

// --- ctags ----------------------------------------------------------------------

export async function fetchCtags(assetCode) {
  const path = assetCode ? `/assets/${encodeURIComponent(assetCode)}/ctags` : "/ctags";
  return (await api.get(path)).map(mapCtag);
}

export function createCtag(assetCode, ctag) {
  return api.post(`/assets/${encodeURIComponent(assetCode)}/ctags`, ctag);
}

export function updateCtag(code, ctag) {
  return api.put(`/ctags/${encodeURIComponent(code)}`, ctag);
}

export function deleteCtag(code) {
  return api.del(`/ctags/${encodeURIComponent(code)}`);
}

// Combined catalog in the shape lib/tags.js used to build from mock data.
export async function fetchTagCatalog() {
  const [tags, ctags] = await Promise.all([fetchTags(), fetchCtags()]);
  return [...tags, ...ctags];
}

// --- baselines --------------------------------------------------------------------

export async function fetchBaselines(assetCode) {
  const path = assetCode ? `/assets/${encodeURIComponent(assetCode)}/baselines` : "/baselines";
  return (await api.get(path)).map(mapBaseline);
}

export function createBaseline(baseline) {
  return api.post("/baselines", baseline);
}

export function updateBaseline(code, baseline) {
  return api.put(`/baselines/${encodeURIComponent(code)}`, baseline);
}

export function deleteBaseline(code) {
  return api.del(`/baselines/${encodeURIComponent(code)}`);
}

// Recompute an asset's Tag/CTag-scoped baselines from recent history.
// windowStart/windowEnd are ISO instants; returns the updated baselines.
export async function reestablishBaselines(assetCode, windowStart, windowEnd) {
  const updated = await api.post(`/assets/${encodeURIComponent(assetCode)}/baselines/reestablish`, {
    windowStart,
    windowEnd,
  });
  return updated.map(mapBaseline);
}

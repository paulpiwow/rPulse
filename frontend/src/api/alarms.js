// Alarms domain: site-status rollup, live active alarms (ack/clear), paged
// alarm history, maintenance warnings, and alarm rule CRUD (AlarmRuleDto —
// everything cross-referenced by business code).
import { api, durationLabel, formatDateTime, formatTime } from "./client.js";

const STATUS_LABELS = { ACTIVE: "Open", ACKED: "Acknowledged", CLEARED: "Resolved" };

// --- site status ---------------------------------------------------------------

// GET /site-status → dashboard rollup + fixed 14-day health trend.
export async function fetchSiteStatus() {
  const status = await api.get("/site-status");
  return {
    siteName: status.siteName,
    assetCount: status.assetCount,
    activeAlarmCount: status.activeAlarmCount,
    maintenanceWarningCount: status.maintenanceWarningCount,
    assets: (status.assets || []).map((asset) => ({
      assetId: asset.assetCode,
      assetName: asset.name,
      location: asset.location,
      status: (asset.status || "green").toLowerCase(),
      activeAlarms: asset.activeAlarms || 0,
      baselineDeviations: asset.deviations || 0,
    })),
    trend: {
      duration: status.trend ? status.trend.duration : "14_DAYS",
      points: status.trend ? status.trend.points || [] : [],
    },
  };
}

// --- active alarms ---------------------------------------------------------------

function mapActiveAlarm(alarm, assetNameByCode = new Map()) {
  return {
    alarmEventId: alarm.historyCode,
    historyCode: alarm.historyCode,
    alarmCode: alarm.alarmCode,
    assetCode: alarm.assetCode,
    assetName: assetNameByCode.get(alarm.assetCode) || alarm.assetCode || "",
    location: "",
    alarmName: alarm.alarmName,
    severity: (alarm.severity || "yellow").toLowerCase(),
    tagKey: alarm.tagKey,
    currentValue: alarm.currentValue,
    thresholdValue: alarm.thresholdValue,
    operator: alarm.operator,
    tripTime: formatTime(alarm.tripTime),
    tripTimestamp: alarm.tripTime,
    duration: durationLabel(alarm.durationSeconds),
    acknowledgement: alarm.status === "ACKED" ? "Acknowledged" : "Pending",
    tracking: alarm.status === "ACKED" ? "Active" : "Open",
    status: alarm.status,
  };
}

// Live-evaluates enabled rules; optionally scoped to one asset. Asset names
// and locations are resolved from /assets so rows read like the mock shape.
export async function fetchActiveAlarms(assetCode) {
  const path = assetCode ? `/alarms/active/${encodeURIComponent(assetCode)}` : "/alarms/active";
  const [alarms, assets] = await Promise.all([api.get(path), api.get("/assets")]);
  const names = new Map(assets.map((a) => [a.code, a.assetName]));
  const locations = new Map(assets.map((a) => [a.code, a.location]));
  return alarms.map((alarm) => {
    const row = mapActiveAlarm(alarm, names);
    row.location = locations.get(alarm.assetCode) || "";
    return row;
  });
}

// Ack = "seen, still firing"; clear = resolved/force-cleared.
export function acknowledgeAlarm(historyCode, userCode) {
  return api.post(`/alarms/active/${encodeURIComponent(historyCode)}/ack`, undefined, userCode ? { userCode } : undefined);
}

export function clearAlarm(historyCode, userCode) {
  return api.post(`/alarms/active/${encodeURIComponent(historyCode)}/clear`, undefined, userCode ? { userCode } : undefined);
}

// --- alarm history ----------------------------------------------------------------

export function mapHistoryRecord(record, assetNameById = new Map()) {
  return {
    alarmEventId: record.code,
    assetName: assetNameById.get(record.assetId) || "",
    location: "",
    alarmName: record.alarmName,
    severity: (record.severity || "").toLowerCase(),
    tripTime: formatDateTime(record.tripTime),
    notificationTime: formatDateTime(record.notificationTime),
    acknowledgeTime: record.acknowledgeTime ? formatDateTime(record.acknowledgeTime) : "",
    clearTime: record.clearTime ? formatDateTime(record.clearTime) : "",
    duration: durationLabel(record.durationSeconds),
    responsibility: record.responsibility || "",
    status: STATUS_LABELS[record.status] || record.status || "",
    rawStatus: record.status,
    acknowledgedByUserId: record.acknowledgedByUserId,
    clearedByUserId: record.clearedByUserId,
  };
}

async function assetLookups() {
  const assets = await api.get("/assets");
  return {
    nameById: new Map(assets.map((a) => [a.id, a.assetName])),
    locationById: new Map(assets.map((a) => [a.id, a.location])),
  };
}

// Paged, newest first. assetCode filters by asset (backend param is named
// assetId but has always taken the code).
export async function fetchAlarmHistory({ from, to, assetCode, page = 0, size = 50 } = {}) {
  const [pageResponse, lookups] = await Promise.all([
    api.get("/alarms/history", { from, to, assetId: assetCode, page, size }),
    assetLookups(),
  ]);
  return {
    rows: (pageResponse.content || []).map((record) => {
      const row = mapHistoryRecord(record, lookups.nameById);
      row.location = lookups.locationById.get(record.assetId) || "";
      return row;
    }),
    page: pageResponse.page,
    size: pageResponse.size,
    totalElements: pageResponse.totalElements,
    totalPages: pageResponse.totalPages,
  };
}

export async function fetchAlarmHistoryDetail(code) {
  const [record, lookups] = await Promise.all([
    api.get(`/alarms/history/${encodeURIComponent(code)}`),
    assetLookups(),
  ]);
  const row = mapHistoryRecord(record, lookups.nameById);
  row.location = lookups.locationById.get(record.assetId) || "";
  return row;
}

// --- maintenance warnings ------------------------------------------------------------

const DIRECTION_LABELS = { ABOVE: "Exceeds", BELOW: "Below" };

// Tags/ctags currently outside their baseline range, enriched with tag
// metadata (name, unit, machine) and asset names so rows match the mock shape.
export async function fetchMaintenanceWarnings() {
  const [warnings, tags, ctags, assets] = await Promise.all([
    api.get("/maintenance-warnings"),
    api.get("/tags"),
    api.get("/ctags"),
    api.get("/assets"),
  ]);
  const tagByCode = new Map(tags.map((t) => [t.code, t]));
  const ctagByCode = new Map(ctags.map((c) => [c.code, c]));
  const assetByCode = new Map(assets.map((a) => [a.code, a]));
  return warnings.map((warning) => {
    const tag = warning.scope === "CTag" ? ctagByCode.get(warning.tagCode) : tagByCode.get(warning.tagCode);
    const asset = assetByCode.get(warning.assetCode);
    const unit = tag ? tag.unit || "" : "";
    const withUnit = (value, decimals = 2) =>
      value === null || value === undefined ? "" : `${Number(value).toFixed(decimals)}${unit ? ` ${unit}` : ""}`;
    return {
      deviationId: warning.tagCode,
      tagCode: warning.tagCode,
      tagName: tag ? tag.tagName : warning.tagCode,
      scope: warning.scope,
      measurementType: tag ? tag.measurementType || "" : "",
      machine: tag && tag.datasource && tag.datasource.machine ? tag.datasource.machine.machineName : "",
      asset: asset ? asset.assetName : warning.assetCode,
      assetCode: warning.assetCode,
      location: asset ? asset.location : "",
      direction: DIRECTION_LABELS[warning.direction] || warning.direction,
      baseline: withUnit(warning.baselineTarget),
      baselineLow: withUnit(warning.baselineLow),
      baselineHigh: withUnit(warning.baselineHigh),
      baselineStdDev: withUnit(warning.baselineStdDev),
      currentValue: withUnit(warning.currentValue),
      currentValueNumber: warning.currentValue,
      unit,
      status: "yellow",
    };
  });
}

// Writes the one Message a warning can produce; body names the target group.
export function notifyMaintenanceWarning(tagCode, groupCode) {
  return api.post(
    `/maintenance-warnings/${encodeURIComponent(tagCode)}/notify`,
    groupCode ? { groupCode } : undefined,
  );
}

// --- alarm rules (configuration) --------------------------------------------------------

// AlarmRuleDto travels as-is: { code, assetCode, alarmName, alarmType, enabled,
// severity, watchedTagCode, watchedKind (TAG|CTAG), operator, thresholdValue,
// rateValue, rateUnit, ratePeriod, logicFormula, notifyGroupCodes, notifyUserCodes }
export async function fetchAlarmRules(assetCode) {
  const path = assetCode ? `/assets/${encodeURIComponent(assetCode)}/alarms` : "/alarms";
  return api.get(path);
}

export function fetchAlarmRule(code) {
  return api.get(`/alarms/${encodeURIComponent(code)}`);
}

export function createAlarmRule(dto) {
  return api.post("/alarms", dto);
}

export function updateAlarmRule(code, dto) {
  return api.put(`/alarms/${encodeURIComponent(code)}`, dto);
}

export function deleteAlarmRule(code) {
  return api.del(`/alarms/${encodeURIComponent(code)}`);
}

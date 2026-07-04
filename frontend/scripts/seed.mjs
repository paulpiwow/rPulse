// Seeds the rPulse backend with the demo dataset from src/data/ via the API.
// The database starts empty (no seed migrations), so run this once after the
// backend is up:  npm run seed   (backend on http://localhost:8080 by default)
//
// Idempotent: entities whose business code already exists are skipped.
import { groups, messages, users } from "../src/data/admin.js";
import { assets, dataSources, machines } from "../src/data/assets.js";
import { baselineRules } from "../src/data/baselines.js";
import { shell } from "../src/data/site.js";
import { ctags, tagCatalog } from "../src/data/tags.js";

// docker-compose maps the backend to host port 8456 (8080 inside the container)
const BASE = process.env.SEED_API || "http://localhost:8456/api/v1";

async function request(method, path, body) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`${method} ${path} → ${response.status} ${text}`);
  }
  return response.status === 204 ? null : response.json();
}

const get = (path) => request("GET", path);
const post = (path, body) => request("POST", path, body);
const put = (path, body) => request("PUT", path, body);

let created = 0;
let skipped = 0;

async function ensure(existingCodes, code, label, create) {
  if (existingCodes.has(code)) {
    skipped += 1;
    return null;
  }
  const result = await create();
  created += 1;
  console.log(`  + ${label} ${code}`);
  return result;
}

function codesOf(list) {
  return new Set(list.map((item) => item.code));
}

// Mock "sourceId" (dct-panel, adem-gateway, ...) → mock datasource code (DS-00x).
const DS_CODE_BY_SOURCE_ID = {
  "dct-panel": "DS-001",
  "adem-gateway": "DS-002",
  "ple-telematics": "DS-003",
  "cooler-vfd": "DS-004",
  "vib-network": "DS-005",
};

// Alarm rules reconstructed from the mock active-alarm events + trip conditions.
const ALARM_RULES = [
  { code: "ALR-001", assetCode: "AST-DCT", alarmName: "Final Discharge Temperature High", alarmType: "Threshold", enabled: true, severity: "red", watchedTagCode: "final-dis-temp", watchedKind: "TAG", operator: ">", thresholdValue: 240, notifyGroupCodes: ["GRP-001"], notifyUserCodes: [] },
  { code: "ALR-002", assetCode: "AST-ECU", alarmName: "Engine Vibration Near Danger", alarmType: "Threshold", enabled: true, severity: "red", watchedTagCode: "vib-engine", watchedKind: "TAG", operator: ">", thresholdValue: 0.8, notifyGroupCodes: ["GRP-002"], notifyUserCodes: [] },
  { code: "ALR-003", assetCode: "AST-DCT", alarmName: "Suction Temperature Low", alarmType: "Threshold", enabled: true, severity: "yellow", watchedTagCode: "suct-temp", watchedKind: "TAG", operator: "<", thresholdValue: 35, notifyGroupCodes: ["GRP-001"], notifyUserCodes: [] },
  { code: "ALR-004", assetCode: "AST-DCT", alarmName: "Final Discharge Pressure Below Load Curve", alarmType: "Threshold", enabled: true, severity: "yellow", watchedTagCode: "final-dis-press", watchedKind: "TAG", operator: "<", thresholdValue: 900, notifyGroupCodes: ["GRP-001"], notifyUserCodes: [] },
  { code: "ALR-005", assetCode: "AST-ECU", alarmName: "Jacket Water Temperature High", alarmType: "Threshold", enabled: true, severity: "yellow", watchedTagCode: "eng-jw-temp", watchedKind: "TAG", operator: ">", thresholdValue: 205, notifyGroupCodes: ["GRP-003"], notifyUserCodes: [] },
];

async function main() {
  console.log(`Seeding ${BASE} ...`);
  await get("/sites").catch(() => {
    throw new Error(`Backend not reachable at ${BASE} — start it first (cd backend && ./mvnw spring-boot:run)`);
  });

  // --- site -----------------------------------------------------------------
  const existingSites = codesOf(await get("/sites"));
  await ensure(existingSites, "SITE-CADRE", "site", () =>
    post("/sites", {
      code: "SITE-CADRE",
      siteName: shell.siteName,
      location: shell.siteLocation,
      customerName: shell.company,
      description: "Cadre rhoPulse demo site",
    }),
  );
  const site = (await get("/sites")).find((s) => s.code === "SITE-CADRE");

  // --- assets ---------------------------------------------------------------
  const existingAssets = codesOf(await get("/assets"));
  for (const asset of assets) {
    await ensure(existingAssets, asset.assetId, "asset", () =>
      post("/assets", {
        code: asset.assetId,
        site: site ? { id: site.id } : null,
        assetName: asset.assetName,
        location: asset.location,
        assetType: "Compressor Package",
        assignedTo: asset.assignedTo,
        baselineRequired: true,
        enabled: true,
        description: asset.description,
      }),
    );
  }
  const assetCodeByName = new Map(assets.map((a) => [a.assetName, a.assetId]));

  // --- machines ---------------------------------------------------------------
  const existingMachines = codesOf(await get("/machines"));
  for (const machine of machines) {
    const assetCode = assetCodeByName.get(machine.assetName);
    await ensure(existingMachines, machine.machineId, "machine", () =>
      post(`/assets/${assetCode}/machines`, {
        code: machine.machineId,
        machineName: machine.machineName,
        machineType: machine.type,
        location: machine.location,
        description: machine.description,
      }),
    );
  }
  const machineCodeByName = new Map(machines.map((m) => [m.machineName, m.machineId]));

  // --- datasources ---------------------------------------------------------------
  const existingDatasources = codesOf(await get("/datasources"));
  for (const ds of dataSources) {
    const machineCode = machineCodeByName.get(ds.machineName);
    await ensure(existingDatasources, ds.dataSourceId, "datasource", () =>
      post(`/machines/${machineCode}/datasources`, {
        code: ds.dataSourceId,
        sourceName: ds.sourceName,
        sourceType: ds.sourceType,
        type: ds.sourceType === "Historian" ? "HISTORIAN" : "PLC",
        protocol: ds.protocol,
        networkAddress: ds.networkAddress,
        location: ds.location,
      }),
    );
  }

  // --- tags -------------------------------------------------------------------
  const existingTags = codesOf(await get("/tags"));
  for (const tag of tagCatalog) {
    const dsCode = DS_CODE_BY_SOURCE_ID[tag.sourceId];
    if (!dsCode) continue;
    await ensure(existingTags, tag.tagId, "tag", () =>
      post(`/datasources/${dsCode}/tags`, {
        code: tag.tagId,
        tagName: tag.tagName,
        tagKey: tag.tagId,
        measurementType: tag.measurementType,
        unit: tag.unit,
        dataType: tag.dataType,
        samplingRate: tag.samplingRate,
        storageMode: tag.storageMode,
        minValue: tag.minValue,
        maxValue: tag.maxValue,
        initialValue: tag.initialValue,
        plot: tag.plot !== false,
        color: tag.color,
        description: tag.description,
      }),
    );
  }

  // --- ctags -------------------------------------------------------------------
  const existingCtags = codesOf(await get("/ctags"));
  for (const ctag of ctags) {
    const assetCode = assetCodeByName.get(ctag.assetName) || assets[0].assetId;
    await ensure(existingCtags, ctag.tagId, "ctag", () =>
      post(`/assets/${assetCode}/ctags`, {
        code: ctag.tagId,
        tagName: ctag.tagName,
        ctagKey: ctag.tagId,
        measurementType: ctag.measurementType,
        unit: ctag.unit,
        samplingRate: ctag.samplingRate,
        calculationType: ctag.calculationType,
        expression: ctag.expression,
        sourceTagIds: Array.isArray(ctag.sourceTagIds) ? ctag.sourceTagIds.join(",") : ctag.sourceTagIds || "",
        plot: true,
      }),
    );
  }

  // --- baselines (need entity ids for the target references) --------------------
  const tagsByCode = new Map((await get("/tags")).map((t) => [t.code, t]));
  const ctagsByCode = new Map((await get("/ctags")).map((c) => [c.code, c]));
  const assetsByCode = new Map((await get("/assets")).map((a) => [a.code, a]));
  const existingBaselines = codesOf(await get("/baselines"));
  for (const rule of baselineRules) {
    const assetCode = assetCodeByName.get(rule.assetName);
    const asset = assetsByCode.get(assetCode);
    if (!asset) continue;
    const tag = rule.scope === "Tag" ? tagsByCode.get(rule.tagId) : null;
    const ctag = rule.scope === "CTag" ? ctagsByCode.get(rule.tagId) : null;
    if (rule.scope === "Tag" && !tag) continue;
    if (rule.scope === "CTag" && !ctag) continue;
    await ensure(existingBaselines, rule.baselineId, "baseline", () =>
      post("/baselines", {
        code: rule.baselineId,
        scope: rule.scope,
        asset: { id: asset.id },
        tag: tag ? { id: tag.id } : null,
        ctag: ctag ? { id: ctag.id } : null,
        measurementType: rule.measurementType,
        unit: rule.unit,
        baselineLow: Number(rule.baselineLow),
        baselineTarget: Number(rule.baselineTarget),
        baselineStdDev: Number(rule.baselineStdDev),
        baselineHigh: Number(rule.baselineHigh),
        evaluationWindow: rule.evaluationWindow,
        warningDelay: rule.warningDelay,
        enabled: rule.enabled === "Yes",
        owner: rule.owner,
      }),
    );
  }

  // --- groups --------------------------------------------------------------------
  const existingGroups = codesOf(await get("/groups"));
  for (const group of groups) {
    await ensure(existingGroups, group.groupId, "group", () =>
      post("/groups", {
        code: group.groupId,
        groupName: group.groupName,
        purpose: group.purpose,
        delivery: group.delivery,
        active: group.active === "Yes",
        notes: "",
      }),
    );
  }

  // --- users + group membership ----------------------------------------------------
  const existingUsers = codesOf(await get("/users"));
  for (const user of users) {
    await ensure(existingUsers, user.userId, "user", () =>
      post("/users", {
        code: user.userId,
        userName: user.userName,
        email: user.email,
        role: user.role,
        active: user.status === "Active",
        notificationPrefs: user.notifications,
        emailNotifications: user.notifications.includes("Email"),
        smsNotifications: user.notifications.includes("SMS"),
      }),
    );
  }
  const userCodeByName = new Map(users.map((u) => [u.userName, u.userId]));
  const groupCodesByUser = new Map();
  for (const group of groups) {
    for (const memberName of group.members.split(",").map((s) => s.trim())) {
      const userCode = userCodeByName.get(memberName);
      if (!userCode) continue;
      if (!groupCodesByUser.has(userCode)) groupCodesByUser.set(userCode, []);
      groupCodesByUser.get(userCode).push(group.groupId);
    }
  }
  for (const [userCode, groupCodes] of groupCodesByUser) {
    await put(`/users/${userCode}/groups`, groupCodes);
  }
  console.log(`  ~ set group membership for ${groupCodesByUser.size} users`);

  // --- alarm rules -------------------------------------------------------------------
  const existingRules = new Set((await get("/alarms")).map((r) => r.code));
  for (const rule of ALARM_RULES) {
    await ensure(existingRules, rule.code, "alarm rule", () => post("/alarms", rule));
  }

  // --- messages -----------------------------------------------------------------------
  const existingMessages = codesOf(await get("/messages"));
  for (const message of messages) {
    await ensure(existingMessages, message.messageId, "message", () =>
      post("/messages", {
        code: message.messageId,
        title: message.title,
        body: message.title,
        source: "SYSTEM",
        target: message.target,
        status: message.status,
      }),
    );
  }

  // --- license (singleton) ----------------------------------------------------------------
  const license = await get("/license").catch(() => null);
  if (!license) {
    await put("/license", {
      code: "LIC-001",
      customerName: shell.company,
      status: "Active",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      renewalStatus: "Not Started",
    });
    created += 1;
    console.log("  + license LIC-001");
  } else {
    skipped += 1;
  }

  console.log(`Done: ${created} created, ${skipped} already present.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

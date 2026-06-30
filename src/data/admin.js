import { run } from "./site.js";

export const groups = [
  { groupId: "GRP-001", groupName: "Compressor Operations", purpose: "First response for Cadre compressor process alarms", members: "Maya Singh, Owen Carter", delivery: "Email, SMS", active: "Yes" },
  { groupId: "GRP-002", groupName: "Cadre Reliability", purpose: "Rotating equipment, vibration, and compressor health review", members: "Alex Rivera, Sam Patel", delivery: "Email, SMS", active: "Yes" },
  { groupId: "GRP-003", groupName: "Engine Reliability", purpose: "CAT ADEM engine condition and load review", members: "Jordan Ellis, Sam Patel", delivery: "Email", active: "Yes" },
  { groupId: "GRP-004", groupName: "Automation Support", purpose: "InfluxDB, MQTT, OPC UA, Modbus, and PROFINET support", members: "Cody, Admin", delivery: "Email", active: "Yes" },
];

export const users = [
  { userId: "USR-001", userName: "Cody", email: "cody@example.com", role: "System Administrator", status: "Active", notifications: "Email, SMS" },
  { userId: "USR-002", userName: "Maya Singh", email: "maya.singh@cadre-demo.local", role: "Operator", status: "Active", notifications: "SMS" },
  { userId: "USR-003", userName: "Alex Rivera", email: "alex.rivera@cadre-demo.local", role: "Maintenance / Reliability", status: "Active", notifications: "Email, SMS" },
  { userId: "USR-004", userName: "Owen Carter", email: "owen.carter@cadre-demo.local", role: "Operator", status: "Active", notifications: "Email" },
  { userId: "USR-005", userName: "Jordan Ellis", email: "jordan.ellis@cadre-demo.local", role: "Configurator", status: "Active", notifications: "Email" },
];

export const messages = [
  { messageId: "MSG-001", title: "Cadre simulator raw stop limit reached", target: "Automation Support", createdAt: "2026-06-17 17:25", status: "Unread" },
  { messageId: "MSG-002", title: "Engine vibration warning requires reliability review", target: "Cadre Reliability", createdAt: "2026-06-17 17:16", status: "Unread" },
  { messageId: "MSG-003", title: "InfluxDB write path connected", target: "Cody", createdAt: "2026-06-17 17:10", status: "Acknowledged" },
];

export const notificationRules = [
  { ruleId: "NR-001", name: "Critical Compressor Trips", trigger: "Alarm Active", targetGroup: "Compressor Operations", delivery: "SMS, Email", enabled: "Yes" },
  { ruleId: "NR-002", name: "Vibration Warning Review", trigger: "Maintenance Warning", targetGroup: "Cadre Reliability", delivery: "Email", enabled: "Yes" },
  { ruleId: "NR-003", name: "Engine Condition Escalation", trigger: "Alarm Active", targetGroup: "Engine Reliability", delivery: "Email", enabled: "Yes" },
];

export const auditLog = [
  { auditId: "AUD-CAD-2101", occurredAt: "2026-06-17 15:15", user: "Cody", action: "Import", entity: "Tag_Config", entityId: "asset-simulator", summary: "Imported Cadre compressor simulator configuration with 20 tags" },
  { auditId: "AUD-CAD-2102", occurredAt: "2026-06-17 17:10", user: "System", action: "Create", entity: "Simulator_Run", entityId: run.runId, summary: "Simulator run started for Cadre compressor skid" },
  { auditId: "AUD-CAD-2103", occurredAt: "2026-06-17 17:25", user: "System", action: "Stop", entity: "Simulator_Run", entityId: run.runId, summary: "Simulator stopped at raw storage stop limit" },
];

export const diagnostics = [
  { component: "InfluxDB", status: "green", lastCheck: "17:25", message: `${run.writtenPoints.toLocaleString()} Cadre points written to asset_tag_values`, action: "None" },
  { component: "Postgres", status: "green", lastCheck: "17:25", message: "Cadre configuration state store reachable", action: "None" },
  { component: "Modbus TCP", status: "green", lastCheck: "17:25", message: "DCT panel and vibration registers available", action: "None" },
  { component: "OPC UA", status: "yellow", lastCheck: "17:25", message: "Gateway publish path stopped with simulator", action: "Confirm runtime state before live demo" },
  { component: "MQTT", status: "green", lastCheck: "17:25", message: "Product Link telematics publisher completed run", action: "None" },
  { component: "PROFINET", status: "yellow", lastCheck: "17:25", message: "PROFINET RT/UDP provider stopped with simulator", action: "Confirm gateway state before live demo" },
];

export const screenMatrix = [
  ["Login", "Authenticate", "Site Status"],
  ["Site Status", "Active Alarms", "Active Alarms"],
  ["Site Status", "Asset Alarm Detail", "Asset Alarm Detail"],
  ["Site Status", "Maintenance Warnings", "Maintenance Warnings"],
  ["Active Alarms", "Alarm Detail", "Asset Alarm Detail"],
  ["Active Alarms", "Acknowledge", "Assignment Modal"],
  ["Assignment Modal", "Assign User", "Alarm Acknowledged"],
  ["Asset Alarm Detail", "Plot Data Trends", "Alarm Data Trends"],
  ["Alarm Data Trends", "Back", "Asset Alarm Detail"],
  ["Alarm History", "See Alarm Detail", "Alarm History Detail"],
  ["Maintenance Warnings", "Plot Trend", "Maintenance Warning Trend"],
  ["Maintenance Warnings", "Notify", "Notification Action"],
  ["Asset Inventory", "Add Asset", "New Asset"],
  ["Asset Inventory", "Asset Configuration", "Asset Configuration"],
  ["Asset Inventory", "Alarms", "Alarm List"],
  ["Alarm List", "Add Alarm", "Alarm Configuration"],
  ["Alarm List", "Edit Alarm", "Alarm Configuration"],
  ["Group List", "Add Group", "Group Configuration"],
  ["Group List", "Edit Group", "Group Configuration"],
  ["License Management", "Renew License", "Renewal Workflow"],
  ["User Admin", "Add User", "Edit User"],
  ["User Admin", "Edit User", "Edit User"],
  ["Message Center", "Acknowledge Message", "Message Center"],
];

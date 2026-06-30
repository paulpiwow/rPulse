
export const run = {
  runId: "run-d7a5dd0f0fba",
  startedAt: "2026-06-17T17:10:24.839666Z",
  stoppedAt: "2026-06-17T17:25:27.557537Z",
  stopReason: "raw_stop_limit",
  elapsedSeconds: 902.717881,
  generatedSamples: 317780,
  generatedPoints: 86570,
  writtenPoints: 86570,
  writeRate: 95.96079211187791,
  storageBytes: 78233542,
  rawWarningSeconds: 840,
  rawStopSeconds: 900,
};

export const shell = {
  productName: "\u03c1Pulse",
  siteName: "Cadre Compressor Skid Demo",
  siteLocation: "Cadre Compressor Skid",
  userName: "Cody, Admin",
  version: "v1.0",
  company: "Rhobot Ai Solutions, Inc.",
  syncAge: "14s",
  status: "green",
};

export const navSections = [
  {
    label: "Operate",
    items: [
      { label: "Site Status", route: "site-status", icon: "status", status: "green" },
      { label: "Active Alarms", route: "active-alarms", icon: "alarm", count: 5, status: "red" },
      { label: "Alarm History", route: "alarm-history", icon: "history" },
      { label: "Maintenance Warnings", route: "baseline-deviations", icon: "deviation", count: 7, status: "yellow" },
    ],
  },
  {
    label: "Configure",
    items: [
      { label: "Assets", route: "asset-inventory", icon: "asset" },
      { label: "Alarms", route: "alarm-list", icon: "bell" },
      { label: "Groups", route: "group-list", icon: "groups" },
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "Application", route: "license-management", icon: "application" },
      { label: "Users", route: "user-admin", icon: "user" },
      { label: "Messages", route: "message-center", icon: "message", count: 2 },
    ],
  },
];

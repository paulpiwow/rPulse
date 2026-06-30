import { auditLog, diagnostics, groups, messages, notificationRules, users } from "./admin.js";
import { activeAlarms, alarmHistory } from "./alarms.js";
import { assets, dataSources, machines } from "./assets.js";
import { baselineDeviations, baselineRules } from "./baselines.js";
import { run } from "./site.js";
import { ctags, seriesByTagId, tagCatalog, tagName, tags } from "./tags.js";
import { trendMinuteTimes } from "./time.js";

export const postgres = {
  engine: "Postgres SQL",
  schema: "rpulse_mock_cadre",
  tables: {
    asset: assets,
    machine: machines,
    data_source: dataSources,
    tag: tagCatalog,
    ctag: ctags,
    alarm_event: activeAlarms,
    alarm_history: alarmHistory,
    baseline_deviation: baselineDeviations,
    baseline_rule: baselineRules,
    notification_group: groups,
    app_user: users,
    system_message: messages,
    notification_rule: notificationRules,
    audit_log: auditLog,
    diagnostic: diagnostics,
  },
};

export const influx = {
  engine: "InfluxDB",
  bucket: "asset_simulator",
  measurement: "asset_tag_values",
  site: "Cadre Compressor Skid",
  precision: "mixed: 300 Hz, 20 Hz, 1 Hz, 1 Minute",
  retention: "7d demo window",
  range: { start: trendMinuteTimes[0], stop: trendMinuteTimes[trendMinuteTimes.length - 1] },
  timestamps: trendMinuteTimes,
  tags: tagCatalog.map(({ tagId, tagName, dataSource, measurementType, unit, samplingRate, protocol, storageMode }) => ({ tagId, tagName, dataSource, measurementType, unit, samplingRate, protocol, storageMode })),
  seriesByTagId,
  sampleQuery: 'from(bucket: "asset_simulator") |> range(start: -15m) |> filter(fn: (r) => r._measurement == "asset_tag_values")',
  run,
};

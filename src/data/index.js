// Assembled rhoPulse demo data model (split by domain).
import { auditLog, diagnostics, groups, messages, notificationRules, screenMatrix, users } from "./admin.js";
import { activeAlarms, alarmDetails, alarmHistory } from "./alarms.js";
import { assets, dataSources, machines } from "./assets.js";
import { baselineDeviations, baselineRules } from "./baselines.js";
import { navSections, shell } from "./site.js";
import { deviationTrendTimes, tagCatalog, tagColors, tags, trendTimes } from "./tags.js";
import { trendMinuteTimes } from "./time.js";
import { alarmTrendSeries, deviationTrendSeries, siteHealthTrendByDuration } from "./trends.js";
import { influx, postgres } from "./views.js";

export const data = {
  shell,
  navSections,
  assets,
  activeAlarms,
  alarmDetails,
  alarmHistory,
  baselineDeviations,
  baselineRules,
  machines,
  dataSources,
  tags,
  tagCatalog,
  tagColors,
  groups,
  users,
  messages,
  notificationRules,
  auditLog,
  diagnostics,
  screenMatrix,
  trendTimes,
  deviationTrendTimes,
  alarmTrendSeries,
  deviationTrendSeries,
  siteHealthTrendByDuration,
  trendMinuteTimes,
  postgres,
  influx,
};

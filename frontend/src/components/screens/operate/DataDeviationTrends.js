import { DurationInput } from "../../shared/DurationInput.js";
import { ScreenHeader } from "../../shared/ScreenHeader.js";
import { TrendChart } from "../../shared/TrendChart.js";
import { fetchActiveAlarms, fetchAlarmHistory, fetchMaintenanceWarnings } from "../../../api/alarms.js";
import { isDataSourceOffline } from "../../../api/client.js";
import { fetchBaselines, fetchTagCatalog } from "../../../api/hierarchy.js";
import { TREND_DURATION_OPTIONS, fetchTrend } from "../../../api/telemetry.js";
import { durationKeyFromInput, durationLabelFromInput } from "../../../lib/duration.js";
import { exportReportAsCsv, exportReportAsExcel, trendRowsForExport } from "../../../lib/export.js";
import { formatNumber } from "../../../lib/format.js";
import { computed, onMounted, ref, useRoute, watch } from "../../../lib/vue.js";
import { template } from "./DataDeviationTrends.template.js";
import {
  buildPreAlarmAnalysis,
  buildTrend,
  deriveLinkedAlarm,
  formatDuration,
  formatEventTime,
  formatStat,
  medianValue,
} from "./DataDeviationTrends.analysis.js";

export const DataDeviationTrends = {
  components: { ScreenHeader, TrendChart, DurationInput },
  data() {
    return {
      exportModalOpen: false,
      toast: "",
    };
  },
  template,
  setup() {
    const route = useRoute();
    const requestedTagCode = String(route.query.deviationId || "");
    const durationOptions = TREND_DURATION_OPTIONS.map((option) => ({ value: option.key, label: option.label }));
    const durationKey = ref("6h");
    const durationInput = ref(durationOptions.find((option) => option.value === "6h")?.label || "6h");
    const warning = ref(null);
    const warningTag = ref({});
    const baselineRule = ref({});
    const linkedAlarm = ref(null);
    const trend = ref({ times: [], values: [] });
    const loadError = ref("");
    const warningMissing = ref(false);
    const describeError = (error) =>
      isDataSourceOffline(error) ? "Data source offline — live telemetry unavailable" : error?.message || String(error);
    let trendRequestId = 0;
    const refreshTrend = async () => {
      if (!warning.value) return;
      const requestId = ++trendRequestId;
      try {
        const fetched = await fetchTrend(warningTag.value.kind || "Tag", warning.value.tagCode, durationKey.value);
        if (requestId !== trendRequestId) return;
        trend.value = fetched;
        loadError.value = "";
      } catch (error) {
        if (requestId !== trendRequestId) return;
        trend.value = { times: [], values: [] };
        loadError.value = describeError(error);
      }
    };
    onMounted(async () => {
      try {
        const warnings = await fetchMaintenanceWarnings();
        const match = requestedTagCode
          ? warnings.find((row) => row.tagCode === requestedTagCode)
          : warnings[0];
        if (!match) {
          warningMissing.value = true;
          loadError.value = requestedTagCode
            ? `No maintenance warning found for tag "${requestedTagCode}".`
            : "No maintenance warnings are currently active.";
          return;
        }
        warning.value = match;
        const [catalog, baselines, activeAlarms] = await Promise.all([
          fetchTagCatalog(),
          fetchBaselines(match.assetCode),
          fetchActiveAlarms(match.assetCode),
        ]);
        const candidates = catalog.filter((tag) => tag.tagId === match.tagCode);
        warningTag.value =
          candidates.find((tag) => (match.scope === "CTag" ? tag.kind === "CTag" : tag.kind === "Tag")) ||
          candidates[0] || {
            tagId: match.tagCode,
            tagName: match.tagName,
            kind: match.scope === "CTag" ? "CTag" : "Tag",
            unit: match.unit,
          };
        baselineRule.value = baselines.find((rule) => rule.tagId === match.tagCode) || {};
        let alarm = deriveLinkedAlarm(activeAlarms, [], match, warningTag.value);
        if (!alarm) {
          const history = await fetchAlarmHistory({ assetCode: match.assetCode, size: 50 });
          alarm = deriveLinkedAlarm([], history.rows, match, warningTag.value);
        }
        linkedAlarm.value = alarm;
        await refreshTrend();
      } catch (error) {
        loadError.value = describeError(error);
      }
    });
    watch(durationKey, refreshTrend);
    const plottedDeviation = computed(() => warning.value || {});
    const plotTitle = computed(() => `Maintenance Warning: ${plottedDeviation.value.tagName || "Selected Warning"}`);
    const currentTrend = computed(() =>
      buildTrend(trend.value, warningTag.value, plottedDeviation.value, baselineRule.value)
    );
    const preAlarmAnalysis = computed(() =>
      buildPreAlarmAnalysis(trend.value, warningTag.value, currentTrend.value, linkedAlarm.value)
    );
    const relationshipTrend = computed(() => {
      const chartTrend = currentTrend.value;
      const analysis = preAlarmAnalysis.value;
      const markAreas = analysis.events.map((event) => ({
        name: "Out of Baseline",
        start: event.startIso,
        end: event.endIso,
      }));
      const markLines = [
        analysis.firstEvent
          ? { name: "First Deviation", label: "First Deviation", xAxis: analysis.firstEvent.startIso, color: "#b45309", lineType: "dashed" }
          : null,
        analysis.alarm?.tripTime
          ? { name: "Alarm Trip", label: "Alarm Trip", xAxis: analysis.alarm.tripTime, color: "#b91c1c", width: 2 }
          : null,
      ].filter(Boolean);
      return {
        times: chartTrend.times,
        series: chartTrend.series.map((line) =>
          /measured/i.test(line.name)
            ? { ...line, markAreas, markLines, markAreaColor: "rgba(194, 65, 12, 0.12)", showSymbol: false }
            : { ...line, showSymbol: false }
        ),
      };
    });
    const preAlarmSummary = computed(() => {
      const analysis = preAlarmAnalysis.value;
      return [
        { label: "Linked Alarm Trip", value: analysis.alarm?.tripTime ? formatEventTime(analysis.alarm.tripTime) : "No linked alarm trip in window" },
        { label: "First Deviation Before Alarm", value: !analysis.alarm ? "No linked alarm" : analysis.firstEvent ? formatDuration(analysis.leadTimeMs) : "None in window" },
        { label: "Out-of-Baseline Events", value: formatNumber(analysis.eventCount, 0) },
        { label: "Total Time Out", value: formatDuration(analysis.totalDurationMs) },
        { label: "Continuous Before Trip", value: !analysis.alarm ? "No linked alarm" : analysis.eventAtTrip ? formatDuration(analysis.continuousBeforeTripMs) : "Not out at trip" },
        { label: "Max Deviation", value: `${formatNumber(analysis.maxSigma, 1)} SD` },
      ];
    });
    const preAlarmEvents = computed(() =>
      preAlarmAnalysis.value.events.slice(0, 6).map((event, index) => ({
        id: event.id,
        label: `Deviation ${index + 1}`,
        startLabel: formatEventTime(event.startIso),
        durationLabel: formatDuration(event.durationMs),
        peakLabel: `${event.direction} peak ${formatStat(event.peakValue, preAlarmAnalysis.value.unit)} (${formatNumber(event.peakSigma, 1)} SD)`,
      }))
    );
    const relationshipTimeline = computed(() => {
      const analysis = preAlarmAnalysis.value;
      return [
        { label: "Baseline Window", kind: "normal", weight: 3 },
        { label: `${analysis.eventCount} Deviations`, kind: "warning", weight: Math.max(1, analysis.eventCount) },
        { label: analysis.alarm ? "Alarm Trip" : "No Alarm Mapped", kind: analysis.alarm ? "alarm" : "muted", weight: 1 },
      ];
    });
    const preAlarmNarrative = computed(() => {
      const analysis = preAlarmAnalysis.value;
      const tagName = warningTag.value?.tagName || plottedDeviation.value?.tagName || "Selected tag";
      if (!analysis.alarm) {
        const eventsPart = analysis.eventCount
          ? `left the calculated baseline envelope ${analysis.eventCount} time${analysis.eventCount === 1 ? "" : "s"}`
          : "stayed inside the calculated baseline envelope";
        return `${tagName} ${eventsPart} in the selected ${durationInput.value} window, but there is no linked alarm trip in window, so trip-relative metrics are skipped.`;
      }
      if (!analysis.eventCount) {
        return `${tagName} did not leave the calculated baseline envelope before the linked alarm trip in the selected ${durationInput.value} window.`;
      }
      const continuous = analysis.eventAtTrip
        ? ` It was continuously out of baseline for ${formatDuration(analysis.continuousBeforeTripMs)} before the alarm tripped.`
        : " It had returned inside baseline before the alarm trip.";
      return `${tagName} left the calculated baseline envelope ${analysis.eventCount} time${analysis.eventCount === 1 ? "" : "s"} before the alarm. The first deviation started ${formatDuration(analysis.leadTimeMs)} before trip, with ${formatDuration(analysis.totalDurationMs)} total out-of-baseline time.${continuous}`;
    });
    const deviationReport = computed(() => {
      const chartTrend = currentTrend.value;
      const measured = chartTrend.series.find((line) => /measured/i.test(line.name));
      const values = (measured?.data || []).map(Number).filter(Number.isFinite);
      if (!values.length) return [];
      const mean = values.reduce((total, value) => total + value, 0) / values.length;
      const averageDeviation = values.reduce((total, value) => total + Math.abs(value - mean), 0) / values.length;
      const variance = values.reduce((total, value) => total + Math.pow(value - mean, 2), 0) / values.length;
      const unit = measured?.unit || chartTrend.baselineStats?.unit || "";
      const baselineStats = chartTrend.baselineStats || {};
      return [
        { label: "Baseline Low", value: formatStat(baselineStats.low, unit) },
        { label: "Baseline Target", value: formatStat(baselineStats.baseline, unit) },
        { label: "Baseline High", value: formatStat(baselineStats.high, unit) },
        { label: "Baseline Std Dev", value: formatStat(baselineStats.stdDev, unit) },
        { label: "Baseline Samples", value: formatNumber(baselineStats.sampleCount || values.length, 0) },
        { label: "Average Deviation From Mean", value: formatStat(averageDeviation, unit) },
        { label: "Median", value: formatStat(medianValue(values), unit) },
        { label: "Trend Standard Deviation", value: formatStat(Math.sqrt(variance), unit) },
      ];
    });
    return {
      durationOptions,
      durationInput,
      loadError,
      warningMissing,
      plottedDeviation,
      warningTag,
      plotTitle,
      currentTrend,
      relationshipTrend,
      preAlarmSummary,
      preAlarmEvents,
      relationshipTimeline,
      preAlarmNarrative,
      deviationReport,
      normalizeDurationInput() {
        durationInput.value = durationLabelFromInput(durationInput.value, durationOptions, "6h");
        durationKey.value = durationKeyFromInput(durationInput.value, durationOptions, "6h");
      },
    };
  },
  methods: {
    handleHeaderAction(action) {
      if (action.key === "export-report") this.exportModalOpen = true;
    },
    handleExportFormat(format) {
      this.exportModalOpen = false;
      if (format === "csv") {
        this.exportDeviationCsv();
        return;
      }
      this.exportDeviationExcel();
    },
    exportDeviationCsv() {
      const deviation = this.plottedDeviation || {};
      const filename = exportReportAsCsv(
        `rpulse-maintenance-warning-trend-${deviation.deviationId || "selected"}`,
        "rhoPulse Maintenance Warning Trend Report",
        this.deviationReportSections()
      );
      this.toast = `Exported ${filename}.`;
    },
    exportDeviationExcel() {
      const deviation = this.plottedDeviation || {};
      const filename = exportReportAsExcel(
        `rpulse-maintenance-warning-trend-${deviation.deviationId || "selected"}`,
        "rhoPulse Maintenance Warning Trend Report",
        this.deviationReportSections()
      );
      this.toast = `Exported ${filename}.`;
    },
    deviationReportSections() {
      const deviation = this.plottedDeviation || {};
      return [
        {
          title: "Warning Context",
          rows: [
            { label: "Warning ID", value: deviation.deviationId || "" },
            { label: "Asset", value: deviation.asset || "" },
            { label: "Tag", value: deviation.tagName || "" },
            { label: "Duration", value: this.durationInput },
            { label: "Condition", value: deviation.direction || "" },
          ],
        },
        {
          title: "Pre-Alarm Baseline Analysis",
          rows: [
            { label: "Summary", value: this.preAlarmNarrative },
            ...this.preAlarmSummary,
            ...this.preAlarmEvents.map((event) => ({
              label: event.label,
              value: `${event.startLabel}; ${event.durationLabel}; ${event.peakLabel}`,
            })),
          ],
        },
        { title: "Calculated Metrics", rows: this.deviationReport },
        { title: "Trend Data", rows: trendRowsForExport(this.currentTrend.times, this.currentTrend.series) },
      ];
    },
  },
};

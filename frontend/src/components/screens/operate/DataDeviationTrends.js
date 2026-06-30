import { DurationInput } from "../../shared/DurationInput.js";
import { ScreenHeader } from "../../shared/ScreenHeader.js";
import { TrendChart } from "../../shared/TrendChart.js";
import { data } from "../../../data/index.js";
import { durationLabelFromInput, plotDurationHours, plotDurationOptions } from "../../../lib/duration.js";
import { exportReportAsCsv, exportReportAsExcel, trendRowsForExport } from "../../../lib/export.js";
import { formatNumber } from "../../../lib/format.js";
import { tagCatalog } from "../../../lib/tags.js";
import { computed, ref, useRoute } from "../../../lib/vue.js";
import { template } from "./DataDeviationTrends.template.js";
import { buildPreAlarmAnalysis, buildTrend, formatDuration, formatEventTime, formatStat, medianValue } from "./DataDeviationTrends.analysis.js";

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
    const durationOptions = plotDurationOptions;
    const durationInput = ref("8 Hours");
    const plottedDeviation = computed(() => {
      const deviationId = String(route.query.deviationId || "");
      return (
        data.baselineDeviations.find((deviation) => deviation.deviationId === deviationId) ||
        data.baselineDeviations[0] ||
        {}
      );
    });
    const warningTag = computed(
      () =>
        tagCatalog.find((tag) => tag.tagName === plottedDeviation.value.tagName || tag.tagId === plottedDeviation.value.tagName) ||
        tagCatalog[0] ||
        {}
    );
    const plotTitle = computed(() => `Maintenance Warning: ${plottedDeviation.value.tagName || "Selected Warning"}`);
    const hours = () => plotDurationHours(durationInput.value, "8h");
    const currentTrend = computed(() => buildTrend(hours(), warningTag.value, plottedDeviation.value));
    const preAlarmAnalysis = computed(() => buildPreAlarmAnalysis(hours(), warningTag.value, plottedDeviation.value, currentTrend.value));
    const relationshipTrend = computed(() => {
      const trend = currentTrend.value;
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
        times: trend.times,
        series: trend.series.map((line) =>
          /measured/i.test(line.name)
            ? { ...line, markAreas, markLines, markAreaColor: "rgba(194, 65, 12, 0.12)", showSymbol: false }
            : { ...line, showSymbol: false }
        ),
      };
    });
    const preAlarmSummary = computed(() => {
      const analysis = preAlarmAnalysis.value;
      return [
        { label: "Linked Alarm Trip", value: analysis.alarm?.tripTime ? formatEventTime(analysis.alarm.tripTime) : "No mapped alarm" },
        { label: "First Deviation Before Alarm", value: analysis.firstEvent ? formatDuration(analysis.leadTimeMs) : "None in window" },
        { label: "Out-of-Baseline Events", value: formatNumber(analysis.eventCount, 0) },
        { label: "Total Time Out", value: formatDuration(analysis.totalDurationMs) },
        { label: "Continuous Before Trip", value: analysis.eventAtTrip ? formatDuration(analysis.continuousBeforeTripMs) : "Not out at trip" },
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
        return `${tagName} has baseline deviation context in this window, but no linked alarm trip is mapped for this warning.`;
      }
      if (!analysis.eventCount) {
        return `${tagName} did not leave the calculated baseline envelope before the mapped alarm trip in the selected ${durationInput.value} window.`;
      }
      const continuous = analysis.eventAtTrip
        ? ` It was continuously out of baseline for ${formatDuration(analysis.continuousBeforeTripMs)} before the alarm tripped.`
        : " It had returned inside baseline before the alarm trip.";
      return `${tagName} left the calculated baseline envelope ${analysis.eventCount} time${analysis.eventCount === 1 ? "" : "s"} before the alarm. The first deviation started ${formatDuration(analysis.leadTimeMs)} before trip, with ${formatDuration(analysis.totalDurationMs)} total out-of-baseline time.${continuous}`;
    });
    const deviationReport = computed(() => {
      const trend = currentTrend.value;
      const measured = trend.series.find((line) => /measured/i.test(line.name));
      const values = (measured?.data || []).map(Number).filter(Number.isFinite);
      if (!values.length) return [];
      const mean = values.reduce((total, value) => total + value, 0) / values.length;
      const averageDeviation = values.reduce((total, value) => total + Math.abs(value - mean), 0) / values.length;
      const variance = values.reduce((total, value) => total + Math.pow(value - mean, 2), 0) / values.length;
      const unit = measured?.unit || trend.baselineStats?.unit || "";
      const baselineStats = trend.baselineStats || {};
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
        durationInput.value = durationLabelFromInput(durationInput.value, durationOptions, "8h");
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

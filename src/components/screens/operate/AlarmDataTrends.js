import { GridTable } from "../../shared/GridTable.js";
import { ScreenHeader } from "../../shared/ScreenHeader.js";
import { TrendChart } from "../../shared/TrendChart.js";
import { data } from "../../../data/index.js";
import { plotDurationHours, plotDurationOptions } from "../../../lib/duration.js";
import { exportReportAsCsv, exportReportAsExcel, trendRowsForExport } from "../../../lib/export.js";
import { tagCatalog } from "../../../lib/tags.js";
import { lineNameForTag, trendForTags } from "../../../lib/trends.js";
import { computed, ref, watch } from "../../../lib/vue.js";

export const AlarmDataTrends = {
  components: { ScreenHeader, TrendChart, GridTable },
  data() {
    return {
      exportModalOpen: false,
      toast: "",
    };
  },
  template: `
    <div class="screen">
      <screen-header
        title="Alarm Data Trends"
        subtitle="Trend related Tags and CTags before acknowledgement and tracking"
        status="red"
        :actions="[{ key: 'export-report', label: 'Export Report', kind: 'primary' }]"
        @action="handleHeaderAction"
      />
      <div v-if="toast" class="inline-alert success">{{ toast }}</div>
      <section class="split-layout trend-layout">
        <aside class="control-panel">
          <h2>Plot Duration</h2>
          <label class="duration-control trend-select-control">
            <span>Window</span>
            <select v-model="durationKey">
              <option v-for="option in durationOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </label>
          <div class="trend-add-row">
            <label>
              <span>Add Tag / CTag</span>
              <select v-model="tagToAdd">
                <option value=""></option>
                <option v-for="option in availableTagOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
            </label>
            <button type="button" class="primary" @click="addTagToTrend">Add</button>
          </div>
          <div class="check-list trend-check-list">
            <label v-for="line in currentTrend.series" :key="line.name">
              <input type="checkbox" :value="line.name" v-model="selected" />
              <span class="trend-tag-row">
                <span class="trend-series-label" :title="line.name + ' - ' + line.color">
                  <i class="trend-color-swatch" :style="{ '--series-color': line.color }" aria-hidden="true"></i>
                  <span class="trend-series-name">{{ line.name }}</span>
                </span>
                <strong v-if="line.alarmAssociated" class="association-badge alarm">Alarm</strong>
                <strong v-else class="association-badge ad-hoc">Added</strong>
              </span>
            </label>
          </div>
        </aside>
        <trend-chart
          :title="chartTitle"
          :times="currentTrend.times"
          :series="currentTrend.series"
          :selected="selected"
          height="390px"
          :show-legend="false"
        />
      </section>
      <section class="panel">
        <div class="panel-header">
          <h2>Trend Tags</h2>
        </div>
        <table-context
          title="Plotted signal rows"
          description="Alarm-associated signals are marked separately from ad hoc tags added to this trend."
          :items="[
            { label: 'Rows', value: trendTagRows.length },
            { label: 'Alarm Associated', value: trendTagRows.filter((row) => row.alarmAssociation === 'Alarm Associated').length },
            { label: 'Selected Series', value: selected.length },
            { label: 'Duration', value: durationInput },
            { label: 'Trend Points', value: currentTrend.times.length }
          ]"
        />
        <grid-table :rows="trendTagRows" :columns="columns" height="260px" compact />
      </section>
      <export-format-modal
        :open="exportModalOpen"
        title="Export Alarm Data Trends"
        @close="exportModalOpen = false"
        @select="handleExportFormat"
      />
    </div>
  `,
  setup() {
    const durationOptions = plotDurationOptions;
    const durationKey = ref("8h");
    const tagToAdd = ref("");
    const alarmTagIds = new Set(
      data.alarmDetails
        .map((detail) => tagCatalog.find((tag) => tag.tagName === detail.tagName || tag.tagId === detail.tagName))
        .filter(Boolean)
        .map((tag) => tag.tagId)
    );
    const mappedAlarmTags = tagCatalog.filter((tag) => alarmTagIds.has(tag.tagId));
    const fallbackAlarmTags = data.alarmTrendSeries
      .map((line) => tagCatalog.find((tag) => tag.tagName === line.name))
      .filter(Boolean);
    const alarmTags = mappedAlarmTags.length ? mappedAlarmTags : fallbackAlarmTags;
    const plottedTagIds = ref(alarmTags.map((tag) => tag.tagId));
    const tagById = computed(() => new Map(tagCatalog.map((tag) => [tag.tagId, tag])));
    const plottedTags = computed(() => plottedTagIds.value.map((tagId) => tagById.value.get(tagId)).filter(Boolean));
    const selected = ref(plottedTags.value.map(lineNameForTag));
    const durationInput = computed(() => durationOptions.find((option) => option.value === durationKey.value)?.label || durationKey.value);
    const currentTrend = computed(() => trendForTags(plottedTags.value, plotDurationHours(durationKey.value, "8h"), alarmTagIds));
    const chartTitle = computed(() => `Tags for Selected Alarms - ${durationInput.value}`);
    const availableTagOptions = computed(() =>
      tagCatalog
        .filter((tag) => tag.plot !== false || alarmTagIds.has(tag.tagId) || tag.kind === "CTag")
        .map((tag) => ({
          value: tag.tagId,
          label: `${alarmTagIds.has(tag.tagId) ? "[Alarm] " : ""}${tag.tagId} - ${tag.tagName}`,
        }))
    );
    const addTagToTrend = () => {
      const tagId = tagToAdd.value;
      if (!tagId) return;
      if (!plottedTagIds.value.includes(tagId)) plottedTagIds.value.push(tagId);
      const tag = tagById.value.get(tagId);
      const lineName = lineNameForTag(tag);
      if (lineName && !selected.value.includes(lineName)) selected.value.push(lineName);
      tagToAdd.value = "";
    };
    watch(
      currentTrend,
      (trend) => {
        const currentNames = new Set(trend.series.map((line) => line.name));
        selected.value = selected.value.filter((name) => currentNames.has(name));
        if (!selected.value.length) selected.value = trend.series.filter((line) => line.alarmAssociated).map((line) => line.name);
      },
      { immediate: true }
    );
    return {
      durationOptions,
      durationKey,
      durationInput,
      tagToAdd,
      availableTagOptions,
      selected,
      currentTrend,
      chartTitle,
      addTagToTrend,
      trendTagRows: computed(() =>
        currentTrend.value.series.map((line) => ({
          tagId: line.tagId,
          tagName: line.name,
          kind: tagById.value.get(line.tagId)?.kind || "Tag",
          measurementType: tagById.value.get(line.tagId)?.measurementType || "",
          unit: line.unit,
          dataSource: line.dataSource,
          alarmAssociation: line.alarmAssociated ? "Alarm Associated" : "Ad Hoc",
          plotState: selected.value.includes(line.name) ? "Visible" : "Hidden",
          latestValue: line.data[line.data.length - 1],
        }))
      ),
      columns: [
        { headerName: "Tag ID", field: "tagId", width: 116 },
        { headerName: "Tag Name", field: "tagName", flex: 1.2 },
        { headerName: "Type", field: "kind", width: 82 },
        { headerName: "Alarm Association", field: "alarmAssociation", width: 150 },
        { headerName: "Plot State", field: "plotState", width: 104 },
        { headerName: "Latest", field: "latestValue", type: "numeric", decimals: 2, width: 100 },
        { headerName: "Measurement", field: "measurementType", flex: 1 },
        { headerName: "Units", field: "unit", width: 90 },
        { headerName: "Data Source", field: "dataSource", flex: 1 },
      ],
    };
  },
  methods: {
    handleHeaderAction(action) {
      if (action.key === "export-report") this.exportModalOpen = true;
    },
    handleExportFormat(format) {
      this.exportModalOpen = false;
      if (format === "csv") {
        this.exportTrendCsv();
        return;
      }
      this.exportTrendExcel();
    },
    exportTrendCsv() {
      const filename = exportReportAsCsv("rpulse-alarm-data-trends-report", "rhoPulse Alarm Data Trends Report", this.alarmTrendReportSections());
      this.toast = `Exported ${filename}.`;
    },
    exportTrendExcel() {
      const filename = exportReportAsExcel("rpulse-alarm-data-trends-report", "rhoPulse Alarm Data Trends Report", this.alarmTrendReportSections());
      this.toast = `Exported ${filename}.`;
    },
    alarmTrendReportSections() {
      const visibleRows = trendRowsForExport(this.currentTrend.times, this.currentTrend.series, this.selected);
      return [
        {
          title: "Trend Context",
          rows: [
            { label: "Site", value: data.shell.siteName },
            { label: "Duration", value: this.durationInput },
            { label: "Selected Series", value: this.selected.join(", ") || "All series" },
            { label: "Visible Points", value: visibleRows.length },
          ],
        },
        {
          title: "Latest Values",
          rows: this.currentTrend.series
            .filter((line) => !this.selected.length || this.selected.includes(line.name))
            .map((line) => ({
              Series: line.name,
              Unit: line.unit || "",
              Latest: line.data[line.data.length - 1] ?? "",
            })),
        },
        {
          title: "Trend Data",
          rows: visibleRows,
        },
      ];
    },
  },
};

import { GridTable } from "../../shared/GridTable.js";
import { ScreenHeader } from "../../shared/ScreenHeader.js";
import { TrendChart } from "../../shared/TrendChart.js";
import { fetchActiveAlarms } from "../../../api/alarms.js";
import { isDataSourceOffline } from "../../../api/client.js";
import { fetchTagCatalog } from "../../../api/hierarchy.js";
import { TREND_DURATION_OPTIONS, fetchTrend, fetchTrends } from "../../../api/telemetry.js";
import { data } from "../../../data/index.js";
import { exportReportAsCsv, exportReportAsExcel, trendRowsForExport } from "../../../lib/export.js";
import { computed, onMounted, ref, useRoute, watch } from "../../../lib/vue.js";

const trendPalette = ["#3b82f6", "#ea580c", "#6d28d9", "#059669", "#be185d", "#16a34a", "#0284c7", "#a855f7"];

const lineNameForTag = (tag) => tag?.tagName || tag?.tagId || "Unmapped Tag";

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
      <div v-if="loadError" class="inline-alert">{{ loadError }}</div>
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
    const route = useRoute();
    const assetCode = String(route.query.asset || "");
    const durationOptions = TREND_DURATION_OPTIONS.map((option) => ({ value: option.key, label: option.label }));
    const durationKey = ref("6h");
    const tagToAdd = ref("");
    const loadError = ref("");
    const catalog = ref([]);
    const alarmTagIds = ref(new Set());
    const plottedTagIds = ref([]);
    const trendsByCode = ref(new Map());
    const selected = ref([]);
    const tagById = computed(() => new Map(catalog.value.map((tag) => [tag.tagId, tag])));
    const plottedTags = computed(() => plottedTagIds.value.map((tagId) => tagById.value.get(tagId)).filter(Boolean));
    const durationInput = computed(() => durationOptions.find((option) => option.value === durationKey.value)?.label || durationKey.value);
    const describeError = (error) =>
      isDataSourceOffline(error) ? "Data source offline — live telemetry unavailable" : error?.message || String(error);
    let trendRequestId = 0;
    const refreshTrends = async () => {
      const requestId = ++trendRequestId;
      const tags = plottedTags.value;
      if (!tags.length) {
        trendsByCode.value = new Map();
        return;
      }
      try {
        const byCode = await fetchTrends(tags, durationKey.value);
        if (!byCode.size) {
          // fetchTrends drops individual failures; when every tag failed, probe
          // one directly so a full outage surfaces instead of a blank chart.
          byCode.set(tags[0].tagId, await fetchTrend(tags[0].kind, tags[0].tagId, durationKey.value));
        }
        if (requestId !== trendRequestId) return;
        trendsByCode.value = byCode;
        loadError.value = "";
      } catch (error) {
        if (requestId !== trendRequestId) return;
        trendsByCode.value = new Map();
        loadError.value = describeError(error);
      }
    };
    onMounted(async () => {
      try {
        const [catalogRows, alarms] = await Promise.all([
          fetchTagCatalog(),
          fetchActiveAlarms(assetCode || undefined),
        ]);
        catalog.value = catalogRows;
        const alarmKeys = new Set(alarms.map((alarm) => alarm.tagKey).filter(Boolean));
        const alarmTags = catalogRows.filter((tag) => alarmKeys.has(tag.tagKey) || alarmKeys.has(tag.tagId));
        alarmTagIds.value = new Set(alarmTags.map((tag) => tag.tagId));
        // Assigning plottedTagIds triggers the deep watcher below, which
        // performs the initial trend fetch.
        plottedTagIds.value = alarmTags.map((tag) => tag.tagId);
      } catch (error) {
        loadError.value = describeError(error);
      }
    });
    watch(durationKey, refreshTrends);
    watch(plottedTagIds, refreshTrends, { deep: true });
    const currentTrend = computed(() => {
      let times = [];
      const series = plottedTags.value
        .map((tag, index) => {
          const trend = trendsByCode.value.get(tag.tagId);
          if (!trend || !trend.values.length) return null;
          if (!times.length) times = trend.times;
          return {
            tagId: tag.tagId,
            name: lineNameForTag(tag),
            unit: tag.unit || "",
            data: trend.values,
            color: tag.color || trendPalette[index % trendPalette.length],
            alarmAssociated: alarmTagIds.value.has(tag.tagId),
            dataSource: tag.dataSource || "",
          };
        })
        .filter(Boolean);
      return { times, series };
    });
    const chartTitle = computed(() => `Tags for Selected Alarms - ${durationInput.value}`);
    const availableTagOptions = computed(() =>
      catalog.value
        .filter((tag) => tag.plot !== false)
        .map((tag) => ({
          value: tag.tagId,
          label: `${alarmTagIds.value.has(tag.tagId) ? "[Alarm] " : ""}${tag.tagId} - ${tag.tagName}`,
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
        if (!selected.value.length) {
          const alarmNames = trend.series.filter((line) => line.alarmAssociated).map((line) => line.name);
          selected.value = alarmNames.length ? alarmNames : trend.series.map((line) => line.name);
        }
      },
      { immediate: true }
    );
    return {
      durationOptions,
      durationKey,
      durationInput,
      tagToAdd,
      loadError,
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

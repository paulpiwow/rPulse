import { DurationInput } from "../../shared/DurationInput.js";
import { GridTable } from "../../shared/GridTable.js";
import { ScreenHeader } from "../../shared/ScreenHeader.js";
import { TrendChart } from "../../shared/TrendChart.js";
import { fetchSiteStatus } from "../../../api/alarms.js";
import { isDataSourceOffline } from "../../../api/client.js";
import { durationKeyFromInput, durationLabelFromInput } from "../../../lib/duration.js";
import { statusRenderer } from "../../../lib/grid.js";
import { computed, ref } from "../../../lib/vue.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function trendPointLabel(timestamp, isLast) {
  if (isLast) return "Today";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return String(timestamp);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export const SiteStatus = {
  components: { ScreenHeader, GridTable, TrendChart, DurationInput },
  template: `
    <div class="screen">
      <screen-header
        title="Site Status"
        :subtitle="subtitle"
        status="green"
      />
      <section class="panel site-status-summary-card">
        <div class="site-status-titlebar">
          <h2>Site Status</h2>
          <div class="site-kpi-line" aria-label="Site status summary">
            <span>Assets: <strong>{{ kpis.assets }}</strong></span>
            <i></i>
            <span>Active Alarms: <strong>{{ kpis.activeAlarms }}</strong></span>
            <i></i>
            <span>Maintenance Warnings: <strong>{{ kpis.deviations }}</strong></span>
          </div>
        </div>
      </section>
      <section class="panel site-table-panel">
        <div class="site-table-section">
          <table-context
            title="Asset status table"
            description="Rows show current health, alarm counts, and maintenance warning counts by asset."
            :items="[
              { label: 'Assets', value: kpis.assets },
              { label: 'Active Alarms', value: kpis.activeAlarms },
              { label: 'Warnings', value: kpis.deviations }
            ]"
          />
          <grid-table :rows="rows" :columns="columns" :actions="actions" height="auto" @action="handleAction" @row-open="openAsset" />
        </div>
      </section>
      <section class="panel site-chart-panel">
        <div class="site-chart-section">
          <div class="site-chart-header">
            <div class="site-chart-title">
              <h3>Asset Health Trend</h3>
            </div>
            <div class="site-chart-tools">
              <duration-input
                v-model="durationInput"
                :options="durationOptions"
                list-id="site-duration-options"
                @commit="normalizeDurationInput"
              />
              <div class="site-chart-legend" aria-label="Chart legend">
                <span v-for="item in currentTrend.series" :key="item.name">
                  <i :style="{ '--legend-color': item.color }"></i>{{ item.name }}
                </span>
              </div>
            </div>
          </div>
          <trend-chart
            title=""
            :times="currentTrend.times"
            :series="currentTrend.series"
            height="100%"
            :show-legend="false"
            :show-symbols="true"
            :smooth="false"
            :grid-top="20"
            :grid-bottom="44"
            :y-max="10"
            :y-interval="2"
          />
        </div>
      </section>
    </div>
  `,
  setup() {
    const statusRank = { red: 0, yellow: 1, green: 2 };
    const rows = ref([]);
    const kpis = ref({ assets: 0, activeAlarms: 0, deviations: 0 });
    const trendPoints = ref([]);
    const loadError = ref("");
    const defaultSubtitle = "Asset health by active alarms and maintenance warning state";
    const subtitle = computed(() => loadError.value || defaultSubtitle);

    // Backend serves a fixed 14-day daily trend; shorter durations slice it
    // client-side (24h = last 2 daily points, 7d = last 7).
    const durationOptions = [
      { label: "24 Hours", value: "24h" },
      { label: "7 Days", value: "7d" },
      { label: "14 Days", value: "14d" },
    ];
    const pointCountByDuration = { "24h": 2, "7d": 7, "14d": 14 };
    const durationInput = ref("14 Days");

    async function load() {
      try {
        const status = await fetchSiteStatus();
        rows.value = [...status.assets].sort(
          (a, b) => (statusRank[a.status] ?? 99) - (statusRank[b.status] ?? 99)
        );
        kpis.value = {
          assets: status.assetCount,
          activeAlarms: status.activeAlarmCount,
          deviations: status.maintenanceWarningCount,
        };
        trendPoints.value = status.trend.points;
        loadError.value = "";
      } catch (error) {
        loadError.value = isDataSourceOffline(error)
          ? "Data source offline — live telemetry unavailable"
          : `Failed to load site status: ${error.message}`;
      }
    }
    load();

    return {
      rows,
      kpis,
      subtitle,
      columns: [
        { headerName: "Asset", field: "assetName", flex: 30, minWidth: 190, cellClass: "asset-primary-cell" },
        { headerName: "Location", field: "location", flex: 20, minWidth: 150, cellClass: "asset-secondary-cell" },
        {
          headerName: "Status",
          field: "status",
          cellRenderer: statusRenderer,
          flex: 8,
          minWidth: 74,
          cellClass: "center-cell",
          cellStyle: { justifyContent: "center", textAlign: "center" },
          headerClass: "center-header",
        },
        {
          headerName: "Active Alarms",
          field: "activeAlarms",
          type: "numeric",
          flex: 12,
          minWidth: 116,
          cellClass: "metric-cell center-cell",
          cellStyle: { justifyContent: "center", textAlign: "center" },
          headerClass: "center-header",
        },
        {
          headerName: "Deviations",
          field: "baselineDeviations",
          type: "numeric",
          flex: 12,
          minWidth: 110,
          cellClass: "metric-cell center-cell",
          cellStyle: { justifyContent: "center", textAlign: "center" },
          headerClass: "center-header",
        },
      ],
      actions: [
        { label: "Alarm Detail", route: "asset-alarm-detail" },
        { label: "Maintenance Warnings", route: "baseline-deviations" },
      ],
      durationOptions,
      durationInput,
      currentTrend: computed(() => {
        const key = durationKeyFromInput(durationInput.value, durationOptions, "14d");
        const count = pointCountByDuration[key] || 14;
        const points = trendPoints.value.slice(-count);
        return {
          times: points.map((point, index) => trendPointLabel(point.timestamp, index === points.length - 1)),
          series: [
            { name: "Active Alarms", data: points.map((point) => point.activeAlarms), color: "#c83d3d" },
            { name: "Maintenance Warnings", data: points.map((point) => point.warnings), color: "#c89a19" },
          ],
        };
      }),
      normalizeDurationInput() {
        durationInput.value = durationLabelFromInput(durationInput.value, durationOptions, "14d");
      },
    };
  },
  methods: {
    handleAction({ action, row }) {
      this.$router.push({ name: action.route, query: { asset: row.assetId } });
    },
    openAsset(row) {
      this.$router.push({ name: "asset-alarm-detail", query: { asset: row?.assetId } });
    },
  },
};

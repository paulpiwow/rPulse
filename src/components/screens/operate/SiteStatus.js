import { DurationInput } from "../../shared/DurationInput.js";
import { GridTable } from "../../shared/GridTable.js";
import { ScreenHeader } from "../../shared/ScreenHeader.js";
import { TrendChart } from "../../shared/TrendChart.js";
import { data } from "../../../data/index.js";
import { durationKeyFromInput, durationLabelFromInput } from "../../../lib/duration.js";
import { statusRenderer } from "../../../lib/grid.js";
import { computed, ref } from "../../../lib/vue.js";

export const SiteStatus = {
  components: { ScreenHeader, GridTable, TrendChart, DurationInput },
  template: `
    <div class="screen">
      <screen-header
        title="Site Status"
        subtitle="Asset health by active alarms and maintenance warning state"
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
    const rows = [...data.assets].sort((a, b) => (statusRank[a.status] ?? 99) - (statusRank[b.status] ?? 99));
    const durationOptions = [
      { label: "24 Hours", value: "24h" },
      { label: "7 Days", value: "7d" },
      { label: "14 Days", value: "14d" },
      { label: "30 Days", value: "30d" },
    ];
    const durationInput = ref("14 Days");
    const trendDataByDuration = data.siteHealthTrendByDuration || {
      "24h": {
        label: "24-Hour Site Health Trend",
        times: ["12a", "4a", "8a", "12p", "4p", "8p", "Now"],
        series: [
          { name: "Active Alarms", data: [0, 0, 1, 1, 2, 2, 3], color: "#c83d3d" },
          { name: "Deviations", data: [2, 2, 3, 4, 5, 6, 7], color: "#c89a19" },
        ],
      },
      "7d": {
        label: "7-Day Site Health Trend",
        times: ["Jun 3", "Jun 4", "Jun 5", "Jun 6", "Jun 7", "Jun 8", "Today"],
        series: [
          { name: "Active Alarms", data: [1, 2, 2, 2, 2, 3, 3], color: "#c83d3d" },
          { name: "Deviations", data: [5, 5, 6, 6, 7, 6, 7], color: "#c89a19" },
        ],
      },
      "14d": {
        label: "14-Day Site Health Trend",
        times: ["May 27", "May 28", "May 29", "May 30", "May 31", "Jun 1", "Jun 2", "Jun 3", "Jun 4", "Jun 5", "Jun 7", "Jun 8", "Jun 9"],
        series: [
          { name: "Active Alarms", data: [0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3], color: "#c83d3d" },
          { name: "Deviations", data: [2, 2, 3, 3, 4, 4, 4, 5, 5, 6, 7, 6, 7], color: "#c89a19" },
        ],
      },
      "30d": {
        label: "30-Day Site Health Trend",
        times: ["May 11", "May 15", "May 19", "May 23", "May 27", "May 31", "Jun 4", "Jun 9"],
        series: [
          { name: "Active Alarms", data: [0, 0, 1, 1, 0, 1, 2, 3], color: "#c83d3d" },
          { name: "Deviations", data: [1, 2, 2, 3, 2, 4, 5, 7], color: "#c89a19" },
        ],
      },
    };
    return {
      rows,
      kpis: {
        assets: rows.length,
        activeAlarms: rows.reduce((total, row) => total + row.activeAlarms, 0),
        deviations: rows.reduce((total, row) => total + row.baselineDeviations, 0),
      },
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
        return trendDataByDuration[key] || trendDataByDuration["14d"];
      }),
      normalizeDurationInput() {
        durationInput.value = durationLabelFromInput(durationInput.value, durationOptions, "14d");
      },
    };
  },
  methods: {
    handleAction({ action }) {
      this.$router.push({ name: action.route });
    },
    openAsset() {
      this.$router.push({ name: "asset-alarm-detail" });
    },
  },
};

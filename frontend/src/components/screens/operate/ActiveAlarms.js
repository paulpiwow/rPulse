import { GridTable } from "../../shared/GridTable.js";
import { ScreenHeader } from "../../shared/ScreenHeader.js";
import { StatusBadge } from "../../shared/StatusBadge.js";
import { acknowledgeAlarm, clearAlarm, fetchActiveAlarms } from "../../../api/alarms.js";
import { isDataSourceOffline } from "../../../api/client.js";
import { refreshStore } from "../../../api/store.js";
import { statusRenderer } from "../../../lib/grid.js";

export const ActiveAlarms = {
  components: { ScreenHeader, GridTable, StatusBadge },
  data() {
    return {
      rows: [],
      toast: "",
    };
  },
  created() {
    this.loadRows();
  },
  computed: {
    columns() {
      return [
        { headerName: "Asset", field: "assetName", width: 130, minWidth: 120 },
        { headerName: "Location", field: "location", width: 100, minWidth: 88 },
        { headerName: "Alarm", field: "alarmName", width: 226, minWidth: 200 },
        { headerName: "Status", field: "severity", cellRenderer: statusRenderer, width: 82, minWidth: 74 },
        { headerName: "Trip Time", field: "tripTime", width: 76, minWidth: 68 },
        { headerName: "Dur", field: "duration", width: 90, minWidth: 68 },
        { headerName: "Ack", field: "acknowledgement", width: 110, minWidth: 100 },
      ];
    },
  },
  template: `
    <div class="screen">
      <screen-header
        title="Active Alarms"
        subtitle="Alarm workflow: table to detail to trend to acknowledge to clear"
        status="red"
      />
      <div v-if="toast" class="inline-alert success">{{ toast }}</div>
      <section class="panel">
        <div class="panel-header">
          <h2>Active Alarm Summary</h2>
        </div>
        <table-context
          title="Open alarm queue"
          description="Rows needing detail review, acknowledgement, or clearing."
          :items="[
            { label: 'Open Alarms', value: rows.length },
            { label: 'Sort', value: 'Severity first' },
            { label: 'Actions', value: 'Detail / Ack / Clear' }
          ]"
        />
        <grid-table
          :rows="rows"
          :columns="columns"
          :actions="[
            { label: 'Alarm Detail', key: 'detail' },
            { label: 'Acknowledge', key: 'ack' },
            { label: 'Clear', key: 'clear' }
          ]"
          height="470px"
          @action="handleAction"
          @row-open="openDetail"
        />
      </section>
    </div>
  `,
  methods: {
    errorText(error, prefix) {
      return isDataSourceOffline(error)
        ? "Data source offline — live telemetry unavailable"
        : `${prefix}: ${error.message}`;
    },
    async loadRows() {
      try {
        this.rows = await fetchActiveAlarms();
      } catch (error) {
        this.rows = [];
        this.toast = this.errorText(error, "Failed to load active alarms");
      }
    },
    handleAction({ action, row }) {
      if (action.key === "detail") this.openDetail(row);
      if (action.key === "ack") this.acknowledgeAlarm(row);
      if (action.key === "clear") this.clearAlarm(row);
    },
    openDetail(row) {
      this.$router.push({ name: "asset-alarm-detail", query: { asset: row?.assetCode } });
    },
    async acknowledgeAlarm(row) {
      try {
        await acknowledgeAlarm(row.historyCode);
        await this.loadRows();
        refreshStore();
        this.toast = `Alarm ${row.alarmName} acknowledged. It stays in the active list until cleared.`;
      } catch (error) {
        this.toast = this.errorText(error, "Failed to acknowledge alarm");
      }
    },
    async clearAlarm(row) {
      try {
        await clearAlarm(row.historyCode);
        await this.loadRows();
        refreshStore();
        this.toast = `Alarm ${row.alarmName} cleared and moved to alarm history.`;
      } catch (error) {
        this.toast = this.errorText(error, "Failed to clear alarm");
      }
    },
  },
};

import { GridTable } from "../../shared/GridTable.js";
import { ScreenHeader } from "../../shared/ScreenHeader.js";
import { data } from "../../../data/index.js";
import { statusRenderer } from "../../../lib/grid.js";

export const AlarmHistory = {
  components: { ScreenHeader, GridTable },
  template: `
    <div class="screen">
      <screen-header title="Alarm History" subtitle="Sortable master alarm history with detail navigation" />
      <section class="panel">
        <div class="panel-header">
          <h2>Master Alarm Table</h2>
        </div>
        <table-context
          title="Alarm event rows"
          description="Notification, acknowledgement, owner, and status history."
          :items="[
            { label: 'Scope', value: 'All assets' },
            { label: 'Events', value: rows.length },
            { label: 'Detail', value: 'Double-click row' }
          ]"
        />
        <grid-table
          :rows="rows"
          :columns="columns"
          :actions="[{ label: 'Alarm Detail', key: 'detail' }]"
          height="520px"
          @action="openDetail"
          @row-open="openDetail"
        />
      </section>
    </div>
  `,
  setup() {
    return {
      rows: data.alarmHistory,
      columns: [
        { headerName: "Asset", field: "assetName", flex: 1 },
        { headerName: "Location", field: "location", flex: 1 },
        { headerName: "Alarm", field: "alarmName", flex: 1.4 },
        { headerName: "Trip Time", field: "tripTime", width: 112 },
        { headerName: "Notification", field: "notificationTime", width: 124 },
        { headerName: "Ack", field: "acknowledgeTime", width: 112 },
        { headerName: "Duration", field: "duration", type: "measurement", unit: "min", width: 110 },
        { headerName: "Responsibility", field: "responsibility", width: 140 },
        { headerName: "Status", field: "status", cellRenderer: statusRenderer, width: 124 },
      ],
    };
  },
  methods: {
    openDetail(payload) {
      const row = payload?.row || payload || {};
      this.$router.push({ name: "alarm-history-detail", query: { alarmEventId: row.alarmEventId } });
    },
  },
};

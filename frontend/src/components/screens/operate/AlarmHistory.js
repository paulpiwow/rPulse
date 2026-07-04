import { GridTable } from "../../shared/GridTable.js";
import { ScreenHeader } from "../../shared/ScreenHeader.js";
import { fetchAlarmHistory } from "../../../api/alarms.js";
import { isDataSourceOffline } from "../../../api/client.js";
import { statusRenderer } from "../../../lib/grid.js";
import { computed, ref } from "../../../lib/vue.js";

export const AlarmHistory = {
  components: { ScreenHeader, GridTable },
  template: `
    <div class="screen">
      <screen-header title="Alarm History" :subtitle="subtitle" />
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
    const rows = ref([]);
    const loadError = ref("");
    const subtitle = computed(
      () => loadError.value || "Sortable master alarm history with detail navigation"
    );

    async function load() {
      try {
        const page = await fetchAlarmHistory({ size: 100 });
        rows.value = page.rows;
        loadError.value = "";
      } catch (error) {
        loadError.value = isDataSourceOffline(error)
          ? "Data source offline — live telemetry unavailable"
          : `Failed to load alarm history: ${error.message}`;
      }
    }
    load();

    return {
      rows,
      subtitle,
      columns: [
        { headerName: "Asset", field: "assetName", flex: 1 },
        { headerName: "Location", field: "location", flex: 1 },
        { headerName: "Alarm", field: "alarmName", flex: 1.4 },
        { headerName: "Trip Time", field: "tripTime", width: 112 },
        { headerName: "Notification", field: "notificationTime", width: 124 },
        { headerName: "Ack", field: "acknowledgeTime", width: 112 },
        { headerName: "Duration", field: "duration", width: 110 },
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

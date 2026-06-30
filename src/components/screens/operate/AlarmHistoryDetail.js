import { ActionModal } from "../../shared/ActionModal.js";
import { GridTable } from "../../shared/GridTable.js";
import { ScreenHeader } from "../../shared/ScreenHeader.js";
import { data } from "../../../data/index.js";
import { exportReportAsCsv, exportReportAsExcel } from "../../../lib/export.js";
import { formatNumber } from "../../../lib/format.js";
import { computed, useRoute } from "../../../lib/vue.js";

export const AlarmHistoryDetail = {
  components: { ScreenHeader, ActionModal, GridTable },
  data() {
    return {
      exportModalOpen: false,
      notifyOpen: false,
      toast: "",
    };
  },
  template: `
    <div class="screen">
      <screen-header
        title="Alarm History Detail"
        subtitle="Historical alarm status, ownership, notes, and notification follow-up"
        :actions="[
          { key: 'notify', label: 'Notify Group', kind: 'primary' },
          { key: 'export-report', label: 'Export Report' }
        ]"
        @action="handleHeaderAction"
      />
      <div v-if="toast" class="inline-alert success">{{ toast }}</div>
      <section class="detail-layout alarm-history-detail-layout">
        <div class="panel">
          <div class="panel-header"><h2>Alarm Detail</h2></div>
          <dl class="detail-list">
            <template v-for="item in detailItems" :key="item.label">
              <dt>{{ item.label }}</dt>
              <dd>{{ item.value }}</dd>
            </template>
          </dl>
        </div>
        <div class="panel">
          <div class="panel-header"><h2>Work History</h2></div>
          <table-context
            title="Work history entries"
            description="Notes and notification activity for this alarm event."
            :items="[
              { label: 'Status', value: selectedEvent.status },
              { label: 'Notes', value: workHistoryRows.length },
              { label: 'Event ID', value: selectedEvent.alarmEventId }
            ]"
          />
          <table class="work-history">
            <thead><tr><th>Date</th><th>Time</th><th>User</th><th>Action</th><th>Note</th><th>Notify</th></tr></thead>
            <tbody>
              <tr v-for="entry in workHistoryRows" :key="entry.date + entry.time + entry.action">
                <td>{{ entry.date }}</td>
                <td>{{ entry.time }}</td>
                <td>{{ entry.user }}</td>
                <td>{{ entry.action }}</td>
                <td>{{ entry.note }}</td>
                <td><button @click="notifyOpen = true">Notify Group ></button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section class="panel">
        <div class="panel-header"><h2>Triggered Tags</h2></div>
        <table-context
          title="Alarm evidence"
          description="Tags and CTags used to reconstruct this alarm event for reporting."
          :items="[
            { label: 'Rows', value: evidenceRows.length },
            { label: 'Export', value: 'Included in report' }
          ]"
        />
        <grid-table :rows="evidenceRows" :columns="evidenceColumns" height="240px" compact />
      </section>
      <action-modal
        :open="notifyOpen"
        title="Notify Group"
        mode="notify"
        @close="notifyOpen = false"
        @sent="toast = 'Notification queued and logged.'; notifyOpen = false"
      />
      <export-format-modal
        :open="exportModalOpen"
        title="Export Alarm History Detail"
        @close="exportModalOpen = false"
        @select="handleExportFormat"
      />
    </div>
  `,
  setup() {
    const route = useRoute();
    const selectedEvent = computed(() => {
      const alarmEventId = String(route.query.alarmEventId || "");
      return data.alarmHistory.find((alarm) => alarm.alarmEventId === alarmEventId) || data.alarmHistory[0] || {};
    });
    const detailItems = computed(() => [
      { label: "Event ID", value: selectedEvent.value.alarmEventId || "" },
      { label: "Status", value: selectedEvent.value.status || "" },
      { label: "Asset", value: selectedEvent.value.assetName || "" },
      { label: "Asset Location", value: selectedEvent.value.location || "" },
      { label: "Alarm Name", value: selectedEvent.value.alarmName || "" },
      { label: "Trip Time", value: selectedEvent.value.tripTime || "" },
      { label: "Notification Time", value: selectedEvent.value.notificationTime || "" },
      { label: "Acknowledgement", value: selectedEvent.value.acknowledgeTime || "Pending" },
      { label: "Duration", value: selectedEvent.value.duration || "" },
      { label: "Assigned To", value: selectedEvent.value.responsibility || selectedEvent.value.assignment || "" },
    ]);
    const workHistoryRows = computed(() => [
      { date: "2026-06-17", time: "17:12", user: "Cody", action: "Assigned", note: `Assigned ${selectedEvent.value.alarmEventId || "alarm"} to ${selectedEvent.value.responsibility || "response owner"}.` },
      { date: "2026-06-17", time: "17:18", user: "Alex Rivera", action: "Investigated", note: "Reviewed related Cadre tag trend and current process limits." },
      { date: "2026-06-17", time: "17:25", user: "System", action: "Notification", note: "Notification escalation remains available from this detail record." },
    ]);
    const evidenceRows = computed(() =>
      data.alarmDetails.map((row) => ({
        tagName: row.tagName,
        tagType: row.tagType,
        condition: row.condition,
        limitValue: `${formatNumber(row.value, 2)} ${row.unit}`.trim(),
        currentValue: `${formatNumber(row.currentValue, 2)} ${row.unit}`.trim(),
        duration: row.duration,
        lastSync: row.lastSync,
      }))
    );
    return {
      selectedEvent,
      detailItems,
      workHistoryRows,
      evidenceRows,
      evidenceColumns: [
        { headerName: "Tag", field: "tagName", flex: 1.2 },
        { headerName: "Type", field: "tagType", width: 100 },
        { headerName: "Condition", field: "condition", flex: 1 },
        { headerName: "Limit", field: "limitValue", width: 110 },
        { headerName: "Current", field: "currentValue", width: 120 },
        { headerName: "Duration", field: "duration", width: 110 },
        { headerName: "Last Sync", field: "lastSync", width: 110 },
      ],
    };
  },
  methods: {
    handleHeaderAction(action) {
      if (action.key === "notify") {
        this.notifyOpen = true;
        return;
      }
      if (action.key === "export-report") this.exportModalOpen = true;
    },
    handleExportFormat(format) {
      this.exportModalOpen = false;
      if (format === "csv") {
        this.exportHistoryCsv();
        return;
      }
      this.exportHistoryExcel();
    },
    exportHistoryCsv() {
      const eventId = this.selectedEvent.alarmEventId || "alarm-event";
      const filename = exportReportAsCsv(`rpulse-alarm-history-detail-${eventId}`, "rhoPulse Alarm History Detail Report", this.historyReportSections());
      this.toast = `Exported ${filename}.`;
    },
    exportHistoryExcel() {
      const eventId = this.selectedEvent.alarmEventId || "alarm-event";
      const filename = exportReportAsExcel(`rpulse-alarm-history-detail-${eventId}`, "rhoPulse Alarm History Detail Report", this.historyReportSections());
      this.toast = `Exported ${filename}.`;
    },
    historyReportSections() {
      return [
        { title: "Alarm Event", rows: this.detailItems },
        { title: "Work History", rows: this.workHistoryRows },
        { title: "Triggered Tags", rows: this.evidenceRows },
      ];
    },
  },
};

import { ActionModal } from "../../shared/ActionModal.js";
import { GridTable } from "../../shared/GridTable.js";
import { ScreenHeader } from "../../shared/ScreenHeader.js";
import { createMessage } from "../../../api/admin.js";
import { fetchActiveAlarms, fetchAlarmHistoryDetail } from "../../../api/alarms.js";
import { isDataSourceOffline, isNotFound } from "../../../api/client.js";
import { refreshStore } from "../../../api/store.js";
import { exportReportAsCsv, exportReportAsExcel } from "../../../lib/export.js";
import { formatNumber } from "../../../lib/format.js";
import { computed, ref, useRoute } from "../../../lib/vue.js";

const OPERATOR_LABELS = {
  GT: "Greater Than",
  GTE: "Greater Than or Equal",
  LT: "Less Than",
  LTE: "Less Than or Equal",
  EQ: "Equal To",
};

const splitStamp = (stamp) => ({ date: String(stamp).slice(0, 10), time: String(stamp).slice(11) });

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
        :subtitle="subtitle"
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
            description="Lifecycle timeline reconstructed from this alarm event's recorded timestamps."
            :items="[
              { label: 'Status', value: selectedEvent.status },
              { label: 'Entries', value: workHistoryRows.length },
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
      <section v-if="evidenceRows.length" class="panel">
        <div class="panel-header"><h2>Triggered Tags</h2></div>
        <table-context
          title="Alarm evidence"
          description="Live tag values for this alarm while it remains in the active list."
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
        @sent="sendNotification"
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
    const record = ref(null);
    const activeAlarm = ref(null);
    const loadError = ref("");
    const subtitle = computed(
      () => loadError.value || "Historical alarm status, ownership, notes, and notification follow-up"
    );
    const selectedEvent = computed(() => record.value || {});

    async function load() {
      const code = String(route.query.alarmEventId || "");
      if (!code) {
        loadError.value = "No alarm event selected — open a row from Alarm History.";
        return;
      }
      try {
        record.value = await fetchAlarmHistoryDetail(code);
      } catch (error) {
        if (isNotFound(error)) {
          loadError.value = `Alarm event ${code} was not found.`;
        } else if (isDataSourceOffline(error)) {
          loadError.value = "Data source offline — live telemetry unavailable";
        } else {
          loadError.value = `Failed to load alarm event: ${error.message}`;
        }
        return;
      }
      // Evidence values only exist while the alarm is still firing — match the
      // event against the live active-alarm list.
      if (record.value.rawStatus !== "CLEARED") {
        try {
          const active = await fetchActiveAlarms();
          activeAlarm.value = active.find((alarm) => alarm.historyCode === code) || null;
        } catch {
          activeAlarm.value = null;
        }
      }
    }
    load();

    const detailItems = computed(() => [
      { label: "Event ID", value: selectedEvent.value.alarmEventId || "" },
      { label: "Status", value: selectedEvent.value.status || "" },
      { label: "Asset", value: selectedEvent.value.assetName || "" },
      { label: "Asset Location", value: selectedEvent.value.location || "" },
      { label: "Alarm Name", value: selectedEvent.value.alarmName || "" },
      { label: "Trip Time", value: selectedEvent.value.tripTime || "" },
      { label: "Notification Time", value: selectedEvent.value.notificationTime || "" },
      { label: "Acknowledgement", value: selectedEvent.value.acknowledgeTime || "Pending" },
      { label: "Cleared", value: selectedEvent.value.clearTime || "" },
      { label: "Duration", value: selectedEvent.value.duration || "" },
      { label: "Responsibility", value: selectedEvent.value.responsibility || "" },
    ]);

    // The work history timeline is synthesized from the event's real
    // lifecycle timestamps (trip / notification / ack / clear).
    const workHistoryRows = computed(() => {
      const event = selectedEvent.value;
      const owner = event.responsibility || "Operator";
      const entries = [];
      if (event.tripTime) {
        entries.push({ ...splitStamp(event.tripTime), user: "System", action: "Trip", note: `Alarm ${event.alarmName || ""} tripped and the event was opened.`.trim() });
      }
      if (event.notificationTime) {
        entries.push({ ...splitStamp(event.notificationTime), user: "System", action: "Notification", note: `Notification issued to ${owner}.` });
      }
      if (event.acknowledgeTime) {
        entries.push({ ...splitStamp(event.acknowledgeTime), user: owner, action: "Acknowledged", note: "Alarm acknowledged; tracking active for follow-up." });
      }
      if (event.clearTime) {
        entries.push({ ...splitStamp(event.clearTime), user: owner, action: "Cleared", note: "Alarm cleared and event closed." });
      }
      return entries;
    });

    const evidenceRows = computed(() => {
      const alarm = activeAlarm.value;
      if (!alarm) return [];
      return [
        {
          tagName: alarm.tagKey,
          tagType: "Tag",
          condition: OPERATOR_LABELS[alarm.operator] || alarm.operator || "",
          limitValue: formatNumber(alarm.thresholdValue, 2),
          currentValue: formatNumber(alarm.currentValue, 2),
          duration: alarm.duration,
          lastSync: alarm.tripTime,
        },
      ];
    });

    return {
      selectedEvent,
      subtitle,
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
    async sendNotification(payload) {
      this.notifyOpen = false;
      const event = this.selectedEvent;
      try {
        await createMessage({
          title: `Alarm ${event.alarmName || event.alarmEventId || ""}`.trim(),
          body:
            payload.note ||
            `Alarm ${event.alarmName || ""} on ${event.assetName || "asset"} (event ${event.alarmEventId || ""}, status ${event.status || ""}) requires review by ${payload.groupName}.`,
          source: "ALARM",
          target: payload.groupName,
        });
        refreshStore();
        this.toast = `Notification sent to ${payload.groupName} and logged in Message Center.`;
      } catch (error) {
        this.toast = isDataSourceOffline(error)
          ? "Data source offline — live telemetry unavailable"
          : `Failed to send notification: ${error.message}`;
      }
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

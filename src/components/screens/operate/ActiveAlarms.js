import { ActionModal } from "../../shared/ActionModal.js";
import { GridTable } from "../../shared/GridTable.js";
import { ScreenHeader } from "../../shared/ScreenHeader.js";
import { StatusBadge } from "../../shared/StatusBadge.js";
import { data } from "../../../data/index.js";
import { statusRenderer } from "../../../lib/grid.js";

export const ActiveAlarms = {
  components: { ScreenHeader, GridTable, StatusBadge, ActionModal },
  data() {
    return {
      rows: data.activeAlarms.map((row) => ({ ...row })),
      selectedAlarm: null,
      modalMode: "",
      modalOpen: false,
      toast: "",
    };
  },
  computed: {
    columns() {
      return [
        { headerName: "Asset", field: "assetName", width: 130, minWidth: 120 },
        { headerName: "Location", field: "location", width: 100, minWidth: 88 },
        { headerName: "Alarm", field: "alarmName", width: 226, minWidth: 200 },
        { headerName: "Status", field: "severity", cellRenderer: statusRenderer, width: 82, minWidth: 74 },
        { headerName: "Trip Time", field: "tripTime", width: 76, minWidth: 68 },
        { headerName: "Dur", field: "duration", type: "measurement", unit: "min", width: 76, minWidth: 68 },
        { headerName: "Assign", field: "assignment", width: 110, minWidth: 100 },
      ];
    },
  },
  template: `
    <div class="screen">
      <screen-header
        title="Active Alarms"
        subtitle="Alarm workflow: table to detail to trend to assign to acknowledge to track"
        status="red"
      />
      <div v-if="toast" class="inline-alert success">{{ toast }}</div>
      <section class="panel">
        <div class="panel-header">
          <h2>Active Alarm Summary</h2>
        </div>
        <table-context
          title="Open alarm queue"
          description="Rows needing detail review, assignment, or acknowledgement."
          :items="[
            { label: 'Open Alarms', value: rows.length },
            { label: 'Sort', value: 'Severity first' },
            { label: 'Actions', value: 'Detail / Ack' }
          ]"
        />
        <grid-table
          :rows="rows"
          :columns="columns"
          :actions="[
            { label: 'Alarm Detail', key: 'detail' },
            { label: 'Acknowledge', key: 'ack' }
          ]"
          height="470px"
          @action="handleAction"
          @row-open="openDetail"
        />
      </section>
      <action-modal
        :open="modalOpen"
        :row="selectedAlarm"
        title="Assign Before Acknowledgement"
        mode="assign"
        @close="modalOpen = false"
        @assigned="assignAlarm"
      />
    </div>
  `,
  methods: {
    handleAction({ action, row }) {
      if (action.key === "detail") this.openDetail(row);
      if (action.key === "assign") this.openAssign(row);
      if (action.key === "ack") this.acknowledgeAlarm(row);
      if (action.key === "track") this.$router.push({ name: "alarm-history-detail" });
    },
    openDetail() {
      this.$router.push({ name: "asset-alarm-detail" });
    },
    openAssign(row) {
      this.selectedAlarm = row;
      this.modalMode = "assign";
      this.modalOpen = true;
    },
    assignAlarm(payload) {
      const target = this.rows.find((item) => item.alarmEventId === this.selectedAlarm.alarmEventId);
      if (target) {
        target.assignment = payload.assignee;
        target.acknowledgement = "Pending";
        target.tracking = "Ready";
      }
      this.modalOpen = false;
      this.toast = `Assigned to ${payload.assignee}. Alarm can now be acknowledged and tracked.`;
    },
    acknowledgeAlarm(row) {
      if (row.assignment === "Unassigned" || row.acknowledgement === "Blocked") {
        this.toast = "Assignment is required before acknowledgement.";
        this.openAssign(row);
        return;
      }
      const target = this.rows.find((item) => item.alarmEventId === row.alarmEventId);
      if (target) {
        target.acknowledgement = "Acknowledged";
        target.tracking = "Active";
      }
      this.toast = "Alarm acknowledged. Tracking is active for follow-up notes and notifications.";
    },
  },
};

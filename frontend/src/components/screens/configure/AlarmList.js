import { GridTable } from "../../shared/GridTable.js";
import { ScreenHeader } from "../../shared/ScreenHeader.js";
import { fetchAlarmRules, updateAlarmRule, deleteAlarmRule } from "../../../api/alarms.js";
import { isDataSourceOffline } from "../../../api/client.js";
import { statusRenderer } from "../../../lib/grid.js";
import { computed, onMounted, ref, useRoute } from "../../../lib/vue.js";

export const AlarmList = {
  components: { ScreenHeader, GridTable },
  template: `
    <div class="screen">
      <screen-header
        title="Alarm List"
        :subtitle="assetCode ? 'Alarm rules for asset ' + assetCode : 'All configured alarm rules'"
      />
      <div class="table-command-row">
        <button type="button" class="primary" @click="addAlarm">Add Alarm ></button>
      </div>
      <div v-if="loadError" class="inline-alert">{{ loadError }}</div>
      <div v-if="actionError" class="inline-alert">{{ actionError }}</div>
      <section class="panel">
        <div class="panel-header"><h2>Alarm List</h2></div>
        <table-context
          title="Configured alarm rows"
          description="Alarm rule definitions with notification targets and enablement."
          :items="[
            { label: 'Alarms', value: rows.length }
          ]"
        />
        <grid-table
          :rows="rows"
          :columns="columns"
          :actions="[
            { label: 'Alarm Configuration', key: 'edit' },
            { label: 'Enable/Disable', key: 'toggle' },
            { label: 'Delete', key: 'delete' }
          ]"
          height="500px"
          @action="onAction"
        />
      </section>
    </div>
  `,
  setup() {
    const route = useRoute();
    const assetCode = computed(() => String(route.query.asset || ""));
    const rows = ref([]);
    const loadError = ref("");
    const actionError = ref("");
    // Keep the full alarm rule for each row, looked up by its code. The toggle
    // needs to send the whole rule back to the server, not just the few fields
    // the table shows, so we stash the originals here when the list loads.
    const rulesByCode = ref({});

    // Fetch the alarm rules from the server and turn them into table rows. Called
    // when the screen first opens and again after a delete or an on/off change so
    // the table always shows the current state.
    async function load() {
      try {
        const rules = await fetchAlarmRules(assetCode.value || undefined);
        const byCode = {};
        rows.value = rules.map((rule) => {
          byCode[rule.code] = rule;
          return {
            alarmEventId: rule.code,
            alarmName: rule.alarmName,
            assetName: rule.assetCode,
            severity: (rule.severity || "yellow").toLowerCase(),
            assignment: (rule.notifyGroupCodes || []).join(", "),
            tracking: rule.enabled ? "Enabled" : "Disabled",
            assetCode: rule.assetCode,
          };
        });
        rulesByCode.value = byCode;
        loadError.value = "";
      } catch (error) {
        loadError.value = isDataSourceOffline(error) ? "Data source offline" : `Failed to load alarm rules: ${error.message}`;
      }
    }

    onMounted(load);

    return {
      assetCode,
      rows,
      loadError,
      actionError,
      rulesByCode,
      load,
      columns: [
        { headerName: "Alarm ID", field: "alarmEventId", width: 130 },
        { headerName: "Alarm Name", field: "alarmName", flex: 1.4 },
        { headerName: "Asset", field: "assetName", flex: 1 },
        { headerName: "Severity", field: "severity", cellRenderer: statusRenderer, width: 92 },
        { headerName: "Notify Groups", field: "assignment", width: 150 },
        { headerName: "Status", field: "tracking", width: 120 },
      ],
    };
  },
  methods: {
    addAlarm() {
      const query = this.assetCode ? { asset: this.assetCode } : {};
      this.$router.push({ name: "alarm-configuration", query });
    },
    openAlarm(row) {
      this.$router.push({
        name: "alarm-configuration",
        query: { alarm: row.alarmEventId, asset: row.assetCode },
      });
    },
    // One of the row buttons was clicked. Send it to the matching handler based
    // on which button it was (edit, on/off, or delete).
    onAction({ action, row }) {
      if (action.key === "toggle") return this.toggleAlarm(row);
      if (action.key === "delete") return this.removeAlarm(row);
      return this.openAlarm(row);
    },
    // Flip an alarm between Enabled and Disabled. We take the full rule we saved
    // earlier, switch only its on/off flag, and save the whole thing back.
    async toggleAlarm(row) {
      const rule = this.rulesByCode[row.alarmEventId];
      if (!rule) return;
      this.actionError = "";
      try {
        await updateAlarmRule(rule.code, { ...rule, enabled: !rule.enabled });
        await this.load();
      } catch (error) {
        this.actionError = `Could not change status for ${row.alarmName}: ${error.message}`;
      }
    },
    // Delete an alarm after the user confirms. Once it's gone we reload the list.
    async removeAlarm(row) {
      const ok = window.confirm(`Delete alarm "${row.alarmName}" (${row.alarmEventId})? This cannot be undone.`);
      if (!ok) return;
      this.actionError = "";
      try {
        await deleteAlarmRule(row.alarmEventId);
        await this.load();
      } catch (error) {
        this.actionError = `Could not delete ${row.alarmName}: ${error.message}`;
      }
    },
  },
};

import { GridTable } from "../../shared/GridTable.js";
import { ScreenHeader } from "../../shared/ScreenHeader.js";
import { fetchAlarmRules } from "../../../api/alarms.js";
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
          :actions="[{ label: 'Alarm Configuration', key: 'edit' }]"
          height="500px"
          @action="openAlarm"
        />
      </section>
    </div>
  `,
  setup() {
    const route = useRoute();
    const assetCode = computed(() => String(route.query.asset || ""));
    const rows = ref([]);
    const loadError = ref("");
    onMounted(async () => {
      try {
        const rules = await fetchAlarmRules(assetCode.value || undefined);
        rows.value = rules.map((rule) => ({
          alarmEventId: rule.code,
          alarmName: rule.alarmName,
          assetName: rule.assetCode,
          severity: (rule.severity || "yellow").toLowerCase(),
          assignment: (rule.notifyGroupCodes || []).join(", "),
          tracking: rule.enabled ? "Enabled" : "Disabled",
          assetCode: rule.assetCode,
        }));
        loadError.value = "";
      } catch (error) {
        loadError.value = isDataSourceOffline(error) ? "Data source offline" : `Failed to load alarm rules: ${error.message}`;
      }
    });
    return {
      assetCode,
      rows,
      loadError,
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
    openAlarm({ row }) {
      this.$router.push({
        name: "alarm-configuration",
        query: { alarm: row.alarmEventId, asset: row.assetCode },
      });
    },
  },
};

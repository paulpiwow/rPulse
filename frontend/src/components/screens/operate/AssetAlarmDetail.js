import { GridTable } from "../../shared/GridTable.js";
import { ScreenHeader } from "../../shared/ScreenHeader.js";
import { fetchActiveAlarms, fetchSiteStatus } from "../../../api/alarms.js";
import { isDataSourceOffline } from "../../../api/client.js";
import { computed, ref, useRoute } from "../../../lib/vue.js";

const OPERATOR_LABELS = {
  GT: "Greater Than",
  GTE: "Greater Than or Equal",
  LT: "Less Than",
  LTE: "Less Than or Equal",
  EQ: "Equal To",
};

export const AssetAlarmDetail = {
  components: { ScreenHeader, GridTable },
  template: `
    <div class="screen">
      <screen-header
        title="Asset Alarm Detail"
        :subtitle="detailSubtitle"
        status="red"
      />
      <div class="table-command-row">
        <button type="button" class="primary" @click="plotTags">Plot Tags ></button>
      </div>
      <section class="panel">
        <div class="panel-header">
          <h2>Alarm Detail Table</h2>
        </div>
        <table-context
          :title="detailTitle"
          description="Tags and CTags driving this alarm state."
          :items="tableContextItems"
        />
        <grid-table :rows="rows" :columns="columns" height="360px" />
      </section>
    </div>
  `,
  setup() {
    const route = useRoute();
    const rows = ref([]);
    const asset = ref({});
    const assetCode = ref(String(route.query.asset || ""));
    const loadError = ref("");

    const detailSubtitle = computed(() => {
      if (loadError.value) return loadError.value;
      const entry = asset.value;
      return `${entry.assetName || "Selected asset"} at ${entry.location || "site"} has ${entry.activeAlarms ?? rows.value.length} active alarms`;
    });
    const detailTitle = computed(() => `${asset.value.assetName || "Selected asset"} alarm tags`);
    const tableContextItems = computed(() => [
      { label: "Asset ID", value: assetCode.value },
      { label: "Active Alarms", value: asset.value.activeAlarms ?? rows.value.length },
      { label: "Rows", value: rows.value.length },
    ]);

    async function load() {
      try {
        const status = await fetchSiteStatus();
        // No asset in the route query: fall back to the first asset that has
        // active alarms (or the first asset at all).
        if (!assetCode.value) {
          const firstAlarming = status.assets.find((item) => item.activeAlarms > 0) || status.assets[0];
          assetCode.value = firstAlarming ? firstAlarming.assetId : "";
        }
        asset.value = status.assets.find((item) => item.assetId === assetCode.value) || {};
        rows.value = assetCode.value
          ? (await fetchActiveAlarms(assetCode.value)).map((alarm) => ({
              tagName: alarm.tagKey,
              tagType: "Tag",
              currentValue: alarm.currentValue,
              condition: OPERATOR_LABELS[alarm.operator] || alarm.operator || "",
              value: alarm.thresholdValue,
              unit: "",
              duration: alarm.duration,
              lastSync: alarm.tripTime,
            }))
          : [];
        loadError.value = "";
      } catch (error) {
        loadError.value = isDataSourceOffline(error)
          ? "Data source offline — live telemetry unavailable"
          : `Failed to load asset alarms: ${error.message}`;
      }
    }
    load();

    return {
      rows,
      assetCode,
      detailSubtitle,
      detailTitle,
      tableContextItems,
      columns: [
        { headerName: "Alarm Tag", field: "tagName", flex: 1.2 },
        { headerName: "Alarm Type", field: "tagType", width: 126 },
        { headerName: "Current Value", field: "currentValue", type: "numeric", decimals: 2, width: 132 },
        { headerName: "Condition", field: "condition", flex: 1 },
        { headerName: "Limit Value", field: "value", type: "numeric", decimals: 2, width: 118 },
        { headerName: "Units", field: "unit", width: 100 },
        { headerName: "Time Duration", field: "duration", width: 128 },
        { headerName: "Last Sync", field: "lastSync", width: 110 },
      ],
    };
  },
  methods: {
    plotTags() {
      this.$router.push({ name: "alarm-data-trends", query: { asset: this.assetCode } });
    },
  },
};

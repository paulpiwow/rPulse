import { GridTable } from "../../shared/GridTable.js";
import { ScreenHeader } from "../../shared/ScreenHeader.js";
import { data } from "../../../data/index.js";
import { statusRenderer } from "../../../lib/grid.js";

export const AssetInventory = {
  components: { ScreenHeader, GridTable },
  template: `
    <div class="screen">
      <screen-header
        title="Asset Inventory"
        subtitle="Configured assets with access to asset configuration and alarm list"
        :actions="[{ key: 'add', label: 'Add Asset', kind: 'primary' }]"
        @action="$router.push({ name: 'new-asset' })"
      />
      <section class="panel">
        <div class="panel-header"><h2>Asset Inventory List</h2></div>
        <table-context
          title="Configured asset rows"
          description="Assets available for configuration, alarms, and maintenance warning review."
          :items="[
            { label: 'Assets', value: rows.length },
            { label: 'Open Alarms', value: rows.reduce((total, row) => total + row.activeAlarms, 0) },
            { label: 'Warnings', value: rows.reduce((total, row) => total + row.baselineDeviations, 0) }
          ]"
        />
        <grid-table
          :rows="rows"
          :columns="columns"
          :actions="[{ label: 'Asset Configuration', key: 'configure' }, { label: 'Alarm List', key: 'alarms' }]"
          height="520px"
          @action="handleAction"
        />
      </section>
    </div>
  `,
  setup() {
    return {
      rows: data.assets,
      columns: [
        { headerName: "Asset ID", field: "assetId", width: 120 },
        { headerName: "Asset Name", field: "assetName", flex: 1.2 },
        { headerName: "Location", field: "location", flex: 1 },
        { headerName: "Status", field: "status", cellRenderer: statusRenderer, width: 92 },
        { headerName: "Active Alarms", field: "activeAlarms", type: "numeric", width: 140 },
        { headerName: "Maintenance Warnings", field: "baselineDeviations", type: "numeric", width: 190 },
      ],
    };
  },
  methods: {
    handleAction({ action }) {
      this.$router.push({ name: action.key === "alarms" ? "alarm-list" : "asset-configuration" });
    },
  },
};

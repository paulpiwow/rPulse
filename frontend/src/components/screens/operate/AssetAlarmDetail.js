import { GridTable } from "../../shared/GridTable.js";
import { ScreenHeader } from "../../shared/ScreenHeader.js";
import { data } from "../../../data/index.js";

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
        <button type="button" class="primary" @click="$router.push({ name: 'alarm-data-trends' })">Plot Tags ></button>
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
    const rows = data.alarmDetails;
    const asset = data.assets.find((item) => item.activeAlarms > 0) || data.assets[0] || {};
    const detailSubtitle = `${asset.assetName || "Selected asset"} at ${asset.location || data.shell.siteLocation} has ${asset.activeAlarms || rows.length} active alarms`;
    const detailTitle = `${asset.assetName || "Selected asset"} alarm tags`;
    return {
      rows,
      detailSubtitle,
      detailTitle,
      tableContextItems: [
        { label: "Asset ID", value: asset.assetId },
        { label: "Active Alarms", value: asset.activeAlarms },
        { label: "Last Sync", value: asset.lastUpdate },
        { label: "Rows", value: rows.length },
      ],
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
};

import { GridTable } from "../../shared/GridTable.js";
import { ScreenHeader } from "../../shared/ScreenHeader.js";
import { data } from "../../../data/index.js";
import { statusRenderer } from "../../../lib/grid.js";

export const AlarmList = {
  components: { ScreenHeader, GridTable },
  template: `
    <div class="screen">
      <screen-header
        title="Alarm List"
        subtitle="Alarms for selected asset and location"
      />
      <div class="table-command-row">
        <button type="button" class="primary" @click="$router.push({ name: 'alarm-configuration' })">Add Alarm ></button>
      </div>
      <section class="panel">
        <div class="panel-header"><h2>Alarm List</h2></div>
        <table-context
          title="Configured alarm rows"
          description="Alarm definitions and current workflow fields."
          :items="[
            { label: 'Alarms', value: rows.length }
          ]"
        />
        <grid-table
          :rows="rows"
          :columns="columns"
          :actions="[{ label: 'Alarm Configuration', key: 'edit' }]"
          height="500px"
          @action="$router.push({ name: 'alarm-configuration' })"
        />
      </section>
    </div>
  `,
  setup() {
    return {
      rows: data.activeAlarms,
      columns: [
        { headerName: "Alarm ID", field: "alarmEventId", width: 130 },
        { headerName: "Alarm Name", field: "alarmName", flex: 1.4 },
        { headerName: "Asset", field: "assetName", flex: 1 },
        { headerName: "Status", field: "severity", cellRenderer: statusRenderer, width: 92 },
        { headerName: "Assignment", field: "assignment", width: 130 },
        { headerName: "Tracking", field: "tracking", width: 130 },
      ],
    };
  },
};

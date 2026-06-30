import { GridTable } from "../../shared/GridTable.js";
import { ScreenHeader } from "../../shared/ScreenHeader.js";
import { data } from "../../../data/index.js";

export const GroupList = {
  components: { ScreenHeader, GridTable },
  template: `
    <div class="screen">
      <screen-header
        title="Group List"
        subtitle="Notification and administration groups"
      />
      <div class="table-command-row">
        <button type="button" class="primary" @click="$router.push({ name: 'group-configuration' })">Add Group ></button>
      </div>
      <section class="panel">
        <div class="panel-header"><h2>Group List</h2></div>
        <table-context
          title="Group rows"
          description="Notification routing and administrative ownership."
          :items="[
            { label: 'Groups', value: rows.length }
          ]"
        />
        <grid-table
          :rows="rows"
          :columns="columns"
          :actions="[{ label: 'Group Configuration', key: 'edit' }]"
          height="500px"
          @action="$router.push({ name: 'group-configuration' })"
        />
      </section>
    </div>
  `,
  setup() {
    return {
      rows: data.groups,
      columns: [
        { headerName: "Group ID", field: "groupId", width: 130 },
        { headerName: "Group Name", field: "groupName", flex: 1.2 },
        { headerName: "Purpose", field: "purpose", flex: 1 },
        { headerName: "Members", field: "members", flex: 1 },
        { headerName: "Delivery", field: "delivery", width: 130 },
        { headerName: "Active", field: "active", width: 100 },
      ],
    };
  },
};

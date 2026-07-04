import { GridTable } from "../../shared/GridTable.js";
import { ScreenHeader } from "../../shared/ScreenHeader.js";
import { fetchGroups } from "../../../api/admin.js";
import { isDataSourceOffline } from "../../../api/client.js";
import { onMounted, ref } from "../../../lib/vue.js";

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
      <div v-if="loadError" class="inline-alert">{{ loadError }}</div>
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
          @action="openGroup"
        />
      </section>
    </div>
  `,
  setup() {
    const rows = ref([]);
    const loadError = ref("");
    onMounted(async () => {
      try {
        rows.value = await fetchGroups();
        loadError.value = "";
      } catch (error) {
        loadError.value = isDataSourceOffline(error) ? "Data source offline" : `Failed to load groups: ${error.message}`;
      }
    });
    return {
      rows,
      loadError,
      // membership lives on the user side of the API, so the mock-era
      // "Members" column (always blank now) is dropped.
      columns: [
        { headerName: "Group ID", field: "groupId", width: 130 },
        { headerName: "Group Name", field: "groupName", flex: 1.2 },
        { headerName: "Purpose", field: "purpose", flex: 1.4 },
        { headerName: "Delivery", field: "delivery", width: 150 },
        { headerName: "Active", field: "active", width: 100 },
      ],
    };
  },
  methods: {
    openGroup({ row }) {
      this.$router.push({ name: "group-configuration", query: { group: row.groupId } });
    },
  },
};

import { GridTable } from "../../shared/GridTable.js";
import { ScreenHeader } from "../../shared/ScreenHeader.js";
import { data } from "../../../data/index.js";
import { statusRenderer } from "../../../lib/grid.js";

export const UserAdmin = {
  components: { ScreenHeader, GridTable },
  template: `
    <div class="screen">
      <screen-header
        title="User Admin"
        subtitle="Users, authorities, contact methods, and notification preferences"
        :actions="[{ key: 'add', label: 'Add User', kind: 'primary' }]"
        @action="$router.push({ name: 'edit-user' })"
      />
      <section class="panel">
        <div class="panel-header"><h2>Users and Authorities</h2></div>
        <table-context
          title="User rows"
          description="Accounts, roles, status, and notification preferences."
          :items="[
            { label: 'Users', value: rows.length },
            { label: 'Action', value: 'Edit user' }
          ]"
        />
        <grid-table
          :rows="rows"
          :columns="columns"
          :actions="[{ label: 'Edit User', key: 'edit' }]"
          height="500px"
          @action="$router.push({ name: 'edit-user' })"
        />
      </section>
    </div>
  `,
  setup() {
    return {
      rows: data.users,
      columns: [
        { headerName: "User ID", field: "userId", width: 120 },
        { headerName: "User Name", field: "userName", flex: 1 },
        { headerName: "Email", field: "email", flex: 1.4 },
        { headerName: "Role", field: "role", flex: 1.3 },
        { headerName: "Status", field: "status", cellRenderer: statusRenderer, width: 120 },
        { headerName: "Notifications", field: "notifications", width: 150 },
      ],
    };
  },
};

import { ScreenHeader } from "../../shared/ScreenHeader.js";
import { StatusBadge } from "../../shared/StatusBadge.js";
import { data } from "../../../data/index.js";

export const LicenseManagement = {
  components: { ScreenHeader, StatusBadge },
  template: `
    <div class="screen">
      <screen-header
        title="Application"
        subtitle="License, customer, and site fields used by the application shell"
        status="green"
      />
      <section class="panel">
        <div class="panel-header"><h2>License Management</h2></div>
        <div class="field-grid three">
          <label><span>Customer Name</span><input value="Cadre" /></label>
          <label><span>Site Name</span><input :value="shell.siteName" /></label>
          <label><span>Site Location</span><input :value="shell.siteLocation" /></label>
          <label><span>License Status</span><select><option>Active</option><option>Expired</option><option>Renewal Pending</option></select></label>
          <label><span>Start Date</span><input value="2026-01-01" /></label>
          <label><span>End Date</span><input value="2026-12-31" /></label>
        </div>
      </section>
      <div class="table-command-row">
        <button type="button" class="primary" @click="$router.push({ name: 'renewal-workflow' })">Renew License</button>
      </div>
    </div>
  `,
  setup() {
    return { shell: data.shell };
  },
};

import { ScreenHeader } from "../../shared/ScreenHeader.js";
import { StatusBadge } from "../../shared/StatusBadge.js";
import { fetchLicense, saveLicense } from "../../../api/admin.js";
import { isDataSourceOffline } from "../../../api/client.js";
import { fetchSites } from "../../../api/hierarchy.js";

export const LicenseManagement = {
  components: { ScreenHeader, StatusBadge },
  data() {
    return {
      license: null,
      loaded: false,
      form: {
        customerName: "",
        status: "Active",
        startDate: "",
        endDate: "",
      },
      siteName: "",
      siteLocation: "",
      error: "",
      toast: "",
      saving: false,
    };
  },
  async created() {
    await this.loadLicense();
  },
  computed: {
    headerStatus() {
      if (!this.license) return "yellow";
      if (this.license.status === "Active") return "green";
      if (this.license.status === "Expired") return "red";
      return "yellow";
    },
  },
  methods: {
    async loadLicense() {
      try {
        const [license, sites] = await Promise.all([fetchLicense(), fetchSites()]);
        this.license = license;
        if (license) {
          this.form = {
            customerName: license.customerName || "",
            status: license.status || "Active",
            startDate: license.startDate || "",
            endDate: license.endDate || "",
          };
        }
        const site = sites && sites[0];
        this.siteName = site ? site.siteName || "" : "";
        this.siteLocation = site ? site.location || "" : "";
        this.error = "";
      } catch (error) {
        this.error = isDataSourceOffline(error) ? "Data source offline" : error.message || "Failed to load license.";
      } finally {
        this.loaded = true;
      }
    },
    async save() {
      if (this.saving) return;
      this.saving = true;
      this.toast = "";
      try {
        await saveLicense({
          code: this.license?.code || "LIC-001",
          customerName: this.form.customerName,
          status: this.form.status,
          startDate: this.form.startDate,
          endDate: this.form.endDate,
          renewalStatus: this.license?.renewalStatus || "Not Started",
          customerContact: this.license?.customerContact || "",
          requestedTerm: this.license?.requestedTerm || "",
          renewalNote: this.license?.renewalNote || "",
        });
        this.toast = "License saved.";
        await this.loadLicense();
      } catch (error) {
        this.error = isDataSourceOffline(error) ? "Data source offline" : error.message || "Save failed.";
      } finally {
        this.saving = false;
      }
    },
  },
  template: `
    <div class="screen">
      <screen-header
        title="Application"
        subtitle="License, customer, and site fields used by the application shell"
        :status="headerStatus"
      />
      <div v-if="error" class="inline-alert">{{ error }}</div>
      <div v-else-if="toast" class="inline-alert success">{{ toast }}</div>
      <div v-else-if="loaded && !license" class="inline-alert">
        No license on record. Fill in the fields below and save to create one.
      </div>
      <section class="panel">
        <div class="panel-header"><h2>License Management</h2></div>
        <div class="field-grid three">
          <label><span>Customer Name</span><input v-model="form.customerName" placeholder="Customer name" /></label>
          <label><span>Site Name</span><input :value="siteName" readonly /></label>
          <label><span>Site Location</span><input :value="siteLocation" readonly /></label>
          <label>
            <span>License Status</span>
            <select v-model="form.status">
              <option>Active</option>
              <option>Expired</option>
              <option>Renewal Pending</option>
            </select>
          </label>
          <label><span>Start Date</span><input v-model="form.startDate" placeholder="YYYY-MM-DD" /></label>
          <label><span>End Date</span><input v-model="form.endDate" placeholder="YYYY-MM-DD" /></label>
        </div>
      </section>
      <div class="table-command-row">
        <button type="button" class="secondary" :disabled="saving" @click="save">{{ saving ? 'Saving...' : 'Save' }}</button>
        <button type="button" class="primary" @click="$router.push({ name: 'renewal-workflow' })">Renew License</button>
      </div>
    </div>
  `,
};

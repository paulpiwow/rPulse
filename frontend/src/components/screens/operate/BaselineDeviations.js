import { ActionModal } from "../../shared/ActionModal.js";
import { GridTable } from "../../shared/GridTable.js";
import { ScreenHeader } from "../../shared/ScreenHeader.js";
import { fetchMaintenanceWarnings, notifyMaintenanceWarning } from "../../../api/alarms.js";
import { isDataSourceOffline } from "../../../api/client.js";
import { refreshStore } from "../../../api/store.js";
import { data } from "../../../data/index.js";
import { exportReportAsCsv, exportReportAsExcel } from "../../../lib/export.js";

export const BaselineDeviations = {
  components: { ScreenHeader, GridTable, ActionModal },
  data() {
    return {
      rows: [],
      exportModalOpen: false,
      notifyOpen: false,
      selectedDeviation: null,
      toast: "",
    };
  },
  created() {
    this.loadRows();
  },
  template: `
    <div class="screen">
      <screen-header
        title="Maintenance Warnings"
        subtitle="Tags and CTags outside established baseline ranges"
        status="yellow"
        :actions="[{ key: 'export-report', label: 'Export Report', kind: 'primary' }]"
        @action="handleHeaderAction"
      />
      <div v-if="toast" class="inline-alert success">{{ toast }}</div>
      <section class="panel">
        <div class="panel-header">
          <h2>Maintenance Warnings</h2>
        </div>
        <table-context
          title="Baseline deviation rows"
          description="Measurements outside configured limits."
          :items="[
            { label: 'Scope', value: scopeLabel },
            { label: 'Warnings', value: rows.length },
            { label: 'Actions', value: 'Plot / Notify' }
          ]"
        />
        <grid-table
          :rows="rows"
          :columns="columns"
          :actions="[{ label: 'Plot Trend', key: 'plot' }, { label: 'Notify Group', key: 'notify' }]"
          height="520px"
          @action="handleAction"
        />
      </section>
      <action-modal
        :open="notifyOpen"
        title="Notification Action"
        mode="notify"
        @close="notifyOpen = false"
        @sent="markNotified"
      />
      <export-format-modal
        :open="exportModalOpen"
        title="Export Maintenance Warnings"
        @close="exportModalOpen = false"
        @select="handleExportFormat"
      />
    </div>
  `,
  computed: {
    assetFilter() {
      return String(this.$route.query.asset || "");
    },
    scopeLabel() {
      return this.assetFilter || "All assets";
    },
    columns() {
      return [
        { headerName: "Tag", field: "tagName", width: 146, minWidth: 136 },
        { headerName: "Measure", field: "measurementType", width: 112, minWidth: 102 },
        { headerName: "Asset", field: "asset", width: 168, minWidth: 156 },
        { headerName: "Baseline", field: "baseline", type: "measurement", decimals: 2, align: "left", width: 94, minWidth: 86 },
        { headerName: "Current Value", field: "currentValue", type: "measurement", decimals: 2, align: "left", width: 126, minWidth: 116 },
        { headerName: "Condition", field: "condition", width: 172, minWidth: 162 },
      ];
    },
  },
  methods: {
    async loadRows() {
      try {
        let warnings = await fetchMaintenanceWarnings();
        if (this.assetFilter) {
          warnings = warnings.filter((row) => row.assetCode === this.assetFilter);
        }
        this.rows = warnings.map((row) => ({
          ...row,
          condition: row.direction === "Below" ? "Below Low Baseline" : "Above High Baseline",
        }));
      } catch (error) {
        this.rows = [];
        this.toast = isDataSourceOffline(error)
          ? "Data source offline — live telemetry unavailable"
          : `Failed to load maintenance warnings: ${error.message}`;
      }
    },
    handleHeaderAction(action) {
      if (action.key === "export-report") this.exportModalOpen = true;
    },
    handleExportFormat(format) {
      this.exportModalOpen = false;
      if (format === "csv") {
        this.exportWarningsCsv();
        return;
      }
      this.exportWarningsExcel();
    },
    handleAction({ action, row }) {
      if (action.key === "plot") this.$router.push({ name: "data-deviation-trends", query: { deviationId: row.tagCode } });
      if (action.key === "notify") {
        this.selectedDeviation = row;
        this.notifyOpen = true;
      }
    },
    exportWarningsCsv() {
      const filename = exportReportAsCsv("rpulse-maintenance-warnings-report", "rhoPulse Maintenance Warnings Report", this.warningReportSections());
      this.toast = `Exported ${filename}.`;
    },
    exportWarningsExcel() {
      const filename = exportReportAsExcel("rpulse-maintenance-warnings-report", "rhoPulse Maintenance Warnings Report", this.warningReportSections());
      this.toast = `Exported ${filename}.`;
    },
    warningReportSections() {
      return [
        {
          title: "Warning Summary",
          rows: [
            { label: "Site", value: data.shell.siteName },
            { label: "Open Warnings", value: this.rows.length },
            { label: "Assets Affected", value: new Set(this.rows.map((row) => row.asset)).size },
            { label: "Generated By", value: data.shell.userName },
          ],
        },
        {
          title: "Warning Rows",
          rows: this.rows.map((row) => ({
            Warning: row.deviationId,
            Asset: row.asset,
            Tag: row.tagName,
            Baseline: row.baseline,
            Current: row.currentValue,
            Condition: row.condition,
          })),
        },
      ];
    },
    async markNotified(payload) {
      this.notifyOpen = false;
      const deviation = this.selectedDeviation;
      if (!deviation) return;
      try {
        await notifyMaintenanceWarning(deviation.tagCode, payload.groupCode);
        const target = this.rows.find((row) => row.deviationId === deviation.deviationId);
        if (target) target.notified = "Yes";
        refreshStore();
        this.toast = `Notification for ${deviation.tagName} sent to ${payload.groupName}.`;
      } catch (error) {
        this.toast = isDataSourceOffline(error)
          ? "Data source offline — live telemetry unavailable"
          : `Failed to send notification: ${error.message}`;
      }
    },
  },
};

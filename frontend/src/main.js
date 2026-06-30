import { createApp } from "./lib/vue.js";
import { router } from "./router.js";
import { AppShell } from "./components/AppShell.js";
import { StatusBadge } from "./components/shared/StatusBadge.js";
import { TableContext } from "./components/shared/TableContext.js";
import { DurationInput } from "./components/shared/DurationInput.js";
import { ExportFormatModal } from "./components/shared/ExportFormatModal.js";
import { GridTable } from "./components/shared/GridTable.js";
import { TrendChart } from "./components/shared/TrendChart.js";

// AG Grid enterprise license, if one is provided on the window.
if (window.agGrid && window.agGrid.LicenseManager && window.AG_GRID_LICENSE_KEY) {
  window.agGrid.LicenseManager.setLicenseKey(window.AG_GRID_LICENSE_KEY);
}

createApp(AppShell)
  .component("status-badge", StatusBadge)
  .component("table-context", TableContext)
  .component("duration-input", DurationInput)
  .component("export-format-modal", ExportFormatModal)
  .component("grid-table", GridTable)
  .component("trend-chart", TrendChart)
  .use(router)
  .mount("#app");

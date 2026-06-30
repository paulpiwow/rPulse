import { StatusBadge } from "./StatusBadge.js";
import { data } from "../../data/index.js";
import { escapeHtml, formatTabularValue } from "../../lib/format.js";
import { isNumericColumn, isTabularColumn, readableHeaderMinWidth, statusColorClass, statusRenderer, tabularRenderer, textFilter } from "../../lib/grid.js";
import { nextTick } from "../../lib/vue.js";

export const GridTable = {
  props: {
    rows: { type: Array, default: () => [] },
    columns: { type: Array, default: () => [] },
    actions: { type: Array, default: () => [] },
    height: { type: String, default: "360px" },
    compact: { type: Boolean, default: false },
  },
  emits: ["action", "row-open"],
  template: `
    <div class="grid-wrap" :class="{ 'grid-wrap-auto': isAutoHeight, 'grid-wrap-compact': compact }" :style="gridWrapStyle">
      <div v-if="agReady" ref="gridEl" class="ag-theme-quartz rpulse-grid" :style="gridStyle"></div>
      <table v-else class="fallback-grid">
        <thead>
          <tr>
            <th v-for="col in columns" :key="col.field" :class="fallbackHeaderClass(col)" :title="col.headerName">{{ col.headerName }}</th>
            <th v-if="actions.length" class="actions-cell center-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="rowKey(row)" @dblclick="$emit('row-open', row)">
            <td v-for="col in columns" :key="col.field" :class="fallbackCellClass(col)" :title="cellText(row, col)">
              <span v-if="col.cellRenderer === statusRenderer" :class="['status-block', statusValue(row, col)]" :title="cellText(row, col)"></span>
              <span v-else :class="cellClass(col, row)">{{ cellText(row, col) }}</span>
            </td>
            <td v-if="actions.length" class="table-actions actions-cell">
              <button v-for="action in actions" :key="action.label" type="button" @click="$emit('action', { action, row })">
                {{ actionLabel(action) }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  components: { StatusBadge },
  data() {
    return {
      agReady: Boolean(window.agGrid),
      gridApi: null,
      statusRenderer,
    };
  },
  computed: {
    isAutoHeight() {
      return this.height === "auto";
    },
    gridWrapStyle() {
      return this.isAutoHeight ? {} : { minHeight: this.height };
    },
    gridStyle() {
      return this.isAutoHeight ? {} : { height: this.height };
    },
  },
  mounted() {
    this.mountGrid();
  },
  beforeUnmount() {
    if (this.gridApi && this.gridApi.destroy) {
      this.gridApi.destroy();
    }
  },
  watch: {
    rows: {
      handler() {
        this.refreshRows();
      },
      deep: true,
    },
    columns: {
      handler() {
        this.mountGrid();
      },
      deep: true,
    },
  },
  methods: {
    rowKey(row) {
      return row.id || row.assetId || row.alarmEventId || row.tagId || row.groupId || row.userId || JSON.stringify(row);
    },
    makeColumns() {
      const mapped = this.columns.map((col) => {
        const centeredColumn = this.isCenteredColumn(col);
        const leftAlignedColumn = col.align === "left";
        const wrappingColumn = /(note|description|tracking)/i.test(`${col.headerName || ""} ${col.field || ""}`);
        return {
          ...textFilter,
          ...col,
          minWidth: readableHeaderMinWidth(col),
          headerClass: [col.headerClass, centeredColumn ? "center-header" : ""].filter(Boolean).join(" "),
          cellClass: [
            col.cellClass,
            centeredColumn ? "center-cell" : "",
            leftAlignedColumn ? "left-cell" : "",
            col.cellRenderer === statusRenderer ? "status-cell" : "",
            isNumericColumn(col) ? "numeric-cell" : isTabularColumn(col) ? "tabular-cell" : "",
            wrappingColumn ? "wrap-cell" : "",
          ]
            .filter(Boolean)
            .join(" "),
          cellRenderer:
            col.cellRenderer === statusRenderer
              ? statusRenderer
              : isNumericColumn(col)
                ? tabularRenderer(col)
                : col.cellRenderer,
        };
      });
      if (!this.actions.length) return mapped;
      mapped.push({
        headerName: "Actions",
        field: "__actions",
        width: this.actionColumnWidth(),
        minWidth: this.actionColumnWidth(),
        filter: false,
        sortable: false,
        resizable: false,
        headerClass: "center-header",
        cellClass: "actions-cell center-cell",
        cellRenderer: () =>
          `<div class="ag-action-set">${this.actions
            .map((action, index) => `<button class="grid-action" type="button" data-action-index="${index}">${escapeHtml(this.actionLabel(action))}</button>`)
            .join("")}</div>`,
      });
      return mapped;
    },
    mountGrid() {
      if (!this.agReady || !this.$refs.gridEl) return;
      if (this.gridApi && this.gridApi.destroy) this.gridApi.destroy();
      const options = {
        theme: "legacy",
        rowData: this.rows,
        columnDefs: this.makeColumns(),
        defaultColDef: {
          sortable: true,
          filter: false,
          resizable: true,
          minWidth: this.compact ? 62 : 72,
          wrapHeaderText: true,
          autoHeaderHeight: false,
          suppressSizeToFit: false,
          tooltipValueGetter: (params) => params.valueFormatted ?? params.value,
        },
        animateRows: false,
        domLayout: this.isAutoHeight ? "autoHeight" : "normal",
        suppressColumnVirtualisation: true,
        rowHeight: this.compact ? 32 : 34,
        headerHeight: 34,
        suppressMenuHide: false,
        suppressHorizontalScroll: false,
        rowSelection: "single",
        onFirstDataRendered: () => this.fitColumns(),
        onRowDoubleClicked: (event) => this.$emit("row-open", event.data),
        onCellClicked: (event) => {
          const button = event.event.target.closest("[data-action-index]");
          if (!button) return;
          const action = this.actions[Number(button.dataset.actionIndex)];
          this.$emit("action", { action, row: event.data });
        },
      };
      if (window.agGrid.createGrid) {
        this.gridApi = window.agGrid.createGrid(this.$refs.gridEl, options);
      } else {
        new window.agGrid.Grid(this.$refs.gridEl, options);
        this.gridApi = options.api;
      }
      if (this.gridApi?.resetColumnState) this.gridApi.resetColumnState();
      this.refreshRows();
    },
    fitColumns() {
      if (!this.gridApi) return;
      nextTick(() => {
        if (!this.gridApi) return;
        // Fit the defined columns to the panel first so wide data sets stay
        // contained inside the page. If a table still exceeds its panel, AG
        // Grid keeps every column and exposes horizontal scrolling inside the
        // table instead of pushing the whole screen wider.
        if (this.gridApi.sizeColumnsToFit) {
          this.gridApi.sizeColumnsToFit();
        } else if (this.gridApi.autoSizeAllColumns) {
          this.gridApi.autoSizeAllColumns(false);
        }
      });
    },
    actionLabel(action) {
      const label = String(action?.label || "");
      return />\s*$/.test(label) ? label : `${label} >`;
    },
    actionColumnWidth() {
      const buttonWidths = this.actions.map((action) => Math.ceil(this.actionLabel(action).length * 6.3 + 24));
      const gaps = Math.max(0, this.actions.length - 1) * 6;
      return Math.max(108, buttonWidths.reduce((total, width) => total + Math.max(58, width), 20) + gaps);
    },
    refreshRows() {
      if (!this.gridApi) return;
      if (this.gridApi.setGridOption) {
        this.gridApi.setGridOption("rowData", this.rows);
      } else if (this.gridApi.setRowData) {
        this.gridApi.setRowData(this.rows);
      }
      nextTick(() => {
        this.fitColumns();
      });
    },
    cellClass(col, row) {
      if (!isNumericColumn(col)) return isTabularColumn(col) ? "tabular-display" : "";
      return formatTabularValue(row[col.field], col).overflow ? "overflow-warning" : "numeric-display";
    },
    fallbackHeaderClass(col) {
      return this.isCenteredColumn(col) ? "center-header" : "";
    },
    fallbackCellClass(col) {
      return [
        this.isCenteredColumn(col) ? "center-cell" : "",
        col.align === "left" ? "left-cell" : "",
        col.cellRenderer === statusRenderer ? "status-cell" : "",
        isNumericColumn(col) ? "numeric-cell" : isTabularColumn(col) ? "tabular-cell" : "",
        /(note|description|tracking)/i.test(`${col.headerName || ""} ${col.field || ""}`) ? "wrap-cell" : "",
      ]
        .filter(Boolean)
        .join(" ");
    },
    cellText(row, col) {
      return isNumericColumn(col) ? formatTabularValue(row[col.field], col).text : String(row[col.field] ?? "");
    },
    statusValue(row, col) {
      return statusColorClass(row[col.field]);
    },
    isCenteredColumn(col) {
      if (col.align === "left") return false;
      return col.align === "center" || col.cellRenderer === statusRenderer || isNumericColumn(col);
    },
  },
};

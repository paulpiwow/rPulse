import { GridTable } from "./GridTable.js";
import { data } from "../../data/index.js";

export const ExportFormatModal = {
  props: {
    open: { type: Boolean, default: false },
    title: { type: String, default: "Export Report" },
  },
  emits: ["close", "select"],
  template: `
    <div v-if="open" class="modal-layer" @click.self="$emit('close')">
      <div class="modal export-format-modal" role="dialog" aria-modal="true" :aria-label="title">
        <div class="modal-header">
          <h2>{{ title }}</h2>
          <button type="button" class="icon-button modal-close-button" aria-label="Close export options" @click="$emit('close')">x</button>
        </div>
        <div class="modal-body">
          <p class="modal-copy">Choose the file format for this report.</p>
          <div class="export-format-grid">
            <button type="button" class="export-format-option" @click="$emit('select', 'excel')">
              <strong>Excel</strong>
              <span>Formatted report workbook</span>
            </button>
            <button type="button" class="export-format-option" @click="$emit('select', 'csv')">
              <strong>CSV</strong>
              <span>Comma-separated data file</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
};

// GridTable wraps AG Grid Enterprise and also provides a plain table fallback
// for static-file review when the CDN is unavailable. All screen tables pass
// through this component so row height, status blocks, and numeric formatting
// stay consistent across the console.

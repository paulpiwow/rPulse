import { TableContext } from "./TableContext.js";
import { TrendChart } from "./TrendChart.js";

export const EditableTable = {
  props: {
    title: String,
    rows: { type: Array, default: () => [] },
    columns: { type: Array, default: () => [] },
    actions: { type: Array, default: () => [] },
    toolbarLabel: String,
    toolbarValue: String,
    toolbarOptions: { type: Array, default: () => [] },
    toolbarControls: { type: Array, default: () => [] },
    toolbarActions: { type: Array, default: () => [] },
    showUpdate: { type: Boolean, default: true },
    contextTitle: String,
    contextDescription: String,
    contextItems: { type: Array, default: () => [] },
  },
  emits: ["update-table", "cell-change", "action", "toolbar-change", "toolbar-action"],
  components: { TableContext },
  template: `
    <section class="panel editable-table-panel">
      <div class="panel-header">
        <h2>{{ title }}</h2>
        <div class="editable-table-actions">
          <label v-for="control in toolbarControls" :key="control.key" class="editable-table-toolbar-field">
            <span>{{ control.label }}</span>
            <input
              v-if="control.type === 'datetime-local'"
              type="datetime-local"
              :value="control.value"
              :min="control.min"
              :max="control.max"
              @change="$emit('toolbar-change', { key: control.key, value: $event.target.value })"
            />
            <select v-else :value="control.value" @change="$emit('toolbar-change', { key: control.key, value: $event.target.value })">
              <option v-for="option in control.options || []" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </label>
          <label v-if="toolbarOptions.length" class="editable-table-toolbar-field">
            <span>{{ toolbarLabel }}</span>
            <select :value="toolbarValue" @change="$emit('toolbar-change', $event.target.value)">
              <option v-for="option in toolbarOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </label>
          <button v-for="action in toolbarActions" :key="action.key" type="button" class="primary" @click="$emit('toolbar-action', action)">
            {{ action.label }}
          </button>
          <button v-for="action in actions" :key="action.key" type="button" class="primary" @click="$emit('action', action)">
            {{ action.label }}
          </button>
          <button v-if="showUpdate" type="button" class="primary" @click="$emit('update-table')">Update</button>
        </div>
      </div>
      <table-context
        :title="contextTitle"
        :description="contextDescription"
        :items="contextItems"
      />
      <div class="editable-table-scroll">
        <table class="editable-table">
        <thead>
          <tr>
            <th v-for="column in columns" :key="column.field" :class="column.className" :style="columnStyle(column)" :title="column.headerName">{{ column.headerName }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in rows" :key="row.__rowId || rowIndex">
            <td v-for="column in columns" :key="column.field" :class="column.className" :style="columnStyle(column)" :title="cellTitle(row, column)">
              <button
                v-if="column.type === 'button'"
                type="button"
                class="primary table-action-button"
                @click="$emit('action', { action: { key: column.actionKey, label: column.buttonLabel }, row, column })"
              >
                {{ column.buttonLabel }}
              </button>
              <select
                v-else-if="column.type === 'select'"
                v-model="row[column.field]"
                :aria-label="column.headerName"
                :disabled="column.readonly"
                @change="$emit('cell-change', { row, column })"
              >
                <option value=""></option>
                <option v-for="option in optionList(column, row)" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
              <input
                v-else
                v-model="row[column.field]"
                :aria-label="column.headerName"
                :class="column.type === 'numeric' ? 'numeric-input' : 'text-input'"
                :inputmode="column.type === 'numeric' ? 'decimal' : undefined"
                :readonly="column.readonly"
                @change="$emit('cell-change', { row, column })"
              />
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
  methods: {
    optionList(column, row) {
      return typeof column.options === "function" ? column.options(row, this.rows) : column.options || [];
    },
    columnStyle(column) {
      return {
        width: column.width || undefined,
        minWidth: column.minWidth || column.width || undefined,
      };
    },
    cellTitle(row, column) {
      return String(row[column.field] ?? column.buttonLabel ?? "");
    },
  },
};

// TrendChart owns all ECharts options so every plot is rendered by ECharts.
// The component listens for shell theme changes and repaints from CSS tokens.

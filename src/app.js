(function () {
  // rhoPulse is intentionally kept as a static Vue prototype for fast review.
  // Shared components below enforce the shell, grid, status, and measurement
  // rules so individual screens do not drift away from the Clean Shell standard.
  if (!window.Vue || !window.VueRouter) {
    document.getElementById("app").innerHTML = `
      <div class="boot-panel">
        <div class="boot-mark">&rho;Pulse</div>
        <div class="boot-text">Vue 3 and Vue Router could not load. Start a local server with internet access or install local dependencies.</div>
      </div>`;
    return;
  }

  const {
    createApp,
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    reactive,
    ref,
    watch,
  } = Vue;
  const { createRouter, createWebHashHistory, useRoute, useRouter } = VueRouter;
  const data = window.RPULSE_DATA;
  const themeState = reactive({
    darkMode: new URLSearchParams(window.location.search).get("theme") === "dark",
  });
  const plcTagTemplates = [
    { name: "Final Discharge Press", measurementType: "Pressure", unit: "PSI", samplingRate: "1 Hz" },
    { name: "Final Discharge Temp", measurementType: "Temperature", unit: "F", samplingRate: "1 Hz" },
    { name: "Engine Speed", measurementType: "Speed", unit: "RPM", samplingRate: "1 Hz" },
    { name: "Engine Load", measurementType: "Load", unit: "%", samplingRate: "1 Hz" },
    { name: "Compressor Oil Press", measurementType: "Pressure", unit: "PSI", samplingRate: "1 Hz" },
    { name: "Recycle Valve Position", measurementType: "Position", unit: "%", samplingRate: "20 Hz" },
    { name: "Suction Temp", measurementType: "Temperature", unit: "F", samplingRate: "300 Hz" },
    { name: "Cooler Fan Speed", measurementType: "Speed", unit: "RPM", samplingRate: "1 Hz" },
    { name: "Engine Vibration", measurementType: "Vibration", unit: "IPS", samplingRate: "1/min" },
    { name: "Compressor Vibration", measurementType: "Vibration", unit: "IPS", samplingRate: "1/min" },
  ];
  const fallbackSourceNames = data.dataSources?.map((source) => source.sourceName) || ["EMIT DCT Panel"];
  const mockPlcTags = Array.from({ length: 150 }, (_, index) => {
    const template = plcTagTemplates[index % plcTagTemplates.length];
    const bank = Math.floor(index / plcTagTemplates.length) + 1;
    const tagNumber = String(index + 1).padStart(3, "0");
    return {
      tagId: `PLC-TAG-${tagNumber}`,
      tagName: `${template.name} ${bank}`,
      kind: "Tag",
      dataSource: fallbackSourceNames[index % fallbackSourceNames.length],
      measurementType: template.measurementType,
      unit: template.unit,
      samplingRate: template.samplingRate,
      lastSync: "09:42",
      plot: true,
    };
  });
  const tagCatalog = [
    ...(Array.isArray(data.tagCatalog) && data.tagCatalog.length ? data.tagCatalog : mockPlcTags),
    ...data.tags.filter((tag) => tag.kind === "CTag"),
  ];
  const assetTagConnectionStorageKey = "rpulse-asset-tag-connections";
  const assetSourceKey = (machineName, sourceName) => `${String(machineName || "").trim()}::${String(sourceName || "").trim()}`;
  const defaultAssetTagConnections = () =>
    (data.dataSources || []).reduce((connections, source) => {
      const tagIds = tagCatalog
        .filter((tag) => tag.kind !== "CTag" && tag.dataSource === source.sourceName)
        .map((tag) => tag.tagId);
      if (tagIds.length) connections[assetSourceKey(source.machineName, source.sourceName)] = { tagIds, aliases: {} };
      return connections;
    }, {});
  const readAssetTagConnections = () => {
    const defaults = defaultAssetTagConnections();
    try {
      return { ...defaults, ...JSON.parse(window.localStorage.getItem(assetTagConnectionStorageKey) || "{}") };
    } catch (error) {
      return defaults;
    }
  };
  const writeAssetTagConnection = (machineName, sourceName, connection) => {
    const connections = readAssetTagConnections();
    connections[assetSourceKey(machineName, sourceName)] = connection;
    window.localStorage.setItem(assetTagConnectionStorageKey, JSON.stringify(connections));
  };

  if (window.agGrid && window.agGrid.LicenseManager && window.AG_GRID_LICENSE_KEY) {
    window.agGrid.LicenseManager.setLicenseKey(window.AG_GRID_LICENSE_KEY);
  }

  const textFilter = {
    sortable: true,
    filter: false,
    resizable: true,
  };

  // Numeric and time-like fields need fixed-width figures so times, decimals,
  // and IDs remain easy to scan in dense operations tables.
  const isNumericColumn = (col) => col.type === "numeric" || col.type === "measurement";

  const isTabularColumn = (col) => {
    if (isNumericColumn(col) || col.type === "time" || col.type === "date" || col.type === "tabular") return true;
    const name = `${col.headerName || ""} ${col.field || ""}`;
    return /(time|date|duration|update|created|occurred|check|sampling)/i.test(name);
  };

  const readableHeaderMinWidth = (col) => {
    const header = String(col.headerName || "");
    const headerWidth = Math.ceil(header.length * 6.1 + 24);
    return Math.max(col.minWidth || 0, Math.min(headerWidth, 136));
  };

  const statusColorClass = (value) => {
    const normalized = String(value || "").toLowerCase();
    if (normalized === "green" || normalized === "yellow" || normalized === "red") return normalized;
    if (/(baseline|deviation|pending|warning|unread)/i.test(normalized)) return "yellow";
    if (/(alarm|open|expired|fault|critical|high|blocked|not started)/i.test(normalized)) return "red";
    if (/(normal|active|acknowledged|enabled|closed|ok|resolved|reviewed)/i.test(normalized)) return "green";
    return normalized || "unknown";
  };

  // AG Grid status cells use color only. The text remains available as a title
  // attribute for accessibility, but the visible cell is the simple square block.
  const statusRenderer = (params) => {
    const value = String(params.value || "");
    const color = statusColorClass(value);
    const label = value || "Unknown";
    return `<span class="status-block ${color}" title="${escapeHtml(label)}"></span>`;
  };

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const splitValueAndUnit = (value) => {
    const text = String(value ?? "").trim();
    const match = text.match(/^([+-]?(?:\d+(?:\.\d+)?|\.\d+))(?:\s*)(.*)$/);
    if (!match) return { number: value, unit: "" };
    return { number: match[1], unit: match[2] || "" };
  };

  const formatNumber = (value, decimals) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return String(value ?? "");
    const source = String(value ?? "");
    const inferredDecimals = source.includes(".") ? source.split(".")[1].length : 0;
    const places = Number.isInteger(decimals) ? decimals : inferredDecimals;
    const normalized = Object.is(number, -0) ? 0 : number;
    return normalized.toFixed(places);
  };

  const formatTabularValue = (value, col = {}) => {
    let text = String(value ?? "");
    if (col.type === "numeric") {
      text = formatNumber(value, col.decimals);
    }
    if (col.type === "measurement") {
      const parsed = splitValueAndUnit(value);
      const formatted = formatNumber(parsed.number, col.decimals);
      const resolvedUnit = col.unit || parsed.unit;
      text = resolvedUnit ? `${formatted} ${resolvedUnit}` : formatted;
    }
    if (col.maxChars && text.length > col.maxChars) {
      return { text: "*".repeat(Math.max(3, col.maxChars)), overflow: true };
    }
    return { text, overflow: false };
  };

  const durationToken = (value) =>
    String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .replace(/^last/, "")
      .replace(/hours?$/, "h")
      .replace(/days?$/, "d");

  const durationKeyFromInput = (input, options, fallback) => {
    const token = durationToken(input);
    const match = options.find((option) => durationToken(option.value) === token || durationToken(option.label) === token);
    return match ? match.value : fallback;
  };

  const durationLabelFromInput = (input, options, fallback) => {
    const key = durationKeyFromInput(input, options, fallback);
    return options.find((option) => option.value === key)?.label || input;
  };

  const plotDurationOptions = [
    { label: "1 Hour", value: "1h" },
    { label: "2 Hours", value: "2h" },
    { label: "4 Hours", value: "4h" },
    { label: "8 Hours", value: "8h" },
    { label: "12 Hours", value: "12h" },
    { label: "24 Hours", value: "24h" },
    { label: "2 Days", value: "2d" },
    { label: "3 Days", value: "3d" },
  ];

  const plotDurationHours = (input, fallback = "8h") => {
    const key = durationKeyFromInput(input, plotDurationOptions, fallback);
    const match = String(key).match(/^(\d+)([hd])$/);
    if (!match) return 8;
    return Number(match[1]) * (match[2] === "d" ? 24 : 1);
  };

  const lookbackLabel = (hours, index, count) => {
    if (index === count - 1) return "Now";
    const remaining = hours - (hours * index) / Math.max(1, count - 1);
    if (remaining < 1) return `-${Math.round(remaining * 60)}m`;
    return Number.isInteger(remaining) ? `-${remaining}h` : `-${remaining.toFixed(1)}h`;
  };

  const safeFileSegment = (value) =>
    String(value || "rpulse-report")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "rpulse-report";

  const csvEscape = (value) => {
    const text = String(value ?? "");
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const rowsToCsv = (rows, columns) => {
    const fields =
      columns?.length
        ? columns.map((column) => ({ key: column.field, label: column.headerName || column.label || column.field }))
        : Object.keys(rows[0] || {}).map((key) => ({ key, label: key }));
    const header = fields.map((field) => csvEscape(field.label)).join(",");
    const body = rows.map((row) => fields.map((field) => csvEscape(row[field.key])).join(","));
    return [header, ...body].join("\r\n");
  };

  const downloadTextFile = (fileBase, content, mime = "text/plain;charset=utf-8") => {
    const filename = fileBase.includes(".") ? fileBase : `${safeFileSegment(fileBase)}.txt`;
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    return filename;
  };

  const exportRowsAsCsv = (fileBase, rows, columns) =>
    downloadTextFile(`${safeFileSegment(fileBase)}.csv`, rowsToCsv(rows, columns), "text/csv;charset=utf-8");

  const reportRowsForExport = (title, sections) => {
    const rows = [
      { Section: "Report", Record: "", Field: "Title", Value: title },
      { Section: "Report", Record: "", Field: "Generated", Value: new Date().toLocaleString() },
    ];
    sections.forEach((section) => {
      (section.rows || []).forEach((row, index) => {
        if (row && "label" in row && "value" in row) {
          rows.push({ Section: section.title, Record: "", Field: row.label, Value: row.value });
          return;
        }
        Object.entries(row || {}).forEach(([key, value]) => {
          rows.push({ Section: section.title, Record: index + 1, Field: key, Value: value });
        });
      });
    });
    return rows;
  };

  const exportReportAsCsv = (fileBase, title, sections) =>
    exportRowsAsCsv(fileBase, reportRowsForExport(title, sections), [
      { field: "Section", headerName: "Section" },
      { field: "Record", headerName: "Record" },
      { field: "Field", headerName: "Field" },
      { field: "Value", headerName: "Value" },
    ]);

  const sectionRowsAsHtml = (rows = []) => {
    if (!rows.length) return `<tr><td>No rows</td></tr>`;
    const labelValueRows = rows.every((row) => row && "label" in row && "value" in row);
    const fields = labelValueRows
      ? ["label", "value"]
      : Array.from(rows.reduce((set, row) => {
          Object.keys(row || {}).forEach((key) => set.add(key));
          return set;
        }, new Set()));
    const headerLabel = (field) => ({ label: "Field", value: "Value" }[field] || field);
    const header = `<tr>${fields.map((field) => `<th>${escapeHtml(headerLabel(field))}</th>`).join("")}</tr>`;
    const body = rows
      .map((row) => `<tr>${fields.map((field) => `<td>${escapeHtml(row?.[field] ?? "")}</td>`).join("")}</tr>`)
      .join("");
    return `${header}${body}`;
  };

  const exportReportAsExcel = (fileBase, title, sections) => {
    const sectionTables = sections
      .map(
        (section) => `
          <h2>${escapeHtml(section.title)}</h2>
          <table>${sectionRowsAsHtml(section.rows || [])}</table>`
      )
      .join("");
    const workbook = `\ufeff<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; color: #111827; }
            h1 { font-size: 18px; margin: 0 0 6px; }
            h2 { font-size: 14px; margin: 18px 0 6px; }
            p { margin: 0 0 14px; color: #475569; }
            table { border-collapse: collapse; margin-bottom: 14px; }
            th { background: #e8edf4; font-weight: 700; }
            th, td { border: 1px solid #aeb8c6; padding: 6px 8px; mso-number-format: "\\@"; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(title)}</h1>
          <p>Generated: ${escapeHtml(new Date().toLocaleString())}</p>
          ${sectionTables}
        </body>
      </html>`;
    return downloadTextFile(`${safeFileSegment(fileBase)}.xls`, workbook, "application/vnd.ms-excel;charset=utf-8");
  };

  const trendRowsForExport = (times, series, selected = []) => {
    const selectedNames = selected.length ? selected : series.map((line) => line.name);
    const visibleSeries = series.filter((line) => selectedNames.includes(line.name));
    return times.map((time, index) =>
      visibleSeries.reduce(
        (row, line) => {
          row[`${line.name}${line.unit ? ` (${line.unit})` : ""}`] = line.data[index] ?? "";
          return row;
        },
        { Time: time }
      )
    );
  };

  const trendPalette = ["#3b82f6", "#ea580c", "#6d28d9", "#059669", "#be185d", "#16a34a", "#0284c7", "#a855f7"];

  const lineNameForTag = (tag) => tag?.tagName || tag?.tagId || "Unmapped Tag";

  const trendIndexesForHours = (hours) => {
    const total = data.trendMinuteTimes?.length || 0;
    if (!total) return [];
    const windowPoints = Math.min(total, Math.max(2, Math.round(hours * 60)));
    const start = Math.max(0, total - windowPoints);
    const maxPoints = hours <= 2 ? 121 : hours <= 12 ? 181 : hours <= 24 ? 241 : 361;
    const step = Math.max(1, Math.ceil(windowPoints / Math.max(2, maxPoints - 1)));
    const indexes = [];
    for (let index = start; index < total; index += step) indexes.push(index);
    if (indexes[indexes.length - 1] !== total - 1) indexes.push(total - 1);
    return indexes;
  };

  const ctagSeriesValues = (tag) => {
    const sourceTagIds = String(tag?.sourceTagIds || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    const sourceSeries = sourceTagIds.map((tagId) => data.influx?.seriesByTagId?.[tagId]).filter((series) => Array.isArray(series));
    if (!sourceSeries.length) return [];
    const expression = String(tag.expression || tag.calculationType || "").toLowerCase();
    return sourceSeries[0].map((_, index) => {
      const values = sourceSeries.map((series) => Number(series[index] ?? 0));
      if (/standarddeviation|standard deviation/.test(expression)) {
        const mean = values.reduce((total, value) => total + value, 0) / values.length;
        const variance = values.reduce((total, value) => total + Math.pow(value - mean, 2), 0) / values.length;
        return Number(Math.sqrt(variance).toFixed(2));
      }
      if (expression.includes("/") && values.length >= 2) return Number((values[0] / Math.max(values[1], 0.0001)).toFixed(2));
      if (expression.includes("-") && values.length >= 2) return Number(values.slice(1).reduce((total, value) => total - value, values[0]).toFixed(2));
      return Number(values.reduce((total, value) => total + value, 0).toFixed(2));
    });
  };

  const trendValuesForTag = (tag) => {
    if (!tag) return [];
    const directSeries = data.influx?.seriesByTagId?.[tag.tagId];
    if (Array.isArray(directSeries)) return directSeries;
    return ctagSeriesValues(tag);
  };

  const quantileValue = (values, percent) => {
    if (!values.length) return null;
    const sorted = [...values].sort((left, right) => left - right);
    const position = (sorted.length - 1) * percent;
    const lower = Math.floor(position);
    const upper = Math.ceil(position);
    if (lower === upper) return sorted[lower];
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
  };

  const baselineStatsForValues = (values) => {
    const numericValues = values.map(Number).filter(Number.isFinite);
    if (!numericValues.length) return null;
    const baseline = numericValues.reduce((total, value) => total + value, 0) / numericValues.length;
    const variance = numericValues.reduce((total, value) => total + (value - baseline) ** 2, 0) / numericValues.length;
    return {
      low: quantileValue(numericValues, 0.1),
      baseline,
      high: quantileValue(numericValues, 0.9),
      stdDev: Math.sqrt(variance),
      sampleCount: numericValues.length,
    };
  };

  const baselineStatsForTagWindow = (tag, hours) => {
    const values = trendValuesForTag(tag).map(Number).filter(Number.isFinite);
    if (!values.length) return null;
    const pointCount = Math.min(values.length, Math.max(2, Math.round(hours * 60)));
    return baselineStatsForValues(values.slice(values.length - pointCount));
  };

  const trendForTags = (tags, hours, alarmTagIds = new Set()) => {
    const indexes = trendIndexesForHours(hours);
    return {
      times: indexes.map((valueIndex, index) => data.trendMinuteTimes?.[valueIndex] || lookbackLabel(hours, index, indexes.length)),
      series: tags
        .map((tag, index) => {
          const values = trendValuesForTag(tag);
          if (!values.length) return null;
          const baseColor = tag.color || data.tagColors?.[tag.tagId];
          return {
            tagId: tag.tagId,
            name: lineNameForTag(tag),
            unit: tag.unit || "",
            data: indexes.map((valueIndex) => values[valueIndex] ?? null),
            color: baseColor || trendPalette[index % trendPalette.length],
            alarmAssociated: alarmTagIds.has(tag.tagId),
            dataSource: tag.dataSource || "",
          };
        })
        .filter(Boolean),
    };
  };

  const trendWindowSeries = (series, drift) =>
    series.map((line) => ({
      ...line,
      data: line.data.map((value, index, values) => {
        const number = Number(value);
        if (!Number.isFinite(number) || /(baseline|mean|limit|std dev|high|low)/i.test(line.name)) return value;
        const progress = values.length <= 1 ? 1 : index / (values.length - 1);
        const offset = (1 - progress) * drift * Math.max(1, Math.abs(number) * 0.08);
        const adjusted = number - offset;
        const places = Math.abs(number) < 1 || String(value).includes(".") ? 2 : 0;
        return Number(adjusted.toFixed(places));
      }),
    }));

  const tabularRenderer = (col) => (params) => {
    const formatted = formatTabularValue(params.value, col);
    const className = formatted.overflow ? "overflow-warning" : "numeric-display";
    return `<span class="${className}">${escapeHtml(formatted.text)}</span>`;
  };

  const DurationInput = {
    props: {
      modelValue: { type: String, default: "" },
      label: { type: String, default: "Duration" },
      options: { type: Array, default: () => [] },
      listId: { type: String, default: "duration-options" },
    },
    emits: ["update:modelValue", "commit"],
    template: `
      <label class="duration-control">
        <span v-if="label">{{ label }}</span>
        <select
          v-if="options.length"
          class="duration-input"
          :value="modelValue"
          @change="handleSelectChange"
        >
          <option v-for="option in options" :key="option.value" :value="option.label">{{ option.label }}</option>
        </select>
        <input
          v-else
          class="duration-input text-input"
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          @blur="$emit('commit')"
          @keydown.enter.prevent="$emit('commit')"
        />
      </label>
    `,
    methods: {
      handleSelectChange(event) {
        this.$emit("update:modelValue", event.target.value);
        this.$emit("commit");
      },
    },
  };

  // Header and shell status indicator. Like the grid status renderer, this can
  // be rendered as color-only when the label prop is intentionally blank.
  const StatusBadge = {
    props: ["value", "label"],
    template: `
      <span :class="['status-badge', normalized]">
        <span></span><template v-if="label !== ''">{{ label || displayLabel }}</template>
      </span>
    `,
    computed: {
      normalized() {
        return String(this.value || "unknown").toLowerCase();
      },
      displayLabel() {
        const text = String(this.value || "unknown");
        return text.charAt(0).toUpperCase() + text.slice(1);
      },
    },
  };

  const TableContext = {
    props: {
      title: String,
      description: String,
      items: { type: Array, default: () => [] },
    },
    template: `
      <div class="table-context" v-if="visibleItems.length">
        <dl v-if="visibleItems.length" class="table-context-meta">
          <div v-for="item in visibleItems" :key="item.label">
            <dt>{{ item.label }}</dt>
            <dd>{{ item.value }}</dd>
          </div>
        </dl>
      </div>
    `,
    computed: {
      visibleItems() {
        return this.items.filter((item) => item && item.label && item.value !== undefined && item.value !== null && item.value !== "");
      },
    },
  };

  const ExportFormatModal = {
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
  const GridTable = {
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

  const EditableTable = {
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
  const TrendChart = {
    props: {
      title: String,
      times: { type: Array, default: () => [] },
      series: { type: Array, default: () => [] },
      selected: { type: Array, default: () => [] },
      height: { type: String, default: "360px" },
      showLegend: { type: Boolean, default: true },
      showSymbols: { type: Boolean, default: false },
      smooth: { type: Boolean, default: true },
      showDataZoom: { type: Boolean, default: true },
      gridTop: { type: Number, default: 58 },
      gridBottom: { type: Number, default: 36 },
      yMin: { type: Number, default: null },
      yMax: { type: Number, default: null },
      yInterval: { type: Number, default: null },
    },
    template: `
      <div class="trend-surface" :style="{ height }">
        <div ref="chartEl" class="trend-chart"></div>
        <div v-if="chartNotice" class="trend-notice">{{ chartNotice }}</div>
      </div>
    `,
    data() {
      return {
        chart: null,
        chartNotice: "",
      };
    },
    computed: {
      visibleSeries() {
        if (!this.selected.length) return this.series;
        return this.series.filter((item) => this.selected.includes(item.name));
      },
    },
    mounted() {
      this.mountChart();
      window.addEventListener("resize", this.resize);
      window.addEventListener("rpulse-theme-change", this.renderChart);
    },
    beforeUnmount() {
      window.removeEventListener("resize", this.resize);
      window.removeEventListener("rpulse-theme-change", this.renderChart);
      if (this.chart) this.chart.dispose();
    },
    watch: {
      title: "renderChart",
      selected: { handler: "renderChart", deep: true },
      times: { handler: "renderChart", deep: true },
      series: { handler: "renderChart", deep: true },
      showLegend: "renderChart",
      showSymbols: "renderChart",
      smooth: "renderChart",
      showDataZoom: "renderChart",
    },
    methods: {
      mountChart() {
        if (!window.echarts) {
          this.chartNotice = "ECharts is required for chart display.";
          return;
        }
        if (!this.$refs.chartEl) return;
        this.chartNotice = "";
        this.chart = window.echarts.init(this.$refs.chartEl);
        this.renderChart();
      },
      renderChart() {
        if (!this.chart) return;
        const css = getComputedStyle(this.$refs.chartEl);
        const token = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
        const chartBg = token("--chart-bg", "#ffffff");
        const chartInk = token("--field-ink", "#263246");
        const chartAxis = token("--chart-axis", "#8e99ad");
        const chartAxisText = token("--chart-axis-text", chartInk);
        const chartGrid = token("--chart-grid", "rgba(38, 50, 70, .16)");
        const chartTooltipBg = token("--chart-tooltip-bg", "rgba(15, 23, 42, .92)");
        const chartTooltipBorder = token("--chart-tooltip-border", "rgba(148, 163, 184, .35)");
        const chartTooltipText = token("--chart-tooltip-text", "#f8fafc");
        const chartSliderBg = token("--chart-slider-bg", "#f8fafc");
        const chartSliderBorder = token("--chart-slider-border", "#d7dce6");
        const chartSliderFill = token("--chart-slider-fill", "rgba(11, 99, 229, .14)");
        const chartSliderHandle = token("--chart-slider-handle", "#ffffff");
        const chartSliderHandleBorder = token("--chart-slider-handle-border", "#0b63e5");
        const visibleSeries = this.visibleSeries;
        const axisKeys = [...new Set(visibleSeries.map((item) => item.unit || ""))];
        const usesMixedUnits = axisKeys.length > 1;
        const parsedTimes = this.times.map((value) => Date.parse(value)).filter((value) => Number.isFinite(value));
        const isTimeAxis = parsedTimes.length > 0;
        const timeSpanMs = isTimeAxis && parsedTimes.length > 1 ? parsedTimes[parsedTimes.length - 1] - parsedTimes[0] : 0;
        const isMultiDayAxis = timeSpanMs >= 48 * 60 * 60 * 1000;
        const seriesUnitByName = new Map(visibleSeries.map((item) => [item.name, item.unit || ""]));
        const tooltipDateFormatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
        const compactTimeFormatter = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
        const hourFormatter = new Intl.DateTimeFormat(undefined, { hour: "numeric" });
        const dayHourFormatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric" });
        const xAxisLabelText = (value) => {
          if (!isTimeAxis) return String(value ?? "");
          const date = new Date(value);
          if (isMultiDayAxis) return dayHourFormatter.format(date).replace(", ", "\n");
          if (timeSpanMs >= 12 * 60 * 60 * 1000) return hourFormatter.format(date);
          return compactTimeFormatter.format(date);
        };
        const valueText = (value, unit) => {
          const number = Number(value);
          if (!Number.isFinite(number)) return String(value ?? "");
          const decimals = unit === "RPM" || unit === "Min" || unit === "state" ? 0 : Math.abs(number) < 10 ? 2 : 1;
          return `${formatNumber(number, decimals)}${unit ? ` ${unit}` : ""}`;
        };
        const hasTitle = Boolean(this.title);
        const legendTop = hasTitle ? 38 : 12;
        const resolvedGridTop = Math.max(
          this.gridTop,
          hasTitle && this.showLegend ? 86 : hasTitle ? 62 : this.showLegend ? 54 : 28
        );
        const resolvedGridBottom = this.showDataZoom ? Math.max(this.gridBottom, isMultiDayAxis ? 88 : 72) : this.gridBottom;
        const yAxes = axisKeys.map((unit, index) => ({
          type: "value",
          name: unit,
          nameGap: 12,
          nameTextStyle: { color: chartAxisText, fontSize: 10, fontWeight: 600 },
          position: usesMixedUnits && index > 0 ? "right" : "left",
          offset: usesMixedUnits && index > 1 ? (index - 1) * 54 : 0,
          min: this.yMin ?? undefined,
          max: this.yMax ?? undefined,
          interval: this.yInterval ?? undefined,
          scale: this.yMin === null && this.yMax === null,
          axisTick: { show: false },
          axisLine: { lineStyle: { color: chartAxis } },
          splitLine: { show: index === 0, lineStyle: { color: chartGrid, type: "dashed" } },
          axisLabel: { color: chartAxisText },
        }));
        this.chart.setOption({
          animation: false,
          backgroundColor: chartBg,
          color: visibleSeries.map((item) => item.color),
          textStyle: { fontFamily: "Inter, Segoe UI, Arial, sans-serif", color: chartInk },
          title: {
            show: Boolean(this.title),
            text: this.title,
            left: 16,
            top: 12,
            textStyle: { color: chartInk, fontSize: 14, fontWeight: 600 },
          },
          tooltip: {
            trigger: "axis",
            axisPointer: { type: "cross", lineStyle: { color: chartAxis, width: 1, type: "dashed" } },
            backgroundColor: chartTooltipBg,
            borderColor: chartTooltipBorder,
            textStyle: { color: chartTooltipText, fontSize: 12 },
            extraCssText: "box-shadow: 0 12px 30px rgba(15, 23, 42, .22);",
            formatter: (params) => {
              const rows = Array.isArray(params) ? params : [params];
              const axisValue = rows[0]?.axisValue ?? (Array.isArray(rows[0]?.value) ? rows[0].value[0] : rows[0]?.value);
              const heading = isTimeAxis && Number.isFinite(Date.parse(axisValue))
                ? tooltipDateFormatter.format(new Date(axisValue))
                : String(axisValue ?? "");
              const body = rows
                .map((param) => {
                  const rawValue = Array.isArray(param.value) ? param.value[1] : param.value;
                  const unit = seriesUnitByName.get(param.seriesName) || "";
                  return `<div class="chart-tooltip-row">${param.marker}<span>${escapeHtml(param.seriesName)}</span><strong>${escapeHtml(valueText(rawValue, unit))}</strong></div>`;
                })
                .join("");
              return `<div class="chart-tooltip-title">${escapeHtml(heading)}</div>${body}`;
            },
          },
          legend: {
            show: this.showLegend,
            type: "scroll",
            top: legendTop,
            left: 16,
            right: 16,
            height: 28,
            itemWidth: 18,
            itemHeight: 9,
            pageIconSize: 10,
            textStyle: { color: chartAxisText, fontSize: 11 },
            pageTextStyle: { color: chartAxisText, fontSize: 10 },
            selectedMode: "multiple",
          },
          grid: {
            left: 58,
            right: usesMixedUnits ? 78 + Math.max(0, axisKeys.length - 2) * 54 : 24,
            top: resolvedGridTop,
            bottom: resolvedGridBottom,
          },
          xAxis: {
            type: isTimeAxis ? "time" : "category",
            data: isTimeAxis ? undefined : this.times,
            min: isTimeAxis ? parsedTimes[0] : undefined,
            max: isTimeAxis ? parsedTimes[parsedTimes.length - 1] : undefined,
            splitNumber: isTimeAxis ? (isMultiDayAxis ? 5 : 7) : undefined,
            minInterval: isTimeAxis ? (isMultiDayAxis ? 6 * 60 * 60 * 1000 : 30 * 60 * 1000) : undefined,
            boundaryGap: false,
            axisTick: { show: false },
            axisLine: { lineStyle: { color: chartAxis } },
            axisLabel: {
              color: chartAxisText,
              fontSize: 10,
              lineHeight: 14,
              margin: 10,
              hideOverlap: true,
              formatter: isTimeAxis ? xAxisLabelText : undefined,
            },
            splitLine: { show: true, lineStyle: { color: chartGrid, type: "dashed" } },
          },
          yAxis: yAxes.length ? yAxes : [{
            type: "value",
            scale: true,
            axisTick: { show: false },
            axisLine: { lineStyle: { color: chartAxis } },
            splitLine: { lineStyle: { color: chartGrid, type: "dashed" } },
            axisLabel: { color: chartAxisText },
          }],
          dataZoom: this.showDataZoom
            ? [
                {
                  type: "inside",
                  xAxisIndex: 0,
                  filterMode: "none",
                  zoomOnMouseWheel: true,
                  moveOnMouseMove: false,
                  moveOnMouseWheel: true,
                  throttle: 16,
                },
                {
                  type: "slider",
                  xAxisIndex: 0,
                  filterMode: "none",
                  bottom: 14,
                  height: 28,
                  showDetail: false,
                  borderColor: chartSliderBorder,
                  fillerColor: chartSliderFill,
                  backgroundColor: chartSliderBg,
                  dataBackground: {
                    lineStyle: { color: chartAxis },
                    areaStyle: { color: "rgba(148, 163, 184, .18)" },
                  },
                  selectedDataBackground: { areaStyle: { color: chartSliderFill } },
                  handleStyle: { color: chartSliderHandle, borderColor: chartSliderHandleBorder },
                  moveHandleStyle: { color: chartSliderHandleBorder, opacity: 0.3 },
                },
              ]
            : [],
          series: visibleSeries.map((item) => {
            const lineData = isTimeAxis ? item.data.map((value, index) => [this.times[index], value]) : item.data;
            return {
              name: item.name,
              type: "line",
              yAxisIndex: Math.max(0, axisKeys.indexOf(item.unit || "")),
              smooth: item.baselineLine ? false : (item.smooth ?? this.smooth),
              showSymbol: item.baselineLine ? false : (item.showSymbol ?? this.showSymbols),
              symbol: item.baselineLine ? "none" : "circle",
              symbolSize: 7,
              sampling: isTimeAxis ? "lttb" : undefined,
              data: lineData,
              lineStyle: {
                width: item.width ?? (item.baselineLine ? 2 : 2.2),
                type: item.lineType || "solid",
                opacity: item.opacity ?? 1,
              },
              itemStyle: { color: item.color },
              markLine: item.markLines?.length
                ? {
                    symbol: ["none", "none"],
                    silent: true,
                    label: { color: chartAxisText, fontSize: 10, formatter: "{b}" },
                    lineStyle: { color: chartAxis, width: 1.4, type: "solid" },
                    data: item.markLines.map((line) => ({
                      name: line.name,
                      xAxis: line.xAxis,
                      lineStyle: { color: line.color || chartAxis, type: line.lineType || "solid", width: line.width || 1.4 },
                      label: { formatter: line.label || line.name, color: line.color || chartAxisText },
                    })),
                  }
                : undefined,
              markArea: item.markAreas?.length
                ? {
                    silent: true,
                    label: { show: false },
                    itemStyle: { color: item.markAreaColor || "rgba(194, 65, 12, 0.12)" },
                    data: item.markAreas.map((area) => [
                      { name: area.name || "Out of Baseline", xAxis: area.start },
                      { xAxis: area.end },
                    ]),
                  }
                : undefined,
            };
          }),
        }, true);
      },
      resize() {
        if (this.chart) this.chart.resize();
      },
    },
  };

  // ActionModal covers the workflow states that branch from tables without
  // adding extra shell navigation entries: assign, notify, acknowledge/track.
  const ActionModal = {
    props: ["open", "title", "mode", "row"],
    emits: ["close", "assigned", "acknowledged", "sent"],
    data() {
      return {
        assignee: data.users[1]?.userName || data.users[0]?.userName || "Operator",
        note: "",
        group: data.groups[0]?.groupName || "Response Group",
        users: data.users,
        groups: data.groups,
      };
    },
    template: `
      <div v-if="open" class="modal-layer" role="dialog" aria-modal="true">
        <div class="modal">
          <header class="modal-header">
            <h2>{{ title }}</h2>
            <button type="button" class="icon-button" aria-label="Close" @click="$emit('close')">x</button>
          </header>
          <div v-if="mode === 'assign'" class="modal-body">
            <p class="modal-copy">Assignment is required before acknowledgement. Assign responsibility to yourself or another owner before acknowledging this alarm.</p>
            <div class="field-grid two">
              <label>
                <span>Alarm</span>
                <input :value="row?.alarmName || 'Selected alarm'" disabled />
              </label>
              <label>
                <span>Assign To</span>
                <select v-model="assignee">
                  <option v-for="user in users" :key="user.userId">{{ user.userName }}</option>
                </select>
              </label>
              <label class="wide">
                <span>Assignment Note</span>
                <textarea v-model="note" rows="3" placeholder="Corrective responsibility before acknowledgement"></textarea>
              </label>
            </div>
            <div class="modal-actions">
              <button type="button" class="secondary" @click="$emit('close')">Cancel</button>
              <button type="button" class="primary" @click="$emit('assigned', { assignee, note })">Assign User</button>
            </div>
          </div>
          <div v-else-if="mode === 'notify'" class="modal-body">
            <div class="field-grid two">
              <label>
                <span>Target Group</span>
                <select v-model="group">
                  <option v-for="item in groups" :key="item.groupId">{{ item.groupName }}</option>
                </select>
              </label>
              <label>
                <span>Delivery</span>
                <input value="Email and SMS where configured" disabled />
              </label>
              <label class="wide">
                <span>Message</span>
                <textarea v-model="note" rows="3" placeholder="Add context for this notification"></textarea>
              </label>
            </div>
            <div class="modal-actions">
              <button type="button" class="secondary" @click="$emit('close')">Cancel</button>
              <button type="button" class="primary" @click="$emit('sent', { group, note })">Send Notification</button>
            </div>
          </div>
          <div v-else class="modal-body">
            <p class="modal-copy">The selected action completed. Tracking is now available for follow-up ownership.</p>
            <div class="modal-actions">
              <button type="button" class="primary" @click="$emit('acknowledged')">Open Tracking</button>
            </div>
          </div>
        </div>
      </div>
    `,
  };

  // ScreenHeader provides the in-field breadcrumb trail and screen-level action
  // area. The breadcrumb map mirrors the permitted shell tree.
  const ScreenHeader = {
    props: ["title", "subtitle", "status", "actions"],
    components: { StatusBadge },
    emits: ["action"],
    setup() {
      return { themeState };
    },
    computed: {
      visibleActions() {
        return this.actions || [];
      },
      crumbs() {
        const routeName = this.$route.name;
        const map = {
          "site-status": [{ label: "Operate", route: "site-status" }, { label: "Site Status" }],
          "active-alarms": [{ label: "Operate", route: "site-status" }, { label: "Active Alarms" }],
          "asset-alarm-detail": [
            { label: "Operate", route: "site-status" },
            { label: "Active Alarms", route: "active-alarms" },
            { label: "Asset Alarm Detail" },
          ],
          "alarm-data-trends": [
            { label: "Operate", route: "site-status" },
            { label: "Active Alarms", route: "active-alarms" },
            { label: "Asset Alarm Detail", route: "asset-alarm-detail" },
            { label: "Alarm Data Trends" },
          ],
          "alarm-history": [{ label: "Operate", route: "site-status" }, { label: "Alarm History" }],
          "alarm-history-detail": [
            { label: "Operate", route: "site-status" },
            { label: "Alarm History", route: "alarm-history" },
            { label: "Alarm History Detail" },
          ],
          "baseline-deviations": [{ label: "Operate", route: "site-status" }, { label: "Maintenance Warnings" }],
          "data-deviation-trends": [
            { label: "Operate", route: "site-status" },
            { label: "Maintenance Warnings", route: "baseline-deviations" },
            { label: "Maintenance Warning Trend" },
          ],
          "asset-inventory": [{ label: "Configure", route: "asset-inventory" }, { label: "Assets" }],
          "asset-configuration": [
            { label: "Configure", route: "asset-inventory" },
            { label: "Assets", route: "asset-inventory" },
            { label: "Asset Configuration" },
          ],
          "connect-tags": [
            { label: "Configure", route: "asset-inventory" },
            { label: "Assets", route: "asset-inventory" },
            { label: "Asset Configuration", route: "asset-configuration" },
            { label: "Connect Tags" },
          ],
          "alarm-list": [{ label: "Configure", route: "asset-inventory" }, { label: "Alarms" }],
          "alarm-configuration": [
            { label: "Configure", route: "asset-inventory" },
            { label: "Alarms", route: "alarm-list" },
            { label: "Alarm Configuration" },
          ],
          "group-list": [{ label: "Configure", route: "asset-inventory" }, { label: "Groups" }],
          "group-configuration": [
            { label: "Configure", route: "asset-inventory" },
            { label: "Groups", route: "group-list" },
            { label: "Group Configuration" },
          ],
          "license-management": [{ label: "Admin", route: "license-management" }, { label: "Application" }],
          "renewal-workflow": [
            { label: "Admin", route: "license-management" },
            { label: "Application", route: "license-management" },
            { label: "Renewal Workflow" },
          ],
          "user-admin": [{ label: "Admin", route: "license-management" }, { label: "Users" }],
          "edit-user": [
            { label: "Admin", route: "license-management" },
            { label: "Users", route: "user-admin" },
            { label: "Edit User" },
          ],
          "message-center": [{ label: "Admin", route: "license-management" }, { label: "Messages" }],
        };
        return map[routeName] || [];
      },
    },
    methods: {
      toggleDarkMode() {
        themeState.darkMode = !themeState.darkMode;
      },
    },
    template: `
      <header class="screen-header">
        <div class="breadcrumb-row">
          <nav class="sub-breadcrumbs" aria-label="Screen breadcrumb">
            <template v-for="(crumb, index) in crumbs" :key="crumb.label">
              <router-link v-if="crumb.route" :to="{ name: crumb.route }">{{ crumb.label }}</router-link>
              <span v-else>{{ crumb.label }}</span>
              <i v-if="index < crumbs.length - 1">></i>
            </template>
          </nav>
          <button type="button" class="theme-toggle" :aria-pressed="themeState.darkMode" @click="toggleDarkMode">
            <span class="toggle-track" aria-hidden="true"><span class="toggle-thumb"></span></span>
            <span>Dark Mode</span>
          </button>
        </div>
        <div v-if="visibleActions.length" class="screen-actions">
          <button v-for="action in visibleActions" :key="action.key" type="button" :class="action.kind || 'secondary'" @click="$emit('action', action)">
            {{ action.label }}
          </button>
        </div>
      </header>
    `,
  };

  const MatrixPanel = {
    components: { GridTable },
    template: `
      <section class="panel">
        <div class="panel-header">
          <h2>Interaction Matrix Watchlist</h2>
          <span class="panel-note">Routes and modal states derived from the latest matrix</span>
        </div>
        <grid-table :rows="rows" :columns="columns" height="260px" compact />
      </section>
    `,
    setup() {
      return {
        rows: data.screenMatrix.map(([from, action, to]) => ({ from, action, to })),
        columns: [
          { headerName: "From Screen", field: "from", flex: 1 },
          { headerName: "Action", field: "action", flex: 1 },
          { headerName: "To Screen / State", field: "to", flex: 1 },
        ],
      };
    },
  };

  const LoginScreen = {
    template: `
      <main class="login-screen">
        <section class="login-panel">
          <div class="login-brand">
            <img class="login-logo" src="./src/assets/rpulse-logo.png" alt="rhoPulse" />
          </div>
          <div class="login-status-stack">
            <div class="login-status">
              <status-badge value="green" label="Site Status" />
              <span>{{ shell.siteName }}</span>
            </div>
            <div class="login-status">
              <status-badge value="green" label="Application Connection Status" />
              <span>Connected</span>
            </div>
          </div>
          <h1>Login</h1>
          <div class="field-stack">
            <label>
              <span>User</span>
              <input value="user" />
            </label>
            <label>
              <span>Password</span>
              <input type="password" value="password" />
            </label>
          </div>
          <button type="button" class="primary block" @click="$router.push({ name: 'site-status' })">Authenticate</button>
        </section>
      </main>
    `,
    components: { StatusBadge },
    setup() {
      return { shell: data.shell };
    },
  };

  const SiteStatus = {
    components: { ScreenHeader, GridTable, TrendChart, DurationInput },
    template: `
      <div class="screen">
        <screen-header
          title="Site Status"
          subtitle="Asset health by active alarms and maintenance warning state"
          status="green"
        />
        <section class="panel site-status-summary-card">
          <div class="site-status-titlebar">
            <h2>Site Status</h2>
            <div class="site-kpi-line" aria-label="Site status summary">
              <span>Assets: <strong>{{ kpis.assets }}</strong></span>
              <i></i>
              <span>Active Alarms: <strong>{{ kpis.activeAlarms }}</strong></span>
              <i></i>
              <span>Maintenance Warnings: <strong>{{ kpis.deviations }}</strong></span>
            </div>
          </div>
        </section>
        <section class="panel site-table-panel">
          <div class="site-table-section">
            <table-context
              title="Asset status table"
              description="Rows show current health, alarm counts, and maintenance warning counts by asset."
              :items="[
                { label: 'Assets', value: kpis.assets },
                { label: 'Active Alarms', value: kpis.activeAlarms },
                { label: 'Warnings', value: kpis.deviations }
              ]"
            />
            <grid-table :rows="rows" :columns="columns" :actions="actions" height="auto" @action="handleAction" @row-open="openAsset" />
          </div>
        </section>
        <section class="panel site-chart-panel">
          <div class="site-chart-section">
            <div class="site-chart-header">
              <div class="site-chart-title">
                <h3>Asset Health Trend</h3>
              </div>
              <div class="site-chart-tools">
                <duration-input
                  v-model="durationInput"
                  :options="durationOptions"
                  list-id="site-duration-options"
                  @commit="normalizeDurationInput"
                />
                <div class="site-chart-legend" aria-label="Chart legend">
                  <span v-for="item in currentTrend.series" :key="item.name">
                    <i :style="{ '--legend-color': item.color }"></i>{{ item.name }}
                  </span>
                </div>
              </div>
            </div>
            <trend-chart
              title=""
              :times="currentTrend.times"
              :series="currentTrend.series"
              height="100%"
              :show-legend="false"
              :show-symbols="true"
              :smooth="false"
              :grid-top="20"
              :grid-bottom="44"
              :y-max="10"
              :y-interval="2"
            />
          </div>
        </section>
      </div>
    `,
    setup() {
      const statusRank = { red: 0, yellow: 1, green: 2 };
      const rows = [...data.assets].sort((a, b) => (statusRank[a.status] ?? 99) - (statusRank[b.status] ?? 99));
      const durationOptions = [
        { label: "24 Hours", value: "24h" },
        { label: "7 Days", value: "7d" },
        { label: "14 Days", value: "14d" },
        { label: "30 Days", value: "30d" },
      ];
      const durationInput = ref("14 Days");
      const trendDataByDuration = data.siteHealthTrendByDuration || {
        "24h": {
          label: "24-Hour Site Health Trend",
          times: ["12a", "4a", "8a", "12p", "4p", "8p", "Now"],
          series: [
            { name: "Active Alarms", data: [0, 0, 1, 1, 2, 2, 3], color: "#c83d3d" },
            { name: "Deviations", data: [2, 2, 3, 4, 5, 6, 7], color: "#c89a19" },
          ],
        },
        "7d": {
          label: "7-Day Site Health Trend",
          times: ["Jun 3", "Jun 4", "Jun 5", "Jun 6", "Jun 7", "Jun 8", "Today"],
          series: [
            { name: "Active Alarms", data: [1, 2, 2, 2, 2, 3, 3], color: "#c83d3d" },
            { name: "Deviations", data: [5, 5, 6, 6, 7, 6, 7], color: "#c89a19" },
          ],
        },
        "14d": {
          label: "14-Day Site Health Trend",
          times: ["May 27", "May 28", "May 29", "May 30", "May 31", "Jun 1", "Jun 2", "Jun 3", "Jun 4", "Jun 5", "Jun 7", "Jun 8", "Jun 9"],
          series: [
            { name: "Active Alarms", data: [0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3], color: "#c83d3d" },
            { name: "Deviations", data: [2, 2, 3, 3, 4, 4, 4, 5, 5, 6, 7, 6, 7], color: "#c89a19" },
          ],
        },
        "30d": {
          label: "30-Day Site Health Trend",
          times: ["May 11", "May 15", "May 19", "May 23", "May 27", "May 31", "Jun 4", "Jun 9"],
          series: [
            { name: "Active Alarms", data: [0, 0, 1, 1, 0, 1, 2, 3], color: "#c83d3d" },
            { name: "Deviations", data: [1, 2, 2, 3, 2, 4, 5, 7], color: "#c89a19" },
          ],
        },
      };
      return {
        rows,
        kpis: {
          assets: rows.length,
          activeAlarms: rows.reduce((total, row) => total + row.activeAlarms, 0),
          deviations: rows.reduce((total, row) => total + row.baselineDeviations, 0),
        },
        columns: [
          { headerName: "Asset", field: "assetName", flex: 30, minWidth: 190, cellClass: "asset-primary-cell" },
          { headerName: "Location", field: "location", flex: 20, minWidth: 150, cellClass: "asset-secondary-cell" },
          {
            headerName: "Status",
            field: "status",
            cellRenderer: statusRenderer,
            flex: 8,
            minWidth: 74,
            cellClass: "center-cell",
            cellStyle: { justifyContent: "center", textAlign: "center" },
            headerClass: "center-header",
          },
          {
            headerName: "Active Alarms",
            field: "activeAlarms",
            type: "numeric",
            flex: 12,
            minWidth: 116,
            cellClass: "metric-cell center-cell",
            cellStyle: { justifyContent: "center", textAlign: "center" },
            headerClass: "center-header",
          },
          {
            headerName: "Deviations",
            field: "baselineDeviations",
            type: "numeric",
            flex: 12,
            minWidth: 110,
            cellClass: "metric-cell center-cell",
            cellStyle: { justifyContent: "center", textAlign: "center" },
            headerClass: "center-header",
          },
        ],
        actions: [
          { label: "Alarm Detail", route: "asset-alarm-detail" },
          { label: "Maintenance Warnings", route: "baseline-deviations" },
        ],
        durationOptions,
        durationInput,
        currentTrend: computed(() => {
          const key = durationKeyFromInput(durationInput.value, durationOptions, "14d");
          return trendDataByDuration[key] || trendDataByDuration["14d"];
        }),
        normalizeDurationInput() {
          durationInput.value = durationLabelFromInput(durationInput.value, durationOptions, "14d");
        },
      };
    },
    methods: {
      handleAction({ action }) {
        this.$router.push({ name: action.route });
      },
      openAsset() {
        this.$router.push({ name: "asset-alarm-detail" });
      },
    },
  };

  const ActiveAlarms = {
    components: { ScreenHeader, GridTable, StatusBadge, ActionModal },
    data() {
      return {
        rows: data.activeAlarms.map((row) => ({ ...row })),
        selectedAlarm: null,
        modalMode: "",
        modalOpen: false,
        toast: "",
      };
    },
    computed: {
      columns() {
        return [
          { headerName: "Asset", field: "assetName", width: 130, minWidth: 120 },
          { headerName: "Location", field: "location", width: 100, minWidth: 88 },
          { headerName: "Alarm", field: "alarmName", width: 226, minWidth: 200 },
          { headerName: "Status", field: "severity", cellRenderer: statusRenderer, width: 82, minWidth: 74 },
          { headerName: "Trip Time", field: "tripTime", width: 76, minWidth: 68 },
          { headerName: "Dur", field: "duration", type: "measurement", unit: "min", width: 76, minWidth: 68 },
          { headerName: "Assign", field: "assignment", width: 110, minWidth: 100 },
        ];
      },
    },
    template: `
      <div class="screen">
        <screen-header
          title="Active Alarms"
          subtitle="Alarm workflow: table to detail to trend to assign to acknowledge to track"
          status="red"
        />
        <div v-if="toast" class="inline-alert success">{{ toast }}</div>
        <section class="panel">
          <div class="panel-header">
            <h2>Active Alarm Summary</h2>
          </div>
          <table-context
            title="Open alarm queue"
            description="Rows needing detail review, assignment, or acknowledgement."
            :items="[
              { label: 'Open Alarms', value: rows.length },
              { label: 'Sort', value: 'Severity first' },
              { label: 'Actions', value: 'Detail / Ack' }
            ]"
          />
          <grid-table
            :rows="rows"
            :columns="columns"
            :actions="[
              { label: 'Alarm Detail', key: 'detail' },
              { label: 'Acknowledge', key: 'ack' }
            ]"
            height="470px"
            @action="handleAction"
            @row-open="openDetail"
          />
        </section>
        <action-modal
          :open="modalOpen"
          :row="selectedAlarm"
          title="Assign Before Acknowledgement"
          mode="assign"
          @close="modalOpen = false"
          @assigned="assignAlarm"
        />
      </div>
    `,
    methods: {
      handleAction({ action, row }) {
        if (action.key === "detail") this.openDetail(row);
        if (action.key === "assign") this.openAssign(row);
        if (action.key === "ack") this.acknowledgeAlarm(row);
        if (action.key === "track") this.$router.push({ name: "alarm-history-detail" });
      },
      openDetail() {
        this.$router.push({ name: "asset-alarm-detail" });
      },
      openAssign(row) {
        this.selectedAlarm = row;
        this.modalMode = "assign";
        this.modalOpen = true;
      },
      assignAlarm(payload) {
        const target = this.rows.find((item) => item.alarmEventId === this.selectedAlarm.alarmEventId);
        if (target) {
          target.assignment = payload.assignee;
          target.acknowledgement = "Pending";
          target.tracking = "Ready";
        }
        this.modalOpen = false;
        this.toast = `Assigned to ${payload.assignee}. Alarm can now be acknowledged and tracked.`;
      },
      acknowledgeAlarm(row) {
        if (row.assignment === "Unassigned" || row.acknowledgement === "Blocked") {
          this.toast = "Assignment is required before acknowledgement.";
          this.openAssign(row);
          return;
        }
        const target = this.rows.find((item) => item.alarmEventId === row.alarmEventId);
        if (target) {
          target.acknowledgement = "Acknowledged";
          target.tracking = "Active";
        }
        this.toast = "Alarm acknowledged. Tracking is active for follow-up notes and notifications.";
      },
    },
  };

  const AssetAlarmDetail = {
    components: { ScreenHeader, GridTable },
    template: `
      <div class="screen">
        <screen-header
          title="Asset Alarm Detail"
          :subtitle="detailSubtitle"
          status="red"
        />
        <div class="table-command-row">
          <button type="button" class="primary" @click="$router.push({ name: 'alarm-data-trends' })">Plot Tags ></button>
        </div>
        <section class="panel">
          <div class="panel-header">
            <h2>Alarm Detail Table</h2>
          </div>
          <table-context
            :title="detailTitle"
            description="Tags and CTags driving this alarm state."
            :items="tableContextItems"
          />
          <grid-table :rows="rows" :columns="columns" height="360px" />
        </section>
      </div>
    `,
    setup() {
      const rows = data.alarmDetails;
      const asset = data.assets.find((item) => item.activeAlarms > 0) || data.assets[0] || {};
      const detailSubtitle = `${asset.assetName || "Selected asset"} at ${asset.location || data.shell.siteLocation} has ${asset.activeAlarms || rows.length} active alarms`;
      const detailTitle = `${asset.assetName || "Selected asset"} alarm tags`;
      return {
        rows,
        detailSubtitle,
        detailTitle,
        tableContextItems: [
          { label: "Asset ID", value: asset.assetId },
          { label: "Active Alarms", value: asset.activeAlarms },
          { label: "Last Sync", value: asset.lastUpdate },
          { label: "Rows", value: rows.length },
        ],
        columns: [
          { headerName: "Alarm Tag", field: "tagName", flex: 1.2 },
          { headerName: "Alarm Type", field: "tagType", width: 126 },
          { headerName: "Current Value", field: "currentValue", type: "numeric", decimals: 2, width: 132 },
          { headerName: "Condition", field: "condition", flex: 1 },
          { headerName: "Limit Value", field: "value", type: "numeric", decimals: 2, width: 118 },
          { headerName: "Units", field: "unit", width: 100 },
          { headerName: "Time Duration", field: "duration", width: 128 },
          { headerName: "Last Sync", field: "lastSync", width: 110 },
        ],
      };
    },
  };

  const AlarmDataTrends = {
    components: { ScreenHeader, TrendChart, GridTable },
    data() {
      return {
        exportModalOpen: false,
        toast: "",
      };
    },
    template: `
      <div class="screen">
        <screen-header
          title="Alarm Data Trends"
          subtitle="Trend related Tags and CTags before acknowledgement and tracking"
          status="red"
          :actions="[{ key: 'export-report', label: 'Export Report', kind: 'primary' }]"
          @action="handleHeaderAction"
        />
        <div v-if="toast" class="inline-alert success">{{ toast }}</div>
        <section class="split-layout trend-layout">
          <aside class="control-panel">
            <h2>Plot Duration</h2>
            <label class="duration-control trend-select-control">
              <span>Window</span>
              <select v-model="durationKey">
                <option v-for="option in durationOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
            </label>
            <div class="trend-add-row">
              <label>
                <span>Add Tag / CTag</span>
                <select v-model="tagToAdd">
                  <option value=""></option>
                  <option v-for="option in availableTagOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
              </label>
              <button type="button" class="primary" @click="addTagToTrend">Add</button>
            </div>
            <div class="check-list trend-check-list">
              <label v-for="line in currentTrend.series" :key="line.name">
                <input type="checkbox" :value="line.name" v-model="selected" />
                <span class="trend-tag-row">
                  <span class="trend-series-label" :title="line.name + ' - ' + line.color">
                    <i class="trend-color-swatch" :style="{ '--series-color': line.color }" aria-hidden="true"></i>
                    <span class="trend-series-name">{{ line.name }}</span>
                  </span>
                  <strong v-if="line.alarmAssociated" class="association-badge alarm">Alarm</strong>
                  <strong v-else class="association-badge ad-hoc">Added</strong>
                </span>
              </label>
            </div>
          </aside>
          <trend-chart
            :title="chartTitle"
            :times="currentTrend.times"
            :series="currentTrend.series"
            :selected="selected"
            height="390px"
            :show-legend="false"
          />
        </section>
        <section class="panel">
          <div class="panel-header">
            <h2>Trend Tags</h2>
          </div>
          <table-context
            title="Plotted signal rows"
            description="Alarm-associated signals are marked separately from ad hoc tags added to this trend."
            :items="[
              { label: 'Rows', value: trendTagRows.length },
              { label: 'Alarm Associated', value: trendTagRows.filter((row) => row.alarmAssociation === 'Alarm Associated').length },
              { label: 'Selected Series', value: selected.length },
              { label: 'Duration', value: durationInput },
              { label: 'Trend Points', value: currentTrend.times.length }
            ]"
          />
          <grid-table :rows="trendTagRows" :columns="columns" height="260px" compact />
        </section>
        <export-format-modal
          :open="exportModalOpen"
          title="Export Alarm Data Trends"
          @close="exportModalOpen = false"
          @select="handleExportFormat"
        />
      </div>
    `,
    setup() {
      const durationOptions = plotDurationOptions;
      const durationKey = ref("8h");
      const tagToAdd = ref("");
      const alarmTagIds = new Set(
        data.alarmDetails
          .map((detail) => tagCatalog.find((tag) => tag.tagName === detail.tagName || tag.tagId === detail.tagName))
          .filter(Boolean)
          .map((tag) => tag.tagId)
      );
      const mappedAlarmTags = tagCatalog.filter((tag) => alarmTagIds.has(tag.tagId));
      const fallbackAlarmTags = data.alarmTrendSeries
        .map((line) => tagCatalog.find((tag) => tag.tagName === line.name))
        .filter(Boolean);
      const alarmTags = mappedAlarmTags.length ? mappedAlarmTags : fallbackAlarmTags;
      const plottedTagIds = ref(alarmTags.map((tag) => tag.tagId));
      const tagById = computed(() => new Map(tagCatalog.map((tag) => [tag.tagId, tag])));
      const plottedTags = computed(() => plottedTagIds.value.map((tagId) => tagById.value.get(tagId)).filter(Boolean));
      const selected = ref(plottedTags.value.map(lineNameForTag));
      const durationInput = computed(() => durationOptions.find((option) => option.value === durationKey.value)?.label || durationKey.value);
      const currentTrend = computed(() => trendForTags(plottedTags.value, plotDurationHours(durationKey.value, "8h"), alarmTagIds));
      const chartTitle = computed(() => `Tags for Selected Alarms - ${durationInput.value}`);
      const availableTagOptions = computed(() =>
        tagCatalog
          .filter((tag) => tag.plot !== false || alarmTagIds.has(tag.tagId) || tag.kind === "CTag")
          .map((tag) => ({
            value: tag.tagId,
            label: `${alarmTagIds.has(tag.tagId) ? "[Alarm] " : ""}${tag.tagId} - ${tag.tagName}`,
          }))
      );
      const addTagToTrend = () => {
        const tagId = tagToAdd.value;
        if (!tagId) return;
        if (!plottedTagIds.value.includes(tagId)) plottedTagIds.value.push(tagId);
        const tag = tagById.value.get(tagId);
        const lineName = lineNameForTag(tag);
        if (lineName && !selected.value.includes(lineName)) selected.value.push(lineName);
        tagToAdd.value = "";
      };
      watch(
        currentTrend,
        (trend) => {
          const currentNames = new Set(trend.series.map((line) => line.name));
          selected.value = selected.value.filter((name) => currentNames.has(name));
          if (!selected.value.length) selected.value = trend.series.filter((line) => line.alarmAssociated).map((line) => line.name);
        },
        { immediate: true }
      );
      return {
        durationOptions,
        durationKey,
        durationInput,
        tagToAdd,
        availableTagOptions,
        selected,
        currentTrend,
        chartTitle,
        addTagToTrend,
        trendTagRows: computed(() =>
          currentTrend.value.series.map((line) => ({
            tagId: line.tagId,
            tagName: line.name,
            kind: tagById.value.get(line.tagId)?.kind || "Tag",
            measurementType: tagById.value.get(line.tagId)?.measurementType || "",
            unit: line.unit,
            dataSource: line.dataSource,
            alarmAssociation: line.alarmAssociated ? "Alarm Associated" : "Ad Hoc",
            plotState: selected.value.includes(line.name) ? "Visible" : "Hidden",
            latestValue: line.data[line.data.length - 1],
          }))
        ),
        columns: [
          { headerName: "Tag ID", field: "tagId", width: 116 },
          { headerName: "Tag Name", field: "tagName", flex: 1.2 },
          { headerName: "Type", field: "kind", width: 82 },
          { headerName: "Alarm Association", field: "alarmAssociation", width: 150 },
          { headerName: "Plot State", field: "plotState", width: 104 },
          { headerName: "Latest", field: "latestValue", type: "numeric", decimals: 2, width: 100 },
          { headerName: "Measurement", field: "measurementType", flex: 1 },
          { headerName: "Units", field: "unit", width: 90 },
          { headerName: "Data Source", field: "dataSource", flex: 1 },
        ],
      };
    },
    methods: {
      handleHeaderAction(action) {
        if (action.key === "export-report") this.exportModalOpen = true;
      },
      handleExportFormat(format) {
        this.exportModalOpen = false;
        if (format === "csv") {
          this.exportTrendCsv();
          return;
        }
        this.exportTrendExcel();
      },
      exportTrendCsv() {
        const filename = exportReportAsCsv("rpulse-alarm-data-trends-report", "rhoPulse Alarm Data Trends Report", this.alarmTrendReportSections());
        this.toast = `Exported ${filename}.`;
      },
      exportTrendExcel() {
        const filename = exportReportAsExcel("rpulse-alarm-data-trends-report", "rhoPulse Alarm Data Trends Report", this.alarmTrendReportSections());
        this.toast = `Exported ${filename}.`;
      },
      alarmTrendReportSections() {
        const visibleRows = trendRowsForExport(this.currentTrend.times, this.currentTrend.series, this.selected);
        return [
          {
            title: "Trend Context",
            rows: [
              { label: "Site", value: data.shell.siteName },
              { label: "Duration", value: this.durationInput },
              { label: "Selected Series", value: this.selected.join(", ") || "All series" },
              { label: "Visible Points", value: visibleRows.length },
            ],
          },
          {
            title: "Latest Values",
            rows: this.currentTrend.series
              .filter((line) => !this.selected.length || this.selected.includes(line.name))
              .map((line) => ({
                Series: line.name,
                Unit: line.unit || "",
                Latest: line.data[line.data.length - 1] ?? "",
              })),
          },
          {
            title: "Trend Data",
            rows: visibleRows,
          },
        ];
      },
    },
  };

  const AlarmHistory = {
    components: { ScreenHeader, GridTable },
    template: `
      <div class="screen">
        <screen-header title="Alarm History" subtitle="Sortable master alarm history with detail navigation" />
        <section class="panel">
          <div class="panel-header">
            <h2>Master Alarm Table</h2>
          </div>
          <table-context
            title="Alarm event rows"
            description="Notification, acknowledgement, owner, and status history."
            :items="[
              { label: 'Scope', value: 'All assets' },
              { label: 'Events', value: rows.length },
              { label: 'Detail', value: 'Double-click row' }
            ]"
          />
          <grid-table
            :rows="rows"
            :columns="columns"
            :actions="[{ label: 'Alarm Detail', key: 'detail' }]"
            height="520px"
            @action="openDetail"
            @row-open="openDetail"
          />
        </section>
      </div>
    `,
    setup() {
      return {
        rows: data.alarmHistory,
        columns: [
          { headerName: "Asset", field: "assetName", flex: 1 },
          { headerName: "Location", field: "location", flex: 1 },
          { headerName: "Alarm", field: "alarmName", flex: 1.4 },
          { headerName: "Trip Time", field: "tripTime", width: 112 },
          { headerName: "Notification", field: "notificationTime", width: 124 },
          { headerName: "Ack", field: "acknowledgeTime", width: 112 },
          { headerName: "Duration", field: "duration", type: "measurement", unit: "min", width: 110 },
          { headerName: "Responsibility", field: "responsibility", width: 140 },
          { headerName: "Status", field: "status", cellRenderer: statusRenderer, width: 124 },
        ],
      };
    },
    methods: {
      openDetail(payload) {
        const row = payload?.row || payload || {};
        this.$router.push({ name: "alarm-history-detail", query: { alarmEventId: row.alarmEventId } });
      },
    },
  };

  const AlarmHistoryDetail = {
    components: { ScreenHeader, ActionModal, GridTable },
    data() {
      return {
        exportModalOpen: false,
        notifyOpen: false,
        toast: "",
      };
    },
    template: `
      <div class="screen">
        <screen-header
          title="Alarm History Detail"
          subtitle="Historical alarm status, ownership, notes, and notification follow-up"
          :actions="[
            { key: 'notify', label: 'Notify Group', kind: 'primary' },
            { key: 'export-report', label: 'Export Report' }
          ]"
          @action="handleHeaderAction"
        />
        <div v-if="toast" class="inline-alert success">{{ toast }}</div>
        <section class="detail-layout alarm-history-detail-layout">
          <div class="panel">
            <div class="panel-header"><h2>Alarm Detail</h2></div>
            <dl class="detail-list">
              <template v-for="item in detailItems" :key="item.label">
                <dt>{{ item.label }}</dt>
                <dd>{{ item.value }}</dd>
              </template>
            </dl>
          </div>
          <div class="panel">
            <div class="panel-header"><h2>Work History</h2></div>
            <table-context
              title="Work history entries"
              description="Notes and notification activity for this alarm event."
              :items="[
                { label: 'Status', value: selectedEvent.status },
                { label: 'Notes', value: workHistoryRows.length },
                { label: 'Event ID', value: selectedEvent.alarmEventId }
              ]"
            />
            <table class="work-history">
              <thead><tr><th>Date</th><th>Time</th><th>User</th><th>Action</th><th>Note</th><th>Notify</th></tr></thead>
              <tbody>
                <tr v-for="entry in workHistoryRows" :key="entry.date + entry.time + entry.action">
                  <td>{{ entry.date }}</td>
                  <td>{{ entry.time }}</td>
                  <td>{{ entry.user }}</td>
                  <td>{{ entry.action }}</td>
                  <td>{{ entry.note }}</td>
                  <td><button @click="notifyOpen = true">Notify Group ></button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        <section class="panel">
          <div class="panel-header"><h2>Triggered Tags</h2></div>
          <table-context
            title="Alarm evidence"
            description="Tags and CTags used to reconstruct this alarm event for reporting."
            :items="[
              { label: 'Rows', value: evidenceRows.length },
              { label: 'Export', value: 'Included in report' }
            ]"
          />
          <grid-table :rows="evidenceRows" :columns="evidenceColumns" height="240px" compact />
        </section>
        <action-modal
          :open="notifyOpen"
          title="Notify Group"
          mode="notify"
          @close="notifyOpen = false"
          @sent="toast = 'Notification queued and logged.'; notifyOpen = false"
        />
        <export-format-modal
          :open="exportModalOpen"
          title="Export Alarm History Detail"
          @close="exportModalOpen = false"
          @select="handleExportFormat"
        />
      </div>
    `,
    setup() {
      const route = useRoute();
      const selectedEvent = computed(() => {
        const alarmEventId = String(route.query.alarmEventId || "");
        return data.alarmHistory.find((alarm) => alarm.alarmEventId === alarmEventId) || data.alarmHistory[0] || {};
      });
      const detailItems = computed(() => [
        { label: "Event ID", value: selectedEvent.value.alarmEventId || "" },
        { label: "Status", value: selectedEvent.value.status || "" },
        { label: "Asset", value: selectedEvent.value.assetName || "" },
        { label: "Asset Location", value: selectedEvent.value.location || "" },
        { label: "Alarm Name", value: selectedEvent.value.alarmName || "" },
        { label: "Trip Time", value: selectedEvent.value.tripTime || "" },
        { label: "Notification Time", value: selectedEvent.value.notificationTime || "" },
        { label: "Acknowledgement", value: selectedEvent.value.acknowledgeTime || "Pending" },
        { label: "Duration", value: selectedEvent.value.duration || "" },
        { label: "Assigned To", value: selectedEvent.value.responsibility || selectedEvent.value.assignment || "" },
      ]);
      const workHistoryRows = computed(() => [
        { date: "2026-06-17", time: "17:12", user: "Cody", action: "Assigned", note: `Assigned ${selectedEvent.value.alarmEventId || "alarm"} to ${selectedEvent.value.responsibility || "response owner"}.` },
        { date: "2026-06-17", time: "17:18", user: "Alex Rivera", action: "Investigated", note: "Reviewed related Cadre tag trend and current process limits." },
        { date: "2026-06-17", time: "17:25", user: "System", action: "Notification", note: "Notification escalation remains available from this detail record." },
      ]);
      const evidenceRows = computed(() =>
        data.alarmDetails.map((row) => ({
          tagName: row.tagName,
          tagType: row.tagType,
          condition: row.condition,
          limitValue: `${formatNumber(row.value, 2)} ${row.unit}`.trim(),
          currentValue: `${formatNumber(row.currentValue, 2)} ${row.unit}`.trim(),
          duration: row.duration,
          lastSync: row.lastSync,
        }))
      );
      return {
        selectedEvent,
        detailItems,
        workHistoryRows,
        evidenceRows,
        evidenceColumns: [
          { headerName: "Tag", field: "tagName", flex: 1.2 },
          { headerName: "Type", field: "tagType", width: 100 },
          { headerName: "Condition", field: "condition", flex: 1 },
          { headerName: "Limit", field: "limitValue", width: 110 },
          { headerName: "Current", field: "currentValue", width: 120 },
          { headerName: "Duration", field: "duration", width: 110 },
          { headerName: "Last Sync", field: "lastSync", width: 110 },
        ],
      };
    },
    methods: {
      handleHeaderAction(action) {
        if (action.key === "notify") {
          this.notifyOpen = true;
          return;
        }
        if (action.key === "export-report") this.exportModalOpen = true;
      },
      handleExportFormat(format) {
        this.exportModalOpen = false;
        if (format === "csv") {
          this.exportHistoryCsv();
          return;
        }
        this.exportHistoryExcel();
      },
      exportHistoryCsv() {
        const eventId = this.selectedEvent.alarmEventId || "alarm-event";
        const filename = exportReportAsCsv(`rpulse-alarm-history-detail-${eventId}`, "rhoPulse Alarm History Detail Report", this.historyReportSections());
        this.toast = `Exported ${filename}.`;
      },
      exportHistoryExcel() {
        const eventId = this.selectedEvent.alarmEventId || "alarm-event";
        const filename = exportReportAsExcel(`rpulse-alarm-history-detail-${eventId}`, "rhoPulse Alarm History Detail Report", this.historyReportSections());
        this.toast = `Exported ${filename}.`;
      },
      historyReportSections() {
        return [
          { title: "Alarm Event", rows: this.detailItems },
          { title: "Work History", rows: this.workHistoryRows },
          { title: "Triggered Tags", rows: this.evidenceRows },
        ];
      },
    },
  };

  const BaselineDeviations = {
    components: { ScreenHeader, GridTable, ActionModal },
    data() {
      return {
        exportModalOpen: false,
        notifyOpen: false,
        selectedDeviation: null,
        toast: "",
      };
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
              { label: 'Scope', value: 'All assets' },
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
    setup() {
      const rows = ref(
        data.baselineDeviations.map((row) => ({
          ...row,
          condition: row.direction === "Below" ? "Below Low Baseline" : "Above High Baseline",
        }))
      );
      return {
        rows,
        columns: [
          { headerName: "Tag", field: "tagName", width: 146, minWidth: 136 },
          { headerName: "Measure", field: "measurementType", width: 112, minWidth: 102 },
          { headerName: "Asset", field: "asset", width: 168, minWidth: 156 },
          { headerName: "Baseline", field: "baseline", type: "measurement", decimals: 2, align: "left", width: 94, minWidth: 86 },
          { headerName: "Current Value", field: "currentValue", type: "measurement", decimals: 2, align: "left", width: 126, minWidth: 116 },
          { headerName: "Condition", field: "condition", width: 172, minWidth: 162 },
        ],
      };
    },
    methods: {
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
        if (action.key === "plot") this.$router.push({ name: "data-deviation-trends", query: { deviationId: row.deviationId } });
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
      markNotified() {
        if (this.selectedDeviation) {
          const target = this.rows.find((row) => row.deviationId === this.selectedDeviation.deviationId);
          if (target) target.notified = "Yes";
        }
        this.notifyOpen = false;
        this.toast = "Notification queued and warning row updated.";
      },
    },
  };

  const DataDeviationTrends = {
    components: { ScreenHeader, TrendChart, DurationInput },
    data() {
      return {
        exportModalOpen: false,
        toast: "",
      };
    },
    template: `
      <div class="screen">
        <screen-header
          title="Maintenance Warning Trend"
          subtitle="Measured tag data against calculated baseline envelope"
          status="yellow"
          :actions="[{ key: 'export-report', label: 'Export Report', kind: 'primary' }]"
          @action="handleHeaderAction"
        />
        <div v-if="toast" class="inline-alert success">{{ toast }}</div>
        <div class="chart-control-row">
          <duration-input
            v-model="durationInput"
            :options="durationOptions"
            list-id="deviation-duration-options"
            @commit="normalizeDurationInput"
          />
        </div>
        <trend-chart
          :title="plotTitle"
          :times="currentTrend.times"
          :series="currentTrend.series"
          height="480px"
          :show-symbols="true"
        />
        <section class="panel baseline-relationship-panel">
          <div class="panel-header">
            <h2>Baseline Relationship</h2>
            <span class="panel-note">Pre-alarm maintenance warning context</span>
          </div>
          <div class="relationship-summary-grid">
            <div v-for="item in preAlarmSummary" :key="item.label">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </div>
          <trend-chart
            title="Baseline Relationship: Maintenance Warning to Alarm Trip"
            :times="relationshipTrend.times"
            :series="relationshipTrend.series"
            height="380px"
            :show-symbols="false"
            :grid-top="96"
          />
          <div class="relationship-timeline">
            <div class="relationship-timeline-rail">
              <span
                v-for="segment in relationshipTimeline"
                :key="segment.label"
                :class="['relationship-segment', segment.kind]"
                :style="{ flexGrow: segment.weight }"
              ></span>
            </div>
            <div class="relationship-timeline-labels">
              <span v-for="segment in relationshipTimeline" :key="segment.label + '-label'">{{ segment.label }}</span>
            </div>
          </div>
        </section>
        <section class="panel prealarm-analysis-panel">
          <div class="panel-header">
            <h2>Pre-Alarm Baseline Analysis</h2>
          </div>
          <p class="prealarm-narrative">{{ preAlarmNarrative }}</p>
          <div class="prealarm-event-list">
            <div v-if="!preAlarmEvents.length" class="prealarm-empty">No out-of-baseline events were detected before the mapped alarm in this window.</div>
            <div v-for="event in preAlarmEvents" :key="event.id" class="prealarm-event-row">
              <strong>{{ event.label }}</strong>
              <span>{{ event.startLabel }}</span>
              <span>{{ event.durationLabel }}</span>
              <span>{{ event.peakLabel }}</span>
            </div>
          </div>
        </section>
        <section class="panel deviation-report-panel">
          <div class="panel-header">
            <h2>Maintenance Warning Report</h2>
          </div>
          <div class="deviation-report-grid">
            <div v-for="item in deviationReport" :key="item.label">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </div>
        </section>
        <export-format-modal
          :open="exportModalOpen"
          title="Export Maintenance Warning Trend"
          @close="exportModalOpen = false"
          @select="handleExportFormat"
        />
      </div>
    `,
    setup() {
      const route = useRoute();
      const durationOptions = plotDurationOptions;
      const durationInput = ref("8 Hours");
      const plottedDeviation = computed(() => {
        const deviationId = String(route.query.deviationId || "");
        return (
          data.baselineDeviations.find((deviation) => deviation.deviationId === deviationId) ||
          data.baselineDeviations[0] ||
          {}
        );
      });
      const warningTag = computed(
        () =>
          tagCatalog.find((tag) => tag.tagName === plottedDeviation.value.tagName || tag.tagId === plottedDeviation.value.tagName) ||
          tagCatalog[0] ||
          {}
      );
      const plotTitle = computed(() => {
        const deviation = plottedDeviation.value;
        return `Maintenance Warning: ${deviation.tagName || "Selected Warning"}`;
      });
      const baselineNumber = (value, fallback = 0) => {
        const parsed = Number(String(value || "").match(/-?\d+(\.\d+)?/)?.[0]);
        const fallbackNumber = Number(fallback);
        return Number.isFinite(parsed) ? parsed : Number.isFinite(fallbackNumber) ? fallbackNumber : 0;
      };
      const baselineRuleForDeviation = (tag, deviation) =>
        data.baselineRules.find(
          (rule) =>
            (tag?.tagId && rule.tagId === tag.tagId) ||
            (tag?.tagName && rule.tagName === tag.tagName) ||
            (deviation?.tagName && rule.tagName === deviation.tagName)
        ) || {};
      const decimalsForUnit = (unit = "") => (/rpm|state/i.test(unit) ? 0 : 2);
      const constantSeries = (indexes, value, unit) => {
        const decimals = decimalsForUnit(unit);
        return indexes.map(() => (Number.isFinite(value) ? Number(value.toFixed(decimals)) : null));
      };
      const buildTrend = (hours) => {
        const indexes = trendIndexesForHours(hours);
        const tag = warningTag.value;
        const values = trendValuesForTag(tag);
        const unit = tag.unit || "";
        const calculatedStats = baselineStatsForTagWindow(tag, hours) || {};
        const baselineRule = baselineRuleForDeviation(tag, plottedDeviation.value);
        const configuredTarget = baselineNumber(baselineRule.baselineTarget || plottedDeviation.value.baseline, Number(tag.initialValue ?? 0));
        const configuredLow = baselineNumber(baselineRule.baselineLow || plottedDeviation.value.baselineLow, Number(tag.minValue ?? configuredTarget));
        const configuredHigh = baselineNumber(baselineRule.baselineHigh || plottedDeviation.value.baselineHigh, Number(tag.maxValue ?? configuredTarget));
        const configuredStdDev = baselineNumber(
          baselineRule.baselineStdDev || plottedDeviation.value.baselineStdDev,
          Math.max(Math.abs(configuredHigh - configuredLow) / 4, 0)
        );
        const target = Number.isFinite(calculatedStats.baseline) ? calculatedStats.baseline : configuredTarget;
        const low = Number.isFinite(calculatedStats.low) ? calculatedStats.low : configuredLow;
        const high = Number.isFinite(calculatedStats.high) ? calculatedStats.high : configuredHigh;
        const stdDev = Number.isFinite(calculatedStats.stdDev) ? calculatedStats.stdDev : configuredStdDev;
        const stdDevLow = target - stdDev;
        const stdDevHigh = target + stdDev;
        const times = indexes.map((valueIndex, index) => data.trendMinuteTimes?.[valueIndex] || lookbackLabel(hours, index, indexes.length));
        return {
          times,
          baselineStats: {
            low,
            baseline: target,
            high,
            stdDev,
            stdDevLow,
            stdDevHigh,
            sampleCount: calculatedStats.sampleCount || indexes.length,
            unit,
          },
          series: [
            {
              name: "Measured Tag Data",
              tagId: tag.tagId,
              unit,
              data: indexes.map((valueIndex) => values[valueIndex] ?? null),
              color: tag.color || data.tagColors?.[tag.tagId] || "#ea580c",
              showSymbol: true,
            },
            {
              name: "Baseline Low",
              unit,
              data: constantSeries(indexes, low, unit),
              color: "#0f766e",
              baselineLine: true,
              lineType: "dashed",
              width: 1.8,
            },
            {
              name: "Baseline Target",
              unit,
              data: constantSeries(indexes, target, unit),
              color: "#1d4ed8",
              baselineLine: true,
              width: 2,
            },
            {
              name: "Std Dev -1 SD",
              unit,
              data: constantSeries(indexes, stdDevLow, unit),
              color: "#64748b",
              baselineLine: true,
              lineType: "dotted",
              width: 1.5,
            },
            {
              name: "Std Dev +1 SD",
              unit,
              data: constantSeries(indexes, stdDevHigh, unit),
              color: "#64748b",
              baselineLine: true,
              lineType: "dotted",
              width: 1.5,
            },
            {
              name: "Baseline High",
              unit,
              data: constantSeries(indexes, high, unit),
              color: "#c2410c",
              baselineLine: true,
              lineType: "dashed",
              width: 1.8,
            },
          ],
        };
      };
      const formatStat = (value, unit = "") => `${formatNumber(value, decimalsForUnit(unit))}${unit ? ` ${unit}` : ""}`;
      const medianValue = (values) => {
        const sorted = [...values].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
      };
      const currentTrend = computed(() => buildTrend(plotDurationHours(durationInput.value, "8h")));
      const parseClockOnTrendDate = (clock) => {
        const match = String(clock || "").match(/^(\d{1,2}):(\d{2})/);
        const trendEnd = new Date(data.trendMinuteTimes?.[data.trendMinuteTimes.length - 1] || Date.now());
        if (!match) return null;
        const timeMs = Date.UTC(
          trendEnd.getUTCFullYear(),
          trendEnd.getUTCMonth(),
          trendEnd.getUTCDate(),
          Number(match[1]),
          Number(match[2])
        );
        return { timeMs, iso: new Date(timeMs).toISOString() };
      };
      const parseCadreTimestamp = (value) => {
        const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})/);
        if (!match) return null;
        const [, year, month, day, hour, minute] = match.map(Number);
        const timeMs = Date.UTC(year, month - 1, day, hour, minute);
        return { timeMs, iso: new Date(timeMs).toISOString() };
      };
      const normalizeSearchText = (value) =>
        String(value || "")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");
      const linkedAlarmForWarning = () => {
        const tag = warningTag.value;
        const deviation = plottedDeviation.value;
        const detail =
          data.alarmDetails.find((alarm) => alarm.tagName === tag.tagName || alarm.tagName === deviation.tagName) ||
          data.alarmDetails.find((alarm) => normalizeSearchText(alarm.tagName).includes(normalizeSearchText(deviation.tagName)));
        if (detail) {
          const trip = parseClockOnTrendDate(detail.time);
          return {
            alarmName: `${detail.tagName} ${detail.condition}`,
            tripTime: trip?.iso || "",
            tripMs: trip?.timeMs || null,
            threshold: `${detail.condition} ${formatStat(detail.value, detail.unit)}`,
          };
        }
        const history = data.alarmHistory.find((alarm) =>
          normalizeSearchText(alarm.alarmName).includes(normalizeSearchText(tag.tagName || deviation.tagName))
        );
        const trip = parseCadreTimestamp(history?.tripTime);
        return history
          ? {
              alarmName: history.alarmName,
              tripTime: trip?.iso || "",
              tripMs: trip?.timeMs || null,
              threshold: history.status || "",
            }
          : null;
      };
      const formatDuration = (ms) => {
        const minutes = Math.max(0, Math.round(ms / 60000));
        const hours = Math.floor(minutes / 60);
        const remaining = minutes % 60;
        if (hours && remaining) return `${hours}h ${remaining}m`;
        if (hours) return `${hours}h`;
        return `${remaining}m`;
      };
      const formatEventTime = (iso) => {
        if (!iso) return "";
        return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
      };
      const buildPreAlarmAnalysis = (hours) => {
        const trend = currentTrend.value;
        const tag = warningTag.value;
        const values = trendValuesForTag(tag);
        const unit = tag.unit || trend.baselineStats?.unit || "";
        const alarm = linkedAlarmForWarning();
        const alarmMs = alarm?.tripMs || Date.parse(data.trendMinuteTimes?.[data.trendMinuteTimes.length - 1]);
        const total = values.length;
        const startIndex = Math.max(0, total - Math.round(hours * 60));
        const stats = trend.baselineStats || {};
        const low = Number(stats.low);
        const high = Number(stats.high);
        const mean = Number(stats.baseline);
        const stdDev = Math.max(Number(stats.stdDev) || 0, 0.0001);
        const points = Array.from({ length: Math.max(0, total - startIndex) }, (_, offset) => {
          const index = startIndex + offset;
          const value = Number(values[index]);
          const iso = data.trendMinuteTimes?.[index];
          const timeMs = Date.parse(iso);
          return Number.isFinite(value) && Number.isFinite(timeMs) ? { index, value, iso, timeMs } : null;
        }).filter(Boolean);
        const rawEvents = [];
        let activeEvent = null;
        points
          .filter((point) => point.timeMs <= alarmMs)
          .forEach((point) => {
            const outside = Number.isFinite(low) && Number.isFinite(high) && (point.value < low || point.value > high);
            if (!outside) {
              if (activeEvent) rawEvents.push(activeEvent);
              activeEvent = null;
              return;
            }
            const deviation = Math.abs(point.value - mean);
            const peakSigma = deviation / stdDev;
            if (!activeEvent) {
              activeEvent = {
                startMs: point.timeMs,
                endMs: point.timeMs,
                startIso: point.iso,
                endIso: point.iso,
                peakValue: point.value,
                peakDeviation: deviation,
                peakSigma,
                direction: point.value > high ? "High" : "Low",
              };
              return;
            }
            activeEvent.endMs = point.timeMs;
            activeEvent.endIso = point.iso;
            if (deviation > activeEvent.peakDeviation) {
              activeEvent.peakValue = point.value;
              activeEvent.peakDeviation = deviation;
              activeEvent.peakSigma = peakSigma;
              activeEvent.direction = point.value > high ? "High" : "Low";
            }
          });
        if (activeEvent) rawEvents.push(activeEvent);
        const mergedEvents = rawEvents.reduce((events, event) => {
          const previous = events[events.length - 1];
          if (previous && event.startMs - previous.endMs <= 10 * 60000) {
            previous.endMs = event.endMs;
            previous.endIso = event.endIso;
            if (event.peakDeviation > previous.peakDeviation) Object.assign(previous, {
              peakValue: event.peakValue,
              peakDeviation: event.peakDeviation,
              peakSigma: event.peakSigma,
              direction: event.direction,
            });
            return events;
          }
          events.push({ ...event });
          return events;
        }, []);
        const events = mergedEvents.map((event, index) => ({
          ...event,
          id: `prealarm-${index + 1}`,
          durationMs: Math.max(60000, Math.min(event.endMs, alarmMs) - event.startMs + 60000),
        }));
        const firstEvent = events[0];
        const eventAtTrip = events.find((event) => event.startMs <= alarmMs && event.endMs + 60000 >= alarmMs);
        const totalDurationMs = events.reduce((totalDuration, event) => totalDuration + event.durationMs, 0);
        const longestDurationMs = events.reduce((longest, event) => Math.max(longest, event.durationMs), 0);
        const maxSigma = events.reduce((max, event) => Math.max(max, event.peakSigma || 0), 0);
        const leadTimeMs = firstEvent ? Math.max(0, alarmMs - firstEvent.startMs) : 0;
        const continuousBeforeTripMs = eventAtTrip ? Math.max(0, alarmMs - eventAtTrip.startMs) : 0;
        return {
          alarm,
          low,
          high,
          mean,
          stdDev,
          unit,
          events,
          eventCount: events.length,
          totalDurationMs,
          longestDurationMs,
          maxSigma,
          leadTimeMs,
          continuousBeforeTripMs,
          firstEvent,
          eventAtTrip,
          alarmMs,
        };
      };
      const preAlarmAnalysis = computed(() => buildPreAlarmAnalysis(plotDurationHours(durationInput.value, "8h")));
      const relationshipTrend = computed(() => {
        const trend = currentTrend.value;
        const analysis = preAlarmAnalysis.value;
        const markAreas = analysis.events.map((event) => ({
          name: "Out of Baseline",
          start: event.startIso,
          end: event.endIso,
        }));
        const markLines = [
          analysis.firstEvent
            ? { name: "First Deviation", label: "First Deviation", xAxis: analysis.firstEvent.startIso, color: "#b45309", lineType: "dashed" }
            : null,
          analysis.alarm?.tripTime
            ? { name: "Alarm Trip", label: "Alarm Trip", xAxis: analysis.alarm.tripTime, color: "#b91c1c", width: 2 }
            : null,
        ].filter(Boolean);
        return {
          times: trend.times,
          series: trend.series.map((line) =>
            /measured/i.test(line.name)
              ? { ...line, markAreas, markLines, markAreaColor: "rgba(194, 65, 12, 0.12)", showSymbol: false }
              : { ...line, showSymbol: false }
          ),
        };
      });
      const preAlarmSummary = computed(() => {
        const analysis = preAlarmAnalysis.value;
        return [
          { label: "Linked Alarm Trip", value: analysis.alarm?.tripTime ? formatEventTime(analysis.alarm.tripTime) : "No mapped alarm" },
          { label: "First Deviation Before Alarm", value: analysis.firstEvent ? formatDuration(analysis.leadTimeMs) : "None in window" },
          { label: "Out-of-Baseline Events", value: formatNumber(analysis.eventCount, 0) },
          { label: "Total Time Out", value: formatDuration(analysis.totalDurationMs) },
          { label: "Continuous Before Trip", value: analysis.eventAtTrip ? formatDuration(analysis.continuousBeforeTripMs) : "Not out at trip" },
          { label: "Max Deviation", value: `${formatNumber(analysis.maxSigma, 1)} SD` },
        ];
      });
      const preAlarmEvents = computed(() =>
        preAlarmAnalysis.value.events.slice(0, 6).map((event, index) => ({
          id: event.id,
          label: `Deviation ${index + 1}`,
          startLabel: formatEventTime(event.startIso),
          durationLabel: formatDuration(event.durationMs),
          peakLabel: `${event.direction} peak ${formatStat(event.peakValue, preAlarmAnalysis.value.unit)} (${formatNumber(event.peakSigma, 1)} SD)`,
        }))
      );
      const relationshipTimeline = computed(() => {
        const analysis = preAlarmAnalysis.value;
        return [
          { label: "Baseline Window", kind: "normal", weight: 3 },
          { label: `${analysis.eventCount} Deviations`, kind: "warning", weight: Math.max(1, analysis.eventCount) },
          { label: analysis.alarm ? "Alarm Trip" : "No Alarm Mapped", kind: analysis.alarm ? "alarm" : "muted", weight: 1 },
        ];
      });
      const preAlarmNarrative = computed(() => {
        const analysis = preAlarmAnalysis.value;
        const tagName = warningTag.value?.tagName || plottedDeviation.value?.tagName || "Selected tag";
        if (!analysis.alarm) {
          return `${tagName} has baseline deviation context in this window, but no linked alarm trip is mapped for this warning.`;
        }
        if (!analysis.eventCount) {
          return `${tagName} did not leave the calculated baseline envelope before the mapped alarm trip in the selected ${durationInput.value} window.`;
        }
        const continuous = analysis.eventAtTrip
          ? ` It was continuously out of baseline for ${formatDuration(analysis.continuousBeforeTripMs)} before the alarm tripped.`
          : " It had returned inside baseline before the alarm trip.";
        return `${tagName} left the calculated baseline envelope ${analysis.eventCount} time${analysis.eventCount === 1 ? "" : "s"} before the alarm. The first deviation started ${formatDuration(analysis.leadTimeMs)} before trip, with ${formatDuration(analysis.totalDurationMs)} total out-of-baseline time.${continuous}`;
      });
      const deviationReport = computed(() => {
        const trend = currentTrend.value;
        const measured = trend.series.find((line) => /measured/i.test(line.name));
        const values = (measured?.data || []).map(Number).filter(Number.isFinite);
        if (!values.length) return [];
        const mean = values.reduce((total, value) => total + value, 0) / values.length;
        const averageDeviation = values.reduce((total, value) => total + Math.abs(value - mean), 0) / values.length;
        const variance = values.reduce((total, value) => total + Math.pow(value - mean, 2), 0) / values.length;
        const unit = measured?.unit || trend.baselineStats?.unit || "";
        const baselineStats = trend.baselineStats || {};
        return [
          { label: "Baseline Low", value: formatStat(baselineStats.low, unit) },
          { label: "Baseline Target", value: formatStat(baselineStats.baseline, unit) },
          { label: "Baseline High", value: formatStat(baselineStats.high, unit) },
          { label: "Baseline Std Dev", value: formatStat(baselineStats.stdDev, unit) },
          { label: "Baseline Samples", value: formatNumber(baselineStats.sampleCount || values.length, 0) },
          { label: "Average Deviation From Mean", value: formatStat(averageDeviation, unit) },
          { label: "Median", value: formatStat(medianValue(values), unit) },
          { label: "Trend Standard Deviation", value: formatStat(Math.sqrt(variance), unit) },
        ];
      });
      return {
        durationOptions,
        durationInput,
        plottedDeviation,
        warningTag,
        plotTitle,
        currentTrend,
        relationshipTrend,
        preAlarmSummary,
        preAlarmEvents,
        relationshipTimeline,
        preAlarmNarrative,
        deviationReport,
        normalizeDurationInput() {
          durationInput.value = durationLabelFromInput(durationInput.value, durationOptions, "8h");
        },
      };
    },
    methods: {
      handleHeaderAction(action) {
        if (action.key === "export-report") this.exportModalOpen = true;
      },
      handleExportFormat(format) {
        this.exportModalOpen = false;
        if (format === "csv") {
          this.exportDeviationCsv();
          return;
        }
        this.exportDeviationExcel();
      },
      exportDeviationCsv() {
        const deviation = this.plottedDeviation || {};
        const filename = exportReportAsCsv(
          `rpulse-maintenance-warning-trend-${deviation.deviationId || "selected"}`,
          "rhoPulse Maintenance Warning Trend Report",
          this.deviationReportSections()
        );
        this.toast = `Exported ${filename}.`;
      },
      exportDeviationExcel() {
        const deviation = this.plottedDeviation || {};
        const filename = exportReportAsExcel(
          `rpulse-maintenance-warning-trend-${deviation.deviationId || "selected"}`,
          "rhoPulse Maintenance Warning Trend Report",
          this.deviationReportSections()
        );
        this.toast = `Exported ${filename}.`;
      },
      deviationReportSections() {
        const deviation = this.plottedDeviation || {};
        return [
          {
            title: "Warning Context",
            rows: [
              { label: "Warning ID", value: deviation.deviationId || "" },
              { label: "Asset", value: deviation.asset || "" },
              { label: "Tag", value: deviation.tagName || "" },
              { label: "Duration", value: this.durationInput },
              { label: "Condition", value: deviation.direction || "" },
            ],
          },
          {
            title: "Pre-Alarm Baseline Analysis",
            rows: [
              { label: "Summary", value: this.preAlarmNarrative },
              ...this.preAlarmSummary,
              ...this.preAlarmEvents.map((event) => ({
                label: event.label,
                value: `${event.startLabel}; ${event.durationLabel}; ${event.peakLabel}`,
              })),
            ],
          },
          { title: "Calculated Metrics", rows: this.deviationReport },
          { title: "Trend Data", rows: trendRowsForExport(this.currentTrend.times, this.currentTrend.series) },
        ];
      },
    },
  };

  const AssetInventory = {
    components: { ScreenHeader, GridTable },
    template: `
      <div class="screen">
        <screen-header
          title="Asset Inventory"
          subtitle="Configured assets with access to asset configuration and alarm list"
          :actions="[{ key: 'add', label: 'Add Asset', kind: 'primary' }]"
          @action="$router.push({ name: 'new-asset' })"
        />
        <section class="panel">
          <div class="panel-header"><h2>Asset Inventory List</h2></div>
          <table-context
            title="Configured asset rows"
            description="Assets available for configuration, alarms, and maintenance warning review."
            :items="[
              { label: 'Assets', value: rows.length },
              { label: 'Open Alarms', value: rows.reduce((total, row) => total + row.activeAlarms, 0) },
              { label: 'Warnings', value: rows.reduce((total, row) => total + row.baselineDeviations, 0) }
            ]"
          />
          <grid-table
            :rows="rows"
            :columns="columns"
            :actions="[{ label: 'Asset Configuration', key: 'configure' }, { label: 'Alarm List', key: 'alarms' }]"
            height="520px"
            @action="handleAction"
          />
        </section>
      </div>
    `,
    setup() {
      return {
        rows: data.assets,
        columns: [
          { headerName: "Asset ID", field: "assetId", width: 120 },
          { headerName: "Asset Name", field: "assetName", flex: 1.2 },
          { headerName: "Location", field: "location", flex: 1 },
          { headerName: "Status", field: "status", cellRenderer: statusRenderer, width: 92 },
          { headerName: "Active Alarms", field: "activeAlarms", type: "numeric", width: 140 },
          { headerName: "Maintenance Warnings", field: "baselineDeviations", type: "numeric", width: 190 },
        ],
      };
    },
    methods: {
      handleAction({ action }) {
        this.$router.push({ name: action.key === "alarms" ? "alarm-list" : "asset-configuration" });
      },
    },
  };

  const AssetConfiguration = {
    components: { ScreenHeader, EditableTable },
    template: `
      <div class="screen">
        <screen-header
          title="Asset Configuration"
          subtitle="Asset, Machines, Data Sources, Tags, and CTags"
        />
        <div v-if="baselineToast" class="inline-alert success">{{ baselineToast }}</div>
        <editable-table
          title="Asset"
          context-title="Current record"
          context-description="Asset row being edited."
          :context-items="assetContextItems"
          :rows="assetRows"
          :columns="assetColumns"
          @update-table="syncConfigurationTables"
        />
        <editable-table
          title="Machines"
          context-title="Equipment rows"
          context-description="Machines and their assigned source systems."
          :context-items="machineContextItems"
          :rows="machineRows"
          :columns="machineColumns"
          :actions="machineDataSourceActions"
          @action="handleMachineTableAction"
          @update-table="updateMachines"
          @cell-change="handleMachineChange"
        />
        <editable-table
          title="Data Sources"
          context-title="Linked sources"
          context-description="Source rows populated from machine assignments."
          :context-items="dataSourceContextItems"
          :rows="dataSourceRows"
          :columns="dataSourceColumns"
          @update-table="syncConfigurationTables"
        />
        <editable-table
          title="Tags"
          context-title="Tag connection scope"
          context-description="Machine/source rows used to connect PLC tags."
          :context-items="tagContextItems"
          :rows="tagRows"
          :columns="tagColumns"
          @action="openTagConnector"
          @update-table="syncConfigurationTables"
        />
        <editable-table
          title="CTags"
          context-title="Calculated tag scope"
          context-description="CTags built from connected source tags."
          :context-items="ctagContextItems"
          :rows="ctagRows"
          :columns="ctagColumns"
          :actions="[{ key: 'create-ctag', label: 'Create CTag' }]"
          @action="openCtagBuilder"
          @update-table="updateCtags"
        />
        <editable-table
          title="Baselines"
          context-title="Automated tag baselines"
          context-description="Choose an asset baseline start and stop time, then calculate low, high, mean, and standard deviation for each tag."
          :context-items="baselineContextItems"
          :rows="baselineRows"
          :columns="baselineColumns"
          :toolbar-controls="baselineDateTimeControls"
          :toolbar-actions="baselineToolbarActions"
          :show-update="false"
          @action="handleBaselineAction"
          @toolbar-change="handleBaselineRangeChange"
          @toolbar-action="handleBaselineToolbarAction"
          @cell-change="handleBaselineChange"
        />
        <div v-if="ctagBuilderOpen" class="modal-layer" role="dialog" aria-modal="true">
          <div class="modal ctag-builder-modal">
            <header class="modal-header">
              <h2>Create CTag Calculation</h2>
              <button type="button" class="icon-button" aria-label="Close" @click="ctagBuilderOpen = false">x</button>
            </header>
            <div class="modal-body">
              <div class="field-grid two">
                <label>
                  <span>CTag Name</span>
                  <input v-model="ctagDraft.name" />
                </label>
                <label>
                  <span>Asset Name</span>
                  <input :value="selectedAssetName" readonly />
                </label>
                <label>
                  <span>Calculation Type</span>
                  <select v-model="ctagDraft.calculationType">
                    <option v-for="option in ctagCalculationOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                  </select>
                </label>
                <label class="wide">
                  <span>Equation Builder</span>
                  <div class="ctag-equation-builder">
                    <div v-for="(term, index) in ctagDraft.terms" :key="index" class="ctag-equation-row">
                      <span v-if="index === 0" class="ctag-equation-prefix">CTag =</span>
                      <select v-else v-model="term.operator" aria-label="Operator">
                        <option v-for="option in ctagOperatorOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                      </select>
                      <select v-model="term.tagId" aria-label="Asset tag">
                        <option value=""></option>
                        <option v-for="option in ctagTagOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                      </select>
                    </div>
                    <button type="button" class="secondary" @click="addCtagTerm">Add Term</button>
                  </div>
                </label>
                <label class="wide">
                  <span>Formula Preview</span>
                  <input :value="ctagFormulaPreview" readonly />
                </label>
                <label>
                  <span>Units</span>
                  <input v-model="ctagDraft.unit" />
                </label>
                <label>
                  <span>Sampling</span>
                  <input v-model="ctagDraft.samplingRate" />
                </label>
              </div>
              <div class="modal-actions">
                <button type="button" class="secondary" @click="ctagBuilderOpen = false">Cancel</button>
                <button type="button" class="primary" @click="createCtag">Create CTag</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    setup() {
      const rowId = (() => {
        let index = 0;
        return () => `editable-${index++}`;
      })();
      const withRowId = (row) => ({ __rowId: rowId(), ...row });
      const nextId = (prefix, rows, field) => {
        const existingIds = [
          ...data.assets.map((asset) => asset.assetId),
          ...data.machines.map((machine) => machine.machineId),
          ...data.dataSources.map((source) => source.dataSourceId),
          ...tagCatalog.map((tag) => tag.tagId),
          ...rows.map((row) => row[field]),
        ];
        const nextNumber =
          existingIds.reduce((maxNumber, id) => {
            const match = String(id || "").match(new RegExp(`^${prefix}-(\\d+)$`));
            return match ? Math.max(maxNumber, Number(match[1])) : maxNumber;
          }, 0) + 1;
        return `${prefix}-${String(nextNumber).padStart(3, "0")}`;
      };
      const blankRow = (columns, rows = []) =>
        withRowId(
          columns.reduce((row, column) => {
            row[column.field] = column.idPrefix ? nextId(column.idPrefix, rows, column.field) : "";
            return row;
          }, {})
        );
      const rowHasValue = (row, columns) => columns.some((column) => !column.readonly && String(row[column.field] ?? "").trim());
      const updateTable = (rowsTarget, columns) => {
        const rows = Array.isArray(rowsTarget) ? rowsTarget : rowsTarget.value;
        if (!rows.length || rowHasValue(rows[rows.length - 1], columns)) {
          rows.push(blankRow(columns, rows));
        }
      };
      const assetWithSources =
        data.assets.find((asset) =>
          data.machines.some(
            (machine) =>
              machine.assetName === asset.assetName &&
              data.dataSources.some((source) => source.machineName === machine.machineName)
          )
        ) || data.assets[0];
      const selectedAssetName = assetWithSources?.assetName || "";
      const selectedMachines = data.machines.filter((machine) => machine.assetName === selectedAssetName);
      const selectedMachineNames = selectedMachines.map((machine) => machine.machineName);
      const selectedSources = data.dataSources.filter((source) => selectedMachineNames.includes(source.machineName));
      const downloadedTags = tagCatalog
        .filter((tag) => tag.kind !== "CTag")
        .map((tag) => ({
          value: tag.tagId,
          label: `${tag.tagId} - ${tag.tagName}`,
          ...tag,
        }));
      const sourceKey = assetSourceKey;
      const machineDataSourceCount = ref(2);
      const machineDataSourceFields = computed(() =>
        Array.from({ length: machineDataSourceCount.value }, (_, index) => `dataSource${index + 1}`)
      );
      const machineDataSourceActions = computed(() => [
        { key: "add-machine", label: "Add Machine" },
        ...(machineDataSourceCount.value < 5 ? [{ key: "add-data-source", label: "Add Data Source Column" }] : []),
      ]);
      const machineOptions = computed(() =>
        machineRows.value
          .filter((machine) => String(machine.machineName || "").trim())
          .map((machine) => ({ value: machine.machineName, label: machine.machineName }))
      );
      const ctagCalculationOptions = [
        { value: "Algebraic", label: "Algebraic" },
        { value: "Addition", label: "Addition" },
        { value: "Subtraction", label: "Subtraction" },
        { value: "Kurtosis", label: "Kurtosis" },
        { value: "Jitter", label: "Jitter" },
        { value: "Standard Deviation", label: "Standard Deviation" },
      ];
      const ctagOperatorOptions = [
        { value: "+", label: "+" },
        { value: "-", label: "-" },
        { value: "*", label: "*" },
        { value: "/", label: "/" },
        { value: "^", label: "^" },
      ];
      const baselineToggleOptions = [
        { value: "On", label: "On" },
        { value: "Off", label: "Off" },
      ];
      const baselinePeriodOptions = plotDurationOptions;
      const baselineTimeline = data.trendMinuteTimes || [];
      const padDatePart = (value) => String(value).padStart(2, "0");
      const dateTimeInputValue = (input) => {
        const date = new Date(input);
        if (Number.isNaN(date.getTime())) return "";
        return `${date.getUTCFullYear()}-${padDatePart(date.getUTCMonth() + 1)}-${padDatePart(date.getUTCDate())}T${padDatePart(date.getUTCHours())}:${padDatePart(date.getUTCMinutes())}`;
      };
      const parseDateTimeInput = (value, endOfMinute = false) => {
        const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
        if (!match) return NaN;
        const [, year, month, day, hour, minute] = match.map(Number);
        return Date.UTC(year, month - 1, day, hour, minute) + (endOfMinute ? 59999 : 0);
      };
      const baselineRangeMin = dateTimeInputValue(baselineTimeline[0]);
      const baselineRangeMax = dateTimeInputValue(baselineTimeline[baselineTimeline.length - 1]);
      const baselineDefaultStart = dateTimeInputValue(new Date(Date.parse(baselineTimeline[baselineTimeline.length - 1]) - 24 * 60 * 60000)) || baselineRangeMin;
      const assetColumns = [
        { headerName: "Asset ID", field: "assetId", readonly: true, idPrefix: "AST", width: "118px" },
        { headerName: "Asset Name", field: "assetName", readonly: true, minWidth: "220px" },
        { headerName: "Location", field: "location", readonly: true, minWidth: "190px" },
        { headerName: "Description", field: "description", readonly: true, minWidth: "340px" },
      ];
      const machineColumns = computed(() => [
        { headerName: "Machine ID", field: "machineId", readonly: true, idPrefix: "MCH", width: "118px" },
        { headerName: "Machine Name", field: "machineName", minWidth: "190px" },
        { headerName: "Location", field: "location", minWidth: "190px" },
        { headerName: "Description", field: "description", minWidth: "260px" },
        ...machineDataSourceFields.value.map((field, index) => ({
          headerName: `Data Source ${index + 1}`,
          field,
          minWidth: "150px",
        })),
      ]);
      const dataSourceColumns = [
        { headerName: "Source ID", field: "dataSourceId", readonly: true, idPrefix: "DS" },
        { headerName: "Machine Name", field: "machineName", readonly: true },
        { headerName: "Data Source Name", field: "sourceName", readonly: true },
        { headerName: "Type", field: "sourceType" },
        { headerName: "Location", field: "location" },
        { headerName: "Network Address", field: "networkAddress" },
      ];
      const tagColumns = [
        { headerName: "Machine Name", field: "machineName", readonly: true },
        { headerName: "Data Source", field: "sourceName", readonly: true },
        { headerName: "Actions", field: "actions", type: "button", buttonLabel: "Connect Tags", actionKey: "connect-tags" },
      ];
      const ctagColumns = [
        { headerName: "CTag ID", field: "ctagId", readonly: true, idPrefix: "CTAG", width: "120px" },
        { headerName: "CTag Name", field: "ctagName", minWidth: "190px" },
        { headerName: "Asset Name", field: "assetName", readonly: true, minWidth: "210px" },
        { headerName: "Source Tags", field: "sourceTagIds", readonly: true, minWidth: "230px" },
        { headerName: "Calculation Type", field: "calculationType", minWidth: "150px" },
        { headerName: "Expression", field: "expression", minWidth: "320px", className: "expression-column" },
        { headerName: "Units", field: "unit", width: "84px" },
        { headerName: "Sampling", field: "samplingRate", width: "104px" },
      ];
      const assetRows = ref(
        data.assets
          .filter((asset) => asset.assetName === selectedAssetName)
          .map((asset) =>
            withRowId({
              assetId: asset.assetId,
              assetName: asset.assetName,
              location: asset.location,
              description: asset.description || "",
            })
          )
      );
      const machineRows = ref(
        selectedMachines.map((machine) => {
          const sources = selectedSources.filter((source) => source.machineName === machine.machineName);
          return withRowId({
            machineId: machine.machineId,
            machineName: machine.machineName,
            location: machine.location,
            description: machine.description || "",
            dataSource1: sources[0]?.sourceName || "",
            dataSource2: sources[1]?.sourceName || "",
          });
        })
      );
      const dataSourceRows = ref([]);
      const tagRows = ref([]);
      const baselineRows = ref(
        (data.baselineRules || [])
          .filter((rule) => rule.assetName === selectedAssetName)
          .map((rule) =>
            withRowId({
              ...rule,
              baselinePeriod: rule.baselinePeriod || "24h",
              sampleCount: rule.sampleCount || "",
              reestablishedAt: rule.reestablishedAt || "Seeded",
              calculationStatus: rule.calculationStatus || "Seeded",
            })
          )
      );
      const assetBaselineStart = ref(baselineDefaultStart);
      const assetBaselineStop = ref(baselineRangeMax);
      const ctagRows = ref(
        data.tags
          .filter((tag) => tag.kind === "CTag" && (!tag.assetName || tag.assetName === selectedAssetName))
          .map((tag) =>
            withRowId({
              ctagId: tag.tagId,
              ctagName: tag.tagName,
              assetName: tag.assetName || selectedAssetName,
              sourceTagIds: tag.sourceTagIds || "",
              calculationType: tag.calculationType || "Algebraic",
              expression: tag.expression || "",
              unit: tag.unit,
              samplingRate: tag.samplingRate,
            })
          )
      );
      const ctagBuilderOpen = ref(false);
      const ctagDraft = reactive({ name: "", calculationType: "Algebraic", terms: [], unit: "", samplingRate: "1Hz" });
      const baselineToast = ref("");
      const router = useRouter();
      const findDownloadedTag = (tagId) => downloadedTags.find((tag) => String(tag.tagId) === String(tagId));
      const formatConnectedTags = (row) =>
        (row.connectedTagIds || [])
          .map((tagId) => {
            const tag = findDownloadedTag(tagId);
            if (!tag) return "";
            const alias = row.connectedTagAliases?.[tagId];
            return alias ? `${tag.tagId} - ${tag.tagName} (${alias})` : `${tag.tagId} - ${tag.tagName}`;
          })
          .filter(Boolean)
          .join(", ");
      const selectedAssetTags = computed(() =>
        tagRows.value.flatMap((row) =>
          (readAssetTagConnections()[sourceKey(row.machineName, row.sourceName)]?.tagIds || [])
            .map((tagId) => {
              const tag = findDownloadedTag(tagId);
              if (!tag) return null;
              return {
                ...tag,
                alias: readAssetTagConnections()[sourceKey(row.machineName, row.sourceName)]?.aliases?.[tagId] || "",
                machineName: row.machineName,
                dataSource: row.sourceName,
              };
            })
            .filter(Boolean)
        )
      );
      const ctagTagOptions = computed(() =>
        selectedAssetTags.value.map((tag) => ({
          value: tag.tagId,
          label: `${tag.tagId} - ${tag.alias || tag.tagName} (${tag.machineName} / ${tag.dataSource})`,
        }))
      );
      const baselineCatalogTags = computed(() => {
        const connectedIds = new Set(selectedAssetTags.value.map((tag) => tag.tagId));
        const configuredIds = new Set(
          (data.baselineRules || [])
            .filter((rule) => rule.assetName === selectedAssetName)
            .map((row) => row.tagId)
            .filter(Boolean)
        );
        const sourceNames = new Set(dataSourceRows.value.map((row) => row.sourceName).filter(Boolean));
        const createdCtags = ctagRows.value
          .filter((row) => row.ctagId && row.ctagName)
          .map((row) => ({
            tagId: row.ctagId,
            tagName: row.ctagName,
            kind: "CTag",
            assetName: row.assetName || selectedAssetName,
            dataSource: "Computed",
            measurementType: row.calculationType || "Calculated",
            unit: row.unit || "",
          }));
        const rows = [
          ...tagCatalog.filter(
            (tag) =>
              connectedIds.has(tag.tagId) ||
              configuredIds.has(tag.tagId) ||
              sourceNames.has(tag.dataSource) ||
              tag.assetName === selectedAssetName
          ),
          ...createdCtags,
        ];
        return [...new Map(rows.map((tag) => [tag.tagId, tag])).values()];
      });
      const baselineColumns = computed(() => [
        { headerName: "Tag Name", field: "tagName", readonly: true, minWidth: "220px" },
        { headerName: "Measurement", field: "measurementType", readonly: true, minWidth: "132px" },
        { headerName: "Low", field: "baselineLow", type: "numeric", readonly: true, width: "92px" },
        { headerName: "High", field: "baselineHigh", type: "numeric", readonly: true, width: "94px" },
        { headerName: "Mean", field: "baselineTarget", type: "numeric", readonly: true, width: "96px" },
        { headerName: "Std Dev", field: "baselineStdDev", type: "numeric", readonly: true, width: "96px" },
        { headerName: "Last Established", field: "reestablishedAt", readonly: true, minWidth: "164px" },
        { headerName: "Enabled", field: "enabled", type: "select", options: baselineToggleOptions, width: "104px" },
      ]);
      const baselineDateTimeControls = computed(() => [
        { key: "start", label: "Start", type: "datetime-local", value: assetBaselineStart.value, min: baselineRangeMin, max: assetBaselineStop.value || baselineRangeMax },
        { key: "stop", label: "Stop", type: "datetime-local", value: assetBaselineStop.value, min: assetBaselineStart.value || baselineRangeMin, max: baselineRangeMax },
      ]);
      const baselineToolbarActions = [{ key: "reestablish-asset-baselines", label: "Reestablish All" }];
      const resetCtagTerms = () => {
        ctagDraft.terms = [
          { tagId: "", operator: "+" },
          { tagId: "", operator: "+" },
          { tagId: "", operator: "+" },
        ];
      };
      const addCtagTerm = () => {
        ctagDraft.terms.push({ tagId: "", operator: "+" });
      };
      const selectedCtagTagIds = () => ctagDraft.terms.map((term) => term.tagId).filter(Boolean);
      const ctagExpressionText = () => {
        const tagIds = selectedCtagTagIds();
        if (!tagIds.length) return "";
        if (ctagDraft.calculationType === "Addition") return tagIds.join(" + ");
        if (ctagDraft.calculationType === "Subtraction") return tagIds.join(" - ");
        if (["Kurtosis", "Jitter", "Standard Deviation"].includes(ctagDraft.calculationType)) {
          return `${ctagDraft.calculationType.replace(/\s+/g, "")}(${tagIds.join(", ")})`;
        }
        return ctagDraft.terms
          .filter((term) => term.tagId)
          .map((term, index) => (index === 0 ? term.tagId : `${term.operator || "+"} ${term.tagId}`))
          .join(" ");
      };
      const ctagFormulaPreview = computed(() => `CTag = ${ctagExpressionText() || "[Tag] [Operator] [Tag]"}`);
      const formatBaselineDate = (date = new Date()) =>
        date.toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
      const normalizeBaselineDate = (value) => {
        const text = String(value || "").trim();
        return text && text !== "Seeded" ? text : formatBaselineDate();
      };
      const baselineToggleValue = (value) => {
        const text = String(value || "").trim().toLowerCase();
        return ["off", "no", "false", "disabled"].includes(text) ? "Off" : "On";
      };
      const baselineRange = () => {
        const fallbackStart = parseDateTimeInput(baselineDefaultStart);
        const fallbackStop = parseDateTimeInput(baselineRangeMax, true);
        const start = parseDateTimeInput(assetBaselineStart.value);
        const stop = parseDateTimeInput(assetBaselineStop.value, true);
        const resolvedStart = Number.isFinite(start) ? start : fallbackStart;
        const resolvedStop = Number.isFinite(stop) ? stop : fallbackStop;
        return resolvedStart <= resolvedStop
          ? { start: resolvedStart, stop: resolvedStop }
          : { start: resolvedStop, stop: resolvedStart };
      };
      const formatBaselineRangeValue = (value) => {
        const [date = "", time = ""] = String(value || "").split("T");
        if (!date || !time) return "";
        return `${date} ${time}`;
      };
      const baselineRangeLabel = () => `${formatBaselineRangeValue(assetBaselineStart.value)} to ${formatBaselineRangeValue(assetBaselineStop.value)}`;
      const baselineTagLabel = (tag) => `${tag.tagId} - ${tag.tagName || tag.tagId}`;
      const baselineRuleHasValue = (row) => Boolean(row.tagId || row.tagName);
      const baselineDecimalsForRow = (row) => {
        const unit = String(row.unit || "");
        if (/rpm|hour|minute|state/i.test(unit)) return 0;
        if (/ips|ratio|v$/i.test(unit)) return 2;
        return 2;
      };
      const quantile = (values, percent) => {
        if (!values.length) return null;
        const sorted = [...values].sort((left, right) => left - right);
        const position = (sorted.length - 1) * percent;
        const lower = Math.floor(position);
        const upper = Math.ceil(position);
        if (lower === upper) return sorted[lower];
        return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
      };
      const baselineWindowValuesForTag = (tag) => {
        const values = trendValuesForTag(tag).map(Number).filter(Number.isFinite);
        if (!values.length) return [];
        const range = baselineRange();
        return values.filter((_, index) => {
          const timestamp = Date.parse(baselineTimeline[index]);
          return Number.isFinite(timestamp) && timestamp >= range.start && timestamp <= range.stop;
        });
      };
      const assetHealthWindowValues = (period) => {
        const sourceNames = new Set(dataSourceRows.value.map((row) => row.sourceName).filter(Boolean));
        const assetTags = tagCatalog.filter(
          (tag) => tag.kind !== "CTag" && (sourceNames.has(tag.dataSource) || tag.assetName === selectedAssetName)
        );
        const windows = assetTags
          .map((tag) => ({ tag, values: baselineWindowValuesForTag(tag) }))
          .filter((entry) => entry.values.length);
        if (!windows.length) return [];
        const sampleCount = Math.min(...windows.map((entry) => entry.values.length));
        return Array.from({ length: sampleCount }, (_, index) => {
          const healthValues = windows.map(({ tag, values }) => {
            const value = values[values.length - sampleCount + index];
            const min = Number(tag.minValue);
            const max = Number(tag.maxValue);
            const center = Number.isFinite(Number(tag.initialValue)) ? Number(tag.initialValue) : (min + max) / 2;
            const span = Number.isFinite(max - min) && max > min ? max - min : Math.max(Math.abs(center), 1);
            const tolerance = Math.max(span * 0.06, Math.abs(center) * 0.08, 1);
            const penalty = Math.min(38, (Math.abs(value - center) / tolerance) * 7);
            return Math.min(Math.max(100 - penalty, 62), 100);
          });
          return healthValues.reduce((total, value) => total + value, 0) / healthValues.length;
        });
      };
      const calculatedBaselineForRow = (row) => {
        const values =
          row.scope === "Asset"
            ? assetHealthWindowValues()
            : baselineWindowValuesForTag(
                baselineCatalogTags.value.find((tag) => tag.tagId === row.tagId) || tagCatalog.find((tag) => tag.tagId === row.tagId)
              );
        if (!values.length) return null;
        const low = quantile(values, 0.1);
        const high = quantile(values, 0.9);
        const baseline = values.reduce((total, value) => total + value, 0) / values.length;
        const variance = values.reduce((total, value) => total + (value - baseline) ** 2, 0) / values.length;
        return { low, baseline, high, stdDev: Math.sqrt(variance), sampleCount: values.length };
      };
      const recalculateBaselineRow = (row, accepted = false) => {
        applyBaselineTagMetadata(row);
        row.baselinePeriod = baselineRangeLabel();
        const calculation = calculatedBaselineForRow(row);
        if (!calculation) {
          row.baselineLow = "";
          row.baselineTarget = "";
          row.baselineStdDev = "";
          row.baselineHigh = "";
          row.sampleCount = "";
          row.calculationStatus = "No Data";
          return false;
        }
        const decimals = baselineDecimalsForRow(row);
        row.baselineLow = formatNumber(calculation.low, decimals);
        row.baselineTarget = formatNumber(calculation.baseline, decimals);
        row.baselineStdDev = formatNumber(calculation.stdDev, decimals);
        row.baselineHigh = formatNumber(calculation.high, decimals);
        row.sampleCount = calculation.sampleCount;
        row.calculationStatus = accepted ? "Reestablished" : "Calculated";
        row.reestablishedAt = accepted ? formatBaselineDate() : normalizeBaselineDate(row.reestablishedAt);
        return true;
      };
      const applyBaselineTagMetadata = (row) => {
        row.assetName = selectedAssetName;
        if (row.scope === "Asset") {
          row.tagId = "";
          row.tagName = row.tagName || "Asset Health Index";
          row.tagLabel = row.tagName;
          row.measurementType = row.measurementType || "Composite";
          row.unit = "%";
          return;
        }
        if (!row.tagId) {
          row.tagName = "";
          row.tagLabel = "";
          row.measurementType = "";
          row.unit = "";
          return;
        }
        const tag = baselineCatalogTags.value.find((item) => item.tagId === row.tagId) || tagCatalog.find((item) => item.tagId === row.tagId);
        if (!tag) return;
        row.scope = tag.kind === "CTag" ? "CTag" : "Tag";
        row.assetName = tag.assetName || selectedAssetName;
        row.tagName = tag.tagName;
        row.tagLabel = baselineTagLabel(tag);
        row.measurementType = tag.measurementType || row.measurementType || "";
        row.unit = tag.unit || row.unit || "";
      };
      const syncBaselineRowsFromTags = () => {
        const existingByTagId = new Map(baselineRows.value.filter((row) => row.tagId).map((row) => [row.tagId, row]));
        const seedByTagId = new Map(
          (data.baselineRules || [])
            .filter((rule) => rule.assetName === selectedAssetName && rule.tagId)
            .map((rule) => [rule.tagId, rule])
        );
        const nextRows = [];
        baselineCatalogTags.value
          .filter((tag) => tag.tagId)
          .forEach((tag) => {
            const seed = seedByTagId.get(tag.tagId) || {};
            const row =
              existingByTagId.get(tag.tagId) ||
              withRowId({
                baselineId: seed.baselineId || nextId("BASE", [...baselineRows.value, ...nextRows], "baselineId"),
                tagId: tag.tagId,
                scope: tag.kind === "CTag" ? "CTag" : "Tag",
                baselinePeriod: baselineRangeLabel(),
                baselineLow: seed.baselineLow || "",
                baselineTarget: seed.baselineTarget || "",
                baselineStdDev: seed.baselineStdDev || "",
                baselineHigh: seed.baselineHigh || "",
                sampleCount: seed.sampleCount || "",
                reestablishedAt: normalizeBaselineDate(seed.reestablishedAt),
                calculationStatus: seed.calculationStatus || "Calculated",
                evaluationWindow: seed.evaluationWindow || "15m",
                warningDelay: seed.warningDelay || "",
                enabled: baselineToggleValue(seed.enabled),
                owner: seed.owner || "",
              });
            row.tagId = tag.tagId;
            row.scope = tag.kind === "CTag" ? "CTag" : "Tag";
            row.assetName = tag.assetName || selectedAssetName;
            row.tagName = tag.tagName || row.tagName || tag.tagId;
            row.tagLabel = baselineTagLabel(tag);
            row.measurementType = tag.measurementType || row.measurementType || "";
            row.unit = tag.unit || row.unit || "";
            row.baselinePeriod = baselineRangeLabel();
            row.reestablishedAt = normalizeBaselineDate(row.reestablishedAt || seed.reestablishedAt);
            row.enabled = baselineToggleValue(row.enabled || seed.enabled);
            nextRows.push(row);
          });
        baselineRows.value = nextRows;
        baselineRows.value.forEach((row) => recalculateBaselineRow(row));
      };
      const updateBaselines = () => {
        syncBaselineRowsFromTags();
      };
      const handleBaselineChange = ({ row, column }) => {
        if (column?.field === "enabled") row.enabled = baselineToggleValue(row.enabled);
      };
      const recalculateBaselineRows = () => {
        baselineRows.value.forEach((row) => recalculateBaselineRow(row));
      };
      const handleBaselineRangeChange = ({ key, value }) => {
        if (key === "start") assetBaselineStart.value = value || baselineDefaultStart;
        if (key === "stop") assetBaselineStop.value = value || baselineRangeMax;
        const start = parseDateTimeInput(assetBaselineStart.value);
        const stop = parseDateTimeInput(assetBaselineStop.value);
        if (Number.isFinite(start) && Number.isFinite(stop) && start > stop) {
          if (key === "start") assetBaselineStop.value = assetBaselineStart.value;
          if (key === "stop") assetBaselineStart.value = assetBaselineStop.value;
        }
        recalculateBaselineRows();
      };
      const handleBaselineToolbarAction = (action) => {
        if (action?.key !== "reestablish-asset-baselines") return;
        const rowsToReestablish = baselineRows.value.filter((row) => row.tagId && baselineToggleValue(row.enabled) === "On");
        const count = rowsToReestablish.reduce((total, row) => total + (recalculateBaselineRow(row, true) ? 1 : 0), 0);
        baselineToast.value = count
          ? `Reestablished ${count} enabled tag baselines from ${baselineRangeLabel()}.`
          : `No enabled tag baselines had historian samples from ${baselineRangeLabel()}.`;
      };
      const handleBaselineAction = (payload) => {
        const action = payload?.action || payload;
        if (action?.key === "reestablish-baseline") {
          const row = payload?.row;
          if (!row?.tagId) {
            baselineToast.value = "Select a tag before reestablishing the baseline.";
            return;
          }
          baselineToast.value = recalculateBaselineRow(row, true)
            ? `Reestablished baseline for ${row.tagName || row.tagId} from ${baselineRangeLabel()}.`
            : `No historian samples were available for ${row.tagName || row.tagId}.`;
        }
      };
      const syncTagRowsFromDataSources = () => {
        const existingByKey = new Map(tagRows.value.map((row) => [sourceKey(row.machineName, row.sourceName), row]));
        tagRows.value = dataSourceRows.value.map((source) => {
          const key = sourceKey(source.machineName, source.sourceName);
          const existing = existingByKey.get(key);
          const validTagIds = new Set(downloadedTags.filter((tag) => tag.dataSource === source.sourceName).map((tag) => tag.tagId));
          const row =
            existing ||
            withRowId({
              machineName: source.machineName,
              sourceName: source.sourceName,
              connectedTagsLabel: "",
            });
          row.machineName = source.machineName;
          row.sourceName = source.sourceName;
          const connection = readAssetTagConnections()[key] || { tagIds: [], aliases: {} };
          row.connectedTagIds = (connection.tagIds || []).filter((tagId) => validTagIds.has(tagId));
          row.connectedTagAliases = connection.aliases || {};
          row.connectedTagsLabel = formatConnectedTags(row);
          return row;
        });
      };
      const syncDataSourcesFromMachines = () => {
        const existingByKey = new Map(dataSourceRows.value.map((row) => [sourceKey(row.machineName, row.sourceName), row]));
        const existingBySource = new Map(dataSourceRows.value.map((row) => [String(row.sourceName || "").trim(), row]));
        const knownBySource = new Map(selectedSources.map((source) => [source.sourceName, source]));
        const nextRows = [];
        const seen = new Set();
        machineRows.value.forEach((machine) => {
          const machineName = String(machine.machineName || "").trim();
          if (!machineName) return;
          machineDataSourceFields.value.forEach((field) => {
            const sourceName = String(machine[field] || "").trim();
            if (!sourceName) return;
            const key = sourceKey(machineName, sourceName);
            if (seen.has(key)) return;
            seen.add(key);
            const existing = existingByKey.get(key) || existingBySource.get(sourceName);
            const known = knownBySource.get(sourceName);
            const row = existing || withRowId({});
            row.dataSourceId = row.dataSourceId || known?.dataSourceId || nextId("DS", [...dataSourceRows.value, ...nextRows], "dataSourceId");
            row.machineName = machineName;
            row.sourceName = sourceName;
            row.sourceType = row.sourceType || known?.sourceType || "";
            row.location = row.location || machine.location || "";
            row.networkAddress = row.networkAddress || known?.networkAddress || "";
            nextRows.push(row);
          });
        });
        dataSourceRows.value = nextRows;
      };
      const syncConfigurationTables = () => {
        syncDataSourcesFromMachines();
        syncTagRowsFromDataSources();
        syncBaselineRowsFromTags();
      };
      const addMachineRow = () => {
        machineRows.value.push(
          withRowId({
            machineId: nextId("MCH", machineRows.value, "machineId"),
            machineName: `New Machine ${machineRows.value.length + 1}`,
            assetName: selectedAssetName,
            location: assetRows.value[0]?.location || "",
            description: "",
            ...Object.fromEntries(machineDataSourceFields.value.map((field) => [field, ""])),
          })
        );
        syncConfigurationTables();
      };
      const handleMachineTableAction = (payload) => {
        const action = payload?.action || payload;
        if (action.key === "add-machine") {
          addMachineRow();
          return;
        }
        if (action.key !== "add-data-source" || machineDataSourceCount.value >= 5) return;
        machineDataSourceCount.value += 1;
        machineRows.value.forEach((machine) => {
          machine[`dataSource${machineDataSourceCount.value}`] = machine[`dataSource${machineDataSourceCount.value}`] || "";
        });
        syncConfigurationTables();
      };
      const updateMachines = () => {
        updateTable(machineRows, machineColumns.value);
        syncConfigurationTables();
      };
      const handleMachineChange = () => {
        syncConfigurationTables();
      };
      const openTagConnector = ({ action, row }) => {
        if (action.key !== "connect-tags") return;
        router.push({
          name: "connect-tags",
          query: {
            machine: row.machineName,
            source: row.sourceName,
          },
        });
      };
      const openCtagBuilder = () => {
        ctagDraft.name = "";
        ctagDraft.calculationType = "Algebraic";
        resetCtagTerms();
        ctagDraft.unit = "";
        ctagDraft.samplingRate = "1Hz";
        ctagBuilderOpen.value = true;
      };
      const buildCtagExpression = () => {
        return ctagExpressionText();
      };
      const createCtag = () => {
        const selectedIds = [...new Set(selectedCtagTagIds())];
        const selectedTags = selectedAssetTags.value.filter((tag) => selectedIds.includes(tag.tagId));
        if (!selectedTags.length) return;
        const expression = buildCtagExpression();
        ctagRows.value.push(
          withRowId({
            ctagId: nextId("CTAG", ctagRows.value, "ctagId"),
            ctagName: ctagDraft.name || `CTag ${ctagRows.value.length + 1}`,
            assetName: selectedAssetName,
            sourceTagIds: selectedIds.join(", "),
            calculationType: ctagDraft.calculationType,
            expression,
            unit: ctagDraft.unit,
            samplingRate: ctagDraft.samplingRate,
          })
        );
        ctagBuilderOpen.value = false;
        syncBaselineRowsFromTags();
      };
      const updateCtags = () => {
        updateTable(ctagRows, ctagColumns);
        const lastRow = ctagRows.value[ctagRows.value.length - 1];
        if (lastRow && !lastRow.assetName) lastRow.assetName = selectedAssetName;
        syncBaselineRowsFromTags();
      };
      const regenerateAssetId = () => {
        if (!assetRows.value[0]?.assetId) assetRows.value[0].assetId = nextId("AST", assetRows.value, "assetId");
      };
      const assetContextItems = computed(() => [
        { label: "Asset", value: selectedAssetName },
        { label: "Asset ID", value: assetRows.value[0]?.assetId },
        { label: "Rows", value: assetRows.value.length },
      ]);
      const machineContextItems = computed(() => [
        { label: "Machines", value: machineRows.value.length },
        { label: "Source Columns", value: machineDataSourceCount.value },
      ]);
      const dataSourceContextItems = computed(() => [
        { label: "Sources", value: dataSourceRows.value.length },
        { label: "Machines", value: machineRows.value.length },
      ]);
      const tagContextItems = computed(() => [
        { label: "Source Rows", value: tagRows.value.length },
        { label: "Connected Tags", value: selectedAssetTags.value.length },
      ]);
      const baselineContextItems = computed(() => {
        const configuredRows = baselineRows.value.filter(baselineRuleHasValue);
        return [
          { label: "Tag Baselines", value: configuredRows.length },
          { label: "Start", value: formatBaselineRangeValue(assetBaselineStart.value) },
          { label: "Stop", value: formatBaselineRangeValue(assetBaselineStop.value) },
          { label: "Auto Calculated", value: "Low / High / Mean / Std Dev" },
          { label: "Reestablished", value: configuredRows.filter((row) => row.calculationStatus === "Reestablished").length },
        ];
      });
      const ctagContextItems = computed(() => [
        { label: "CTags", value: ctagRows.value.length },
        { label: "Source Tags", value: selectedAssetTags.value.length },
      ]);
      syncConfigurationTables();
      return {
        assetRows,
        assetColumns,
        assetContextItems,
        machineRows,
        machineColumns,
        machineContextItems,
        machineDataSourceActions,
        dataSourceRows,
        dataSourceColumns,
        dataSourceContextItems,
        tagRows,
        tagColumns,
        tagContextItems,
        baselineRows,
        baselineColumns,
        baselineContextItems,
        baselineDateTimeControls,
        baselineToolbarActions,
        baselineToast,
        ctagRows,
        ctagColumns,
        ctagContextItems,
        ctagBuilderOpen,
        ctagDraft,
        selectedAssetName,
        selectedAssetTags,
        machineOptions,
        ctagCalculationOptions,
        ctagOperatorOptions,
        ctagTagOptions,
        ctagFormulaPreview,
        syncConfigurationTables,
        updateTable,
        updateMachines,
        updateCtags,
        regenerateAssetId,
        handleMachineTableAction,
        handleMachineChange,
        handleBaselineAction,
        handleBaselineChange,
        handleBaselineRangeChange,
        handleBaselineToolbarAction,
        updateBaselines,
        openTagConnector,
        openCtagBuilder,
        addCtagTerm,
        createCtag,
      };
    },
  };

  const ConnectTags = {
    components: { ScreenHeader },
    template: `
      <div class="screen">
        <screen-header
          title="Connect Tags"
          :subtitle="connectionTitle"
        />
        <section class="panel connect-tags-screen-panel">
          <div class="connect-tags-context">
            <span>Machine: {{ machineName }}</span>
            <span>Data Source: {{ sourceName }}</span>
          </div>
          <label class="connect-tags-search">
            <span>Search Tags</span>
            <input v-model="searchTerm" placeholder="Search Tag ID, Tag Name, or Alias" />
          </label>
          <div class="connect-tags-layout">
            <section class="connect-tags-pane">
              <div class="panel-header"><h2>Tag List</h2></div>
              <table-context
                title="Available source tags"
                description="Search narrows this list without changing selected tags."
                :items="availableContextItems"
              />
              <div class="connect-tags-table-scroll">
                <table class="editable-table connect-tags-table">
                  <thead>
                    <tr>
                      <th>Tag ID</th>
                      <th>Tag Name</th>
                      <th>Alias</th>
                      <th>Connect</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="tag in filteredAvailableTagRows" :key="tag.tagId">
                      <td><input :value="tag.tagId" readonly /></td>
                      <td><span class="table-display-field" :title="tag.tagName">{{ tag.tagName }}</span></td>
                      <td><input v-model="tag.alias" placeholder="Optional" /></td>
                      <td><button type="button" class="primary table-action-button" @click="connectTag(tag)">Connect</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
            <section class="connect-tags-pane">
              <div class="panel-header">
                <h2>Selected Tags</h2>
                <button type="button" class="primary" @click="updateSelectedTags">Update</button>
              </div>
              <table-context
                title="Selected asset tags"
                description="Update saves the selected tag IDs and aliases."
                :items="selectedContextItems"
              />
              <div class="connect-tags-table-scroll">
                <table class="editable-table connect-tags-table">
                  <thead>
                    <tr>
                      <th>Tag ID</th>
                      <th>Tag Name</th>
                      <th>Alias</th>
                      <th>Deselect</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="tag in selectedTagRows" :key="tag.tagId">
                      <td><input :value="tag.tagId" readonly /></td>
                      <td><span class="table-display-field" :title="tag.tagName">{{ tag.tagName }}</span></td>
                      <td><input :value="tag.alias" readonly /></td>
                      <td><button type="button" class="secondary table-action-button" @click="deselectTag(tag)">Deselect</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </section>
      </div>
    `,
    setup() {
      const route = useRoute();
      const machineName = computed(() => String(route.query.machine || ""));
      const sourceName = computed(() => String(route.query.source || ""));
      const connectionTitle = computed(() => `${machineName.value} / ${sourceName.value}`);
      const connectionKey = computed(() => assetSourceKey(machineName.value, sourceName.value));
      const connection = readAssetTagConnections()[connectionKey.value] || { tagIds: [], aliases: {} };
      const selectedTagIds = ref([...(connection.tagIds || [])]);
      const selectedAliases = reactive({ ...(connection.aliases || {}) });
      const searchTerm = ref("");
      const availableTagRows = ref(
        tagCatalog
          .filter((tag) => tag.kind !== "CTag")
          .map((tag) => ({
            tagId: tag.tagId,
            tagName: tag.tagName,
            alias: selectedAliases[tag.tagId] || "",
          }))
      );
      const filteredAvailableTagRows = computed(() => {
        const query = searchTerm.value.trim().toLowerCase();
        if (!query) return availableTagRows.value;
        return availableTagRows.value.filter((tag) =>
          [tag.tagId, tag.tagName, tag.alias].some((value) => String(value || "").toLowerCase().includes(query))
        );
      });
      const selectedTagRows = computed(() =>
        selectedTagIds.value
          .map((tagId) => {
            const tag = tagCatalog.find((item) => item.tagId === tagId);
            if (!tag) return null;
            return {
              tagId: tag.tagId,
              tagName: tag.tagName,
              alias: selectedAliases[tag.tagId] || "",
            };
          })
          .filter(Boolean)
      );
      const availableContextItems = computed(() => [
        { label: "Visible Rows", value: filteredAvailableTagRows.value.length },
        { label: "Catalog Rows", value: availableTagRows.value.length },
      ]);
      const selectedContextItems = computed(() => [
        { label: "Selected Tags", value: selectedTagRows.value.length },
      ]);
      const persistSelection = () => {
        writeAssetTagConnection(machineName.value, sourceName.value, {
          tagIds: selectedTagIds.value,
          aliases: { ...selectedAliases },
        });
      };
      const connectTag = (tag) => {
        if (!selectedTagIds.value.includes(tag.tagId)) selectedTagIds.value.push(tag.tagId);
        const alias = String(tag.alias || "").trim();
        if (alias) selectedAliases[tag.tagId] = alias;
        if (!alias && selectedAliases[tag.tagId]) delete selectedAliases[tag.tagId];
      };
      const deselectTag = (tag) => {
        selectedTagIds.value = selectedTagIds.value.filter((tagId) => tagId !== tag.tagId);
        delete selectedAliases[tag.tagId];
        const availableRow = availableTagRows.value.find((row) => row.tagId === tag.tagId);
        if (availableRow) availableRow.alias = "";
      };
      const updateSelectedTags = () => {
        persistSelection();
      };
      return {
        machineName,
        sourceName,
        connectionTitle,
        availableContextItems,
        selectedContextItems,
        searchTerm,
        availableTagRows,
        filteredAvailableTagRows,
        selectedTagRows,
        connectTag,
        deselectTag,
        updateSelectedTags,
      };
    },
  };

  const FormScreen = {
    props: ["title", "subtitle", "fields", "primaryLabel"],
    components: { ScreenHeader },
    template: `
      <div class="screen">
        <screen-header :title="title" :subtitle="subtitle" />
        <section class="panel">
          <div class="field-grid three">
            <label v-for="field in fields" :key="field.label" :class="{ wide: field.wide }">
              <span>{{ field.label }}</span>
              <select v-if="field.type === 'select'">
                <option v-for="option in field.options" :key="option">{{ option }}</option>
              </select>
              <textarea v-else-if="field.type === 'textarea'" rows="3" :placeholder="field.placeholder || ''"></textarea>
              <input
                v-else
                :class="field.type === 'numeric' ? 'numeric-input' : 'text-input'"
                :inputmode="field.type === 'numeric' ? 'decimal' : undefined"
                :value="field.value || ''"
                :placeholder="field.placeholder || ''"
              />
            </label>
          </div>
          <div class="form-actions">
            <button type="button" class="secondary" @click="$router.back()">Cancel</button>
            <button type="button" class="primary">{{ primaryLabel || 'Save' }}</button>
          </div>
        </section>
      </div>
    `,
  };

  const AlarmList = {
    components: { ScreenHeader, GridTable },
    template: `
      <div class="screen">
        <screen-header
          title="Alarm List"
          subtitle="Alarms for selected asset and location"
        />
        <div class="table-command-row">
          <button type="button" class="primary" @click="$router.push({ name: 'alarm-configuration' })">Add Alarm ></button>
        </div>
        <section class="panel">
          <div class="panel-header"><h2>Alarm List</h2></div>
          <table-context
            title="Configured alarm rows"
            description="Alarm definitions and current workflow fields."
            :items="[
              { label: 'Alarms', value: rows.length }
            ]"
          />
          <grid-table
            :rows="rows"
            :columns="columns"
            :actions="[{ label: 'Alarm Configuration', key: 'edit' }]"
            height="500px"
            @action="$router.push({ name: 'alarm-configuration' })"
          />
        </section>
      </div>
    `,
    setup() {
      return {
        rows: data.activeAlarms,
        columns: [
          { headerName: "Alarm ID", field: "alarmEventId", width: 130 },
          { headerName: "Alarm Name", field: "alarmName", flex: 1.4 },
          { headerName: "Asset", field: "assetName", flex: 1 },
          { headerName: "Status", field: "severity", cellRenderer: statusRenderer, width: 92 },
          { headerName: "Assignment", field: "assignment", width: 130 },
          { headerName: "Tracking", field: "tracking", width: 130 },
        ],
      };
    },
  };

  const AlarmConfiguration = {
    components: { ScreenHeader },
    template: `
      <div class="screen">
        <screen-header
          title="Alarm Configuration"
          subtitle="Build alarm logic from configured asset Tags and CTags"
        />
        <section class="panel alarm-config-panel">
          <div class="panel-header">
            <h2>Alarm Definition</h2>
          </div>
          <div class="field-grid three">
            <label>
              <span>Select Asset</span>
              <select v-model="selectedAssetName">
                <option v-for="asset in assets" :key="asset.assetId" :value="asset.assetName">{{ asset.assetName }}</option>
              </select>
            </label>
            <label>
              <span>Alarm Name</span>
              <input v-model="alarmName" placeholder="Enter alarm name" />
            </label>
            <label>
              <span>Alarm Type</span>
              <select v-model="alarmType">
                <option>Threshold</option>
                <option>Rate of Change</option>
                <option>Combinatorial Logic</option>
              </select>
            </label>
          </div>
        </section>

        <section class="panel alarm-config-panel">
          <div class="panel-header">
            <h2>Formula Builder</h2>
          </div>
          <table-context
            title="Formula inputs"
            description="Fields used by the selected alarm type."
            :items="[
              { label: 'Alarm Type', value: alarmType },
              { label: 'Available Tags', value: assetTagOptions.length },
              { label: 'Alarm Name', value: alarmName }
            ]"
          />

          <table v-if="alarmType === 'Threshold'" class="editable-table alarm-formula-table">
            <thead>
              <tr>
                <th>If</th>
                <th>Tag / CTag Selection List for Asset</th>
                <th>Operator</th>
                <th>Input Value</th>
                <th>Then</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><input value="If" readonly /></td>
                <td>
                  <select v-model="thresholdRule.tagId">
                    <option v-for="tag in assetTagOptions" :key="tag.value" :value="tag.value">{{ tag.label }}</option>
                  </select>
                </td>
                <td>
                  <select v-model="thresholdRule.operator">
                    <option>&gt;</option>
                    <option>&lt;</option>
                    <option>=</option>
                  </select>
                </td>
                <td><input v-model="thresholdRule.value" class="numeric-input" inputmode="decimal" /></td>
                <td class="display-cell"><span class="table-display-field">Notify selected groups and users</span></td>
              </tr>
            </tbody>
          </table>

          <table v-else-if="alarmType === 'Rate of Change'" class="editable-table alarm-formula-table">
            <thead>
              <tr>
                <th>If</th>
                <th>Tag / CTag Selection List for Asset</th>
                <th>Condition</th>
                <th>Input Value</th>
                <th>Units</th>
                <th>Per</th>
                <th>Then</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><input value="If" readonly /></td>
                <td>
                  <select v-model="rateRule.tagId">
                    <option v-for="tag in assetTagOptions" :key="tag.value" :value="tag.value">{{ tag.label }}</option>
                  </select>
                </td>
                <td><input value="Rate of Change exceeds" readonly /></td>
                <td><input v-model="rateRule.value" class="numeric-input" inputmode="decimal" /></td>
                <td>
                  <select v-model="rateRule.unit">
                    <option v-for="unit in rateUnits" :key="unit">{{ unit }}</option>
                  </select>
                </td>
                <td>
                  <select v-model="rateRule.period">
                    <option>second</option>
                    <option>minute</option>
                    <option>hour</option>
                    <option>day</option>
                  </select>
                </td>
                <td class="display-cell"><span class="table-display-field">Notify selected groups and users</span></td>
              </tr>
            </tbody>
          </table>

          <div v-else class="combinatorial-builder">
            <div class="field-grid two">
              <label>
                <span>Tag / CTag Selector</span>
                <select v-model="logicSelectedTag">
                  <option v-for="tag in assetTagOptions" :key="tag.value" :value="tag.value">{{ tag.label }}</option>
                </select>
              </label>
              <label>
                <span>Insert Selection</span>
                <button type="button" class="primary block" @click="insertLogicTag">Insert Tag / CTag</button>
              </label>
              <label>
                <span>Operator</span>
                <select v-model="logicSelectedOperator">
                  <option v-for="operator in logicOperatorOptions" :key="operator.value" :value="operator.value">{{ operator.label }}</option>
                </select>
              </label>
              <label>
                <span>Insert Operator</span>
                <button type="button" class="primary block" @click="insertLogicOperator">Insert Operator</button>
              </label>
              <label class="wide">
                <span>Formula Writing Space</span>
                <textarea v-model="logicFormula" rows="6" placeholder="Example: ([Tag] > 39.50) AND ([CTag] = TRUE)"></textarea>
              </label>
            </div>
          </div>
        </section>

        <section class="panel alarm-config-panel">
          <div class="panel-header">
            <h2>Notify</h2>
          </div>
          <div class="notify-target-grid">
            <div>
              <h3>Groups</h3>
              <label v-for="group in groups" :key="group.groupId">
                <input type="checkbox" :value="group.groupName" v-model="selectedGroups" />
                <span>{{ group.groupName }}</span>
              </label>
            </div>
            <div>
              <h3>Users</h3>
              <label v-for="user in users" :key="user.userId">
                <input type="checkbox" :value="user.userName" v-model="selectedUsers" />
                <span>{{ user.userName }}</span>
              </label>
            </div>
          </div>
        </section>

        <div class="table-command-row">
          <button type="button" class="primary" @click="updateAlarm">Update</button>
        </div>
        <div v-if="savedMessage" class="inline-alert success">{{ savedMessage }}</div>
      </div>
    `,
    setup() {
      const assets = data.assets;
      const defaultAlarmDetail = data.alarmDetails[0] || {};
      const defaultTag = tagCatalog.find((tag) => tag.tagName === defaultAlarmDetail.tagName || tag.tagId === defaultAlarmDetail.tagName) || tagCatalog[0] || {};
      const defaultAlarmAsset =
        assets.find((asset) => asset.assetName === (data.activeAlarms[0]?.assetName || defaultTag.assetName)) ||
        assets.find((asset) => asset.activeAlarms > 0) ||
        assets[0];
      const selectedAssetName = ref(defaultAlarmAsset?.assetName || "");
      const alarmName = ref(data.activeAlarms[0]?.alarmName || "Final Discharge Temperature High");
      const alarmType = ref("Threshold");
      const thresholdRule = reactive({
        tagId: defaultTag.tagId || "",
        operator: defaultAlarmDetail.condition === "Less Than" ? "<" : ">",
        value: String(defaultAlarmDetail.value ?? defaultTag.maxValue ?? ""),
      });
      const rateRule = reactive({ tagId: defaultTag.tagId || "", value: "5.00", unit: defaultTag.unit || "%", period: "minute" });
      const logicSelectedTag = ref(defaultTag.tagId || "");
      const logicSelectedOperator = ref(">");
      const logicFormula = ref("");
      const logicOperatorOptions = [
        { label: "+", value: "+" },
        { label: "-", value: "-" },
        { label: "*", value: "*" },
        { label: "/", value: "/" },
        { label: ">", value: ">" },
        { label: "<", value: "<" },
        { label: ">=", value: ">=" },
        { label: "<=", value: "<=" },
        { label: "=", value: "=" },
        { label: "!=", value: "!=" },
        { label: "AND", value: "AND" },
        { label: "OR", value: "OR" },
        { label: "NOT", value: "NOT" },
        { label: "(", value: "(" },
        { label: ")", value: ")" },
        { label: "Average", value: "Average()" },
        { label: "Sum", value: "Sum()" },
        { label: "Minimum", value: "Min()" },
        { label: "Maximum", value: "Max()" },
        { label: "Standard Deviation", value: "StandardDeviation()" },
        { label: "Rate Of Change", value: "RateOfChange()" },
        { label: "Absolute Value", value: "Abs()" },
      ];
      const defaultGroupName =
        data.groups.find((group) => group.groupName === data.activeAlarms[0]?.assignment)?.groupName ||
        data.groups[0]?.groupName ||
        "";
      const selectedGroups = ref(defaultGroupName ? [defaultGroupName] : []);
      const selectedUsers = ref([]);
      const savedMessage = ref("");
      const tagOptionsForAsset = (assetName) => {
        const machineNames = data.machines.filter((machine) => machine.assetName === assetName).map((machine) => machine.machineName);
        const sourceNames = data.dataSources
          .filter((source) => machineNames.includes(source.machineName))
          .map((source) => source.sourceName);
        return tagCatalog
          .filter((tag) => sourceNames.includes(tag.dataSource) || (tag.kind === "CTag" && tag.assetName === assetName))
          .map((tag) => ({
            value: tag.tagId,
            label: `${tag.tagId} - ${tag.tagName}`,
            unit: tag.unit,
          }));
      };
      const assetTagOptions = computed(() => tagOptionsForAsset(selectedAssetName.value));
      const rateUnits = computed(() => {
        const units = new Set(["%"]);
        assetTagOptions.value.forEach((tag) => {
          if (tag.unit) units.add(tag.unit);
        });
        return [...units];
      });
      const ensureSelectedTag = () => {
        const first = assetTagOptions.value[0]?.value || "";
        if (!assetTagOptions.value.some((tag) => tag.value === thresholdRule.tagId)) thresholdRule.tagId = first;
        if (!assetTagOptions.value.some((tag) => tag.value === rateRule.tagId)) rateRule.tagId = first;
        if (!assetTagOptions.value.some((tag) => tag.value === logicSelectedTag.value)) logicSelectedTag.value = first;
      };
      watch(assetTagOptions, ensureSelectedTag, { immediate: true });
      watch(alarmType, () => {
        savedMessage.value = "";
      });
      const insertLogicTag = () => {
        if (!logicSelectedTag.value) return;
        const insertion = `[${logicSelectedTag.value}]`;
        logicFormula.value = logicFormula.value ? `${logicFormula.value} ${insertion}` : insertion;
      };
      const insertLogicOperator = () => {
        if (!logicSelectedOperator.value) return;
        logicFormula.value = logicFormula.value ? `${logicFormula.value} ${logicSelectedOperator.value}` : logicSelectedOperator.value;
      };
      const updateAlarm = () => {
        savedMessage.value = `${alarmType.value} alarm updated for ${selectedAssetName.value}.`;
      };
      return {
        assets,
        groups: data.groups,
        users: data.users,
        selectedAssetName,
        alarmName,
        alarmType,
        thresholdRule,
        rateRule,
        logicSelectedTag,
        logicSelectedOperator,
        logicFormula,
        logicOperatorOptions,
        selectedGroups,
        selectedUsers,
        savedMessage,
        assetTagOptions,
        rateUnits,
        insertLogicTag,
        insertLogicOperator,
        updateAlarm,
      };
    },
  };

  const GroupList = {
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

  const LicenseManagement = {
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

  const UserAdmin = {
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

  const MessageCenter = {
    components: { ScreenHeader, GridTable },
    data() {
      return {
        rows: data.messages.map((row) => ({ ...row })),
      };
    },
    template: `
      <div class="screen">
        <screen-header title="Message Center" subtitle="Unread messages and message history" />
        <section class="panel">
          <div class="panel-header"><h2>Unread Message List and History</h2></div>
          <table-context
            title="Message rows"
            description="Unread and acknowledged alarm, license, and application messages."
            :items="[
              { label: 'Messages', value: rows.length },
              { label: 'Unread', value: rows.filter((row) => row.status === 'Unread').length },
              { label: 'Action', value: 'Acknowledge' }
            ]"
          />
          <grid-table
            :rows="rows"
            :columns="columns"
            :actions="[{ label: 'Acknowledge', key: 'ack' }]"
            height="500px"
            @action="acknowledge"
          />
        </section>
      </div>
    `,
    computed: {
      columns() {
        return [
          { headerName: "Message ID", field: "messageId", width: 130 },
          { headerName: "Title", field: "title", flex: 1.4 },
          { headerName: "Target", field: "target", flex: 1 },
          { headerName: "Created", field: "createdAt", width: 170 },
          { headerName: "Status", field: "status", cellRenderer: statusRenderer, width: 140 },
        ];
      },
    },
    methods: {
      acknowledge({ row }) {
        const target = this.rows.find((item) => item.messageId === row.messageId);
        if (target) target.status = "Acknowledged";
      },
    },
  };

  const TabularScreen = {
    props: ["title", "subtitle", "rows", "columns", "status"],
    components: { ScreenHeader, GridTable },
    template: `
      <div class="screen">
        <screen-header :title="title" :subtitle="subtitle" :status="status" />
        <section class="panel">
          <div class="panel-header"><h2>{{ title }}</h2></div>
          <grid-table :rows="rows" :columns="columns" height="520px" />
        </section>
      </div>
    `,
  };

  function formRoute(name, title, subtitle, fields, primaryLabel = "Save") {
    return {
      path: "/" + name,
      name,
      component: FormScreen,
      meta: { title },
      props: { title, subtitle, fields, primaryLabel },
    };
  }

  // Route registration is intentionally limited to the screens associated with
  // the Clean Shell tree and the required workflow detail states.
  const routes = [
    { path: "/", redirect: "/login" },
    { path: "/login", name: "login", component: LoginScreen, meta: { public: true, title: "Login" } },
    { path: "/site-status", name: "site-status", component: SiteStatus, meta: { title: "Site Status", group: "Operate" } },
    { path: "/active-alarms", name: "active-alarms", component: ActiveAlarms, meta: { title: "Active Alarms", group: "Operate" } },
    { path: "/asset-alarm-detail", name: "asset-alarm-detail", component: AssetAlarmDetail, meta: { title: "Asset Alarm Detail", group: "Operate" } },
    { path: "/alarm-data-trends", name: "alarm-data-trends", component: AlarmDataTrends, meta: { title: "Alarm Data Trends", group: "Operate" } },
    { path: "/alarm-history", name: "alarm-history", component: AlarmHistory, meta: { title: "Alarm History", group: "Operate" } },
    { path: "/alarm-history-detail", name: "alarm-history-detail", component: AlarmHistoryDetail, meta: { title: "Alarm History Detail", group: "Operate" } },
    { path: "/baseline-deviations", name: "baseline-deviations", component: BaselineDeviations, meta: { title: "Maintenance Warnings", group: "Operate" } },
    { path: "/data-deviation-trends", name: "data-deviation-trends", component: DataDeviationTrends, meta: { title: "Maintenance Warning Trend", group: "Operate" } },
    { path: "/asset-inventory", name: "asset-inventory", component: AssetInventory, meta: { title: "Asset Inventory", group: "Configure" } },
    { path: "/asset-configuration", name: "asset-configuration", component: AssetConfiguration, meta: { title: "Asset Configuration", group: "Configure" } },
    { path: "/connect-tags", name: "connect-tags", component: ConnectTags, meta: { title: "Connect Tags", group: "Configure" } },
    { path: "/alarm-list", name: "alarm-list", component: AlarmList, meta: { title: "Alarm List", group: "Configure" } },
    { path: "/alarm-configuration", name: "alarm-configuration", component: AlarmConfiguration, meta: { title: "Alarm Configuration", group: "Configure" } },
    {
      path: "/group-list",
      name: "group-list",
      component: GroupList,
      meta: { title: "Group List", group: "Configure" },
    },
    {
      path: "/license-management",
      name: "license-management",
      component: LicenseManagement,
      meta: { title: "Application", group: "Admin" },
    },
    { path: "/user-admin", name: "user-admin", component: UserAdmin, meta: { title: "Users", group: "Admin" } },
    { path: "/message-center", name: "message-center", component: MessageCenter, meta: { title: "Messages", group: "Admin" } },
    formRoute("new-asset", "New Asset", "Full-screen add asset flow from the matrix", [
      { label: "Asset Name", placeholder: "Enter asset name" },
      { label: "Asset Location", placeholder: "Physical site location" },
      { label: "Asset Type", placeholder: "Line, skid, process area" },
      { label: "Initial Status", type: "select", options: ["Active", "Disabled", "Commissioning"] },
      { label: "Baseline Required", type: "select", options: ["Yes", "No"] },
      { label: "Notes", type: "textarea", placeholder: "Configuration notes" },
    ], "Create Asset"),
    formRoute("group-configuration", "Group Configuration", "Selected group configuration and group members", [
      { label: "Group Name", value: "Compressor Operations" },
      { label: "Purpose", value: "First response for Cadre compressor process alarms", wide: true },
      { label: "Members", value: "Maya Singh, Owen Carter" },
      { label: "Delivery Methods", type: "select", options: ["Email and SMS", "Email", "SMS"] },
      { label: "Active", type: "select", options: ["Yes", "No"] },
      { label: "Notes", type: "textarea" },
    ], "Save Group"),
    formRoute("renewal-workflow", "Renewal Workflow", "Application renewal workflow", [
      { label: "Current License", value: "LIC-0001" },
      { label: "Renewal Status", type: "select", options: ["Not Started", "Requested", "Pending Approval", "Renewed"] },
      { label: "Customer Contact", value: "Cadre Demo Manager" },
      { label: "Requested Term", type: "select", options: ["12 months", "24 months", "36 months"] },
      { label: "Renewal Note", type: "textarea" },
    ], "Submit Renewal"),
    formRoute("edit-user", "Edit User", "User information and authority update", [
      { label: "User Name", value: "Maya Singh" },
      { label: "Email", value: "maya.singh@cadre-demo.local" },
      { label: "Phone / SMS", value: "+1 555 0102" },
      { label: "Role", type: "select", options: ["Viewer", "Operator", "Maintenance / Reliability", "Configurator", "System Administrator"] },
      { label: "Active", type: "select", options: ["Yes", "No"] },
      { label: "Notification Preferences", value: "SMS" },
    ], "Update User"),
    { path: "/:pathMatch(.*)*", redirect: "/site-status" },
  ];

  const router = createRouter({
    history: createWebHashHistory(),
    routes,
  });

  // AppShell is the exact persistent frame: left navigation, top status bar,
  // and the scrollable field area. Screen components render only inside it.
  const AppShell = {
    components: { StatusBadge },
    setup() {
      const now = ref(new Date());
      const timer = setInterval(() => {
        now.value = new Date();
      }, 30000);
      watch(
        () => themeState.darkMode,
        (enabled) => {
          nextTick(() => {
            window.dispatchEvent(new CustomEvent("rpulse-theme-change", { detail: { darkMode: enabled } }));
          });
        },
        { immediate: true }
      );
      onBeforeUnmount(() => clearInterval(timer));
      const navSections = computed(() =>
        data.navSections.map((section) => ({
          ...section,
          items: section.items.map((item) => {
            if (item.route === "active-alarms") return { ...item, count: data.activeAlarms.length, status: "red" };
            if (item.route === "baseline-deviations") return { ...item, count: data.baselineDeviations.length, status: "yellow" };
            if (item.route === "message-center") {
              return { ...item, count: data.messages.filter((message) => message.status === "Unread").length };
            }
            return item;
          }),
        }))
      );
      return {
        shell: data.shell,
        navSections,
        now,
        themeState,
      };
    },
    computed: {
      isPublic() {
        return this.$route.meta.public;
      },
      dateLabel() {
        return this.now.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
      },
      timeLabel() {
        return this.now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
      },
      breadcrumb() {
        return [this.$route.meta.title || ""].filter(Boolean);
      },
      sectionHomeRoute() {
        const group = this.$route.meta.group;
        if (group === "Configure") return "asset-inventory";
        if (group === "Admin") return "license-management";
        return "site-status";
      },
      sectionLabel() {
        return this.$route.meta.group || "Operate";
      },
      currentTitle() {
        return this.$route.meta.title || "Operations Console";
      },
    },
    methods: {
      // Small inline icons keep the static prototype dependency-free while
      // matching the Clean Shell requirement for icons in the main nav panel.
      navIconPath(icon) {
        const paths = {
          status: "M4 11h4l2-5 4 10 2-5h4",
          alarm: "M10 5a4 4 0 0 1 8 0v4l2 4H8l2-4V5m3 12h4",
          history: "M12 8v5l4 2M4 12a8 8 0 1 0 2.3-5.7M4 4v5h5",
          deviation: "M4 17l5-5 3 3 6-8M4 20h16",
          asset: "M4 7h16v10H4zM7 7V4h10v3M7 17v3m10-3v3",
          bell: "M10 5a4 4 0 0 1 8 0v5l2 4H8l2-4V5m3 12h4",
          groups: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6m8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6M3 20a5 5 0 0 1 10 0m-2 0a5 5 0 0 1 10 0",
          application: "M4 5h16v14H4zM4 9h16M8 13h3m3 0h3M8 16h6",
          user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21a8 8 0 0 1 16 0",
          message: "M4 5h16v12H7l-3 3z",
        };
        return paths[icon] || paths.application;
      },
    },
    template: `
      <router-view v-if="isPublic"></router-view>
      <div v-else :class="['app-shell', { 'theme-dark': themeState.darkMode }]">
        <aside class="side-nav">
          <div class="brand-row">
            <img class="brand-logo" src="./src/assets/rpulse-logo.png" alt="rhoPulse" />
          </div>
          <nav>
            <section v-for="section in navSections" :key="section.label">
              <h2>{{ section.label }}</h2>
              <router-link v-for="item in section.items" :key="item.route" :to="{ name: item.route }" class="nav-link">
                <svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path :d="navIconPath(item.icon)" />
                </svg>
                <span>{{ item.label }}</span>
                <strong v-if="item.count" :class="['nav-count', item.status || 'red']">{{ item.count }}</strong>
              </router-link>
            </section>
          </nav>
          <div class="side-footer">
            <span>&copy; {{ shell.company }}</span>
            <span>{{ shell.version }} &rho; Pulse</span>
          </div>
        </aside>
        <div class="shell-main">
          <header class="top-bar">
            <div class="site-context">
              <span>{{ shell.siteName }}</span>
              <span>-</span>
              <span>{{ shell.siteLocation }}</span>
            </div>
            <div class="sync-center">
              <span :class="['status-dot', shell.status]"></span>
              <span>Synced {{ shell.syncAge }}</span>
            </div>
            <div class="top-meta">
              <span>{{ dateLabel }}</span>
              <span>{{ timeLabel }}</span>
              <span>{{ shell.userName }}</span>
            </div>
          </header>
          <main class="content-shell">
            <router-view></router-view>
          </main>
        </div>
      </div>
    `,
  };

  createApp(AppShell)
    .component("status-badge", StatusBadge)
    .component("table-context", TableContext)
    .component("duration-input", DurationInput)
    .component("export-format-modal", ExportFormatModal)
    .component("grid-table", GridTable)
    .component("trend-chart", TrendChart)
    .use(router)
    .mount("#app");
})();
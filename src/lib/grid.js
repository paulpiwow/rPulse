import { escapeHtml, formatTabularValue } from "./format.js";

export const textFilter = {
  sortable: true,
  filter: false,
  resizable: true,
};

// Numeric and time-like fields need fixed-width figures so times, decimals,
// and IDs remain easy to scan in dense operations tables.

export const isNumericColumn = (col) => col.type === "numeric" || col.type === "measurement";

export const isTabularColumn = (col) => {
  if (isNumericColumn(col) || col.type === "time" || col.type === "date" || col.type === "tabular") return true;
  const name = `${col.headerName || ""} ${col.field || ""}`;
  return /(time|date|duration|update|created|occurred|check|sampling)/i.test(name);
};

export const readableHeaderMinWidth = (col) => {
  const header = String(col.headerName || "");
  const headerWidth = Math.ceil(header.length * 6.1 + 24);
  return Math.max(col.minWidth || 0, Math.min(headerWidth, 136));
};

export const statusColorClass = (value) => {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "green" || normalized === "yellow" || normalized === "red") return normalized;
  if (/(baseline|deviation|pending|warning|unread)/i.test(normalized)) return "yellow";
  if (/(alarm|open|expired|fault|critical|high|blocked|not started)/i.test(normalized)) return "red";
  if (/(normal|active|acknowledged|enabled|closed|ok|resolved|reviewed)/i.test(normalized)) return "green";
  return normalized || "unknown";
};

// AG Grid status cells use color only. The text remains available as a title
// attribute for accessibility, but the visible cell is the simple square block.

export const statusRenderer = (params) => {
  const value = String(params.value || "");
  const color = statusColorClass(value);
  const label = value || "Unknown";
  return `<span class="status-block ${color}" title="${escapeHtml(label)}"></span>`;
};

export const tabularRenderer = (col) => (params) => {
  const formatted = formatTabularValue(params.value, col);
  const className = formatted.overflow ? "overflow-warning" : "numeric-display";
  return `<span class="${className}">${escapeHtml(formatted.text)}</span>`;
};

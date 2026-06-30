import { data } from "../data/index.js";
import { escapeHtml, safeFileSegment } from "./format.js";

export const csvEscape = (value) => {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const rowsToCsv = (rows, columns) => {
  const fields =
    columns?.length
      ? columns.map((column) => ({ key: column.field, label: column.headerName || column.label || column.field }))
      : Object.keys(rows[0] || {}).map((key) => ({ key, label: key }));
  const header = fields.map((field) => csvEscape(field.label)).join(",");
  const body = rows.map((row) => fields.map((field) => csvEscape(row[field.key])).join(","));
  return [header, ...body].join("\r\n");
};

export const downloadTextFile = (fileBase, content, mime = "text/plain;charset=utf-8") => {
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

export const exportRowsAsCsv = (fileBase, rows, columns) =>
  downloadTextFile(`${safeFileSegment(fileBase)}.csv`, rowsToCsv(rows, columns), "text/csv;charset=utf-8");

export const reportRowsForExport = (title, sections) => {
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

export const exportReportAsCsv = (fileBase, title, sections) =>
  exportRowsAsCsv(fileBase, reportRowsForExport(title, sections), [
    { field: "Section", headerName: "Section" },
    { field: "Record", headerName: "Record" },
    { field: "Field", headerName: "Field" },
    { field: "Value", headerName: "Value" },
  ]);

export const sectionRowsAsHtml = (rows = []) => {
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

export const exportReportAsExcel = (fileBase, title, sections) => {
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

export const trendRowsForExport = (times, series, selected = []) => {
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

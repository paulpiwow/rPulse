export const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const splitValueAndUnit = (value) => {
  const text = String(value ?? "").trim();
  const match = text.match(/^([+-]?(?:\d+(?:\.\d+)?|\.\d+))(?:\s*)(.*)$/);
  if (!match) return { number: value, unit: "" };
  return { number: match[1], unit: match[2] || "" };
};

export const formatNumber = (value, decimals) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value ?? "");
  const source = String(value ?? "");
  const inferredDecimals = source.includes(".") ? source.split(".")[1].length : 0;
  const places = Number.isInteger(decimals) ? decimals : inferredDecimals;
  const normalized = Object.is(number, -0) ? 0 : number;
  return normalized.toFixed(places);
};

export const formatTabularValue = (value, col = {}) => {
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

export const durationToken = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/^last/, "")
    .replace(/hours?$/, "h")
    .replace(/days?$/, "d");

export const safeFileSegment = (value) =>
  String(value || "rpulse-report")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "rpulse-report";

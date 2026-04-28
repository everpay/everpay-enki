/**
 * CSV export with UTF-8 BOM so Excel correctly opens accented/non-ASCII text.
 * Each cell is RFC-4180 escaped (wrap in quotes, double internal quotes).
 */
function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s: string;
  if (typeof value === "object") {
    try { s = JSON.stringify(value); } catch { s = String(value); }
  } else {
    s = String(value);
  }
  if (/[",\n\r]/.test(s)) {
    s = `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function rowsToCsv(headers: string[], rows: Array<Array<unknown>>): string {
  const head = headers.map(escapeCell).join(",");
  const body = rows.map((r) => r.map(escapeCell).join(",")).join("\r\n");
  return `${head}\r\n${body}`;
}

export function downloadCsv(filename: string, headers: string[], rows: Array<Array<unknown>>) {
  const csv = rowsToCsv(headers, rows);
  // UTF-8 BOM so Excel detects encoding correctly
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
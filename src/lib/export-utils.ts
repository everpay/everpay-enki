const escapeHtml = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a); }, 100);
}

export function exportAsCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map((row) =>
    Object.values(row)
      .map((v) => (typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v))
      .join(','),
  );
  downloadBlob(
    new Blob([[headers, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' }),
    `${filename}.csv`,
  );
}

export function exportAsXML(data: Record<string, unknown>[], filename: string, root = 'records', item = 'record') {
  if (!data.length) return;
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${root}>\n`;
  data.forEach((row) => {
    xml += `  <${item}>\n`;
    Object.entries(row).forEach(([k, v]) => {
      xml += `    <${k}>${String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c] || c))}</${k}>\n`;
    });
    xml += `  </${item}>\n`;
  });
  xml += `</${root}>`;
  downloadBlob(new Blob([xml], { type: 'application/xml;charset=utf-8;' }), `${filename}.xml`);
}

export function exportAsPDF(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const safeTitle = escapeHtml(filename);
  const headers = Object.keys(data[0]).map((k) => `<th>${escapeHtml(k)}</th>`).join('');
  const rows = data.map((r) => `<tr>${Object.values(r).map((v) => `<td>${escapeHtml(v)}</td>`).join('')}</tr>`).join('');
  const html = `<html><head><title>${safeTitle}</title><style>body{font-family:sans-serif;margin:20px}table{width:100%;border-collapse:collapse}th{background:#f2f2f2}th,td{border:1px solid #ddd;padding:8px;text-align:left}</style></head><body><h1>${safeTitle}</h1><table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></body></html>`;
  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 500); }
}
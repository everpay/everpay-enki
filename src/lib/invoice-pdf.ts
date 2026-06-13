import { formatCurrency } from '@/lib/format';
import { Currency } from '@/lib/types';

const escHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

interface InvoiceData {
  invoice_number: string;
  customer_name?: string | null;
  customer_email: string;
  amount: number;
  currency: Currency;
  status: string;
  description?: string | null;
  due_date?: string | null;
  created_at: string;
  notes?: string | null;
  items?: Array<{ description: string; quantity: number; unit_price: number }> | null;
}

export function generateInvoicePDF(invoice: InvoiceData): void {
  const lineItemsRows = Array.isArray(invoice.items) && invoice.items.length > 0
    ? invoice.items.map(item => `<tr><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${escHtml(item.description || 'Item')}</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">${item.quantity}</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatCurrency(item.unit_price, invoice.currency)}</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;">${formatCurrency(item.quantity * item.unit_price, invoice.currency)}</td></tr>`).join('')
    : `<tr><td colspan="4" style="padding:10px 12px;text-align:center;color:#94a3b8;">No line items</td></tr>`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${invoice.invoice_number}</title>
    <style>* { margin: 0; padding: 0; box-sizing: border-box; } body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #0f172a; background: #fff; }
    .page { max-width: 800px; margin: 0 auto; padding: 48px; } .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; }
    .brand { font-size: 28px; font-weight: 800; } .inv-label { font-size: 32px; font-weight: 800; text-align: right; } .inv-number { font-size: 14px; color: #64748b; text-align: right; margin-top: 4px; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 40px; } .meta-section h3 { font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; margin-bottom: 8px; }
    .meta-section p { font-size: 14px; line-height: 1.6; } table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead th { background: #f8fafc; padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; text-align: left; }
    .total-row { border-top: 2px solid #0f172a; } .total-row td { padding: 14px 12px; font-size: 16px; font-weight: 700; }
    .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }</style></head><body><div class="page">
    <div class="header"><div><div class="brand">everpay</div><div style="font-size:12px;color:#94a3b8;margin-top:4px;">everpayinc.com</div></div><div><div class="inv-label">INVOICE</div><div class="inv-number">${escHtml(invoice.invoice_number || 'N/A')}</div></div></div>
    <div class="meta"><div class="meta-section"><h3>Bill To</h3><p>${escHtml(invoice.customer_name || invoice.customer_email)}</p><p>${escHtml(invoice.customer_email)}</p></div>
    <div class="meta-section" style="text-align:right;"><h3>Invoice Details</h3><p>Date: ${new Date(invoice.created_at).toLocaleDateString()}</p>${invoice.due_date ? `<p>Due: ${new Date(invoice.due_date).toLocaleDateString()}</p>` : ''}<p>Status: ${escHtml(invoice.status)}</p></div></div>
    ${invoice.description ? `<p style="font-size:14px;color:#64748b;margin-bottom:24px;">${escHtml(invoice.description)}</p>` : ''}
    <table><thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>${lineItemsRows}</tbody>
    <tfoot><tr class="total-row"><td colspan="3" style="text-align:right;padding:14px 12px;">Total Due</td><td style="text-align:right;padding:14px 12px;">${formatCurrency(invoice.amount, invoice.currency)}</td></tr></tfoot></table>
    ${invoice.notes ? `<div style="background:#f8fafc;border-radius:8px;padding:16px;margin-top:32px;font-size:13px;color:#64748b;"><strong>Notes:</strong> ${escHtml(invoice.notes)}</div>` : ''}
    <div class="footer"><p>Everpay · everpayinc.com</p></div></div></body></html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) { printWindow.document.write(html); printWindow.document.close(); printWindow.onload = () => printWindow.print(); }
}

import { Platform } from 'react-native';
import * as Print from 'expo-print';
import { formatETB, formatDuration, resolveAssetUrl } from './api';

export function buildReceiptHtml(invoice) {
  const payment = invoice.payment_method_name
    ? `<p>Payment: ${invoice.payment_method_name}${
        invoice.payment_method_logo_url
          ? `<br/><img src="${resolveAssetUrl(invoice.payment_method_logo_url)}" alt="" style="height:32px;margin-top:4px"/>`
          : invoice.payment_method_icon
            ? ` (${invoice.payment_method_icon})`
            : ''
      }</p>`
    : '';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Receipt ${invoice.invoice_number || ''}</title></head>
<body style="font-family:-apple-system,sans-serif;padding:24px;max-width:400px;margin:0 auto;">
  <h2 style="text-align:center;margin:0">${invoice.facility_name || 'Parking'}</h2>
  <p style="text-align:center;color:#888;margin:8px 0 16px">PARKING RECEIPT</p>
  <hr/>
  <p>Invoice: <b>${invoice.invoice_number || '—'}</b></p>
  <p>Plate: <b style="font-size:20px;letter-spacing:2px">${invoice.plate}</b></p>
  <p>Entry: ${(invoice.entry_time || '').replace('T', ' ').slice(0, 19)}</p>
  <p>Exit: ${(invoice.exit_time || '').replace('T', ' ').slice(0, 19)}</p>
  <p>Duration: ${formatDuration(invoice.duration_minutes)}</p>
  <p>Rate: ${formatETB(invoice.hourly_rate)}/hr</p>
  ${payment}
  <hr/>
  <p style="font-size:22px;font-weight:700;text-align:right">Total: ${formatETB(invoice.total_fee)}</p>
</body></html>`;
}

export async function downloadReceipt(invoice) {
  const html = buildReceiptHtml(invoice);
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoice.invoice_number || invoice.plate || 'receipt'}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return;
  }
  await Print.printAsync({ html });
}

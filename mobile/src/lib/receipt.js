import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
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

export function buildReceiptText(invoice) {
  const lines = [
    invoice.facility_name || 'Parking',
    'PARKING RECEIPT',
    '────────────────',
    `Invoice: ${invoice.invoice_number || '—'}`,
    `Plate: ${invoice.plate}`,
    `Entry: ${(invoice.entry_time || '').replace('T', ' ').slice(0, 19)}`,
    `Exit: ${(invoice.exit_time || '').replace('T', ' ').slice(0, 19)}`,
    `Duration: ${formatDuration(invoice.duration_minutes)}`,
    `Rate: ${formatETB(invoice.hourly_rate)}/hr`,
  ];
  if (invoice.payment_method_name) {
    lines.push(`Payment: ${invoice.payment_method_name}`);
  }
  lines.push('────────────────', `Total: ${formatETB(invoice.total_fee)}`);
  return lines.join('\n');
}

function pngFilenameFor(invoice) {
  const base = (invoice.invoice_number || invoice.plate || 'receipt').replace(/[^\w-]+/g, '_');
  return `${base}.png`;
}

function htmlFilenameFor(invoice) {
  return `${invoice.invoice_number || invoice.plate || 'receipt'}.html`;
}

function isMobileWeb() {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod|android/i.test(navigator.userAgent);
}

function fmtTime(iso) {
  return (iso || '').replace('T', ' ').slice(0, 19);
}

function buildReceiptRows(invoice) {
  const rows = [
    ['Invoice', invoice.invoice_number || '—'],
    ['Plate', invoice.plate || '—'],
    ['Entry', fmtTime(invoice.entry_time)],
    ['Exit', fmtTime(invoice.exit_time)],
    ['Duration', formatDuration(invoice.duration_minutes)],
    ['Rate', `${formatETB(invoice.hourly_rate)}/hr`],
  ];
  if (invoice.payment_method_name) {
    rows.push(['Payment', invoice.payment_method_name]);
  }
  return rows;
}

/** Draw receipt to PNG — works in PWA / mobile browser where HTML download fails. */
function buildReceiptPngBlob(invoice) {
  const width = 420;
  const padding = 28;
  const rows = buildReceiptRows(invoice);
  const rowHeight = 34;
  const headerBlock = 88;
  const totalBlock = 72;
  const height = padding * 2 + headerBlock + rows.length * rowHeight + totalBlock;

  const canvas = document.createElement('canvas');
  const scale = 2;
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('Canvas unavailable'));

  ctx.scale(scale, scale);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

  let y = padding;

  ctx.fillStyle = '#111827';
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(invoice.facility_name || 'Parking', width / 2, y + 22);
  y += 30;

  ctx.fillStyle = '#6b7280';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('PARKING RECEIPT', width / 2, y + 14);
  y += 28;

  ctx.strokeStyle = '#e5e7eb';
  ctx.beginPath();
  ctx.moveTo(padding, y);
  ctx.lineTo(width - padding, y);
  ctx.stroke();
  y += 20;

  for (const [label, value] of rows) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#6b7280';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(label, padding, y + 18);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#111827';
    if (label === 'Plate') {
      ctx.font = 'bold 20px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillText(String(value), width - padding, y + 20);
    } else {
      ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(String(value), width - padding, y + 18);
    }
    y += rowHeight;
  }

  y += 4;
  ctx.strokeStyle = '#e5e7eb';
  ctx.beginPath();
  ctx.moveTo(padding, y);
  ctx.lineTo(width - padding, y);
  ctx.stroke();
  y += 28;

  ctx.textAlign = 'left';
  ctx.fillStyle = '#6b7280';
  ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('Total paid', padding, y + 4);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(formatETB(invoice.total_fee), width - padding, y + 6);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to create receipt image'))),
      'image/png',
      1,
    );
  });
}

async function downloadBlobWeb(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function showReceiptImagePreview(blob) {
  const url = URL.createObjectURL(blob);
  const overlay = document.createElement('div');
  overlay.style.cssText =
    'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.9);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;box-sizing:border-box';

  const hint = document.createElement('p');
  hint.textContent = 'Long press the receipt image → Save to Photos / Files';
  hint.style.cssText = 'color:#fff;margin:0 0 12px;font:14px -apple-system,sans-serif;text-align:center';

  const img = document.createElement('img');
  img.src = url;
  img.alt = 'Parking receipt';
  img.style.cssText = 'max-width:100%;max-height:70vh;border-radius:10px;background:#fff;box-shadow:0 8px 32px rgba(0,0,0,0.4)';

  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = 'Close';
  close.style.cssText =
    'margin-top:16px;padding:12px 32px;border:none;border-radius:10px;background:#fff;color:#111;font:600 16px -apple-system,sans-serif';
  close.onclick = () => {
    overlay.remove();
    URL.revokeObjectURL(url);
  };

  overlay.appendChild(hint);
  overlay.appendChild(img);
  overlay.appendChild(close);
  document.body.appendChild(overlay);
}

async function shareBlobWeb(blob, filename, title) {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    throw new Error('Share unavailable');
  }

  const file = new File([blob], filename, { type: blob.type || 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title });
    return;
  }

  await navigator.share({ title, text: title });
}

async function saveReceiptImageWeb(invoice) {
  const blob = await buildReceiptPngBlob(invoice);
  const filename = pngFilenameFor(invoice);
  const title = 'Parking Receipt';

  try {
    await shareBlobWeb(blob, filename, title);
    return;
  } catch (err) {
    if (err?.name === 'AbortError') return;
  }

  try {
    await downloadBlobWeb(blob, filename);
    return;
  } catch {
    /* fall through */
  }

  showReceiptImagePreview(blob);
}

async function downloadReceiptHtmlWeb(html, invoice) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  await downloadBlobWeb(blob, htmlFilenameFor(invoice));
}

async function sharePdfOnNative(html) {
  const { uri } = await Print.printToFileAsync({ html });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Save or share receipt',
      UTI: 'com.adobe.pdf',
    });
    return;
  }
  await Print.printAsync({ html });
}

export function receiptActionLabel() {
  return 'Download';
}

export async function downloadReceipt(invoice) {
  const html = buildReceiptHtml(invoice);

  if (Platform.OS === 'web') {
    if (isMobileWeb()) {
      await saveReceiptImageWeb(invoice);
      return;
    }
    await downloadReceiptHtmlWeb(html, invoice);
    return;
  }

  await sharePdfOnNative(html);
}

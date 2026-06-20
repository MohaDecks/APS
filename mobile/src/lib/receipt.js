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

/** True when opened inside Dirshay / Flutter / in-app WebView (not real browser). */
export function isInAppWebView() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  if (params.get('inApp') === '1' || params.get('embedded') === '1') return true;

  const ua = navigator.userAgent || '';

  if (/;\s*wv\)/i.test(ua) || /\bWebView\b/i.test(ua)) return true;
  if (/flutter/i.test(ua)) return true;

  if (window.flutter_inappwebview || window.DirshayApp || window.dirshayApp) return true;
  if (window.Android?.saveReceipt || window.Android?.downloadFile) return true;
  if (window.webkit?.messageHandlers?.saveReceipt || window.webkit?.messageHandlers?.dirshay) return true;

  // iOS WKWebView: AppleWebKit without a standalone browser token
  if (/iPhone|iPad|iPod/i.test(ua) && /AppleWebKit/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|Safari/i.test(ua)) {
    return true;
  }

  // Mobile but no share API — typical in embedded WebViews
  if (isMobileWeb() && typeof navigator.share !== 'function') return true;

  return false;
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

function drawReceiptCanvas(invoice) {
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
  if (!ctx) throw new Error('Canvas unavailable');

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

  return canvas;
}

export function buildReceiptDataUrl(invoice) {
  return drawReceiptCanvas(invoice).toDataURL('image/png');
}

function buildReceiptPngBlob(invoice) {
  return new Promise((resolve, reject) => {
    drawReceiptCanvas(invoice).toBlob(
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

/** Ask Dirshay / Flutter native layer to save the receipt file. */
async function tryNativeAppSave(dataUrl, invoice) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;

  const filename = pngFilenameFor(invoice);
  const text = buildReceiptText(invoice);
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  const payload = { type: 'saveReceipt', filename, mimeType: 'image/png', base64, dataUrl, text };

  const handlers = [
    () => window.flutter_inappwebview?.callHandler?.('saveReceipt', payload),
    () => window.flutter_inappwebview?.callHandler?.('downloadFile', payload),
    () => window.DirshayApp?.saveReceipt?.(JSON.stringify(payload)),
    () => window.dirshayApp?.saveReceipt?.(JSON.stringify(payload)),
    () => window.DirshayApp?.postMessage?.(JSON.stringify(payload)),
    () => window.dirshayApp?.postMessage?.(JSON.stringify(payload)),
    () => window.Android?.saveReceipt?.(base64, filename),
    () => window.Android?.downloadFile?.(base64, filename, 'image/png'),
    () => window.webkit?.messageHandlers?.saveReceipt?.postMessage(payload),
    () => window.webkit?.messageHandlers?.dirshay?.postMessage(payload),
  ];

  for (const run of handlers) {
    try {
      const result = await run();
      if (result !== false) return true;
    } catch {
      /* try next bridge */
    }
  }

  try {
    window.parent?.postMessage?.(payload, '*');
  } catch {
    /* ignore */
  }

  return false;
}

export async function copyReceiptText(invoice) {
  const text = buildReceiptText(invoice);
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.cssText = 'position:fixed;left:-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    el.remove();
  }
}

async function saveReceiptImageWeb(invoice) {
  const dataUrl = buildReceiptDataUrl(invoice);
  const text = buildReceiptText(invoice);
  const filename = pngFilenameFor(invoice);

  if (isInAppWebView()) {
    const saved = await tryNativeAppSave(dataUrl, invoice);
    if (saved) return { action: 'saved' };
    return { action: 'preview', dataUrl, text };
  }

  const blob = await buildReceiptPngBlob(invoice);

  try {
    await shareBlobWeb(blob, filename, 'Parking Receipt');
    return { action: 'shared' };
  } catch (err) {
    if (err?.name === 'AbortError') return { action: 'cancelled' };
  }

  try {
    await downloadBlobWeb(blob, filename);
    return { action: 'saved' };
  } catch {
    return { action: 'preview', dataUrl, text };
  }
}

async function downloadReceiptHtmlWeb(html, invoice) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  await downloadBlobWeb(blob, htmlFilenameFor(invoice));
  return { action: 'saved' };
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
    return { action: 'shared' };
  }
  await Print.printAsync({ html });
  return { action: 'shared' };
}

export function receiptActionLabel() {
  return 'Download';
}

/** @returns {{ action: 'saved'|'shared'|'preview'|'cancelled' }} */
export async function downloadReceipt(invoice) {
  const html = buildReceiptHtml(invoice);

  if (Platform.OS === 'web') {
    if (isMobileWeb()) {
      return saveReceiptImageWeb(invoice);
    }
    await downloadReceiptHtmlWeb(html, invoice);
    return { action: 'saved' };
  }

  return sharePdfOnNative(html);
}

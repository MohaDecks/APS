import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatETB, formatDuration } from './api';

const INK = '#111111';
const TICKET_W = 340;
const PAD = 22;

function fmtTime12(iso) {
  if (!iso) return '— : — —';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '— : — —';
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h} : ${m} ${ampm}`;
}

function fmtDateTicket(iso) {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return '— / — / —';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm} / ${dd} / ${yyyy}`;
}

function fmtPaid(amount) {
  return `Paid : ${Number(amount ?? 0).toFixed(2)}`;
}

function companyLines(invoice) {
  const name = invoice.facility_name || 'Airport Parking';
  const address = invoice.facility_address || 'Bole International Airport, Addis Ababa';
  return { name, address };
}

const CAR_FRONT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="${INK}">
  <rect x="14" y="28" width="52" height="26" rx="6"/>
  <path d="M22 28 L28 16 H52 L58 28 Z"/>
  <rect x="30" y="18" width="20" height="10" rx="2" fill="#fff"/>
  <circle cx="26" cy="56" r="7"/><circle cx="54" cy="56" r="7"/>
  <circle cx="26" cy="56" r="3" fill="#fff"/><circle cx="54" cy="56" r="3" fill="#fff"/>
</svg>`;

const CAR_SIDE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 40" fill="${INK}">
  <rect x="4" y="18" width="56" height="14" rx="4"/>
  <path d="M14 18 L20 8 H38 L46 18 Z"/>
  <rect x="22" y="10" width="14" height="8" rx="1" fill="#fff"/>
  <circle cx="18" cy="34" r="5"/><circle cx="46" cy="34" r="5"/>
</svg>`;

function iconDataUrl(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function ticketStylesHtml() {
  return `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    background: #eef2f7; padding: 24px;
    display: flex; justify-content: center;
  }
  .ticket {
    width: ${TICKET_W}px; background: #fff; color: ${INK};
    border: 4px solid #1e40af; padding: ${PAD}px ${PAD - 4}px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  }
  .top { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
  .car-front { width: 72px; height: 72px; flex-shrink: 0; }
  .company { flex: 1; padding-top: 6px; }
  .company-name { font-size: 15px; font-weight: 700; line-height: 1.25; margin-bottom: 4px; }
  .company-addr { font-size: 13px; line-height: 1.3; color: #333; }
  .dots { border: none; border-top: 2px dotted ${INK}; margin: 14px 0; }
  .title { text-align: center; font-size: 18px; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 8px; }
  .date { text-align: center; font-size: 15px; font-weight: 600; margin-bottom: 4px; }
  .time-row {
    display: flex; align-items: center; justify-content: center;
    gap: 8px; font-size: 14px; font-weight: 700; margin: 10px 0;
  }
  .time-row.exit { margin-top: 6px; }
  .car-side { width: 48px; height: 30px; }
  .arrow { font-size: 18px; font-weight: 900; line-height: 1; }
  .plate {
    text-align: center; font-size: 28px; font-weight: 900;
    letter-spacing: 3px; font-family: ui-monospace, Menlo, monospace;
    margin: 14px 0 10px; padding: 8px 0;
  }
  .paid { text-align: center; font-size: 26px; font-weight: 800; margin: 16px 0 8px; }
  .meta { text-align: center; font-size: 12px; color: #444; margin-bottom: 6px; }
  .barcode {
    display: flex; justify-content: center; align-items: flex-end;
    height: 52px; gap: 2px; margin: 12px 0 14px;
  }
  .bar { background: ${INK}; width: 2px; }
  .thanks {
    text-align: center; font-size: 13px; font-weight: 800;
    letter-spacing: 0.4px; text-transform: uppercase;
  }`;
}

function barcodeBars(code) {
  const src = String(code || '0000');
  const bars = [];
  let seed = src.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  for (let i = 0; i < 72; i += 1) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const h = 28 + (seed % 22);
    const w = (seed % 3) === 0 ? 3 : 2;
    bars.push({ h, w });
  }
  return bars;
}

function barcodeHtml(code) {
  return barcodeBars(code)
    .map(({ h, w }) => `<span class="bar" style="height:${h}px;width:${w}px"></span>`)
    .join('');
}

export function buildReceiptHtml(invoice) {
  const { name, address } = companyLines(invoice);
  const exitDate = invoice.exit_time || invoice.entry_time;
  const paymentLine = invoice.payment_method_name
    ? `<p class="meta">Payment: ${invoice.payment_method_name}</p>`
    : '';
  const invoiceLine = invoice.invoice_number
    ? `<p class="meta">Invoice: ${invoice.invoice_number}</p>`
    : '';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Receipt ${invoice.invoice_number || ''}</title>
<style>${ticketStylesHtml()}</style></head>
<body>
  <div class="ticket">
    <div class="top">
      <img class="car-front" src="${iconDataUrl(CAR_FRONT_SVG)}" alt=""/>
      <div class="company">
        <div class="company-name">${name}</div>
        <div class="company-addr">${address}</div>
      </div>
    </div>
    <hr class="dots"/>
    <div class="title">CHECK FOR PARKING</div>
    <div class="date">${fmtDateTicket(exitDate)}</div>
    <hr class="dots"/>
    <div class="time-row">
      <img class="car-side" src="${iconDataUrl(CAR_SIDE_SVG)}" alt=""/>
      <span class="arrow">→</span>
      <span>FROM : ${fmtTime12(invoice.entry_time)}</span>
    </div>
    <div class="plate">${invoice.plate || '—'}</div>
    <div class="time-row exit">
      <span>TO : ${fmtTime12(invoice.exit_time)}</span>
      <span class="arrow">→</span>
      <img class="car-side" src="${iconDataUrl(CAR_SIDE_SVG)}" alt=""/>
    </div>
    <div class="paid">${fmtPaid(invoice.total_fee)}</div>
    ${invoiceLine}
    ${paymentLine}
    <p class="meta">Duration: ${formatDuration(invoice.duration_minutes)} · Rate: ${formatETB(invoice.hourly_rate)}/hr</p>
    <hr class="dots"/>
    <div class="barcode">${barcodeHtml(invoice.invoice_number || invoice.plate)}</div>
    <div class="thanks">THANK YOU AND LUCKY ROAD !</div>
  </div>
</body></html>`;
}

export function buildReceiptText(invoice) {
  const { name, address } = companyLines(invoice);
  const lines = [
    name,
    address,
    '────────────────',
    'CHECK FOR PARKING',
    fmtDateTicket(invoice.exit_time || invoice.entry_time),
    '────────────────',
    `FROM : ${fmtTime12(invoice.entry_time)}`,
    `Plate: ${invoice.plate}`,
    `TO : ${fmtTime12(invoice.exit_time)}`,
    fmtPaid(invoice.total_fee),
  ];
  if (invoice.invoice_number) lines.push(`Invoice: ${invoice.invoice_number}`);
  if (invoice.payment_method_name) lines.push(`Payment: ${invoice.payment_method_name}`);
  lines.push(
    `Duration: ${formatDuration(invoice.duration_minutes)}`,
    '────────────────',
    'THANK YOU AND LUCKY ROAD !',
  );
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

  if (/iPhone|iPad|iPod/i.test(ua) && /AppleWebKit/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|Safari/i.test(ua)) {
    return true;
  }

  if (isMobileWeb() && typeof navigator.share !== 'function') return true;

  return false;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Image load failed: ${url}`));
    img.src = url;
  });
}

function drawDottedLine(ctx, x, y, w) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawBarcode(ctx, x, y, maxW, code) {
  const bars = barcodeBars(code);
  let cx = x;
  const baseY = y + 52;
  ctx.fillStyle = INK;
  for (const { h, w } of bars) {
    if (cx + w > x + maxW) break;
    ctx.fillRect(cx, baseY - h, w, h);
    cx += w + 2;
  }
}

function wrapText(ctx, text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function renderReceiptCanvas(invoice) {
  const width = TICKET_W;
  const innerW = width - PAD * 2;
  const height = 620;

  const canvas = document.createElement('canvas');
  const scale = 2;
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  ctx.scale(scale, scale);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#1e40af';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, width - 4, height - 4);

  let y = PAD;
  const { name, address } = companyLines(invoice);

  const carFront = await loadImage(iconDataUrl(CAR_FRONT_SVG));
  ctx.drawImage(carFront, PAD, y, 68, 68);

  ctx.fillStyle = INK;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = '700 14px Arial, Helvetica, sans-serif';
  const nameLines = wrapText(ctx, name, innerW - 82);
  nameLines.forEach((line, i) => {
    ctx.fillText(line, PAD + 82, y + 8 + i * 18);
  });
  ctx.font = '13px Arial, Helvetica, sans-serif';
  const addrLines = wrapText(ctx, address, innerW - 82);
  const addrY = y + 8 + nameLines.length * 18 + 4;
  addrLines.forEach((line, i) => {
    ctx.fillText(line, PAD + 82, addrY + i * 16);
  });

  y += 78;
  drawDottedLine(ctx, PAD, y, innerW);
  y += 18;

  ctx.textAlign = 'center';
  ctx.font = '800 17px Arial, Helvetica, sans-serif';
  ctx.fillText('CHECK FOR PARKING', width / 2, y);
  y += 24;
  ctx.font = '600 14px Arial, Helvetica, sans-serif';
  ctx.fillText(fmtDateTicket(invoice.exit_time || invoice.entry_time), width / 2, y);
  y += 22;
  drawDottedLine(ctx, PAD, y, innerW);
  y += 20;

  const carSide = await loadImage(iconDataUrl(CAR_SIDE_SVG));
  ctx.textAlign = 'left';
  ctx.font = '700 13px Arial, Helvetica, sans-serif';
  ctx.drawImage(carSide, PAD + 8, y, 46, 28);
  ctx.fillText('→', PAD + 60, y + 8);
  ctx.fillText(`FROM : ${fmtTime12(invoice.entry_time)}`, PAD + 78, y + 8);
  y += 44;

  ctx.textAlign = 'center';
  ctx.font = '900 28px ui-monospace, Menlo, monospace';
  ctx.fillText(String(invoice.plate || '—'), width / 2, y);
  y += 38;

  ctx.textAlign = 'right';
  ctx.font = '700 13px Arial, Helvetica, sans-serif';
  ctx.fillText(`TO : ${fmtTime12(invoice.exit_time)}`, width - PAD - 78, y);
  ctx.textAlign = 'left';
  ctx.fillText('→', width - PAD - 72, y);
  ctx.drawImage(carSide, width - PAD - 54, y - 4, 46, 28);
  y += 40;

  ctx.textAlign = 'center';
  ctx.font = '800 24px Arial, Helvetica, sans-serif';
  ctx.fillText(fmtPaid(invoice.total_fee), width / 2, y);
  y += 28;

  ctx.font = '12px Arial, Helvetica, sans-serif';
  if (invoice.invoice_number) {
    ctx.fillText(`Invoice: ${invoice.invoice_number}`, width / 2, y);
    y += 16;
  }
  if (invoice.payment_method_name) {
    ctx.fillText(`Payment: ${invoice.payment_method_name}`, width / 2, y);
    y += 16;
  }
  ctx.fillText(
    `Duration: ${formatDuration(invoice.duration_minutes)} · Rate: ${formatETB(invoice.hourly_rate)}/hr`,
    width / 2,
    y,
  );
  y += 22;

  drawDottedLine(ctx, PAD, y, innerW);
  y += 16;
  drawBarcode(ctx, PAD + 10, y, innerW - 20, invoice.invoice_number || invoice.plate);
  y += 68;

  ctx.font = '800 12px Arial, Helvetica, sans-serif';
  ctx.fillText('THANK YOU AND LUCKY ROAD !', width / 2, y);

  return canvas;
}

export async function buildReceiptDataUrl(invoice) {
  const canvas = await renderReceiptCanvas(invoice);
  return canvas.toDataURL('image/png');
}

async function buildReceiptPngBlob(invoice) {
  const canvas = await renderReceiptCanvas(invoice);
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
  const dataUrl = await buildReceiptDataUrl(invoice);
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

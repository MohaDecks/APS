import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatETB, formatDuration, resolveAssetUrl } from './api';
import api from './api';
import { BRAND_NAME } from './brand';
import { getBranding, getBrandingLogoUri } from './branding';

const INK = '#111111';
const TICKET_W = 320;
const PAD = 22;

function fmtTime12(iso) {
  if (!iso) return '00:00 —';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '00:00 —';
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
}

function fmtDateLine(iso) {
  if (!iso) return 'Date: 00/00/00';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Date: 00/00/00';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `Date: ${mm}/${dd}/${yy}`;
}

function facilityInfo(invoice) {
  const branding = getBranding();
  const name = invoice?.facility_name || branding.facilityName || BRAND_NAME;
  return {
    name,
    contact: invoice?.payment_phone || '+251 —',
  };
}

function paymentLine(invoice) {
  if (!invoice.payment_method_name) return '';
  return `Payment: ${invoice.payment_method_name}`;
}

function ticketStylesHtml() {
  return `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    background: #dbeafe; padding: 32px;
    display: flex; justify-content: center;
  }
  .ticket {
    width: ${TICKET_W}px; background: #fff; color: ${INK};
    padding: ${PAD}px 18px 24px;
    box-shadow: 0 8px 28px rgba(0,0,0,0.15);
  }
  .hero {
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 10px;
  }
  .title {
    text-align: center; font-size: 15px; font-weight: 800;
    letter-spacing: 0.6px; margin: 4px 0 10px;
  }
  .rule { border: none; border-top: 1.5px solid ${INK}; margin: 0 0 14px; }
  .center { text-align: center; font-size: 13px; line-height: 1.55; margin-bottom: 2px; }
  .ticket-no { text-align: center; font-size: 13px; font-weight: 700; margin-top: 10px; }
  .cols-outer {
    position: relative; margin: 18px 0 16px; padding: 0 8px;
    border-left: 1.5px solid ${INK}; border-right: 1.5px solid ${INK};
  }
  .cols { display: flex; min-height: 150px; }
  .col { flex: 1; padding: 10px 8px; }
  .lbl { font-size: 13px; font-weight: 800; margin-bottom: 5px; display: block; }
  .val { font-size: 13px; font-weight: 500; margin-bottom: 2px; }
  .col-right { text-align: right; }
  .paid-lbl { font-size: 13px; font-weight: 800; margin-top: 20px; margin-bottom: 3px; }
  .paid-val { font-size: 16px; font-weight: 800; }
  .meta { text-align: center; font-size: 11px; color: #333; margin: 8px 0 10px; line-height: 1.4; }
  .logo-wide { width: 220px; height: 100px; object-fit: contain; margin: 0 auto 8px; display: block; }
  .thanks {
    text-align: center; font-size: 12px; font-weight: 800;
    letter-spacing: 0.3px; margin: 14px 0 12px;
  }
  .barcode {
    display: flex; justify-content: center; align-items: flex-end;
    height: 44px; gap: 2px;
  }
  .bar { background: ${INK}; }`;
}

function barcodeBars(code) {
  const src = String(code || '0000');
  const bars = [];
  let seed = src.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  for (let i = 0; i < 76; i += 1) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    bars.push({ h: 20 + (seed % 24), w: (seed % 3) === 0 ? 3 : 2 });
  }
  return bars;
}

export function getFacilityInfo(invoice) {
  return facilityInfo(invoice);
}

export function formatReceiptTime12(iso) {
  return fmtTime12(iso);
}

export function formatReceiptDateLine(iso) {
  return fmtDateLine(iso);
}

export function getBarcodeBars(code) {
  return barcodeBars(code);
}

export function getFacilityLogoUri(invoice) {
  return getBrandingLogoUri(invoice);
}

function barcodeHtml(code) {
  return barcodeBars(code)
    .map(({ h, w }) => `<span class="bar" style="height:${h}px;width:${w}px"></span>`)
    .join('');
}

export function buildReceiptHtml(invoice) {
  const { name, contact } = facilityInfo(invoice);
  const ticket = invoice.invoice_number || '0000000';
  const payLine = paymentLine(invoice);
  const logoUri = getFacilityLogoUri(invoice);
  const hasLogo = Boolean(logoUri);

  const heroHtml = hasLogo
    ? `<img class="logo-wide" src="${logoUri}" alt="Logo"/>`
    : '';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Receipt ${ticket}</title>
<style>${ticketStylesHtml()}</style></head>
<body>
  <div class="ticket">
    ${heroHtml}
    <div class="title">PARKING RECEIPT</div>
    <hr class="rule"/>
    ${hasLogo ? '' : `<p class="center">${name}</p>`}
    <p class="center">${contact}</p>
    <p class="ticket-no">Ticket#: ${ticket}</p>
    <div class="cols-outer">
      <div class="cols">
        <div class="col">
          <span class="lbl">Entry Time</span>
          <div class="val">${fmtTime12(invoice.entry_time)}</div>
          <div class="val">${fmtDateLine(invoice.entry_time)}</div>
          <span class="lbl" style="margin-top:16px">Duration</span>
          <div class="val">${formatDuration(invoice.duration_minutes)}</div>
        </div>
        <div class="col col-right">
          <span class="lbl">Exit Time</span>
          <div class="val">${fmtTime12(invoice.exit_time)}</div>
          <div class="val">${fmtDateLine(invoice.exit_time)}</div>
          <div class="paid-lbl">PAID:</div>
          <div class="paid-val">${formatETB(invoice.total_fee)}</div>
        </div>
      </div>
    </div>
    ${payLine ? `<p class="meta">${payLine}</p>` : ''}
    <div class="thanks">THANK YOU AND DRIVE SAFELY</div>
    <div class="barcode">${barcodeHtml(ticket)}</div>
  </div>
</body></html>`;
}

export function buildReceiptText(invoice) {
  const { name, contact } = facilityInfo(invoice);
  const ticket = invoice.invoice_number || '0000000';
  const lines = [
    'PARKING RECEIPT',
    name,
    contact,
    `Ticket#: ${ticket}`,
    `Plate: ${invoice.plate || '—'}`,
    'Entry Time',
    fmtTime12(invoice.entry_time),
    fmtDateLine(invoice.entry_time),
    `Duration: ${formatDuration(invoice.duration_minutes)}`,
    'Exit Time',
    fmtTime12(invoice.exit_time),
    fmtDateLine(invoice.exit_time),
    `PAID: ${formatETB(invoice.total_fee)}`,
  ];
  if (invoice.payment_method_name) {
    lines.push(`Payment: ${invoice.payment_method_name}`);
  }
  lines.push('THANK YOU AND DRIVE SAFELY');
  return lines.join('\n');
}

function pngFilenameFor(invoice) {
  const base = (invoice.invoice_number || invoice.plate || 'receipt').replace(/[^\w-]+/g, '_');
  return `${base}.png`;
}

export function getReceiptFilename(invoice) {
  return pngFilenameFor(invoice);
}

/** Synchronous save — must run inside click handler (before any await). */
export function triggerReceiptDownloadSync(dataUrl, filename) {
  if (Platform.OS !== 'web' || typeof document === 'undefined' || !dataUrl) return false;

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename || 'receipt.png';
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}

export function isInAppWebView() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  if (params.get('inApp') === '1' || params.get('embedded') === '1') return true;

  const ua = navigator.userAgent || '';
  if (/;\s*wv\)/i.test(ua) || /\bWebView\b/i.test(ua) || /flutter/i.test(ua)) return true;
  if (window.flutter_inappwebview || window.DirshayApp || window.dirshayApp) return true;
  if (window.Android?.saveReceipt || window.Android?.downloadFile) return true;
  if (window.webkit?.messageHandlers?.saveReceipt || window.webkit?.messageHandlers?.dirshay) return true;

  const isMobile = /iphone|ipad|ipod|android/i.test(ua);
  if (isMobile && typeof navigator.share !== 'function') return true;

  return false;
}

function loadImage(url) {
  return fetch(url, { mode: 'cors', credentials: 'omit' })
    .then((res) => {
      if (!res.ok) throw new Error(`Image fetch failed: ${url}`);
      return res.blob();
    })
    .then((blob) => {
      const objectUrl = URL.createObjectURL(blob);
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(img);
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error(`Image decode failed: ${url}`));
        };
        img.src = objectUrl;
      });
    });
}

function drawSolidLine(ctx, x, y, w) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
}

function drawBarcode(ctx, x, y, maxW, code) {
  let cx = x;
  const baseY = y + 44;
  ctx.fillStyle = INK;
  for (const { h, w } of barcodeBars(code)) {
    if (cx + w > x + maxW) break;
    ctx.fillRect(cx, baseY - h, w, h);
    cx += w + 2;
  }
}

async function renderReceiptCanvas(invoice, skipLogo = false) {
  const width = TICKET_W;
  const innerW = width - PAD * 2;
  const height = 540;
  const { name, contact } = facilityInfo(invoice);
  const ticket = invoice.invoice_number || '0000000';

  const canvas = document.createElement('canvas');
  const scale = 2;
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  ctx.scale(scale, scale);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  let y = PAD;

  const logoUri = skipLogo ? null : getFacilityLogoUri(invoice);
  let drewLogo = false;

  if (logoUri) {
    try {
      const logo = await loadImage(logoUri);
      const logoW = 220;
      const logoH = 100;
      ctx.drawImage(logo, (width - logoW) / 2, y, logoW, logoH);
      y += logoH + 12;
      drewLogo = true;
    } catch {
      /* logo unavailable — fall back to facility name */
    }
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.font = '800 14px Arial, Helvetica, sans-serif';
  ctx.fillText('PARKING RECEIPT', width / 2, y);
  y += 12;
  drawSolidLine(ctx, PAD, y, innerW);
  y += 18;

  ctx.font = '13px Arial, Helvetica, sans-serif';
  if (!drewLogo) {
    ctx.fillText(name, width / 2, y);
    y += 16;
  }
  ctx.fillText(contact, width / 2, y);
  y += 18;

  ctx.font = '700 13px Arial, Helvetica, sans-serif';
  ctx.fillText(`Ticket#: ${ticket}`, width / 2, y);
  y += 24;

  const colTop = y;
  const colH = 150;
  const sideX = PAD + 8;
  const sideW = innerW - 16;

  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(sideX, colTop);
  ctx.lineTo(sideX, colTop + colH);
  ctx.moveTo(sideX + sideW, colTop);
  ctx.lineTo(sideX + sideW, colTop + colH);
  ctx.stroke();

  const leftX = sideX + 10;
  const rightX = sideX + sideW - 10;

  ctx.textAlign = 'left';
  ctx.font = '800 12px Arial, Helvetica, sans-serif';
  ctx.fillText('Entry Time', leftX, colTop + 16);
  ctx.font = '500 12px Arial, Helvetica, sans-serif';
  ctx.fillText(fmtTime12(invoice.entry_time), leftX, colTop + 32);
  ctx.fillText(fmtDateLine(invoice.entry_time), leftX, colTop + 48);
  ctx.font = '800 12px Arial, Helvetica, sans-serif';
  ctx.fillText('Duration', leftX, colTop + 78);
  ctx.font = '500 12px Arial, Helvetica, sans-serif';
  ctx.fillText(formatDuration(invoice.duration_minutes), leftX, colTop + 94);

  ctx.textAlign = 'right';
  ctx.font = '800 12px Arial, Helvetica, sans-serif';
  ctx.fillText('Exit Time', rightX, colTop + 16);
  ctx.font = '500 12px Arial, Helvetica, sans-serif';
  ctx.fillText(fmtTime12(invoice.exit_time), rightX, colTop + 32);
  ctx.fillText(fmtDateLine(invoice.exit_time), rightX, colTop + 48);
  ctx.font = '800 12px Arial, Helvetica, sans-serif';
  ctx.fillText('PAID:', rightX, colTop + 88);
  ctx.font = '800 15px Arial, Helvetica, sans-serif';
  ctx.fillText(formatETB(invoice.total_fee), rightX, colTop + 106);

  y = colTop + colH + 12;
  ctx.textAlign = 'center';
  ctx.font = '11px Arial, Helvetica, sans-serif';
  const payLine = paymentLine(invoice);
  if (payLine) {
    ctx.fillText(payLine, width / 2, y);
    y += 16;
  }

  ctx.font = '800 11px Arial, Helvetica, sans-serif';
  ctx.fillText('THANK YOU AND DRIVE SAFELY', width / 2, y);
  y += 16;
  drawBarcode(ctx, PAD + 4, y, innerW - 8, ticket);

  return canvas;
}

export async function buildReceiptDataUrl(invoice) {
  return (await renderReceiptCanvas(invoice)).toDataURL('image/png');
}

async function buildReceiptPngBlob(invoice) {
  const attempt = async (skipLogo) => {
    const canvas = await renderReceiptCanvas(invoice, skipLogo);
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
            return;
          }
          try {
            const dataUrl = canvas.toDataURL('image/png');
            fetch(dataUrl)
              .then((r) => r.blob())
              .then(resolve)
              .catch(() => reject(new Error('Failed to create receipt image')));
          } catch {
            reject(new Error('Failed to create receipt image'));
          }
        },
        'image/png',
        1,
      );
    });
  };

  try {
    return await attempt(false);
  } catch {
    return attempt(true);
  }
}

/** Pre-generate receipt PNG (call after checkout so download is instant). */
export async function prepareReceiptBlob(invoice) {
  return buildReceiptPngBlob(invoice);
}

function shouldUseServerReceipt() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  const { hostname } = window.location;
  return hostname !== 'localhost' && hostname !== '127.0.0.1';
}

async function fetchReceiptPngFromApi(invoice) {
  const num = encodeURIComponent(invoice.invoice_number);
  const { data } = await api.get(`/invoices/number/${num}/receipt.png`, {
    responseType: 'arraybuffer',
    timeout: 30000,
  });
  return new Blob([data], { type: 'image/png' });
}

/** Pre-generate blob + dataUrl for instant synchronous download on button click. */
export async function prepareReceiptDownload(invoice) {
  if (shouldUseServerReceipt()) {
    const blob = await fetchReceiptPngFromApi(invoice);
    const dataUrl = await blobToDataUrl(blob);
    return {
      blob,
      dataUrl,
      filename: pngFilenameFor(invoice),
    };
  }

  const blob = await buildReceiptPngBlob(invoice);
  const dataUrl = await blobToDataUrl(blob);
  return {
    blob,
    dataUrl,
    filename: pngFilenameFor(invoice),
  };
}

async function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function downloadBlobWeb(blob, filename) {
  const dataUrl = await blobToDataUrl(blob);
  if (triggerReceiptDownloadSync(dataUrl, filename)) return;

  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
}

function isMobileWebBrowser() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod|android/i.test(navigator.userAgent);
}

async function shareBlobWeb(blob, filename, title) {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    throw new Error('Share unavailable');
  }
  const file = new File([blob], filename, { type: 'image/png' });
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
    () => window.Android?.saveReceipt?.(base64, filename),
    () => window.webkit?.messageHandlers?.saveReceipt?.postMessage(payload),
  ];

  for (const run of handlers) {
    try {
      const result = await run();
      if (result !== false) return true;
    } catch {
      /* next */
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
  if (Platform.OS === 'web' && navigator.clipboard?.writeText) {
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

async function deliverReceiptBlob(blob, invoice, cachedDataUrl) {
  const filename = pngFilenameFor(invoice);
  const dataUrl = cachedDataUrl || await blobToDataUrl(blob);

  if (isInAppWebView()) {
    const saved = await tryNativeAppSave(dataUrl, invoice);
    if (saved) return { action: 'saved', filename, dataUrl };
  }

  if (Platform.OS === 'web' && triggerReceiptDownloadSync(dataUrl, filename)) {
    return { action: 'saved', filename, dataUrl };
  }

  try {
    await downloadBlobWeb(blob, filename);
    return { action: 'saved', filename, dataUrl };
  } catch {
    /* fall through */
  }

  if (isMobileWebBrowser() && typeof navigator?.share === 'function') {
    try {
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Parking Receipt' });
        return { action: 'saved', filename, dataUrl };
      }
    } catch (err) {
      if (err?.name === 'AbortError') throw err;
    }
  }

  return { action: 'preview', dataUrl, filename, text: buildReceiptText(invoice) };
}

/** Download a pre-generated receipt PNG (keeps browser user-gesture for save). */
export async function downloadReceiptBlob(blob, invoice, dataUrl) {
  if (Platform.OS !== 'web') {
    return downloadReceipt(invoice);
  }
  return deliverReceiptBlob(blob, invoice, dataUrl);
}

/** Generate receipt PNG and save to device (download / share / native app). */
export async function saveReceiptPngFile(invoice) {
  if (Platform.OS !== 'web') {
    return downloadReceipt(invoice);
  }

  const blob = await buildReceiptPngBlob(invoice);
  return deliverReceiptBlob(blob, invoice);
}

async function saveReceiptImageWeb(invoice) {
  try {
    const result = await saveReceiptPngFile(invoice);
    if (result.action === 'saved') return result;
    return result;
  } catch (err) {
    if (err?.name === 'AbortError') return { action: 'cancelled' };
    const dataUrl = await buildReceiptDataUrl(invoice);
    return {
      action: 'preview',
      dataUrl,
      text: buildReceiptText(invoice),
      filename: pngFilenameFor(invoice),
    };
  }
}

async function sharePdfOnNative(html) {
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
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
  return 'Download Receipt';
}

export async function downloadReceipt(invoice) {
  if (Platform.OS === 'web') {
    return saveReceiptImageWeb(invoice);
  }
  return sharePdfOnNative(buildReceiptHtml(invoice));
}

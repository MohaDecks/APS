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

function filenameFor(invoice) {
  return `${invoice.invoice_number || invoice.plate || 'receipt'}.html`;
}

function isMobileWeb() {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod|android/i.test(navigator.userAgent);
}

function isIOSWeb() {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalonePwa() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    window.navigator.standalone === true
  );
}

/** Desktop browser — blob + <a download> works reliably. */
async function downloadOnDesktopWeb(html, invoice) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filenameFor(invoice);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Opens system print dialog — on iOS/PWA use "Save to Files" or "Save as PDF". */
function printReceiptWeb(html) {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;opacity:0;pointer-events:none';
    document.body.appendChild(iframe);

    const cleanup = () => {
      setTimeout(() => iframe.remove(), 1500);
    };

    const frameWindow = iframe.contentWindow;
    if (!frameWindow) {
      iframe.remove();
      reject(new Error('Print unavailable'));
      return;
    }

    frameWindow.document.open();
    frameWindow.document.write(html);
    frameWindow.document.close();

    const runPrint = () => {
      try {
        frameWindow.focus();
        frameWindow.print();
        cleanup();
        resolve();
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    if (frameWindow.document.readyState === 'complete') {
      runPrint();
    } else {
      iframe.onload = runPrint;
      setTimeout(runPrint, 400);
    }
  });
}

async function shareReceiptWeb(html, invoice) {
  const text = buildReceiptText(invoice);
  const name = filenameFor(invoice);

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    const candidates = [];
    if (typeof File !== 'undefined') {
      candidates.push(
        new File([html], name, { type: 'text/html' }),
        new File([text], name.replace(/\.html$/, '.txt'), { type: 'text/plain' }),
      );
    }

    for (const file of candidates) {
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'Parking Receipt', text });
          return;
        } catch (err) {
          if (err?.name === 'AbortError') return;
        }
      }
    }

    try {
      await navigator.share({ title: 'Parking Receipt', text });
      return;
    } catch (err) {
      if (err?.name === 'AbortError') return;
    }
  }

  throw new Error('Share unavailable');
}

async function downloadOrPrintOnMobileWeb(html, invoice) {
  // iOS and installed PWA cannot save via <a download> or window.open(blob:).
  if (isIOSWeb() || isStandalonePwa()) {
    await printReceiptWeb(html);
    return;
  }

  // Android: try native share sheet with file, then download link, then print.
  try {
    await shareReceiptWeb(html, invoice);
    return;
  } catch {
    /* fall through */
  }

  try {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filenameFor(invoice);
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  } catch {
    /* fall through */
  }

  await printReceiptWeb(html);
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
  if (Platform.OS !== 'web') return 'Save / Share Receipt';
  if (isMobileWeb() || isStandalonePwa()) {
    return isIOSWeb() ? 'Save Receipt (PDF)' : 'Save / Share Receipt';
  }
  return 'Download Receipt';
}

export async function downloadReceipt(invoice) {
  const html = buildReceiptHtml(invoice);

  if (Platform.OS === 'web') {
    if (isMobileWeb() || isStandalonePwa()) {
      await downloadOrPrintOnMobileWeb(html, invoice);
      return;
    }
    await downloadOnDesktopWeb(html, invoice);
    return;
  }

  await sharePdfOnNative(html);
}

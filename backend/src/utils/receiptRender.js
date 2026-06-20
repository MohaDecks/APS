import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { FACILITY_LOGO_DIR } from './upload.js';

const INK = '#111111';
const W = 640;
const H = 1080;

function fmtTime12(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '00:00 —';
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
}

function fmtDateLine(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Date: 00/00/00';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `Date: ${mm}/${dd}/${yy}`;
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function formatETB(amount) {
  return `ETB ${Number(amount).toFixed(2)}`;
}

function escapeXml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function logoDataUri(facilityLogoUrl) {
  if (!facilityLogoUrl?.includes('/api/uploads/facility/')) return null;
  const filename = path.basename(facilityLogoUrl);
  const filePath = path.join(FACILITY_LOGO_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  const ext = path.extname(filename).toLowerCase();
  const mime = ext === '.png' ? 'image/png'
    : ext === '.webp' ? 'image/webp'
      : ext === '.gif' ? 'image/gif'
        : ext === '.svg' ? 'image/svg+xml'
          : 'image/jpeg';
  const base64 = fs.readFileSync(filePath).toString('base64');
  return `data:${mime};base64,${base64}`;
}

function buildReceiptSvg(invoice) {
  const ticket = invoice.invoice_number || '0000000';
  const name = invoice.facility_name || 'Dirsh Parking';
  const contact = invoice.payment_phone || '+251 —';
  const logoUri = logoDataUri(invoice.facility_logo_url);
  const payLine = invoice.payment_method_name
    ? `Payment: ${invoice.payment_method_name}`
    : '';

  let y = 48;
  const logoBlock = logoUri
    ? `<image href="${logoUri}" x="${(W - 440) / 2}" y="${y}" width="440" height="200" preserveAspectRatio="xMidYMid meet"/>`
    : '';
  if (logoUri) y += 220;

  const nameBlock = logoUri
    ? ''
    : `<text x="${W / 2}" y="${y}" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" fill="${INK}">${escapeXml(name)}</text>`;

  if (!logoUri) y += 36;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  ${logoBlock}
  ${nameBlock}
  <text x="${W / 2}" y="${y + 40}" text-anchor="middle" font-family="Arial,sans-serif" font-size="32" font-weight="800" fill="${INK}">PARKING RECEIPT</text>
  <line x1="88" y1="${y + 58}" x2="${W - 88}" y2="${y + 58}" stroke="${INK}" stroke-width="3"/>
  <text x="${W / 2}" y="${y + 100}" text-anchor="middle" font-family="Arial,sans-serif" font-size="26" fill="${INK}">${escapeXml(contact)}</text>
  <text x="${W / 2}" y="${y + 140}" text-anchor="middle" font-family="Arial,sans-serif" font-size="26" font-weight="700" fill="${INK}">Ticket#: ${escapeXml(ticket)}</text>

  <rect x="88" y="${y + 170}" width="${W - 176}" height="300" fill="none" stroke="${INK}" stroke-width="3"/>
  <line x1="${W / 2}" y1="${y + 170}" x2="${W / 2}" y2="${y + 470}" stroke="${INK}" stroke-width="0"/>

  <text x="120" y="${y + 210}" font-family="Arial,sans-serif" font-size="24" font-weight="800" fill="${INK}">Entry Time</text>
  <text x="120" y="${y + 245}" font-family="Arial,sans-serif" font-size="24" fill="${INK}">${escapeXml(fmtTime12(invoice.entry_time))}</text>
  <text x="120" y="${y + 275}" font-family="Arial,sans-serif" font-size="24" fill="${INK}">${escapeXml(fmtDateLine(invoice.entry_time))}</text>
  <text x="120" y="${y + 330}" font-family="Arial,sans-serif" font-size="24" font-weight="800" fill="${INK}">Duration</text>
  <text x="120" y="${y + 365}" font-family="Arial,sans-serif" font-size="24" fill="${INK}">${escapeXml(formatDuration(invoice.duration_minutes))}</text>

  <text x="${W - 120}" y="${y + 210}" text-anchor="end" font-family="Arial,sans-serif" font-size="24" font-weight="800" fill="${INK}">Exit Time</text>
  <text x="${W - 120}" y="${y + 245}" text-anchor="end" font-family="Arial,sans-serif" font-size="24" fill="${INK}">${escapeXml(fmtTime12(invoice.exit_time))}</text>
  <text x="${W - 120}" y="${y + 275}" text-anchor="end" font-family="Arial,sans-serif" font-size="24" fill="${INK}">${escapeXml(fmtDateLine(invoice.exit_time))}</text>
  <text x="${W - 120}" y="${y + 340}" text-anchor="end" font-family="Arial,sans-serif" font-size="24" font-weight="800" fill="${INK}">PAID:</text>
  <text x="${W - 120}" y="${y + 385}" text-anchor="end" font-family="Arial,sans-serif" font-size="30" font-weight="800" fill="${INK}">${escapeXml(formatETB(invoice.total_fee))}</text>

  ${payLine ? `<text x="${W / 2}" y="${y + 510}" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" fill="#333">${escapeXml(payLine)}</text>` : ''}
  <text x="${W / 2}" y="${y + 560}" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" font-weight="800" fill="${INK}">THANK YOU AND DRIVE SAFELY</text>
</svg>`;
}

export async function renderReceiptPng(invoice) {
  const svg = buildReceiptSvg(invoice);
  return sharp(Buffer.from(svg)).png().toBuffer();
}

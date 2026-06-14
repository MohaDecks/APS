import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = join(__dirname, '../dist/index.html');

const base = (process.env.EXPO_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
const prefix = base || '';

const injections = `
    <link rel="manifest" href="${prefix}/manifest.json" />
    <link rel="apple-touch-icon" href="${prefix}/icons/apple-touch-icon.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Parking" />
    <meta name="mobile-web-app-capable" content="yes" />
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => navigator.serviceWorker.register('${prefix}/sw.js').catch(() => {}));
      }
    </script>`;

let html = readFileSync(htmlPath, 'utf8');
if (!html.includes('manifest.json')) {
  html = html.replace('</head>', `${injections}\n  </head>`);
  writeFileSync(htmlPath, html);
  console.log('PWA tags injected into dist/index.html');
} else {
  console.log('PWA tags already present');
}

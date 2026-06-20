import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '../dist');
const htmlPath = join(distDir, 'index.html');

const base = (process.env.EXPO_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
const prefix = base || '';

const injections = `
    <link rel="manifest" href="${prefix}/manifest.json" />
    <link rel="apple-touch-icon" href="${prefix}/icons/apple-touch-icon.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
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

// Fix manifest paths for /m/ subpath deployment
const manifestPath = join(distDir, 'manifest.json');
if (existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const p = prefix || '';
  manifest.start_url = `${p}/`;
  manifest.scope = `${p}/`;
  if (Array.isArray(manifest.icons)) {
    manifest.icons = manifest.icons.map((icon) => ({
      ...icon,
      src: icon.src.startsWith('/') ? `${p}${icon.src}` : icon.src,
    }));
  }
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log('manifest.json patched for base path:', p || '(root)');
}

// Bump cache every build so deployed PWA picks up new JS
const swPath = join(distDir, 'sw.js');
if (existsSync(swPath)) {
  let sw = readFileSync(swPath, 'utf8');
  const cacheName = `airport-parking-${Date.now()}`;
  sw = sw.replace(/const CACHE_NAME = '[^']+';/, `const CACHE_NAME = '${cacheName}';`);
  if (prefix) {
    const paths = [
      '/',
      '/manifest.json',
      '/icons/icon-192.png',
      '/icons/icon-512.png',
      '/icons/apple-touch-icon.png',
      '/favicon.png',
      '/offline.html',
    ];
    for (const path of paths) {
      sw = sw.replaceAll(`'${path}'`, `'${prefix}${path === '/' ? '/' : path}'`);
    }
  }
  writeFileSync(swPath, sw);
  console.log('sw.js cache busted:', cacheName);
}

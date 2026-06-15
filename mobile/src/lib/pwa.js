/** Web base path: '' on operator port; '/m' only for legacy paths. */
export function getWebBasePath() {
  if (typeof window === 'undefined') return '';
  const { pathname, port } = window.location;
  if (port === '8082') return '';
  if (pathname === '/m' || pathname.startsWith('/m/')) return '/m';
  return '';
}

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  const base = getWebBasePath();
  const swUrl = `${base}/sw.js`;

  window.addEventListener('load', async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        const scopePath = new URL(reg.scope).pathname;
        const wantScope = base ? `${base}/` : '/';
        if (scopePath !== wantScope && scopePath === '/') {
          await reg.unregister();
        }
      }
    } catch {
      /* ignore */
    }
    navigator.serviceWorker.register(swUrl).catch(() => {});
  });
}

export function ensurePwaMeta() {
  if (typeof document === 'undefined') return;

  const base = getWebBasePath();

  const tags = [
    { rel: 'manifest', href: `${base}/manifest.json` },
    { rel: 'apple-touch-icon', href: `${base}/icons/apple-touch-icon.png` },
  ];

  tags.forEach(({ rel, href }) => {
    if (!document.querySelector(`link[rel="${rel}"]`)) {
      const link = document.createElement('link');
      link.rel = rel;
      link.href = href;
      document.head.appendChild(link);
    }
  });

  const metas = [
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
    { name: 'apple-mobile-web-app-title', content: 'Parking' },
    { name: 'mobile-web-app-capable', content: 'yes' },
  ];

  metas.forEach(({ name, content }) => {
    if (!document.querySelector(`meta[name="${name}"]`)) {
      const meta = document.createElement('meta');
      meta.name = name;
      meta.content = content;
      document.head.appendChild(meta);
    }
  });
}

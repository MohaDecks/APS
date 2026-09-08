/** Web base path: root on the operator domain; '/m' only for legacy paths. */
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
  const scope = base ? `${base}/` : '/';

  const start = async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        const scopePath = new URL(reg.scope).pathname;
        if (scopePath !== scope && scopePath === '/') {
          await reg.unregister();
        }
      }
    } catch {
      /* ignore */
    }
    try {
      const reg = await navigator.serviceWorker.register(swUrl, { scope, updateViaCache: 'none' });
      await reg.update();
    } catch {
      /* ignore */
    }
  };

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
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
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
    { name: 'apple-mobile-web-app-title', content: 'Parking' },
    { name: 'mobile-web-app-capable', content: 'yes' },
    { name: 'theme-color', content: '#2563EB' },
  ];

  metas.forEach(({ name, content }) => {
    const existing = document.querySelector(`meta[name="${name}"]`);
    if (existing) {
      existing.setAttribute('content', content);
      return;
    }
    const meta = document.createElement('meta');
    meta.name = name;
    meta.content = content;
    document.head.appendChild(meta);
  });
}

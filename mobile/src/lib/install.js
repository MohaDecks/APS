import { Platform } from 'react-native';

let deferredPrompt = typeof window !== 'undefined' ? window.__deferredInstall || null : null;
const listeners = new Set();

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.navigator.standalone === true
  );
}

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribeInstall(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function isAppInstalled() {
  return isStandalone();
}

export function isIosWeb() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function canNativeInstall() {
  return !!deferredPrompt || !!(typeof window !== 'undefined' && window.__deferredInstall);
}

export function captureInstallEvents() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;

  if (window.__deferredInstall && !deferredPrompt) {
    deferredPrompt = window.__deferredInstall;
    notify();
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.__deferredInstall = e;
    notify();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    window.__deferredInstall = null;
    notify();
  });
}

export async function promptInstall() {
  if (isStandalone()) return { ok: true, installed: true, mode: 'already' };

  const event = deferredPrompt || (typeof window !== 'undefined' ? window.__deferredInstall : null);
  if (event) {
    try {
      event.prompt();
      const choice = await event.userChoice;
      deferredPrompt = null;
      window.__deferredInstall = null;
      notify();
      return {
        ok: choice.outcome === 'accepted',
        installed: choice.outcome === 'accepted',
        mode: 'native',
      };
    } catch {
      return { ok: false, installed: false, mode: 'help' };
    }
  }

  return { ok: false, installed: false, mode: 'help' };
}

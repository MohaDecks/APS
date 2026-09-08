import { Platform, Alert } from 'react-native';

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
  return !!deferredPrompt;
}

export function captureInstallEvents() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;

  if (window.__deferredInstall && !deferredPrompt) {
    deferredPrompt = window.__deferredInstall;
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.__deferredInstall = e;
    notify();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
}

export async function promptInstall() {
  if (isStandalone()) return { ok: true, installed: true };

  if (deferredPrompt) {
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    notify();
    return { ok: choice.outcome === 'accepted', installed: choice.outcome === 'accepted' };
  }

  if (isIosWeb()) {
    Alert.alert('Install app', 'Tap Share, then Add to Home Screen.');
    return { ok: false, installed: false };
  }

  Alert.alert('Install app', 'Open the browser menu and tap Install app / Add to Home screen.');
  return { ok: false, installed: false };
}

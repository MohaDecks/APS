import { Platform } from 'react-native';
import Constants from 'expo-constants';

/** Operator app port (local dev — separate from admin so browser sessions do not clash). */
export const OPERATOR_WEB_PORT = '8082';

export const APP_HOST = 'app.bildhaan.dirshay.com';
export const ADMIN_HOST = 'bildhaan.admin.dirshay.com';

function getApiUrl() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const { hostname, port, origin } = window.location;

    // Local dev — operator on 8082, API on 3001
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      if (port === OPERATOR_WEB_PORT || port === '8081' || port === '19006') {
        return `http://${hostname}:3001`;
      }
    }

    // Production (HTTPS subdomains) — nginx proxies /api on the same origin
    return origin;
  }

  if (Platform.OS === 'android') {
    return Constants.expoConfig?.extra?.apiUrl || 'http://10.0.2.2:3001';
  }

  return Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001';
}

export { getApiUrl };

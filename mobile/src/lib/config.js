import { Platform } from 'react-native';
import Constants from 'expo-constants';

/** Operator app port (separate from admin so browser sessions do not clash). */
export const OPERATOR_WEB_PORT = '8082';

function getApiUrl() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const { hostname, port, origin, protocol } = window.location;

    // Local dev — operator on 8082, API on 3001
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      if (port === OPERATOR_WEB_PORT || port === '8081' || port === '19006') {
        return `http://${hostname}:3001`;
      }
    }

    // Production operator port — API proxied on same port via nginx
    if (port === OPERATOR_WEB_PORT) {
      return origin;
    }

    // Legacy /m/ path on admin domain
    if (window.location.pathname.startsWith('/m')) {
      return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
    }

    const configured = Constants.expoConfig?.extra?.apiUrl;
    if (configured && configured !== 'http://localhost:3001') {
      return configured.replace(/\/$/, '');
    }

    return origin;
  }

  if (Platform.OS === 'android') {
    return Constants.expoConfig?.extra?.apiUrl || 'http://10.0.2.2:3001';
  }

  return Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001';
}

export { getApiUrl };

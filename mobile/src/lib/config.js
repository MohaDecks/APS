import { Platform } from 'react-native';
import Constants from 'expo-constants';

function getApiUrl() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const { hostname, port, origin } = window.location;
    // Local dev: Expo on 8081, API on 3001
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      if (port === '8081' || port === '19006' || port === '8082') {
        return `http://${hostname}:3001`;
      }
    }
    // Production: nginx proxies /api on same origin
    return origin;
  }
  if (Platform.OS === 'android') {
    return Constants.expoConfig?.extra?.apiUrl || 'http://10.0.2.2:3001';
  }
  return Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001';
}

export { getApiUrl };

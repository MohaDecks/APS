import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from './config';

const api = axios.create({ baseURL: `${getApiUrl()}/api`, timeout: 10000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

export function formatETB(amount) {
  return `ETB ${Number(amount).toFixed(2)}`;
}

export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export async function saveAuth(token, user) {
  await AsyncStorage.setItem('token', token);
  await AsyncStorage.setItem('user', JSON.stringify(user));
}

export async function clearAuth() {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('user');
}

export async function getUser() {
  const raw = await AsyncStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

export function resolveAssetUrl(path) {
  if (!path) return null;
  const base = getApiUrl().replace(/\/$/, '');

  if (path.startsWith('http')) {
    try {
      const parsed = new URL(path);
      if (parsed.pathname.startsWith('/api/uploads')) {
        return `${base}${parsed.pathname}${parsed.search}`;
      }
    } catch {
      /* keep original URL */
    }
    return path;
  }

  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

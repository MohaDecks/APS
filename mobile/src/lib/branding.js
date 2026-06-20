import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { resolveAssetUrl } from './api';

const CACHE_KEY = 'facility_branding';

let memory = {
  facilityName: 'Dirsh Parking',
  logoUrl: null,
  loaded: false,
};

export function getBranding() {
  return memory;
}

export function getBrandingLogoUri(invoice) {
  const fromInvoice = resolveAssetUrl(invoice?.facility_logo_url);
  if (fromInvoice) return fromInvoice;
  return memory.logoUrl || null;
}

export async function loadBranding(force = false) {
  if (memory.loaded && !force) return memory;

  if (!memory.logoUrl) {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        memory = {
          facilityName: cached.facilityName || 'Dirsh Parking',
          logoUrl: resolveAssetUrl(cached.logoPath),
          loaded: memory.loaded,
        };
      }
    } catch {
      /* ignore cache read errors */
    }
  }

  try {
    const { data } = await api.get('/settings/branding');
    memory = {
      facilityName: data.facility_name || 'Dirsh Parking',
      logoUrl: resolveAssetUrl(data.facility_logo_url),
      loaded: true,
    };
    await AsyncStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        facilityName: memory.facilityName,
        logoPath: data.facility_logo_url || null,
      }),
    );
  } catch {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        memory = {
          facilityName: cached.facilityName || 'Dirsh Parking',
          logoUrl: resolveAssetUrl(cached.logoPath),
          loaded: true,
        };
      }
    } catch {
      /* keep defaults */
    }
  }

  return memory;
}

export function splitFacilityName(name) {
  const trimmed = (name || 'Dirsh Parking').trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return {
      title: parts[0].toUpperCase(),
      subtitle: parts.slice(1).join(' ').toUpperCase(),
    };
  }
  return { title: trimmed.toUpperCase(), subtitle: 'PARKING' };
}

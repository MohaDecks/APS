import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from './api';

const BrandingContext = createContext({
  facilityName: 'Dirsh Parking',
  logoUrl: null,
  loaded: false,
  refreshBranding: async () => {},
});

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState({
    facilityName: 'Dirsh Parking',
    logoUrl: null,
    loaded: false,
  });

  const refreshBranding = useCallback(async () => {
    try {
      const { data } = await api.get('/settings/branding');
      setBranding({
        facilityName: data.facility_name || 'Dirsh Parking',
        logoUrl: data.facility_logo_url || null,
        loaded: true,
      });
    } catch {
      setBranding((b) => ({ ...b, loaded: true }));
    }
  }, []);

  useEffect(() => {
    refreshBranding();
  }, [refreshBranding]);

  return (
    <BrandingContext.Provider value={{ ...branding, refreshBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}

export async function loadBranding() {
  try {
    const { data } = await api.get('/settings/branding');
    return {
      facilityName: data.facility_name || 'Dirsh Parking',
      logoUrl: data.facility_logo_url || null,
      loaded: true,
    };
  } catch {
    return { facilityName: 'Dirsh Parking', logoUrl: null, loaded: false };
  }
}

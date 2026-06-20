import { useEffect, useState } from 'react';
import { getBranding, loadBranding } from '../lib/branding';

export function useBranding(force = false) {
  const [branding, setBranding] = useState(getBranding());

  useEffect(() => {
    let active = true;
    loadBranding(force).then((data) => {
      if (active) setBranding({ ...data });
    });
    return () => { active = false; };
  }, [force]);

  return branding;
}

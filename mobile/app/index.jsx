import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen from '../src/components/SplashScreen';
import { loadBranding } from '../src/lib/branding';
import { SPLASH_DURATION_MS } from '../src/lib/brand';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const started = Date.now();

    Promise.all([AsyncStorage.getItem('token'), loadBranding(true)]).then(([token]) => {
      const elapsed = Date.now() - started;
      const wait = Math.max(0, SPLASH_DURATION_MS - elapsed);

      setTimeout(() => {
        router.replace(token ? '/terminal' : '/login');
      }, wait);
    });
  }, [router]);

  return <SplashScreen />;
}

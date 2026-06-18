import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen from '../src/components/SplashScreen';

const SPLASH_MS = 2200;

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const started = Date.now();

    AsyncStorage.getItem('token').then((token) => {
      const elapsed = Date.now() - started;
      const wait = Math.max(0, SPLASH_MS - elapsed);

      setTimeout(() => {
        router.replace(token ? '/terminal' : '/login');
      }, wait);
    });
  }, [router]);

  return <SplashScreen />;
}

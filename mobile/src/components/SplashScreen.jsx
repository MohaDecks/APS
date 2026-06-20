import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SPLASH_BG, BRAND_RED } from '../lib/brand';
import { useBranding } from '../hooks/useBranding';

export default function SplashScreen() {
  const branding = useBranding(true);
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true }),
    ]).start();
  }, [fade, scale]);

  const { logoUrl, facilityName } = branding;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />
      <View style={styles.container}>
        <Animated.View style={[styles.brand, { opacity: fade, transform: [{ scale }] }]}>
          {logoUrl ? (
            <Image
              source={{ uri: logoUrl }}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel={facilityName || 'Dirsh Parking'}
            />
          ) : (
            <View style={styles.placeholder} />
          )}
        </Animated.View>
        <Animated.View style={[styles.footer, { opacity: fade }]}>
          <ActivityIndicator size="small" color={BRAND_RED} />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: SPLASH_BG,
  },
  glowTop: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(184, 6, 17, 0.12)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: 80,
    left: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(184, 6, 17, 0.07)',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  brand: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 220,
    height: 150,
    maxWidth: '100%',
  },
  placeholder: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  footer: {
    position: 'absolute',
    bottom: 48,
  },
});

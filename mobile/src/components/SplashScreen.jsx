import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SPLASH_BG, BRAND_BLUE, BRAND_BLUE_SOFT, BRAND_NAME } from '../lib/brand';
import { theme } from '../lib/theme';
import { useBranding } from '../hooks/useBranding';
import { splitFacilityName } from '../lib/branding';

export default function SplashScreen() {
  const branding = useBranding(true);
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 520, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 8, tension: 54, useNativeDriver: true }),
    ]).start();
  }, [fade, scale]);

  const { title, subtitle } = splitFacilityName(branding.facilityName || BRAND_NAME);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.orbTop} />
      <View style={styles.orbBottom} />
      <View style={styles.container}>
        <Animated.View style={[styles.brand, { opacity: fade, transform: [{ scale }] }]}>
          <View style={styles.mark}>
            <Text style={styles.markLetter}>P</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </Animated.View>
        <Animated.View style={[styles.footer, { opacity: fade }]}>
          <ActivityIndicator size="small" color={BRAND_BLUE} />
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
  orbTop: {
    position: 'absolute',
    top: -90,
    right: -50,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: BRAND_BLUE_SOFT,
    opacity: 0.7,
  },
  orbBottom: {
    position: 'absolute',
    bottom: 40,
    left: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#BFDBFE',
    opacity: 0.45,
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
  mark: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: BRAND_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    shadowColor: BRAND_BLUE,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8,
  },
  markLetter: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
    fontFamily: theme.font,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.dark,
    letterSpacing: 2.4,
    fontFamily: theme.font,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '700',
    color: BRAND_BLUE,
    letterSpacing: 4,
    fontFamily: theme.font,
  },
  footer: {
    position: 'absolute',
    bottom: 48,
  },
});

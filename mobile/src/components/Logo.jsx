import { View, Text, StyleSheet } from 'react-native';

export function LogoMark({ size = 72 }) {
  return (
    <View style={[styles.markOuter, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[styles.markInner, { width: size * 0.88, height: size * 0.88, borderRadius: size * 0.44 }]}>
        <Text style={[styles.markLetter, { fontSize: size * 0.42 }]}>P</Text>
      </View>
    </View>
  );
}

function LogoText({ centered, large }) {
  return (
    <View style={centered && styles.textCenter}>
      <Text style={[styles.title, large && styles.titleLarge]}>AIRPORT PARKING</Text>
      <Text style={[styles.subtitle, large && styles.subtitleLarge]}>VEHICLES SYSTEM</Text>
    </View>
  );
}

export default function Logo({ variant = 'compact' }) {
  if (variant === 'hero') {
    return (
      <View style={styles.hero}>
        <View style={styles.glow} />
        <LogoMark size={88} />
        <LogoText centered large />
      </View>
    );
  }

  const markSize = variant === 'full' ? 52 : 44;

  return (
    <View style={styles.row}>
      <LogoMark size={markSize} />
      <LogoText />
    </View>
  );
}

const styles = StyleSheet.create({
  markOuter: {
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  markInner: {
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  markLetter: {
    color: '#fff',
    fontWeight: '800',
    marginTop: -2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hero: {
    alignItems: 'center',
    gap: 18,
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: 8,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(37, 99, 235, 0.18)',
  },
  textCenter: {
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 1.2,
  },
  titleLarge: {
    fontSize: 22,
    letterSpacing: 1.6,
  },
  subtitle: {
    fontSize: 8,
    fontWeight: '700',
    color: '#2563eb',
    letterSpacing: 2,
    marginTop: 4,
  },
  subtitleLarge: {
    fontSize: 10,
    marginTop: 6,
  },
});

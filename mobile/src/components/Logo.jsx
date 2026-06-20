import { View, Text, Image, StyleSheet } from 'react-native';
import { getBranding, splitFacilityName } from '../lib/branding';

function LogoText({ centered, large, dark, facilityName }) {
  const { title, subtitle } = splitFacilityName(facilityName);
  return (
    <View style={centered && styles.textCenter}>
      <Text style={[styles.title, large && styles.titleLarge, dark && styles.titleDark]}>
        {title}
      </Text>
      <Text style={[styles.subtitle, large && styles.subtitleLarge, dark && styles.subtitleDark]}>
        {subtitle}
      </Text>
    </View>
  );
}

export default function Logo({ variant = 'compact', theme: colorTheme = 'light', logoUri, facilityName }) {
  const dark = colorTheme === 'dark';
  const branding = getBranding();
  const resolvedLogo = logoUri ?? branding.logoUrl;
  const resolvedName = facilityName ?? branding.facilityName;

  if (resolvedLogo && variant === 'hero') {
    return (
      <View style={styles.hero}>
        <Image
          source={{ uri: resolvedLogo }}
          style={styles.heroBrandLogo}
          resizeMode="contain"
          accessibilityLabel={resolvedName}
        />
      </View>
    );
  }

  if (variant === 'hero') {
    return (
      <View style={styles.hero}>
        <LogoText centered large dark={dark} facilityName={resolvedName} />
      </View>
    );
  }

  const markSize = variant === 'full' ? 56 : 44;

  if (resolvedLogo) {
    return (
      <View style={styles.row}>
        <Image
          source={{ uri: resolvedLogo }}
          style={[styles.inlineLogo, { height: markSize }]}
          resizeMode="contain"
          accessibilityLabel={resolvedName}
        />
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <LogoText dark={dark} facilityName={resolvedName} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hero: {
    alignItems: 'center',
    gap: 20,
  },
  heroBrandLogo: {
    width: 260,
    height: 220,
    maxWidth: '100%',
  },
  inlineLogo: {
    width: 160,
    maxWidth: '100%',
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
  titleDark: {
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 8,
    fontWeight: '700',
    color: '#dc2626',
    letterSpacing: 2,
    marginTop: 4,
  },
  subtitleLarge: {
    fontSize: 10,
    marginTop: 6,
    letterSpacing: 2.4,
  },
  subtitleDark: {
    color: '#fca5a5',
  },
});

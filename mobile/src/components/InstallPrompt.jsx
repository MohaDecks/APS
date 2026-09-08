import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import {
  captureInstallEvents,
  promptInstall,
  isAppInstalled,
  subscribeInstall,
} from '../lib/install';

export function setupInstallCapture() {
  captureInstallEvents();
}

export default function InstallButton({ compact = false }) {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    const sync = () => setHidden(isAppInstalled());
    sync();
    return subscribeInstall(sync);
  }, []);

  if (Platform.OS !== 'web' || hidden) return null;

  return (
    <TouchableOpacity
      style={[styles.btn, compact && styles.btnCompact]}
      onPress={() => promptInstall()}
      activeOpacity={0.85}
    >
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>⬇</Text>
      </View>
      <Text style={styles.text}>Install app</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  btnCompact: {
    paddingVertical: 12,
    flex: 1,
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { color: '#fff', fontSize: 12, fontWeight: '800' },
  text: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal, Pressable } from 'react-native';
import {
  captureInstallEvents,
  promptInstall,
  isAppInstalled,
  subscribeInstall,
  isIosWeb,
  canNativeInstall,
} from '../lib/install';

export function setupInstallCapture() {
  captureInstallEvents();
}

export default function InstallButton({ compact = false }) {
  const [hidden, setHidden] = useState(false);
  const [help, setHelp] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    const sync = () => {
      setHidden(isAppInstalled());
      setReady(canNativeInstall());
    };
    sync();
    return subscribeInstall(sync);
  }, []);

  if (Platform.OS !== 'web' || hidden) return null;

  const onPress = async () => {
    try {
      const result = await promptInstall();
      if (result.mode === 'help') {
        if (/android/i.test(navigator.userAgent)) {
          window.location.href = 'https://app.bildhaan.dirshay.com/install.html';
          return;
        }
        setHelp(true);
      }
    } catch {
      window.location.href = '/install.html';
    }
  };

  const ios = isIosWeb();

  return (
    <>
      <TouchableOpacity
        style={[styles.btn, compact && styles.btnCompact]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>⬇</Text>
        </View>
        <Text style={styles.text}>{ready ? 'Install app' : 'Install app'}</Text>
      </TouchableOpacity>

      <Modal visible={help} transparent animationType="fade" onRequestClose={() => setHelp(false)}>
        <Pressable style={styles.overlay} onPress={() => setHelp(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation?.()}>
            <Text style={styles.sheetTitle}>Install Bildhaan Parking</Text>
            {ios ? (
              <>
                <Text style={styles.step}>1. Taabo Share (↑) hoosta Safari</Text>
                <Text style={styles.step}>2. Taabo Add to Home Screen</Text>
                <Text style={styles.step}>3. Taabo Add</Text>
              </>
            ) : (
              <>
                <Text style={styles.step}>1. Taabo menu-ga browser-ka (⋮ ama ⋯)</Text>
                <Text style={styles.step}>2. Dooro Install app ama Add to Home screen</Text>
                <Text style={styles.step}>3. Taabo Install</Text>
                <Text style={styles.hint}>Isticmaal Chrome + HTTPS: https://app.bildhaan.dirshay.com</Text>
              </>
            )}
            <TouchableOpacity style={styles.ok} onPress={() => setHelp(false)}>
              <Text style={styles.okText}>OK</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 28,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  step: {
    fontSize: 15,
    color: '#334155',
    marginBottom: 8,
    lineHeight: 22,
  },
  hint: {
    fontSize: 13,
    color: '#2563EB',
    marginTop: 6,
    marginBottom: 8,
  },
  ok: {
    marginTop: 16,
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  okText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

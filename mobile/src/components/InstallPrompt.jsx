import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useBranding } from '../hooks/useBranding';

export default function InstallPrompt() {
  const branding = useBranding();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    if (ios) {
      const dismissedBefore = localStorage.getItem('pwa-install-dismissed');
      if (!dismissedBefore) setVisible(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pwa-install-dismissed', '1');
    }
  };

  if (Platform.OS !== 'web' || !visible || dismissed) return null;

  return (
    <View style={styles.banner}>
      <View style={styles.content}>
        <Text style={styles.emoji}>📲</Text>
        <View style={styles.textWrap}>
          <Text style={styles.title}>Install {branding.facilityName || 'Dirsh Parking'}</Text>
          <Text style={styles.subtitle}>
            {isIOS
              ? 'Tap Share → Add to Home Screen'
              : 'Add to your home screen for quick access'}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        {!isIOS && deferredPrompt && (
          <TouchableOpacity style={styles.installBtn} onPress={handleInstall}>
            <Text style={styles.installText}>Install</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss}>
          <Text style={styles.dismissText}>{isIOS ? 'Got it' : 'Later'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: Platform.OS === 'web' ? 'absolute' : 'relative',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 200,
    backgroundColor: '#121212',
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: Platform.OS === 'web' ? 10 : 48,
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  emoji: { fontSize: 28 },
  textWrap: { flex: 1 },
  title: { color: '#fff', fontSize: 14, fontWeight: '700' },
  subtitle: { color: '#aaa', fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  installBtn: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  installText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  dismissBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  dismissText: { color: '#888', fontSize: 13 },
});

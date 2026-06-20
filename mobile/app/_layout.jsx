import { useEffect } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppShell from '../src/components/AppShell';
import InstallPrompt from '../src/components/InstallPrompt';
import { registerServiceWorker, ensurePwaMeta } from '../src/lib/pwa';
import { loadBranding } from '../src/lib/branding';
import { theme } from '../src/lib/theme';

export default function RootLayout() {
  useEffect(() => {
    loadBranding();
    if (Platform.OS === 'web') {
      ensurePwaMeta();
      registerServiceWorker();
    }
  }, []);

  return (
    <SafeAreaProvider>
      <AppShell>
        <View style={styles.root}>
          <InstallPrompt />
          <View style={styles.content}>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="terminal" />
              <Stack.Screen name="invoice" options={{ presentation: 'modal' }} />
            </Stack>
          </View>
        </View>
      </AppShell>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', backgroundColor: theme.bg },
  content: { flex: 1, width: '100%' },
});

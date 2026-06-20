import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api, { saveAuth } from '../src/lib/api';
import { theme } from '../src/lib/theme';
import { SPLASH_BG, BRAND_RED, BRAND_RED_DARK } from '../src/lib/brand';
import { useBranding } from '../src/hooks/useBranding';

const webInput = Platform.OS === 'web' ? { outlineStyle: 'none' } : {};

export default function Login() {
  const branding = useBranding();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!username.trim() || !password) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { username: username.trim(), password });
      if (data.user.role !== 'operator') {
        Alert.alert('Access Denied', 'Admin accounts use the web portal. Operators only.');
        return;
      }
      await saveAuth(data.token, data.user);
      router.replace('/terminal');
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.error || 'Check your credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.panel}>
            {branding.logoUrl ? (
              <View style={styles.logoWrap}>
                <Image
                  source={{ uri: branding.logoUrl }}
                  style={styles.logo}
                  resizeMode="contain"
                  accessibilityLabel={branding.facilityName}
                />
              </View>
            ) : (
              <Text style={styles.fallbackTitle}>{branding.facilityName || 'Dirsh Parking'}</Text>
            )}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Operator sign in</Text>
              <Text style={styles.cardHint}>Enter your credentials to continue</Text>

              <Text style={styles.label}>User name</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="User name"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                autoCorrect={false}
                {...webInput}
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                {...webInput}
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.buttonText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: SPLASH_BG,
  },
  flex: { flex: 1 },
  glowTop: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(184, 6, 17, 0.14)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: 40,
    left: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(184, 6, 17, 0.08)',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  panel: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 28,
    paddingHorizontal: 12,
  },
  logo: {
    width: 200,
    height: 130,
    maxWidth: '100%',
  },
  fallbackTitle: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 28,
    fontFamily: theme.font,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 24,
    ...Platform.select({
      web: { boxShadow: '0 16px 48px rgba(0,0,0,0.35)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 10,
      },
    }),
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    fontFamily: theme.font,
  },
  cardHint: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 22,
    fontFamily: theme.font,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontFamily: theme.font,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 8,
    fontFamily: theme.font,
    ...webInput,
  },
  button: {
    backgroundColor: BRAND_RED,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    ...Platform.select({
      web: { boxShadow: `0 8px 20px ${BRAND_RED}55` },
      default: {
        shadowColor: BRAND_RED,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 4,
      },
    }),
  },
  buttonDisabled: { opacity: 0.55 },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
    fontFamily: theme.font,
  },
});

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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api, { saveAuth } from '../src/lib/api';
import { theme } from '../src/lib/theme';
import { BRAND_BLUE, BRAND_BLUE_SOFT, BRAND_NAME } from '../src/lib/brand';
import { useBranding } from '../src/hooks/useBranding';
import { splitFacilityName } from '../src/lib/branding';

const webInput = Platform.OS === 'web' ? { outlineStyle: 'none' } : {};

export default function Login() {
  const branding = useBranding();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { title, subtitle } = splitFacilityName(branding.facilityName || BRAND_NAME);

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
      <View style={styles.orbTop} />
      <View style={styles.orbBottom} />

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
            <View style={styles.brandBlock}>
              <View style={styles.mark}>
                <Text style={styles.markLetter}>P</Text>
              </View>
              <Text style={styles.brandTitle}>{title}</Text>
              <Text style={styles.brandSub}>{subtitle}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Operator sign in</Text>
              <Text style={styles.cardHint}>Enter your credentials to continue</Text>

              <Text style={styles.label}>User name</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="User name"
                placeholderTextColor="#94A3B8"
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
                placeholderTextColor="#94A3B8"
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
    backgroundColor: theme.bg,
  },
  flex: { flex: 1 },
  orbTop: {
    position: 'absolute',
    top: -70,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: BRAND_BLUE_SOFT,
    opacity: 0.75,
  },
  orbBottom: {
    position: 'absolute',
    bottom: 20,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#BFDBFE',
    opacity: 0.4,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 28,
  },
  panel: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: 26,
  },
  mark: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: BRAND_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: BRAND_BLUE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  markLetter: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    fontFamily: theme.font,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.dark,
    letterSpacing: 2,
    fontFamily: theme.font,
  },
  brandSub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: BRAND_BLUE,
    letterSpacing: 3.5,
    fontFamily: theme.font,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: '#E0EAFF',
    ...Platform.select({
      web: { boxShadow: '0 18px 40px rgba(37, 99, 235, 0.12)' },
      default: {
        shadowColor: BRAND_BLUE,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 8,
      },
    }),
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.dark,
    textAlign: 'center',
    fontFamily: theme.font,
  },
  cardHint: {
    fontSize: 14,
    color: theme.label,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 22,
    fontFamily: theme.font,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.label,
    marginBottom: 8,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontFamily: theme.font,
  },
  input: {
    backgroundColor: '#F8FAFF',
    borderWidth: 1.5,
    borderColor: '#DCE7FF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.dark,
    marginBottom: 8,
    fontFamily: theme.font,
    ...webInput,
  },
  button: {
    backgroundColor: BRAND_BLUE,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    ...Platform.select({
      web: { boxShadow: '0 10px 22px rgba(37, 99, 235, 0.32)' },
      default: {
        shadowColor: BRAND_BLUE,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
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

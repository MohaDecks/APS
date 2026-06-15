import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api, { saveAuth } from '../src/lib/api';
import { theme } from '../src/lib/theme';
import Logo from '../src/components/Logo';

const webInput = Platform.OS === 'web' ? { outlineStyle: 'none' } : {};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
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
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Logo variant="hero" />
          <Text style={styles.subtitle}>Operator sign in</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="operator@parking.com"
            placeholderTextColor={theme.label}
            keyboardType="email-address"
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
            placeholderTextColor={theme.label}
            secureTextEntry
            {...webInput}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: theme.space.lg },
  header: { alignItems: 'center', marginBottom: 36 },
  subtitle: { fontSize: 16, color: theme.label, marginTop: 20, fontFamily: theme.font },
  form: {
    backgroundColor: theme.surface,
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
  },
  label: { fontSize: 13, color: theme.label, marginBottom: 6, marginTop: 12, fontFamily: theme.font },
  input: {
    backgroundColor: theme.bg,
    borderRadius: theme.radius.sm,
    padding: 16,
    fontSize: 17,
    color: theme.dark,
    fontFamily: theme.font,
    ...webInput,
  },
  button: {
    backgroundColor: theme.blue,
    borderRadius: theme.radius.md,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600', fontFamily: theme.font },
});

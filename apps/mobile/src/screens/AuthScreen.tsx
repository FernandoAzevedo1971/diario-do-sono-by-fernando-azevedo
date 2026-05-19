import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { AppBackground } from '../components/AppBackground';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { isFirebaseConfigured, loginWithEmail, registerWithEmail, requestPasswordReset } from '../services/authService';
import { colors, spacing } from '../theme/tokens';
import type { AuthenticatedUser } from '../types';

export function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: AuthenticatedUser) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError('Informe email e senha.');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }

    try {
      setLoading(true);
      const authenticatedUser = mode === 'register' ? await registerWithEmail(email, password) : await loginWithEmail(email, password);
      onAuthenticated(authenticatedUser);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Não foi possível autenticar.');
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    setError(null);
    setSuccess(null);

    if (!email) {
      setError('Informe seu email para recuperar a senha.');
      return;
    }

    try {
      await requestPasswordReset(email);

      if (isFirebaseConfigured()) {
        setSuccess('Email de recuperação enviado. Verifique sua caixa de entrada.');
      } else {
        setSuccess('Modo local: recuperação disponível após configurar o Firebase.');
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Não foi possível enviar recuperação.');
    }
  }

  return (
    <AppBackground>
      <View style={styles.container}>
        <Text style={styles.title}>{mode === 'register' ? 'Criar conta' : 'Entrar'}</Text>
        <Text style={styles.subtitle}>Use email e senha para proteger seus registros.</Text>
        <GlassCard style={styles.card}>
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.textMuted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <TextInput style={styles.input} placeholder="Senha" placeholderTextColor={colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry />
          {mode === 'register' ? <TextInput style={styles.input} placeholder="Confirmar senha" placeholderTextColor={colors.textMuted} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry /> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>{success}</Text> : null}
          {!isFirebaseConfigured() ? <Text style={styles.notice}>Firebase ainda não configurado: usando modo local de desenvolvimento.</Text> : null}
          <PrimaryButton label={loading ? 'Aguarde...' : mode === 'register' ? 'Criar conta' : 'Entrar'} onPress={submit} disabled={loading} />
          <PrimaryButton label={mode === 'register' ? 'Já tenho conta' : 'Criar nova conta'} variant="secondary" onPress={() => setMode(mode === 'register' ? 'login' : 'register')} />
          {mode === 'login' ? <PrimaryButton label="Esqueci minha senha" variant="secondary" onPress={resetPassword} /> : null}
        </GlassCard>
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', gap: spacing.sm },
  title: { color: colors.text, fontSize: 22, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  card: { gap: spacing.sm },
  input: { minHeight: 42, borderRadius: 10, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.06)' },
  error: { color: colors.sunrise, lineHeight: 20 },
  success: { color: '#4ade80', lineHeight: 20 },
  notice: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
});

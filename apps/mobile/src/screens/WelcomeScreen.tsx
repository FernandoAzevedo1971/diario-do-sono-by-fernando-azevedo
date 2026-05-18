import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppBackground } from '../components/AppBackground';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, spacing } from '../theme/tokens';

export function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <AppBackground>
      <View style={styles.container}>
        <Text style={styles.moon}>☾</Text>
        <Text style={styles.title}>DIÁRIO DO SONO</Text>
        <Text style={styles.subtitle}>Seu registro diário para entender melhor seu sono</Text>
        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>Bem-vindo</Text>
          <Text style={styles.cardText}>
            Registre sua percepção do sono pela manhã, acompanhe médias e gere relatórios para seu médico.
          </Text>
          <PrimaryButton label="Começar" onPress={onStart} />
        </GlassCard>
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', gap: spacing.lg },
  moon: { color: colors.sunrise, fontSize: 70, textAlign: 'center' },
  title: { color: colors.text, fontSize: 32, fontWeight: '900', textAlign: 'center', letterSpacing: 1.5 },
  subtitle: { color: colors.textMuted, fontSize: 17, textAlign: 'center', lineHeight: 24 },
  card: { gap: spacing.md },
  cardTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
  cardText: { color: colors.textMuted, fontSize: 16, lineHeight: 23 },
});

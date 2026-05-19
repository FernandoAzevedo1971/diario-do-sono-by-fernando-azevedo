import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppBackground } from '../components/AppBackground';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, spacing } from '../theme/tokens';

export function WelcomeScreen({ onStart, isReturning = false }: { onStart: () => void; isReturning?: boolean }) {
  return (
    <AppBackground>
      <View style={styles.container}>
        <Text style={styles.moon}>☾</Text>
        <Text style={styles.title}>DIÁRIO DO SONO</Text>
        <Text style={styles.subtitle}>Seu registro diário para entender melhor seu sono</Text>
        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>{isReturning ? 'Bem-vindo de volta' : 'Bem-vindo'}</Text>
          <Text style={styles.cardText}>
            {isReturning
              ? 'Pronto para registrar sua noite de hoje?'
              : 'Registre sua percepção do sono pela manhã, acompanhe médias e gere relatórios para seu médico.'}
          </Text>
          <PrimaryButton label={isReturning ? 'Continuar' : 'Começar'} onPress={onStart} />
        </GlassCard>
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', gap: spacing.md },
  moon: { color: colors.sunrise, fontSize: 50, textAlign: 'center' },
  title: { color: colors.text, fontSize: 24, fontWeight: '900', textAlign: 'center', letterSpacing: 1.5 },
  subtitle: { color: colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  card: { gap: spacing.sm },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  cardText: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
});

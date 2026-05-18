import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { AppBackground } from '../components/AppBackground';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, spacing } from '../theme/tokens';

export function IsiPromptScreen({ onAnswerNow, onLater }: { onAnswerNow: () => void; onLater: () => void }) {
  return (
    <AppBackground>
      <GlassCard style={styles.card}>
        <Text style={styles.title}>Avalie sua insônia</Text>
        <Text style={styles.text}>
          Antes de começar, que tal responder ao Índice de Gravidade de Insônia? Ele ajuda a acompanhar seus sintomas ao longo do tempo.
        </Text>
        <PrimaryButton label="Responder agora" onPress={onAnswerNow} />
        <PrimaryButton label="Responder depois" variant="secondary" onPress={onLater} />
      </GlassCard>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 'auto', marginBottom: 'auto', gap: spacing.md },
  title: { color: colors.text, fontSize: 28, fontWeight: '900' },
  text: { color: colors.textMuted, fontSize: 16, lineHeight: 24 },
});

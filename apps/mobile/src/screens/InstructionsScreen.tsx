import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { AppBackground } from '../components/AppBackground';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, spacing } from '../theme/tokens';

export function InstructionsScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <AppBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Instruções</Text>
        <GlassCard style={styles.card}>
          <Text style={styles.text}>
            COMPLETE UMA COLUNA DO DIÁRIO A CADA MANHÃ, LOGO QUE SE LEVANTAR, a fim de registrar de modo mais fidedigno o seu repouso. É extremamente importante que possa fornecer sua impressão e percepção, além de vigiar o relógio para acertar as horas. Não se esqueça de preencher o horário o mais preciso que puder. A sua estimativa é importante e é o que procuramos com este diário, mas procure não adquirir o hábito de pausar a noite para vigiar o relógio.
          </Text>
          <PrimaryButton label="Entendi, começar" onPress={onContinue} />
        </GlassCard>
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', gap: spacing.md },
  title: { color: colors.text, fontSize: 22, fontWeight: '900' },
  card: { gap: spacing.md },
  text: { color: colors.text, fontSize: 14, lineHeight: 21 },
});

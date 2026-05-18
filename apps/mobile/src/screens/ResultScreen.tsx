import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { calculateSleepDiaryAverages, formatDuration } from '@diario-do-sono/core';
import { AppBackground } from '../components/AppBackground';
import { GlassCard } from '../components/GlassCard';
import { MetricCard } from '../components/MetricCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, spacing } from '../theme/tokens';
import type { SleepDiaryEntry } from '../types';

export function ResultScreen({ entry, entries, onFinish, onAddAnother }: {
  entry: SleepDiaryEntry;
  entries: SleepDiaryEntry[];
  onFinish: () => void;
  onAddAnother: () => void;
}) {
  const averages = calculateSleepDiaryAverages(entries.map((currentEntry) => currentEntry.metrics));

  return (
    <AppBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Resultado do dia</Text>
        <GlassCard style={styles.hero}>
          <Text style={styles.heroLabel}>Eficiência do sono</Text>
          <Text style={styles.heroValue}>{entry.metrics.sleepEfficiencyPercent}%</Text>
        </GlassCard>
        <View style={styles.metrics}>
          <MetricCard label="TTS calculado" value={formatDuration(entry.metrics.ttsCalculatedMinutes)} />
          <MetricCard label="TTS percebido" value={formatDuration(entry.metrics.ttsPerceivedMinutes)} />
          <MetricCard label="TTC" value={formatDuration(entry.metrics.ttcMinutes)} />
          <MetricCard label="LIS" value={`${entry.metrics.lisMinutes} min`} />
          <MetricCard label="WASO" value={`${entry.metrics.wasoMinutes} min`} />
          <MetricCard label="Fragmentação" value={`${entry.metrics.fragmentationCount}`} />
        </View>
        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>VALOR MÉDIO DE {averages.daysCount} DIA{averages.daysCount === 1 ? '' : 'S'} DE PREENCHIMENTO</Text>
          <View style={styles.metrics}>
            <MetricCard label="Eficiência média" value={`${averages.sleepEfficiencyPercent}%`} />
            <MetricCard label="TTS calc. médio" value={formatDuration(averages.ttsCalculatedMinutes)} />
            <MetricCard label="TTS perc. médio" value={formatDuration(averages.ttsPerceivedMinutes)} />
            <MetricCard label="WASO médio" value={`${averages.wasoMinutes} min`} />
            <MetricCard label="LIS médio" value={`${averages.lisMinutes} min`} />
            <MetricCard label="Despertares" value={`${averages.fragmentationCount}`} />
          </View>
        </GlassCard>
        <PrimaryButton label="Inserir mais um dia" onPress={onAddAnother} />
        <PrimaryButton label="Encerrar para amanhã" variant="secondary" onPress={onFinish} />
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingBottom: spacing.xl },
  title: { color: colors.text, fontSize: 30, fontWeight: '900' },
  hero: { alignItems: 'center', gap: spacing.sm, backgroundColor: 'rgba(109,93,246,0.22)' },
  heroLabel: { color: colors.textMuted, fontSize: 16 },
  heroValue: { color: colors.text, fontSize: 58, fontWeight: '900' },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  card: { gap: spacing.md },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
});

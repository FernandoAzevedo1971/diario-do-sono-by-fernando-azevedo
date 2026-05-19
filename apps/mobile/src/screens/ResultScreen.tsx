import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { calculateSleepDiaryAverages, formatDuration } from '@diario-do-sono/core';
import { AppBackground } from '../components/AppBackground';
import { GlassCard } from '../components/GlassCard';
import { MetricCard } from '../components/MetricCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { SleepTimeline } from '../components/SleepTimeline';
import { colors, spacing } from '../theme/tokens';
import type { SleepDiaryEntry } from '../types';

const SLEEP_QUALITY_LABEL: Record<string, string> = {
  good: 'Boa',
  regular: 'Regular',
  bad: 'Ruim',
};

const FEELING_LABEL: Record<string, string> = {
  rested: 'Descansado',
  tired: 'Cansado',
  sleepy: 'Sonolento',
};

export function ResultScreen({ entry, entries, onFinish, onAddAnother, onSummary }: {
  entry: SleepDiaryEntry;
  entries: SleepDiaryEntry[];
  onFinish: () => void;
  onAddAnother: () => void;
  onSummary: () => void;
}) {
  const averages = calculateSleepDiaryAverages(entries.map((e) => ({ input: e.input, metrics: e.metrics })));
  const { input, metrics } = entry;

  return (
    <AppBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Resultado do dia</Text>

        {/* Sleep timeline visualization */}
        <GlassCard style={styles.timelineCard}>
          <SleepTimeline
            bedTime={input.bedTime}
            sleepLatencyMinutes={input.sleepLatencyMinutes}
            nightAwakeningsCount={input.nightAwakeningsCount}
            wasoMinutes={input.wasoMinutes}
            finalWakeTime={input.finalWakeTime}
            outOfBedLatencyMinutes={input.outOfBedLatencyMinutes}
            outOfBedTime={metrics.outOfBedTime}
          />
        </GlassCard>

        {/* Efficiency hero */}
        <GlassCard style={styles.hero}>
          <Text style={styles.heroLabel}>Eficiência do sono</Text>
          <Text style={styles.heroValue}>{metrics.sleepEfficiencyPercent}%</Text>
        </GlassCard>

        <View style={styles.metrics}>
          <MetricCard label="TTS calculado" value={formatDuration(metrics.ttsCalculatedMinutes)} />
          <MetricCard label="TTS percebido" value={formatDuration(metrics.ttsPerceivedMinutes)} />
          <MetricCard label="TTC" value={formatDuration(metrics.ttcMinutes)} />
          <MetricCard label="LIS" value={`${metrics.lisMinutes} min`} />
          <MetricCard label="WASO" value={`${metrics.wasoMinutes} min`} />
          <MetricCard label="Fragmentação" value={`${metrics.fragmentationCount}`} />
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
            {averages.sleepQuality.mode ? (
              <MetricCard
                label="Qualidade mais frequente"
                value={SLEEP_QUALITY_LABEL[averages.sleepQuality.mode] ?? averages.sleepQuality.mode}
              />
            ) : null}
            {averages.morningFeeling.mode ? (
              <MetricCard
                label="Sensação ao acordar"
                value={FEELING_LABEL[averages.morningFeeling.mode] ?? averages.morningFeeling.mode}
              />
            ) : null}
            {averages.daytimeFeeling.mode ? (
              <MetricCard
                label="Sensação diurna"
                value={FEELING_LABEL[averages.daytimeFeeling.mode] ?? averages.daytimeFeeling.mode}
              />
            ) : null}
          </View>
        </GlassCard>

        <PrimaryButton label="Inserir mais um dia" onPress={onAddAnother} />
        <PrimaryButton label="Ver resumo gráfico" onPress={onSummary} />
        <PrimaryButton label="Encerrar para amanhã" variant="secondary" onPress={onFinish} />
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.lg },
  title: { color: colors.text, fontSize: 22, fontWeight: '900' },
  timelineCard: { paddingHorizontal: spacing.xs },
  hero: { alignItems: 'center', gap: spacing.xs, backgroundColor: 'rgba(109,93,246,0.22)' },
  heroLabel: { color: colors.textMuted, fontSize: 13 },
  heroValue: { color: colors.text, fontSize: 38, fontWeight: '900' },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: { gap: spacing.sm },
  cardTitle: { color: colors.text, fontSize: 13, fontWeight: '900' },
});

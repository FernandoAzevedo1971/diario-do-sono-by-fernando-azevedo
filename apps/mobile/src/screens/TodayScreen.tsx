import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { calculateSleepDiaryAverages, formatDuration } from '@diario-do-sono/core';
import { AppBackground } from '../components/AppBackground';
import { GlassCard } from '../components/GlassCard';
import { MetricCard } from '../components/MetricCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, spacing } from '../theme/tokens';
import type { PatientProfile, SleepDiaryEntry } from '../types';

export function TodayScreen({ profile, entries, onNewEntry, onEditEntry, onSummary, onReport }: {
  profile: PatientProfile;
  entries: SleepDiaryEntry[];
  onNewEntry: () => void;
  onEditEntry: (entry: SleepDiaryEntry) => void;
  onSummary: () => void;
  onReport: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const todayEntry = entries.find((entry) => entry.input.entryDate === today);
  const latestEntry = todayEntry ?? entries[0];
  const averages = calculateSleepDiaryAverages(entries.map((entry) => ({ input: entry.input, metrics: entry.metrics })));
  const recentEntries = entries.slice(0, 5);

  return (
    <AppBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.greeting}>Olá, {profile.name}</Text>
        <Text style={styles.title}>Como foi sua noite?</Text>
        <GlassCard style={styles.card}>
          {todayEntry ? (
            <>
              <Text style={styles.cardTitle}>Registro de hoje preenchido</Text>
              <Text style={styles.cardText}>Você pode revisar ou editar as respostas de hoje.</Text>
              <PrimaryButton label="Editar registro de hoje" onPress={() => onEditEntry(todayEntry)} />
            </>
          ) : (
            <>
              <Text style={styles.cardTitle}>Diário de hoje</Text>
              <Text style={styles.cardText}>Preencha pela manhã, logo que se levantar.</Text>
              <PrimaryButton label="Preencher diário de hoje" onPress={onNewEntry} />
            </>
          )}
        </GlassCard>

        {entries.length > 0 ? (
          <PrimaryButton label="Resumo Gráfico" onPress={onSummary} />
        ) : null}
        <PrimaryButton label="Enviar ao Médico" onPress={onReport} />

        {latestEntry ? (
          <>
            <GlassCard style={styles.card}>
              <Text style={styles.cardTitle}>Último resultado</Text>
              <View style={styles.metrics}>
                <MetricCard label="Eficiência" value={`${latestEntry.metrics.sleepEfficiencyPercent}%`} />
                <MetricCard label="TTS calculado" value={formatDuration(latestEntry.metrics.ttsCalculatedMinutes)} />
                <MetricCard label="TTS percebido" value={formatDuration(latestEntry.metrics.ttsPerceivedMinutes)} />
                <MetricCard label="Status" value={formatSyncStatus(latestEntry.syncStatus)} />
              </View>
            </GlassCard>

            <GlassCard style={styles.card}>
              <Text style={styles.cardTitle}>Médias de {averages.daysCount} dia{averages.daysCount === 1 ? '' : 's'}</Text>
              <View style={styles.metrics}>
                <MetricCard label="Eficiência média" value={`${averages.sleepEfficiencyPercent}%`} />
                <MetricCard label="TTS calc. médio" value={formatDuration(averages.ttsCalculatedMinutes)} />
                <MetricCard label="WASO médio" value={`${averages.wasoMinutes} min`} />
                <MetricCard label="LIS médio" value={`${averages.lisMinutes} min`} />
              </View>
            </GlassCard>

            <GlassCard style={styles.card}>
              <Text style={styles.cardTitle}>Histórico recente</Text>
              <View style={styles.historyList}>
                {recentEntries.map((entry) => (
                  <Pressable key={entry.id} style={styles.historyItem} onPress={() => onEditEntry(entry)}>
                    <View>
                      <Text style={styles.historyDate}>{formatEntryDate(entry.input.entryDate)}</Text>
                      <Text style={styles.historyMeta}>{formatSyncStatus(entry.syncStatus)}</Text>
                    </View>
                    <View style={styles.historyValues}>
                      <Text style={styles.historyValue}>{entry.metrics.sleepEfficiencyPercent}%</Text>
                      <Text style={styles.historyMeta}>{formatDuration(entry.metrics.ttsCalculatedMinutes)}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </GlassCard>
          </>
        ) : null}
      </ScrollView>
    </AppBackground>
  );
}

function formatEntryDate(entryDate: string): string {
  const [year, month, day] = entryDate.split('-');
  return `${day}/${month}/${year}`;
}

function formatSyncStatus(syncStatus: SleepDiaryEntry['syncStatus']): string {
  if (syncStatus === 'synced') {
    return 'Sincronizado';
  }

  if (syncStatus === 'pending') {
    return 'Pendente';
  }

  return 'Local';
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingBottom: spacing.xl },
  greeting: { color: colors.textMuted, fontSize: 16 },
  title: { color: colors.text, fontSize: 30, fontWeight: '900' },
  card: { gap: spacing.md },
  cardTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
  cardText: { color: colors.textMuted, fontSize: 16, lineHeight: 23 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  historyList: { gap: spacing.sm },
  historyItem: {
    minHeight: 70,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  historyDate: { color: colors.text, fontSize: 16, fontWeight: '800' },
  historyMeta: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  historyValues: { alignItems: 'flex-end' },
  historyValue: { color: colors.text, fontSize: 22, fontWeight: '900' },
});

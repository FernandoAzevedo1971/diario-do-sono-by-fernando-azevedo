import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { calculateSleepDiaryAverages, formatDuration } from '@diario-do-sono/core';
import { AppBackground } from '../components/AppBackground';
import { GlassCard } from '../components/GlassCard';
import { MetricCard } from '../components/MetricCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, spacing } from '../theme/tokens';
import type { IsiRecord, PatientProfile, SleepDiaryEntry } from '../types';

const ISI_SEVERITY_COLOR: Record<IsiRecord['severity'], string> = {
  none: colors.success,
  subclinical: colors.sunrise,
  moderate: '#F5A623',
  severe: colors.danger,
};

function formatIsiDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function TodayScreen({ profile, entries, isiHistory, onNewEntry, onEditEntry, onSummary, onPastEntry, onIsi, onIsiHistory }: {
  profile: PatientProfile;
  entries: SleepDiaryEntry[];
  isiHistory: IsiRecord[];
  onNewEntry: () => void;
  onEditEntry: (entry: SleepDiaryEntry) => void;
  onSummary: () => void;
  onPastEntry: () => void;
  onIsi: () => void;
  onIsiHistory: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const todayEntry = entries.find((entry) => entry.input.entryDate === today);
  const latestEntry = todayEntry ?? entries[0];
  const averages = calculateSleepDiaryAverages(entries.map((entry) => ({ input: entry.input, metrics: entry.metrics })));
  const recentEntries = entries.slice(0, 5);
  const latestIsi = isiHistory[0] ?? null;

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

        <PrimaryButton label="Preencher dia anterior" variant="secondary" onPress={onPastEntry} />

        {entries.length > 0 ? (
          <PrimaryButton label="Resumo Gráfico" onPress={onSummary} />
        ) : null}

        <PrimaryButton label="Preencher Índice de Gravidade de Insônia" variant="secondary" onPress={onIsi} />

        {isiHistory.length > 0 ? (
          <PrimaryButton label="Histórico do IGI" variant="secondary" onPress={onIsiHistory} />
        ) : null}

        {latestIsi ? (
          <GlassCard style={styles.card}>
            <Text style={styles.cardTitle}>Último IGI</Text>
            <View style={styles.isiRow}>
              <Text style={[styles.isiScore, { color: ISI_SEVERITY_COLOR[latestIsi.severity] }]}>{latestIsi.score}</Text>
              <View style={styles.isiInfo}>
                <Text style={[styles.isiInterpretation, { color: ISI_SEVERITY_COLOR[latestIsi.severity] }]}>{latestIsi.interpretation}</Text>
                <Text style={styles.historyMeta}>{formatIsiDate(latestIsi.completedAt)}</Text>
              </View>
            </View>
          </GlassCard>
        ) : null}

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
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  greeting: { color: colors.textMuted, fontSize: 15 },
  title: { color: colors.text, fontSize: 32, fontWeight: '900', lineHeight: 38 },
  card: { gap: spacing.sm },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  cardText: { color: colors.textMuted, fontSize: 15, lineHeight: 21 },
  isiRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  isiScore: { fontSize: 36, fontWeight: '900', minWidth: 52, textAlign: 'center' },
  isiInfo: { flex: 1, gap: 3 },
  isiInterpretation: { fontSize: 13, fontWeight: '700', lineHeight: 18 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  historyList: { gap: spacing.xs },
  historyItem: {
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  historyDate: { color: colors.text, fontSize: 15, fontWeight: '800' },
  historyMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  historyValues: { alignItems: 'flex-end' },
  historyValue: { color: colors.text, fontSize: 20, fontWeight: '900' },
});

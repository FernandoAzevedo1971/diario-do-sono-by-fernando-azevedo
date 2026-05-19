import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppBackground } from '../components/AppBackground';
import { BackArrow } from '../components/BackArrow';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, spacing } from '../theme/tokens';
import type { SleepDiaryEntry } from '../types';

const WEEKDAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function buildDays(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function formatCell(isoDate: string): { weekday: string; dayMonth: string } {
  const [year, month, day] = isoDate.split('-');
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  return {
    weekday: WEEKDAYS_PT[d.getDay()],
    dayMonth: `${day}/${month}`,
  };
}

export function PastDiaryCalendarScreen({
  entries,
  onNewEntry,
  onEditEntry,
  onBack,
}: {
  entries: SleepDiaryEntry[];
  onNewEntry: (date: string) => void;
  onEditEntry: (entry: SleepDiaryEntry) => void;
  onBack: () => void;
}) {
  const days = buildDays();
  const entryByDate = new Map(entries.map((e) => [e.input.entryDate, e]));

  function handlePress(isoDate: string) {
    const existing = entryByDate.get(isoDate);
    if (existing) {
      Alert.alert(
        'Dia já preenchido',
        'Você já tem um registro para este dia. Deseja editar as informações?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Editar', onPress: () => onEditEntry(existing) },
        ],
      );
    } else {
      onNewEntry(isoDate);
    }
  }

  return (
    <AppBackground>
      <View style={styles.container}>
        <BackArrow onPress={onBack} />
        <Text style={styles.title}>Dias anteriores</Text>
        <Text style={styles.subtitle}>Selecione o dia que deseja preencher</Text>

        <GlassCard style={styles.card}>
          <View style={styles.grid}>
            {days.map((isoDate) => {
              const filled = entryByDate.has(isoDate);
              const { weekday, dayMonth } = formatCell(isoDate);
              return (
                <Pressable
                  key={isoDate}
                  style={({ pressed }) => [
                    styles.cell,
                    filled ? styles.cellFilled : styles.cellEmpty,
                    pressed && styles.cellPressed,
                  ]}
                  onPress={() => handlePress(isoDate)}
                >
                  <Text style={[styles.cellWeekday, filled && styles.cellTextFilled]}>{weekday}</Text>
                  <Text style={[styles.cellDate, filled && styles.cellTextFilled]}>{dayMonth}</Text>
                  <Text style={[styles.cellIcon, filled ? styles.cellIconFilled : styles.cellIconEmpty]}>
                    {filled ? '✓' : '+'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </GlassCard>

        <PrimaryButton label="Voltar" variant="secondary" onPress={onBack} />
      </View>
    </AppBackground>
  );
}

const CELL_GAP = 8;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: -spacing.sm,
  },
  card: {
    gap: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CELL_GAP,
  },
  cell: {
    width: `${(100 - CELL_GAP * 6 / 7) / 7}%` as any,
    aspectRatio: 0.85,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cellEmpty: {
    backgroundColor: colors.card,
  },
  cellFilled: {
    backgroundColor: 'rgba(112, 224, 163, 0.18)',
    borderColor: colors.success,
  },
  cellPressed: {
    opacity: 0.7,
  },
  cellWeekday: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '600',
  },
  cellDate: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },
  cellIcon: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 1,
  },
  cellTextFilled: {
    color: colors.success,
  },
  cellIconEmpty: {
    color: colors.primary,
  },
  cellIconFilled: {
    color: colors.success,
  },
});

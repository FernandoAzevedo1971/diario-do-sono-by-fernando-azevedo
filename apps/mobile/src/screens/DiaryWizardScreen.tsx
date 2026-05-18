import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  useColorScheme,
} from 'react-native';
import { calculateSleepDiary, type SleepDiaryInput } from '@diario-do-sono/core';
import { NocturneBackdrop } from '../components/NocturneBackdrop';
import { colors, fonts, spacing } from '../theme/tokens';
import type { SleepDiaryEntry } from '../types';

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

const initialInput: SleepDiaryInput = {
  entryDate: todayIsoDate(),
  bedTime: '23:14',
  sleepLatencyMinutes: 11,
  nightAwakeningsCount: 1,
  wasoMinutes: 6,
  finalWakeTime: '07:08',
  outOfBedLatencyMinutes: 15,
  perceivedSleepMinutes: 446,
  sleepQuality: 'good',
  morningFeeling: 'rested',
  alcoholUse: { used: false, untilTime: null, amount: null, beverage: null },
  physicalActivity: { didActivity: false, intensity: null, endTime: null, description: null },
  daytimeFeeling: null,
  sleepMedication: { used: false, name: null, dose: null, time: null },
};

export function DiaryWizardScreen({
  editingEntry,
  previousEntry,
  onCancel,
  onSave,
}: {
  editingEntry?: SleepDiaryEntry | null;
  previousEntry?: SleepDiaryEntry | null;
  onCancel: () => void;
  onSave: (entry: SleepDiaryEntry) => void;
}) {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<SleepDiaryInput>(editingEntry?.input ?? initialInput);
  const result = useMemo(() => calculateSleepDiary(input), [input]);

  const steps = [
    { key: 'bedtime', q: 'Que horas você deitou?', kind: 'time' as const },
    { key: 'latency', q: 'Quanto tempo levou para dormir?', kind: 'num' as const, unit: 'min' },
    { key: 'waso', q: 'Acordou durante a noite?', kind: 'num' as const, unit: 'min' },
    { key: 'mood', q: 'Como se sente ao acordar?', kind: 'scale' as const },
  ];

  const s = steps[step];
  const isLastStep = step === steps.length - 1;

  const handleTimeChange = (value: string) => {
    if (s.kind === 'time') {
      setInput({ ...input, bedTime: value });
    }
  };

  const handleNumChange = (value: number) => {
    if (s.key === 'latency') {
      setInput({ ...input, sleepLatencyMinutes: value });
    } else if (s.key === 'waso') {
      setInput({ ...input, wasoMinutes: value });
    }
  };

  const handleMoodChange = (mood: number) => {
    const feelingMap: { [key: number]: string } = {
      1: 'sleepy',
      2: 'tired',
      3: 'regular',
      4: 'rested',
      5: 'rested',
    };
    setInput({ ...input, morningFeeling: feelingMap[mood] as any });
  };

  const handleSave = () => {
    if (!result.isValid) {
      return;
    }

    const now = new Date().toISOString();
    onSave({
      id: editingEntry?.id ?? `${input.entryDate}-${Date.now()}`,
      input,
      metrics: result.metrics,
      createdAt: editingEntry?.createdAt ?? now,
      updatedAt: now,
      syncStatus: 'local',
      version: editingEntry?.version ?? 1,
    });
  };

  const handleNext = () => {
    if (isLastStep) {
      handleSave();
    } else {
      setStep(step + 1);
    }
  };

  const progressPercent = ((step + 1) / steps.length) * 100;

  return (
    <View style={styles.container}>
      <NocturneBackdrop primary={colors.primary} withMoon={false} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={onCancel}>
              <Text style={styles.backBtn}>← Voltar</Text>
            </Pressable>
            <Text style={styles.progress}>
              {String(step + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
            </Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>

          {/* Question */}
          <Text style={styles.question}>{s.q}</Text>

          {/* Answer card */}
          <View style={styles.answerCard}>
            {s.kind === 'time' && (
              <TimeInput
                value={input.bedTime}
                onChange={handleTimeChange}
              />
            )}

            {s.kind === 'num' && (
              <NumericInput
                value={s.key === 'latency' ? input.sleepLatencyMinutes : input.wasoMinutes}
                onChange={handleNumChange}
                unit={s.unit || ''}
              />
            )}

            {s.kind === 'scale' && (
              <ScaleInput
                value={getMoodValue(input.morningFeeling)}
                onChange={handleMoodChange}
              />
            )}
          </View>

          {/* Navigation buttons */}
          <View style={styles.buttons}>
            {step > 0 && (
              <Pressable style={styles.prevBtn} onPress={() => setStep(step - 1)}>
                <Text style={styles.prevBtnText}>Anterior</Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.nextBtn, step === 0 && { flex: 2 }]}
              onPress={handleNext}
            >
              <Text style={styles.nextBtnText}>
                {isLastStep ? 'Concluir' : 'Próximo'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <View style={timeInputStyles.container}>
      <TextInput
        style={timeInputStyles.input}
        value={value}
        onChangeText={onChange}
        placeholder="HH:MM"
        placeholderTextColor={colors.dim}
        maxLength={5}
      />
    </View>
  );
}

function NumericInput({
  value,
  onChange,
  unit,
}: {
  value: number;
  onChange: (v: number) => void;
  unit: string;
}) {
  return (
    <View style={numInputStyles.container}>
      <View style={numInputStyles.valueRow}>
        <Pressable onPress={() => onChange(Math.max(0, value - 1))}>
          <Text style={numInputStyles.btn}>−</Text>
        </Pressable>

        <View style={numInputStyles.value}>
          <Text style={numInputStyles.number}>{value}</Text>
        </View>

        <Pressable onPress={() => onChange(value + 1)}>
          <Text style={numInputStyles.btn}>+</Text>
        </Pressable>
      </View>
      <Text style={numInputStyles.unit}>{unit}</Text>
    </View>
  );
}

function ScaleInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={scaleInputStyles.container}>
      <View style={scaleInputStyles.scale}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            style={[
              scaleInputStyles.chip,
              value === n && scaleInputStyles.chipActive,
            ]}
          >
            <Text
              style={[
                scaleInputStyles.chipText,
                value === n && scaleInputStyles.chipTextActive,
              ]}
            >
              {n}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={scaleInputStyles.labels}>
        <Text style={scaleInputStyles.label}>Exausta</Text>
        <Text style={scaleInputStyles.label}>Descansada</Text>
      </View>
    </View>
  );
}

function getMoodValue(feeling: string): number {
  const map: { [key: string]: number } = {
    sleepy: 1,
    tired: 2,
    regular: 3,
    rested: 5,
  };
  return map[feeling] || 3;
}

const styles = StyleSheet.create<any>({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    position: 'relative',
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingHorizontal: 24,
    paddingBottom: 28,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  backBtn: {
    fontSize: 13,
    color: colors.ink,
    fontWeight: '500',
  },
  progress: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: fonts.mono.default,
    letterSpacing: 0.08,
    fontWeight: '500',
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 18,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
    shadowColor: colors.primary,
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
    transition: 'width 420ms cubic-bezier(0.22, 0.61, 0.36, 1)',
  },
  question: {
    fontFamily: fonts.serif.display,
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: -0.015,
    lineHeight: 1.1,
    color: colors.ink,
    marginBottom: 32,
  },
  answerCard: {
    padding: 30,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
  prevBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  prevBtnText: {
    fontSize: 13,
    color: colors.ink,
    fontWeight: '500',
  },
  nextBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
  },
  nextBtnText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    letterSpacing: -0.005,
  },
});

const timeInputStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    fontFamily: fonts.serif.display,
    fontSize: 64,
    fontWeight: '300',
    letterSpacing: -0.03,
    color: colors.ink,
    textAlign: 'center',
  },
});

const numInputStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  btn: {
    fontSize: 32,
    color: colors.primary,
    fontWeight: '300',
    paddingHorizontal: 12,
  },
  value: {
    alignItems: 'center',
  },
  number: {
    fontFamily: fonts.serif.display,
    fontSize: 72,
    fontWeight: '300',
    letterSpacing: -0.04,
    color: colors.primary,
  },
  unit: {
    fontFamily: fonts.serif.display,
    fontSize: 26,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
});

const scaleInputStyles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
  },
  scale: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 3,
  },
  chipText: {
    fontFamily: fonts.serif.display,
    fontSize: 20,
    fontWeight: '400',
    letterSpacing: -0.01,
    color: colors.ink,
  },
  chipTextActive: {
    color: '#fff',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 260,
  },
  label: {
    fontSize: 11,
    color: colors.textMuted,
  },
});

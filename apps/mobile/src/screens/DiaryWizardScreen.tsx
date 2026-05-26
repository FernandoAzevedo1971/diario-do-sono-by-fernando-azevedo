import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { calculateSleepDiary, minutesBetweenClockTimes, type AwakeningDetail, type DailyFeeling, type SleepDiaryInput, type SleepQuality } from '@diario-do-sono/core';
import { AppBackground } from '../components/AppBackground';
import { BackArrow } from '../components/BackArrow';
import { DurationInput, StepperInput, TimeInput } from '../components/DiaryInputs';
import { GlassCard } from '../components/GlassCard';
import { SleepTimeline } from '../components/SleepTimeline';
import { OptionCard } from '../components/OptionCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, spacing } from '../theme/tokens';
import type { SleepDiaryEntry } from '../types';

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function buildInitialInput(initialDate?: string): SleepDiaryInput {
  return {
  entryDate: initialDate ?? todayIsoDate(),
  bedTime: '22:30',
  sleepLatencyMinutes: 20,
  nightAwakeningsCount: 1,
  wasoMinutes: 20,
  finalWakeTime: '06:30',
  outOfBedLatencyMinutes: 15,
  perceivedSleepMinutes: 420,
  sleepQuality: 'regular',
  morningFeeling: 'tired',
  alcoholUse: {
    used: false,
    untilTime: null,
    amount: null,
    beverage: null,
  },
  physicalActivity: {
    didActivity: false,
    intensity: null,
    endTime: null,
    description: null,
  },
  daytimeFeeling: null,
  sleepMedication: { used: false, name: null, dose: null, time: null },
  nightObservations: null,
  dayObservations: null,
  awakeningDetails: null,
  };
}

export function DiaryWizardScreen({ editingEntry, previousEntry, initialDate, onCancel, onSave }: {
  editingEntry?: SleepDiaryEntry | null;
  previousEntry?: SleepDiaryEntry | null;
  initialDate?: string;
  onCancel: () => void;
  onSave: (entry: SleepDiaryEntry) => void;
}) {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<SleepDiaryInput>(editingEntry?.input ?? buildInitialInput(initialDate));
  const [answeredFields, setAnsweredFields] = useState<Set<string>>(
    () => editingEntry
      ? new Set(['sleepQuality', 'morningFeeling', 'alcoholUse', 'physicalActivity', 'sleepMedication', 'daytimeFeeling'])
      : new Set(),
  );
  const result = useMemo(() => calculateSleepDiary(input), [input]);

  const mark = (field: string) => setAnsweredFields(prev => new Set([...prev, field]));
  const has = (field: string) => answeredFields.has(field);

  const maxPerceivedMinutes = minutesBetweenClockTimes(input.bedTime, input.finalWakeTime);

  const goNext = () => setStep(step + 1);

  const allDurationsProvided =
    input.nightAwakeningsCount > 0 &&
    (input.awakeningDetails?.length ?? 0) >= input.nightAwakeningsCount &&
    input.awakeningDetails!.slice(0, input.nightAwakeningsCount).every(a => (a.durationMinutes ?? 0) > 0);

  const steps = [
    {
      title: 'A que horas você foi para a cama ontem?',
      content: <TimeInput value={input.bedTime} onChange={(value) => { const newMax = minutesBetweenClockTimes(value, input.finalWakeTime); setInput({ ...input, bedTime: value, perceivedSleepMinutes: Math.min(input.perceivedSleepMinutes, newMax) }); }} rangeStart="18:00" rangeEnd="02:00" />,
    },
    {
      title: 'Quanto tempo estima que demorou para dormir?',
      content: <StepperInput value={input.sleepLatencyMinutes} onChange={(value) => setInput({ ...input, sleepLatencyMinutes: value })} suffix="minutos" step={5} />,
    },
    {
      title: 'Quantas vezes você acordou durante a noite?',
      content: (
        <View style={styles.optionalGroup}>
          <StepperInput
            value={input.nightAwakeningsCount}
            onChange={(value) => {
              const cur = input.awakeningDetails ?? [];
              const next: AwakeningDetail[] | null = value === 0 ? null
                : value > cur.length
                  ? [...cur, ...Array.from({ length: value - cur.length }, () => ({ time: null, durationMinutes: null }))]
                  : cur.slice(0, value);
              setInput({ ...input, nightAwakeningsCount: value, awakeningDetails: next });
            }}
            suffix="vezes"
            step={1}
          />
          {input.nightAwakeningsCount > 0 ? (
            <View style={styles.awakeningDetailsSection}>
              <Text style={styles.fieldLabel}>Horário e duração de cada despertar (opcional)</Text>
              {Array.from({ length: input.nightAwakeningsCount }, (_, i) => {
                const det = input.awakeningDetails?.[i];
                const updateDetail = (patch: Partial<AwakeningDetail>) => {
                  const cur = input.awakeningDetails ?? Array.from({ length: input.nightAwakeningsCount }, () => ({ time: null as string | null, durationMinutes: null as number | null }));
                  const next = [...cur];
                  next[i] = { ...next[i], ...patch };
                  const sumWaso = next.slice(0, input.nightAwakeningsCount).reduce((s, a) => s + (a.durationMinutes ?? 0), 0);
                  setInput({ ...input, awakeningDetails: next, wasoMinutes: sumWaso > 0 ? sumWaso : input.wasoMinutes });
                };
                return (
                  <View key={i} style={styles.awakeningRow}>
                    <Text style={styles.awakeningLabel}>Despertar {i + 1}</Text>
                    <View style={styles.awakeningControls}>
                      <CompactTimePicker value={det?.time ?? '03:00'} onChange={(v) => updateDetail({ time: v })} />
                      <CompactDurationPicker value={det?.durationMinutes ?? 0} onChange={(v) => updateDetail({ durationMinutes: v || null })} />
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}
        </View>
      ),
    },
    ...(!allDurationsProvided ? [{
      title: 'No total, quanto tempo ficou acordado durante a noite?',
      content: <StepperInput value={input.wasoMinutes} onChange={(value) => setInput({ ...input, wasoMinutes: value })} suffix="minutos" step={5} />,
    }] : []),
    {
      title: 'A que horas você acordou definitivamente?',
      content: <TimeInput value={input.finalWakeTime} onChange={(value) => { const newMax = minutesBetweenClockTimes(input.bedTime, value); setInput({ ...input, finalWakeTime: value, perceivedSleepMinutes: Math.min(input.perceivedSleepMinutes, newMax) }); }} rangeStart="04:00" rangeEnd="14:00" />,
    },
    {
      title: 'Quanto tempo demorou para sair da cama?',
      content: <StepperInput value={input.outOfBedLatencyMinutes} onChange={(value) => setInput({ ...input, outOfBedLatencyMinutes: value })} suffix="minutos" step={5} />,
    },
    {
      title: 'Ao todo, quanto tempo acha que dormiu?',
      content: <DurationInput minutes={input.perceivedSleepMinutes} onChange={(value) => setInput({ ...input, perceivedSleepMinutes: value })} maxMinutes={maxPerceivedMinutes} />,
    },
    {
      title: 'Como foi a qualidade do sono esta noite?',
      autoAdvance: true,
      content: <ChoiceGroup value={has('sleepQuality') ? input.sleepQuality : ''} onChange={(value) => { mark('sleepQuality'); setInput({ ...input, sleepQuality: value as SleepQuality }); setTimeout(goNext, 150); }} options={[['good', 'Boa ou muito boa'], ['regular', 'Regular ou média'], ['bad', 'Ruim ou péssima']]} />,
    },
    {
      title: 'Como se sente nesta manhã?',
      autoAdvance: true,
      content: <ChoiceGroup value={has('morningFeeling') ? input.morningFeeling : ''} onChange={(value) => { mark('morningFeeling'); setInput({ ...input, morningFeeling: value as DailyFeeling }); setTimeout(goNext, 150); }} options={[['rested', 'Descansado'], ['tired', 'Cansado'], ['sleepy', 'Sonolento']]} />,
    },
    {
      title: 'Ingeriu álcool ontem?',
      content: (
        <View style={styles.optionalGroup}>
          <ChoiceGroup
            value={has('alcoholUse') ? (input.alcoholUse?.used ? 'yes' : 'no') : ''}
            onChange={(value) => { mark('alcoholUse'); setInput({
              ...input,
              alcoholUse: value === 'yes'
                ? { used: true, amount: input.alcoholUse?.amount ?? '', beverage: input.alcoholUse?.beverage ?? '', untilTime: input.alcoholUse?.untilTime ?? '' }
                : { used: false, amount: null, beverage: null, untilTime: null },
            }); }}
            options={[['no', 'NÃO'], ['yes', 'SIM']]}
          />
          {has('alcoholUse') && input.alcoholUse?.used ? (
            <>
              <TextInput
                style={styles.textArea}
                multiline
                placeholder="Quantidade e qual bebida"
                placeholderTextColor={colors.textMuted}
                value={input.alcoholUse.amount ?? ''}
                onChangeText={(value) => setInput({ ...input, alcoholUse: { ...input.alcoholUse, used: true, amount: value } })}
              />
              <Text style={styles.fieldLabel}>Até que horário?</Text>
              <TimeInput
                value={input.alcoholUse.untilTime ?? '20:00'}
                onChange={(value) => setInput({ ...input, alcoholUse: { ...input.alcoholUse, used: true, untilTime: value } })}
                rangeStart="16:00"
                rangeEnd="02:00"
              />
            </>
          ) : null}
        </View>
      ),
    },
    {
      title: 'Fez atividade física ontem?',
      content: (
        <View style={styles.optionalGroup}>
          <ChoiceGroup
            value={has('physicalActivity') ? (input.physicalActivity?.didActivity ? 'yes' : 'no') : ''}
            onChange={(value) => { mark('physicalActivity'); setInput({
              ...input,
              physicalActivity: value === 'yes'
                ? { didActivity: true, intensity: input.physicalActivity?.intensity ?? 'light', description: input.physicalActivity?.description ?? '', endTime: input.physicalActivity?.endTime ?? '' }
                : { didActivity: false, intensity: null, description: null, endTime: null },
            }); }}
            options={[['no', 'NÃO'], ['yes', 'SIM']]}
          />
          {has('physicalActivity') && input.physicalActivity?.didActivity ? (
            <>
              <ChoiceGroup
                value={input.physicalActivity.intensity ?? 'light'}
                onChange={(value) => setInput({ ...input, physicalActivity: { ...input.physicalActivity, didActivity: true, intensity: value as 'light' | 'intense' } })}
                options={[['light', 'Exercício leve'], ['intense', 'Exercício intenso']]}
              />
              <TextInput
                style={styles.textArea}
                multiline
                placeholder="Descreva a atividade, se quiser"
                placeholderTextColor={colors.textMuted}
                value={input.physicalActivity.description ?? ''}
                onChangeText={(value) => setInput({ ...input, physicalActivity: { ...input.physicalActivity, didActivity: true, description: value } })}
              />
              <Text style={styles.fieldLabel}>Horário em que encerrou</Text>
              <TimeInput
                value={input.physicalActivity.endTime ?? '19:00'}
                onChange={(value) => setInput({ ...input, physicalActivity: { ...input.physicalActivity, didActivity: true, endTime: value } })}
                rangeStart="05:00"
                rangeEnd="23:00"
              />
            </>
          ) : null}
        </View>
      ),
    },
    {
      title: 'Usou alguma medicação para dormir ontem?',
      content: (
        <View style={styles.optionalGroup}>
          {previousEntry?.input.sleepMedication?.used ? (
            <OptionCard
              label={`Repetir do dia anterior: ${previousEntry.input.sleepMedication.name ?? ''} ${previousEntry.input.sleepMedication.dose ?? ''}`}
              onPress={() => { mark('sleepMedication'); setInput({ ...input, sleepMedication: { ...previousEntry.input.sleepMedication, used: true } }); }}
              style={styles.repeatBtn}
            />
          ) : null}
          <ChoiceGroup
            value={has('sleepMedication') ? (input.sleepMedication?.used ? 'yes' : 'no') : ''}
            onChange={(value) => { mark('sleepMedication'); setInput({
              ...input,
              sleepMedication: value === 'yes'
                ? { used: true, name: input.sleepMedication?.name ?? '', dose: input.sleepMedication?.dose ?? '', time: input.sleepMedication?.time ?? '22:00' }
                : { used: false, name: null, dose: null, time: null },
            }); }}
            options={[['no', 'NÃO'], ['yes', 'SIM']]}
          />
          {has('sleepMedication') && input.sleepMedication?.used ? (
            <>
              <TextInput
                style={styles.textInput}
                placeholder="Nome do medicamento"
                placeholderTextColor={colors.textMuted}
                value={input.sleepMedication.name ?? ''}
                onChangeText={(value) => setInput({ ...input, sleepMedication: { ...input.sleepMedication, used: true, name: value } })}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Dose (ex: 10mg)"
                placeholderTextColor={colors.textMuted}
                value={input.sleepMedication.dose ?? ''}
                onChangeText={(value) => setInput({ ...input, sleepMedication: { ...input.sleepMedication, used: true, dose: value } })}
              />
              <Text style={styles.fieldLabel}>Horário que tomou</Text>
              <CompactTimePicker
                value={input.sleepMedication.time ?? '22:00'}
                onChange={(value) => setInput({ ...input, sleepMedication: { ...input.sleepMedication, used: true, time: value } })}
              />
            </>
          ) : null}
        </View>
      ),
    },
    {
      title: 'Como se sentiu durante o dia de ontem?',
      autoAdvance: true,
      content: <ChoiceGroup value={has('daytimeFeeling') ? (input.daytimeFeeling ?? '') : ''} onChange={(value) => { mark('daytimeFeeling'); setInput({ ...input, daytimeFeeling: value as DailyFeeling }); setTimeout(goNext, 150); }} options={[['rested', 'Descansado durante o dia'], ['tired', 'Cansado durante o dia'], ['sleepy', 'Sonolento durante o dia']]} />,
    },
    {
      title: 'Observações (opcional)',
      content: (
        <View style={styles.optionalGroup}>
          <Text style={styles.fieldLabel}>Sobre a noite</Text>
          <TextInput
            style={styles.textArea}
            multiline
            placeholder="Ex: acordei com barulho, sonhos intensos..."
            placeholderTextColor={colors.textMuted}
            value={input.nightObservations ?? ''}
            onChangeText={(value) => setInput({ ...input, nightObservations: value || null })}
          />
          <Text style={styles.fieldLabel}>Sobre o dia anterior</Text>
          <TextInput
            style={styles.textArea}
            multiline
            placeholder="Ex: estresse no trabalho, viagem longa..."
            placeholderTextColor={colors.textMuted}
            value={input.dayObservations ?? ''}
            onChangeText={(value) => setInput({ ...input, dayObservations: value || null })}
          />
        </View>
      ),
    },
  ];

  const currentStep = steps[step] as { title: string; content: React.ReactNode; autoAdvance?: boolean };
  const isLastStep = step === steps.length - 1;

  return (
    <AppBackground>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <BackArrow onPress={onCancel} />
        <Text style={styles.progress}>Pergunta {step + 1} de {steps.length}</Text>

        {/* Live timeline preview — updates as the user fills in each step */}
        <GlassCard style={styles.timelineCard}>
          <SleepTimeline
            bedTime={input.bedTime}
            sleepLatencyMinutes={input.sleepLatencyMinutes}
            nightAwakeningsCount={input.nightAwakeningsCount}
            wasoMinutes={input.wasoMinutes}
            finalWakeTime={input.finalWakeTime}
            outOfBedLatencyMinutes={input.outOfBedLatencyMinutes}
            outOfBedTime={result.isValid ? result.metrics.outOfBedTime : input.finalWakeTime}
            awakeningDetails={input.awakeningDetails}
            onChangeBedTime={(v) => { const newMax = minutesBetweenClockTimes(v, input.finalWakeTime); setInput({ ...input, bedTime: v, perceivedSleepMinutes: Math.min(input.perceivedSleepMinutes, newMax) }); }}
            onChangeFinalWakeTime={(v) => { const newMax = minutesBetweenClockTimes(input.bedTime, v); setInput({ ...input, finalWakeTime: v, perceivedSleepMinutes: Math.min(input.perceivedSleepMinutes, newMax) }); }}
          />
        </GlassCard>

        <Text style={styles.title}>{currentStep.title}</Text>
        <GlassCard style={styles.card}>{currentStep.content}</GlassCard>
        {result.issues.length > 0 && isLastStep ? (
          <GlassCard style={styles.warningCard}>
            {result.issues.map((issue) => <Text key={`${issue.field}-${issue.message}`} style={issue.severity === 'error' ? styles.error : styles.warning}>{issue.message}</Text>)}
          </GlassCard>
        ) : null}
        <View style={styles.actions}>
          <PrimaryButton label={step === 0 ? 'Cancelar' : 'Voltar'} variant="secondary" onPress={() => (step === 0 ? onCancel() : setStep(step - 1))} />
          {!currentStep.autoAdvance && <PrimaryButton
            label={isLastStep ? 'Salvar diário' : 'Continuar'}
            onPress={() => {
              if (!isLastStep) {
                setStep(step + 1);
                return;
              }

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
            }}
          />}
        </View>
      </ScrollView>
    </AppBackground>
  );
}

function CompactTimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [h, m] = value.split(':').map(Number);
  const adjust = (delta: number) => {
    const norm = ((h * 60 + m + delta) % 1440 + 1440) % 1440;
    onChange(`${String(Math.floor(norm / 60)).padStart(2, '0')}:${String(norm % 60).padStart(2, '0')}`);
  };
  return (
    <View style={styles.compactPickerRow}>
      <Pressable onPress={() => adjust(-30)} hitSlop={10} style={styles.compactBtn}>
        <Text style={styles.compactBtnText}>−</Text>
      </Pressable>
      <Text style={styles.compactValue}>{value}</Text>
      <Pressable onPress={() => adjust(30)} hitSlop={10} style={styles.compactBtn}>
        <Text style={styles.compactBtnText}>+</Text>
      </Pressable>
    </View>
  );
}

function CompactDurationPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.compactPickerRow}>
      <Pressable onPress={() => onChange(Math.max(0, value - 5))} hitSlop={10} style={styles.compactBtn}>
        <Text style={styles.compactBtnText}>−</Text>
      </Pressable>
      <Text style={styles.compactValue}>{value}min</Text>
      <Pressable onPress={() => onChange(value + 5)} hitSlop={10} style={styles.compactBtn}>
        <Text style={styles.compactBtnText}>+</Text>
      </Pressable>
    </View>
  );
}

function ChoiceGroup({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return (
    <View style={styles.choiceGroup}>
      {options.map(([optionValue, label]) => <OptionCard key={optionValue} label={label} selected={value === optionValue} onPress={() => onChange(optionValue)} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.lg },
  progress: { color: colors.cyan, fontSize: 11, fontWeight: '800' },
  title: { color: colors.text, fontSize: 20, fontWeight: '900', lineHeight: 26 },
  card: { gap: spacing.sm },
  timelineCard: { paddingHorizontal: 2 },
  choiceGroup: { gap: spacing.md },
  optionalGroup: { gap: spacing.md },
  fieldLabel: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  repeatBtn: { borderColor: colors.cyan, backgroundColor: 'rgba(101,214,255,0.08)' },
  textArea: { minHeight: 88, borderRadius: 16, borderWidth: 1, borderColor: colors.border, color: colors.text, padding: 14, textAlignVertical: 'top', backgroundColor: 'rgba(255,255,255,0.06)' },
  textInput: { height: 46, borderRadius: 12, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 14, backgroundColor: 'rgba(255,255,255,0.06)' },
  actions: { flexDirection: 'row', gap: spacing.md },
  warningCard: { gap: spacing.sm },
  warning: { color: colors.sunrise },
  error: { color: colors.danger },
  awakeningDetailsSection: { gap: 6, paddingTop: spacing.xs },
  awakeningRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)' },
  awakeningControls: { flexDirection: 'row', gap: spacing.sm },
  awakeningLabel: { color: colors.cyan, fontSize: 13, fontWeight: '700' },
  compactPickerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  compactBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(109,93,246,0.25)' },
  compactBtnText: { color: colors.cyan, fontSize: 16, fontWeight: '700', lineHeight: 20 },
  compactValue: { color: colors.text, fontSize: 13, fontWeight: '700', minWidth: 42, textAlign: 'center' },
});

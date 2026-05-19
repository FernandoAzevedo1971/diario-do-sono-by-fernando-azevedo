import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { calculateSleepDiary, minutesBetweenClockTimes, type DailyFeeling, type SleepDiaryInput, type SleepQuality } from '@diario-do-sono/core';
import { AppBackground } from '../components/AppBackground';
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
  const result = useMemo(() => calculateSleepDiary(input), [input]);

  const maxPerceivedMinutes = minutesBetweenClockTimes(input.bedTime, input.finalWakeTime);

  const steps = [
    {
      title: 'A que horas você foi para a cama ontem?',
      content: <TimeInput value={input.bedTime} onChange={(value) => setInput({ ...input, bedTime: value })} rangeStart="18:00" rangeEnd="02:00" />,
    },
    {
      title: 'Quanto tempo estima que demorou para dormir?',
      content: <StepperInput value={input.sleepLatencyMinutes} onChange={(value) => setInput({ ...input, sleepLatencyMinutes: value })} suffix="minutos" step={5} />,
    },
    {
      title: 'Quantas vezes você acordou durante a noite?',
      content: <StepperInput value={input.nightAwakeningsCount} onChange={(value) => setInput({ ...input, nightAwakeningsCount: value })} suffix="vezes" step={1} />,
    },
    {
      title: 'No total, quanto tempo ficou acordado durante a noite?',
      content: <StepperInput value={input.wasoMinutes} onChange={(value) => setInput({ ...input, wasoMinutes: value })} suffix="minutos" step={5} />,
    },
    {
      title: 'A que horas você acordou definitivamente?',
      content: <TimeInput value={input.finalWakeTime} onChange={(value) => setInput({ ...input, finalWakeTime: value })} rangeStart="04:00" rangeEnd="14:00" />,
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
      content: <ChoiceGroup value={input.sleepQuality} onChange={(value) => setInput({ ...input, sleepQuality: value as SleepQuality })} options={[['good', 'Boa ou muito boa'], ['regular', 'Regular ou média'], ['bad', 'Ruim ou péssima']]} />,
    },
    {
      title: 'Como se sente nesta manhã?',
      content: <ChoiceGroup value={input.morningFeeling} onChange={(value) => setInput({ ...input, morningFeeling: value as DailyFeeling })} options={[['rested', 'Descansado'], ['tired', 'Cansado'], ['sleepy', 'Sonolento']]} />,
    },
    {
      title: 'Ingeriu álcool ontem?',
      content: (
        <View style={styles.optionalGroup}>
          <ChoiceGroup
            value={input.alcoholUse?.used ? 'yes' : 'no'}
            onChange={(value) => setInput({
              ...input,
              alcoholUse: value === 'yes'
                ? { used: true, amount: input.alcoholUse?.amount ?? '', beverage: input.alcoholUse?.beverage ?? '', untilTime: input.alcoholUse?.untilTime ?? '' }
                : { used: false, amount: null, beverage: null, untilTime: null },
            })}
            options={[['no', 'NÃO'], ['yes', 'SIM']]}
          />
          {input.alcoholUse?.used ? (
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
            value={input.physicalActivity?.didActivity ? 'yes' : 'no'}
            onChange={(value) => setInput({
              ...input,
              physicalActivity: value === 'yes'
                ? { didActivity: true, intensity: input.physicalActivity?.intensity ?? 'light', description: input.physicalActivity?.description ?? '', endTime: input.physicalActivity?.endTime ?? '' }
                : { didActivity: false, intensity: null, description: null, endTime: null },
            })}
            options={[['no', 'NÃO'], ['yes', 'SIM']]}
          />
          {input.physicalActivity?.didActivity ? (
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
          <ChoiceGroup
            value={input.sleepMedication?.used ? 'yes' : 'no'}
            onChange={(value) => setInput({
              ...input,
              sleepMedication: value === 'yes'
                ? { used: true, name: input.sleepMedication?.name ?? '', dose: input.sleepMedication?.dose ?? '', time: input.sleepMedication?.time ?? input.bedTime }
                : { used: false, name: null, dose: null, time: null },
            })}
            options={[['no', 'NÃO'], ['yes', 'SIM']]}
          />
          {input.sleepMedication?.used ? (
            <>
              {previousEntry?.input.sleepMedication?.used ? (
                <OptionCard
                  label={`Repetir do dia anterior: ${previousEntry.input.sleepMedication.name ?? ''} ${previousEntry.input.sleepMedication.dose ?? ''}`}
                  onPress={() => setInput({
                    ...input,
                    sleepMedication: { ...previousEntry.input.sleepMedication, used: true },
                  })}
                  style={styles.repeatBtn}
                />
              ) : null}
              <TextInput
                style={styles.textArea}
                placeholder="Nome do medicamento"
                placeholderTextColor={colors.textMuted}
                value={input.sleepMedication.name ?? ''}
                onChangeText={(value) => setInput({ ...input, sleepMedication: { ...input.sleepMedication, used: true, name: value } })}
              />
              <TextInput
                style={styles.textArea}
                placeholder="Dose (ex: 10mg)"
                placeholderTextColor={colors.textMuted}
                value={input.sleepMedication.dose ?? ''}
                onChangeText={(value) => setInput({ ...input, sleepMedication: { ...input.sleepMedication, used: true, dose: value } })}
              />
              <Text style={styles.fieldLabel}>Horário que tomou</Text>
              <TimeInput
                value={input.sleepMedication.time ?? input.bedTime}
                onChange={(value) => setInput({ ...input, sleepMedication: { ...input.sleepMedication, used: true, time: value } })}
                rangeStart="18:00"
                rangeEnd="02:00"
              />
            </>
          ) : null}
        </View>
      ),
    },
    {
      title: 'Como se sentiu durante o dia de ontem?',
      content: <ChoiceGroup value={input.daytimeFeeling ?? ''} onChange={(value) => setInput({ ...input, daytimeFeeling: value as DailyFeeling })} options={[['rested', 'Descansado durante o dia'], ['tired', 'Cansado durante o dia'], ['sleepy', 'Sonolento durante o dia']]} />,
    },
  ];

  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;

  return (
    <AppBackground>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
            onChangeBedTime={(v) => setInput({ ...input, bedTime: v })}
            onChangeFinalWakeTime={(v) => setInput({ ...input, finalWakeTime: v })}
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
          <PrimaryButton
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
          />
        </View>
      </ScrollView>
    </AppBackground>
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
  actions: { flexDirection: 'row', gap: spacing.md },
  warningCard: { gap: spacing.sm },
  warning: { color: colors.sunrise },
  error: { color: colors.danger },
});

import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { calculateSleepDiary, type DailyFeeling, type SleepDiaryInput, type SleepQuality } from '@diario-do-sono/core';
import { AppBackground } from '../components/AppBackground';
import { GlassCard } from '../components/GlassCard';
import { OptionCard } from '../components/OptionCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, spacing } from '../theme/tokens';
import type { SleepDiaryEntry } from '../types';

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

const initialInput: SleepDiaryInput = {
  entryDate: todayIsoDate(),
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
};

export function DiaryWizardScreen({ editingEntry, onCancel, onSave }: {
  editingEntry?: SleepDiaryEntry | null;
  onCancel: () => void;
  onSave: (entry: SleepDiaryEntry) => void;
}) {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<SleepDiaryInput>(editingEntry?.input ?? initialInput);
  const result = useMemo(() => calculateSleepDiary(input), [input]);

  const steps = [
    {
      title: 'A que horas você foi para a cama ontem?',
      content: <TextInput style={styles.input} value={input.bedTime} onChangeText={(value) => setInput({ ...input, bedTime: value })} />,
    },
    {
      title: 'Quanto tempo estima que demorou para dormir?',
      content: <NumberInput value={input.sleepLatencyMinutes} onChange={(value) => setInput({ ...input, sleepLatencyMinutes: value })} suffix="min" />,
    },
    {
      title: 'Quantas vezes você acordou durante a noite?',
      content: <NumberInput value={input.nightAwakeningsCount} onChange={(value) => setInput({ ...input, nightAwakeningsCount: value })} suffix="vezes" />,
    },
    {
      title: 'No total, quanto tempo ficou acordado durante a noite?',
      content: <NumberInput value={input.wasoMinutes} onChange={(value) => setInput({ ...input, wasoMinutes: value })} suffix="min" />,
    },
    {
      title: 'A que horas você acordou definitivamente?',
      content: <TextInput style={styles.input} value={input.finalWakeTime} onChangeText={(value) => setInput({ ...input, finalWakeTime: value })} />,
    },
    {
      title: 'Quanto tempo demorou para sair da cama?',
      content: <NumberInput value={input.outOfBedLatencyMinutes} onChange={(value) => setInput({ ...input, outOfBedLatencyMinutes: value })} suffix="min" />,
    },
    {
      title: 'Ao todo, quanto tempo acha que dormiu?',
      content: <NumberInput value={input.perceivedSleepMinutes} onChange={(value) => setInput({ ...input, perceivedSleepMinutes: value })} suffix="min" />,
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
              <TextInput
                style={styles.input}
                placeholder="Até que horário? HH:mm"
                placeholderTextColor={colors.textMuted}
                value={input.alcoholUse.untilTime ?? ''}
                onChangeText={(value) => setInput({ ...input, alcoholUse: { ...input.alcoholUse, used: true, untilTime: value } })}
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
              <TextInput
                style={styles.input}
                placeholder="Horário em que encerrou HH:mm"
                placeholderTextColor={colors.textMuted}
                value={input.physicalActivity.endTime ?? ''}
                onChangeText={(value) => setInput({ ...input, physicalActivity: { ...input.physicalActivity, didActivity: true, endTime: value } })}
              />
            </>
          ) : null}
        </View>
      ),
    },
    {
      title: 'Como se sentiu durante o dia?',
      content: <ChoiceGroup value={input.daytimeFeeling ?? ''} onChange={(value) => setInput({ ...input, daytimeFeeling: value as DailyFeeling })} options={[['rested', 'Descansado durante o dia'], ['tired', 'Cansado durante o dia'], ['sleepy', 'Sonolento durante o dia']]} />,
    },
  ];

  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;

  return (
    <AppBackground>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.progress}>Pergunta {step + 1} de {steps.length}</Text>
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

function NumberInput({ value, onChange, suffix }: { value: number; onChange: (value: number) => void; suffix: string }) {
  return (
    <View style={styles.numberRow}>
      <TextInput style={styles.numberInput} keyboardType="number-pad" value={String(value)} onChangeText={(text) => onChange(Number(text.replace(/\D/g, '')) || 0)} />
      <Text style={styles.suffix}>{suffix}</Text>
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
  content: { gap: spacing.lg, paddingBottom: spacing.xl },
  progress: { color: colors.cyan, fontSize: 14, fontWeight: '800' },
  title: { color: colors.text, fontSize: 27, fontWeight: '900', lineHeight: 34 },
  card: { gap: spacing.md },
  input: { minHeight: 64, color: colors.text, fontSize: 30, fontWeight: '800', textAlign: 'center', borderBottomColor: colors.border, borderBottomWidth: 1 },
  numberRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: spacing.sm },
  numberInput: { color: colors.text, fontSize: 54, fontWeight: '900', minWidth: 110, textAlign: 'center' },
  suffix: { color: colors.textMuted, fontSize: 18, paddingBottom: 10 },
  choiceGroup: { gap: spacing.md },
  optionalGroup: { gap: spacing.md },
  textArea: { minHeight: 88, borderRadius: 16, borderWidth: 1, borderColor: colors.border, color: colors.text, padding: 14, textAlignVertical: 'top', backgroundColor: 'rgba(255,255,255,0.06)' },
  actions: { flexDirection: 'row', gap: spacing.md },
  warningCard: { gap: spacing.sm },
  warning: { color: colors.sunrise },
  error: { color: colors.danger },
});

import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { calculateIsiScore, ISI_ITEMS } from '@diario-do-sono/core';
import { AppBackground } from '../components/AppBackground';
import { BackArrow } from '../components/BackArrow';
import { GlassCard } from '../components/GlassCard';
import { OptionCard } from '../components/OptionCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, spacing } from '../theme/tokens';

export function IsiPromptScreen({ onComplete, onBack }: { onComplete: (score: number, interpretation: string) => void | Promise<void>; onBack?: () => void }) {
  const [answers, setAnswers] = useState<Array<number | null>>(Array(ISI_ITEMS.length).fill(null));
  const [isSaving, setIsSaving] = useState(false);
  const result = useMemo(() => calculateIsiScore(answers.filter((answer): answer is number => answer !== null)), [answers]);
  const isComplete = answers.every((answer) => answer !== null);

  async function handleComplete() {
    if (!isComplete || !result.isValid) {
      return;
    }

    setIsSaving(true);

    try {
      await onComplete(result.score, result.interpretation);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppBackground>
      <ScrollView contentContainerStyle={styles.content}>
        {onBack ? <BackArrow onPress={onBack} /> : null}
        <Text style={styles.title}>Índice de Gravidade de Insônia (IGI)</Text>
        <Text style={styles.subtitle}>Avalie a gravidade dos seus problemas de sono nas <Text style={styles.subtitleBold}>últimas duas semanas</Text>. Escolha a opção que melhor descreve cada situação.</Text>
        {ISI_ITEMS.map((item, index) => (
          <GlassCard key={item.prompt} style={styles.card}>
            <Text style={styles.question}>{index + 1}. {item.prompt}</Text>
            <View style={styles.scaleRow}>
              {item.options.map((label, value) => (
                <OptionCard
                  key={value}
                  label={`${value} - ${label}`}
                  selected={answers[index] === value}
                  onPress={() => {
                    const nextAnswers = [...answers];
                    nextAnswers[index] = value;
                    setAnswers(nextAnswers);
                  }}
                />
              ))}
            </View>
          </GlassCard>
        ))}
        {isComplete && result.isValid ? (
          <GlassCard style={styles.resultCard}>
            <Text style={styles.resultScore}>Pontuacao: {result.score}</Text>
            <Text style={styles.resultText}>{result.interpretation}</Text>
          </GlassCard>
        ) : null}
        <PrimaryButton label={isSaving ? 'Salvando...' : 'Continuar'} disabled={!isComplete || isSaving} onPress={handleComplete} />
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.sm, paddingBottom: spacing.lg },
  title: { color: colors.text, fontSize: 20, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  card: { gap: spacing.sm },
  question: { color: colors.text, fontSize: 14, fontWeight: '800', lineHeight: 20 },
  scaleRow: { gap: spacing.xs },
  resultCard: { gap: spacing.xs },
  resultScore: { color: colors.cyan, fontSize: 15, fontWeight: '900' },
  resultText: { color: colors.text, fontSize: 13, lineHeight: 18 },
  subtitleBold: { fontWeight: '800', color: colors.text },
});

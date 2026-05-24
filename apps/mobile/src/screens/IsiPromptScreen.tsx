import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { calculateIsiScore, ISI_ITEMS } from '@diario-do-sono/core';
import { AppBackground } from '../components/AppBackground';
import { BackArrow } from '../components/BackArrow';
import { GlassCard } from '../components/GlassCard';
import { OptionCard } from '../components/OptionCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, spacing } from '../theme/tokens';

export function IsiPromptScreen({ onComplete, onBack }: { onComplete: (score: number, interpretation: string, severity: 'none' | 'subclinical' | 'moderate' | 'severe') => void | Promise<void>; onBack?: () => void }) {
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
      await onComplete(result.score, result.interpretation, result.severity);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppBackground>
      <ScrollView contentContainerStyle={styles.content}>
        {onBack ? <BackArrow onPress={onBack} /> : null}
        <Text style={styles.title}>Índice de Gravidade de Insônia (ISI)</Text>
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
        <GlassCard style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>Sobre a escala</Text>
          <Text style={styles.aboutText}>
            O Índice de Gravidade de Insônia (ISI) avalia a severidade dos sintomas de insônia e seu impacto na qualidade de vida. É composto por sete perguntas em escala de 0 a 4, resultando em escore total de 0 a 28.{'\n\n'}
            O ISI tem validação na língua portuguesa.
          </Text>
          <Text style={styles.refTitle}>Referências</Text>
          <Text style={styles.refText}>
            CASTRO, Laura de Siqueira. <Text style={styles.refItalic}>Adaptação e Validação do Índice de Gravidade de Insônia (IGI): Caracterização Populacional, Valores Normativos e Aspectos Associados.</Text> 2011. 104 f. Dissertação (Mestrado) — Escola Paulista de Medicina, Universidade Federal de São Paulo. São Paulo, 2011. http://repositorio.unifesp.br/handle/11600/23193
          </Text>
          <Text style={styles.refText}>
            Morin CM, Belleville G, Bélanger L, Ivers H. The Insomnia Severity Index: psychometric indicators to detect insomnia cases and evaluate treatment response. <Text style={styles.refItalic}>Sleep.</Text> 2011 May;34(5):601–608.
          </Text>
          <Text style={styles.refText}>
            Bastien CH, Vallières A, Morin CM. Validation of the Insomnia Severity Index as an outcome measure for insomnia research. <Text style={styles.refItalic}>Sleep Med.</Text> 2001;2(4):297–307. doi:10.1016/S1389-9457(00)00065-4
          </Text>
        </GlassCard>
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
  aboutCard: { gap: spacing.sm, marginTop: spacing.xs },
  aboutTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  aboutText: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  refTitle: { color: colors.text, fontSize: 12, fontWeight: '800', marginTop: spacing.xs },
  refText: { color: colors.textMuted, fontSize: 11, lineHeight: 16 },
  refItalic: { fontStyle: 'italic' },
});

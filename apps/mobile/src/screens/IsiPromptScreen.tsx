import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { calculateIsiScore, ISI_ITEMS } from '@diario-do-sono/core';
import { AppBackground } from '../components/AppBackground';
import { BackArrow } from '../components/BackArrow';
import { GlassCard } from '../components/GlassCard';
import { OptionCard } from '../components/OptionCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, spacing } from '../theme/tokens';

type Severity = 'none' | 'subclinical' | 'moderate' | 'severe';

const SEVERITY_COLOR: Record<Severity, string> = {
  none:        colors.success,
  subclinical: colors.sunrise,
  moderate:    '#F5A623',
  severe:      colors.danger,
};

const SCORE_BANDS: Array<{ range: string; label: string; severity: Severity }> = [
  { range: '0–7',   label: 'Ausência de insônia significativa', severity: 'none' },
  { range: '8–14',  label: 'Limite inferior para insônia',       severity: 'subclinical' },
  { range: '15–21', label: 'Insônia clínica moderada',           severity: 'moderate' },
  { range: '22–28', label: 'Insônia clínica grave',              severity: 'severe' },
];

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
            <Text style={styles.resultScore}>
              Pontuação: <Text style={{ color: SEVERITY_COLOR[result.severity as Severity] }}>{result.score}</Text>
            </Text>
            <Text style={[styles.resultText, { color: SEVERITY_COLOR[result.severity as Severity] }]}>
              {result.interpretation}
            </Text>
            <View style={styles.bandsContainer}>
              {SCORE_BANDS.map((band) => {
                const active = band.severity === result.severity;
                return (
                  <View key={band.range} style={[styles.bandRow, active && { borderLeftColor: SEVERITY_COLOR[band.severity] }]}>
                    <Text style={[styles.bandRange, active && { color: SEVERITY_COLOR[band.severity] }]}>{band.range}</Text>
                    <Text style={[styles.bandLabel, active && { color: SEVERITY_COLOR[band.severity], fontWeight: '800' }]}>{band.label}</Text>
                  </View>
                );
              })}
            </View>
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
  resultCard: { gap: spacing.sm },
  resultScore: { color: colors.text, fontSize: 15, fontWeight: '900' },
  resultText: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
  bandsContainer: { gap: 3, marginTop: spacing.xs },
  bandRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: 5, paddingHorizontal: 8, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: 'transparent', backgroundColor: 'rgba(255,255,255,0.04)' },
  bandRange: { color: colors.textMuted, fontSize: 12, fontWeight: '700', minWidth: 44 },
  bandLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '500', flex: 1 },
  subtitleBold: { fontWeight: '800', color: colors.text },
  aboutCard: { gap: spacing.sm, marginTop: spacing.xs },
  aboutTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  aboutText: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  refTitle: { color: colors.text, fontSize: 12, fontWeight: '800', marginTop: spacing.xs },
  refText: { color: colors.textMuted, fontSize: 11, lineHeight: 16 },
  refItalic: { fontStyle: 'italic' },
});

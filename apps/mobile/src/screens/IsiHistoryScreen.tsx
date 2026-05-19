import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppBackground } from '../components/AppBackground';
import { BackArrow } from '../components/BackArrow';
import { GlassCard } from '../components/GlassCard';
import { colors, spacing } from '../theme/tokens';
import type { IsiRecord } from '../types';

const SEVERITY_COLOR: Record<IsiRecord['severity'], string> = {
  none: colors.success,
  subclinical: colors.sunrise,
  moderate: '#F5A623',
  severe: colors.danger,
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function IsiHistoryScreen({ isiHistory, onBack }: { isiHistory: IsiRecord[]; onBack: () => void }) {
  return (
    <AppBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <BackArrow onPress={onBack} />
        <Text style={styles.title}>Histórico do IGI</Text>
        <Text style={styles.subtitle}>Índice de Gravidade de Insônia — todos os resultados</Text>

        {isiHistory.length === 0 ? (
          <GlassCard>
            <Text style={styles.empty}>Nenhum resultado de IGI registrado ainda.</Text>
          </GlassCard>
        ) : (
          isiHistory.map((record) => (
            <GlassCard key={record.id} style={styles.card}>
              <View style={styles.row}>
                <Text style={[styles.score, { color: SEVERITY_COLOR[record.severity] }]}>{record.score}</Text>
                <View style={styles.info}>
                  <Text style={[styles.interpretation, { color: SEVERITY_COLOR[record.severity] }]}>{record.interpretation}</Text>
                  <Text style={styles.date}>{formatDate(record.completedAt)}</Text>
                </View>
              </View>
            </GlassCard>
          ))
        )}
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.sm, paddingBottom: spacing.lg },
  title: { color: colors.text, fontSize: 20, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  card: {},
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  score: { fontSize: 36, fontWeight: '900', minWidth: 52, textAlign: 'center' },
  info: { flex: 1, gap: 3 },
  interpretation: { fontSize: 13, fontWeight: '700', lineHeight: 18 },
  date: { color: colors.textMuted, fontSize: 12 },
  empty: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
});

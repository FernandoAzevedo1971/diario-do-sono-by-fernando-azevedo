import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppBackground } from '../components/AppBackground';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { generateSleepDiaryPdf } from '../services/pdfService';
import { colors, radius, spacing } from '../theme/tokens';
import type { PatientProfile, SleepDiaryEntry } from '../types';

// ─── types ────────────────────────────────────────────────────────────────────

type Period = '7d' | '14d' | '30d' | 'all';
type ShareVia = 'whatsapp' | 'email' | 'download';

interface SendToDoctorScreenProps {
  profile: PatientProfile;
  entries: SleepDiaryEntry[];
  onBack: () => void;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function getFilteredEntries(entries: SleepDiaryEntry[], period: Period): SleepDiaryEntry[] {
  // entries arrive newest-first; keep sorting consistent
  const sorted = [...entries].sort((a, b) => b.input.entryDate.localeCompare(a.input.entryDate));
  if (period === 'all') return sorted;
  const limit = period === '7d' ? 7 : period === '14d' ? 14 : 30;
  return sorted.slice(0, limit);
}

function periodLabel(period: Period): string {
  if (period === '7d') return '7 dias';
  if (period === '14d') return '14 dias';
  if (period === '30d') return '30 dias';
  return 'Todos';
}

// ─── component ────────────────────────────────────────────────────────────────

export function SendToDoctorScreen({ profile, entries, onBack }: SendToDoctorScreenProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('14d');
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const periods: Period[] = ['7d', '14d', '30d', 'all'];

  async function handleShare(via: ShareVia) {
    setShareError(null);
    setIsGenerating(true);
    try {
      const filtered = getFilteredEntries(entries, selectedPeriod);
      const blob = await generateSleepDiaryPdf(profile, filtered);
      const fileName = `diario-sono-${new Date().toISOString().slice(0, 10)}.pdf`;
      const file = new File([blob], fileName, { type: 'application/pdf' });

      if (via === 'download') {
        // Only runs in browser — safe because this screen is PWA-only
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Diário do Sono',
          text:
            via === 'whatsapp'
              ? 'Segue meu relatório do Diário do Sono para avaliação.'
              : 'Segue em anexo meu relatório do Diário do Sono.',
        });
      } else {
        // Web Share API unavailable — fall back to download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') {
        setShareError('Não foi possível compartilhar. Tente baixar o PDF.');
      }
    } finally {
      setIsGenerating(false);
    }
  }

  if (entries.length === 0) {
    return (
      <AppBackground>
        <View style={styles.emptyContainer}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Text style={styles.backLabel}>← Voltar</Text>
          </Pressable>
          <Text style={styles.emptyTitle}>Nenhum registro ainda</Text>
          <Text style={styles.emptySubtitle}>
            Preencha o diário por pelo menos uma noite para gerar o relatório.
          </Text>
        </View>
      </AppBackground>
    );
  }

  const filteredCount = getFilteredEntries(entries, selectedPeriod).length;

  return (
    <AppBackground>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backLabel}>← Voltar</Text>
        </Pressable>

        <Text style={styles.title}>Enviar ao Médico</Text>
        <Text style={styles.subtitle}>
          Gera um PDF do diário e compartilha com seu médico
        </Text>

        {/* What's included */}
        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>O que será incluído</Text>
          <View style={styles.bulletList}>
            <BulletItem text="Resumo de métricas médias" />
            <BulletItem text="Linha do tempo do sono (últimas 2 semanas)" />
            <BulletItem text="Gráficos de evolução (eficiência, TTS, LIS, WASO)" />
            <BulletItem text="Tabela completa de registros" />
          </View>
          <Text style={styles.countBadge}>
            {entries.length} {entries.length === 1 ? 'noite disponível' : 'noites disponíveis'}
          </Text>
        </GlassCard>

        {/* Period selector */}
        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>Período</Text>
          <View style={styles.chipRow}>
            {periods.map((p) => {
              const active = selectedPeriod === p;
              return (
                <Pressable
                  key={p}
                  onPress={() => setSelectedPeriod(p)}
                  style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                >
                  <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                    {periodLabel(p)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.periodNote}>
            {filteredCount} {filteredCount === 1 ? 'noite selecionada' : 'noites selecionadas'}
          </Text>
        </GlassCard>

        {/* Share buttons */}
        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>Compartilhar via</Text>

          <View style={styles.shareRow}>
            <Pressable
              onPress={() => handleShare('whatsapp')}
              disabled={isGenerating}
              style={[styles.shareButton, isGenerating && styles.shareButtonDisabled]}
            >
              <Text style={styles.shareIcon}>💬</Text>
              <Text style={styles.shareButtonLabel}>WhatsApp</Text>
            </Pressable>

            <Pressable
              onPress={() => handleShare('email')}
              disabled={isGenerating}
              style={[styles.shareButton, isGenerating && styles.shareButtonDisabled]}
            >
              <Text style={styles.shareIcon}>✉</Text>
              <Text style={styles.shareButtonLabel}>E-mail</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => handleShare('download')}
            disabled={isGenerating}
            style={styles.downloadButton}
          >
            <Text style={[styles.downloadLabel, isGenerating && styles.downloadLabelDisabled]}>
              Baixar PDF
            </Text>
          </Pressable>
        </GlassCard>

        {/* Loading state */}
        {isGenerating ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.loadingLabel}>Gerando PDF...</Text>
          </View>
        ) : null}

        {/* Error message */}
        {shareError != null ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{shareError}</Text>
          </View>
        ) : null}
      </ScrollView>
    </AppBackground>
  );
}

// ─── sub-components ───────────────────────────────────────────────────────────

function BulletItem({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },

  emptyContainer: {
    flex: 1,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: spacing.xl,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },

  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
  },
  backLabel: {
    color: colors.primaryLight,
    fontSize: 15,
    fontWeight: '600',
  },

  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },

  card: {
    gap: spacing.sm,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },

  bulletList: {
    gap: spacing.xs,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'flex-start',
  },
  bulletDot: {
    color: colors.primaryLight,
    fontSize: 14,
    lineHeight: 20,
  },
  bulletText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },

  countBadge: {
    color: colors.cyan,
    fontSize: 13,
    fontWeight: '700',
    marginTop: spacing.xs,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipInactive: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  chipLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  chipLabelActive: {
    color: colors.text,
  },

  periodNote: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },

  shareRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  shareButton: {
    flex: 1,
    minHeight: 72,
    backgroundColor: 'rgba(109,93,246,0.18)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  shareButtonDisabled: {
    opacity: 0.45,
  },
  shareIcon: {
    fontSize: 26,
  },
  shareButtonLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },

  downloadButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  downloadLabel: {
    color: colors.primaryLight,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  downloadLabelDisabled: {
    opacity: 0.45,
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  loadingLabel: {
    color: colors.textMuted,
    fontSize: 14,
  },

  errorBox: {
    backgroundColor: 'rgba(255,107,122,0.15)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});

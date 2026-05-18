import React, { useState, useEffect, useRef } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
  useWindowDimensions,
  FlatList,
  GestureResponderEvent,
  PanResponder,
} from 'react-native';
import { calculateSleepDiaryAverages } from '@diario-do-sono/core';
import { colors, spacing, fonts, typography } from '../theme/tokens';
import { NocturneBackdrop } from '../components/NocturneBackdrop';
import { Kicker } from '../components/Kicker';
import { BigNumberHM } from '../components/BigNumberHM';
import { BigPct } from '../components/BigPct';
import { RingMini } from '../components/RingMini';
import { NightBar } from '../components/NightBar';
import { LatencyTrack } from '../components/LatencyTrack';
import type { PatientProfile, SleepDiaryEntry } from '../types';

interface HeroCard {
  id: 'tts' | 'efficiency' | 'latency';
  label: string;
}

const HERO_CARDS: HeroCard[] = [
  { id: 'tts', label: 'Tempo de sono' },
  { id: 'efficiency', label: 'Eficiência' },
  { id: 'latency', label: 'Latência' },
];

export function TodayScreen({
  profile,
  entries,
  onNewEntry,
  onEditEntry,
  onSummary,
  onReport,
}: {
  profile: PatientProfile;
  entries: SleepDiaryEntry[];
  onNewEntry: () => void;
  onEditEntry: (entry: SleepDiaryEntry) => void;
  onSummary: () => void;
  onReport: () => void;
}) {
  const { width } = useWindowDimensions();
  const today = new Date().toISOString().slice(0, 10);
  const todayEntry = entries.find((entry) => entry.input.entryDate === today);
  const latestEntry = todayEntry ?? entries[0];
  const averages = calculateSleepDiaryAverages(
    entries.map((entry) => ({ input: entry.input, metrics: entry.metrics }))
  );

  const [heroIndex, setHeroIndex] = useState(0);
  const [showBreakdownSheet, setShowBreakdownSheet] = useState(false);
  const carouselRef = useRef<FlatList>(null);

  // Breathing animation for halo
  const [breath, setBreath] = useState(0);
  useEffect(() => {
    let raf: any;
    let t0: number | undefined;
    const tick = (t: number) => {
      if (!t0) t0 = t;
      setBreath((Math.sin(((t - t0) / 2400) * Math.PI) + 1) / 2);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleHeroScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / width);
    setHeroIndex(newIndex);
  };

  const renderHeroCard = ({ item, index }: { item: HeroCard; index: number }) => {
    const metrics = latestEntry?.metrics;
    const isPressable = item.id === 'efficiency';

    const content = (
      <View style={[heroStyles.card, { width }]}>
        <Kicker
          num={String(index + 1).padStart(2, '0')}
          label={item.label}
          delta={
            item.id === 'tts'
              ? `+${averages.ttsCalculatedMinutes - (entries[1]?.metrics.ttsCalculatedMinutes ?? 0)}m vs semana`
              : item.id === 'efficiency'
                ? `+${averages.sleepEfficiencyPercent - (entries[1]?.metrics.sleepEfficiencyPercent ?? 0)}% vs semana`
                : 'estável'
          }
        />

        {item.id === 'tts' && metrics ? (
          <>
            <BigNumberHM
              hours={Math.floor(metrics.ttsCalculatedMinutes / 60)}
              minutes={metrics.ttsCalculatedMinutes % 60}
              primary={colors.primary}
              fontFamily={fonts.serif.accent}
            />
            <NightBar
              bedtime="23:14"
              wakeTime="07:08"
              sleepPercentage={metrics.sleepEfficiencyPercent}
              primary={colors.primary}
            />
          </>
        ) : null}

        {item.id === 'efficiency' && metrics ? (
          <View style={heroStyles.efficiencyContent}>
            <BigPct
              value={metrics.sleepEfficiencyPercent}
              primary={colors.primary}
              fontFamily={fonts.serif.accent}
            />
            <View style={heroStyles.efficiencyRight}>
              <RingMini value={metrics.sleepEfficiencyPercent} primary={colors.primary} />
              <Text style={heroStyles.efficiencyHint}>
                Sono útil vs tempo na cama. Acima de <Text style={{ fontWeight: '700' }}>85%</Text> é
                considerado bom.
              </Text>
            </View>
          </View>
        ) : null}

        {item.id === 'latency' && metrics ? (
          <>
            <View style={heroStyles.latencyNumber}>
              <Text style={heroStyles.latencyValue}>{metrics.lisMinutes}</Text>
              <Text style={heroStyles.latencyUnit}>min</Text>
            </View>
            <Text style={heroStyles.latencyHint}>
              Tempo entre deitar e adormecer. Abaixo de 20 min é considerado saudável.
            </Text>
            <LatencyTrack value={metrics.lisMinutes} primary={colors.primary} />
          </>
        ) : null}

        {item.id === 'efficiency' && (
          <View style={heroStyles.pressHint}>
            <Text style={heroStyles.pressHintText}>Segure para detalhes</Text>
            <View style={heroStyles.pressHintDot} />
          </View>
        )}
      </View>
    );

    if (isPressable) {
      return (
        <Pressable onLongPress={() => setShowBreakdownSheet(true)} style={heroStyles.cardContainer}>
          {content}
        </Pressable>
      );
    }

    return <View style={heroStyles.cardContainer}>{content}</View>;
  };

  const streak = entries.length;
  const isiScore = 8; // mock

  return (
    <View style={heroStyles.container}>
      <NocturneBackdrop primary={colors.primary} withMoon={true} />

      {/* Halo breathing effect */}
      <View
        style={[
          heroStyles.halo,
          {
            transform: [{ scale: 0.85 + breath * 0.18 }],
          },
        ]}
      />

      <ScrollView style={heroStyles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={heroStyles.header}>
          <View>
            <Text style={heroStyles.date}>Quarta · 20 maio</Text>
            <Text style={heroStyles.greeting}>
              Bom dia, <Text style={heroStyles.greetingName}>{profile.name}</Text>.
            </Text>
            <Text style={heroStyles.subtitle}>Boa noite de descanso.</Text>
          </View>
          <Pressable style={heroStyles.settingsBtn}>
            {/* User icon */}
            <Text style={{ color: colors.ink }}>⚙️</Text>
          </Pressable>
        </View>

        {/* Hero Carousel */}
        <View style={heroStyles.carouselWrapper}>
          <FlatList
            ref={carouselRef}
            data={HERO_CARDS}
            renderItem={renderHeroCard}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            scrollEventThrottle={16}
            onScroll={handleHeroScroll}
            showsHorizontalScrollIndicator={false}
            style={heroStyles.carousel}
          />

          {/* Dots */}
          <View style={heroStyles.dots}>
            {HERO_CARDS.map((_, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  carouselRef.current?.scrollToIndex({ index: i, animated: true });
                  setHeroIndex(i);
                }}
                style={[
                  heroStyles.dot,
                  heroIndex === i && heroStyles.dotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* CTA - Fill diary */}
        <Pressable style={heroStyles.ctaButton} onPress={onNewEntry}>
          <View style={heroStyles.ctaIcon}>
            <Text style={{ color: '#fff', fontSize: 18 }}>+</Text>
          </View>
          <View style={heroStyles.ctaText}>
            <Text style={heroStyles.ctaTitle}>Preencher diário de hoje</Text>
            <Text style={heroStyles.ctaMeta}>4 perguntas · cerca de 2 min</Text>
          </View>
        </Pressable>

        {/* Weekly trend */}
        <View style={heroStyles.weekTrendSection}>
          <View style={heroStyles.weekTrendHeader}>
            <View>
              <Text style={heroStyles.weekTrendTitle}>Sua semana</Text>
              <Text style={heroStyles.weekTrendMeta}>
                Eficiência · <Text style={{ color: colors.primary, fontWeight: '600' }}>
                  {averages.sleepEfficiencyPercent}%
                </Text>
              </Text>
            </View>
            <View style={heroStyles.dayChip}>
              <Text style={heroStyles.dayChipText}>7d</Text>
            </View>
          </View>
          <View style={heroStyles.chartPlaceholder}>
            <Text style={{ color: colors.textMuted }}>Chart será renderizado aqui</Text>
          </View>
        </View>

        {/* Daily Insight */}
        <View style={heroStyles.insightSection}>
          <View style={heroStyles.insightBar} />
          <View style={heroStyles.insightContent}>
            <Text style={heroStyles.insightKicker}>Padrão da semana</Text>
            <Text style={heroStyles.insightText}>
              Você dormiu antes das 23:30 em <Text style={heroStyles.insightHighlight}>6 das últimas 7 noites</Text>.
              Boa consistência de horário — siga assim para reforçar o ritmo circadiano.
            </Text>
          </View>
        </View>

        {/* ISI row */}
        <Pressable style={heroStyles.isiButton} onPress={onSummary}>
          <View style={heroStyles.isiRing}>
            <Text style={heroStyles.isiScore}>{isiScore}</Text>
          </View>
          <View style={heroStyles.isiContent}>
            <Text style={heroStyles.isiLabel}>IGI · Subclínica</Text>
            <Text style={heroStyles.isiMeta}>Reavaliar em 8 dias</Text>
          </View>
        </Pressable>

        {/* Quick actions */}
        <View style={heroStyles.quickActions}>
          <Pressable style={heroStyles.quickActionBtn} onPress={onSummary}>
            <Text style={heroStyles.quickActionIcon}>📊</Text>
            <View>
              <Text style={heroStyles.quickActionTitle}>Histórico</Text>
              <Text style={heroStyles.quickActionMeta}>14 noites</Text>
            </View>
          </Pressable>
          <Pressable style={heroStyles.quickActionBtn} onPress={onReport}>
            <Text style={heroStyles.quickActionIcon}>📄</Text>
            <View>
              <Text style={heroStyles.quickActionTitle}>Enviar ao médico</Text>
              <Text style={heroStyles.quickActionMeta}>PDF · 2 cliques</Text>
            </View>
          </Pressable>
        </View>

        {/* Streak */}
        <View style={heroStyles.streakSection}>
          <View style={heroStyles.streakDot} />
          <Text style={heroStyles.streakText}>{streak} noites consecutivas preenchidas</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Breakdown sheet modal */}
      {showBreakdownSheet && (
        <BreakdownSheet
          metrics={latestEntry?.metrics}
          primary={colors.primary}
          onClose={() => setShowBreakdownSheet(false)}
        />
      )}
    </View>
  );
}

function BreakdownSheet({
  metrics,
  primary,
  onClose,
}: {
  metrics?: any;
  primary: string;
  onClose: () => void;
}) {
  if (!metrics) return null;

  const rows = [
    { label: 'Tempo total na cama (TTC)', value: `${Math.floor(metrics.ttcMinutes / 60)}h ${String(metrics.ttcMinutes % 60).padStart(2, '0')}`, hint: 'Da hora de deitar até levantar' },
    { label: 'Tempo total de sono (TTS)', value: `${Math.floor(metrics.ttsCalculatedMinutes / 60)}h ${String(metrics.ttsCalculatedMinutes % 60).padStart(2, '0')}`, hint: 'Sono útil, descontando despertares' },
    { label: 'Latência inicial (LIS)', value: `${metrics.lisMinutes} min`, hint: 'Tempo até adormecer' },
    { label: 'Despertares (WASO)', value: `${metrics.wasoMinutes} min`, hint: 'Tempo acordada após adormecer' },
    { label: 'Nº de despertares', value: '2', hint: 'Episódios de mais de 1 min' },
    { label: 'Qualidade percebida', value: '5 / 5', hint: 'Como você se sentiu ao acordar' },
  ];

  return (
    <Pressable style={breakdownStyles.overlay} onPress={onClose}>
      <View style={breakdownStyles.sheet}>
        <View style={breakdownStyles.handle} />

        <View style={breakdownStyles.header}>
          <View>
            <Text style={breakdownStyles.kicker}>Detalhes da noite</Text>
            <Text style={breakdownStyles.title}>
              Eficiência <Text style={{ fontStyle: 'italic', color: primary }}>
                {metrics.sleepEfficiencyPercent}%
              </Text>
            </Text>
          </View>
          <Pressable onPress={onClose} style={breakdownStyles.closeBtn}>
            <Text style={breakdownStyles.closeBtnText}>Fechar</Text>
          </Pressable>
        </View>

        <View style={breakdownStyles.content}>
          {rows.map((row, i) => (
            <View key={row.label} style={[breakdownStyles.row, i < rows.length - 1 && breakdownStyles.rowBorder]}>
              <View style={breakdownStyles.rowLabel}>
                <Text style={breakdownStyles.rowTitle}>{row.label}</Text>
                <Text style={breakdownStyles.rowHint}>{row.hint}</Text>
              </View>
              <Text style={breakdownStyles.rowValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        <View style={[breakdownStyles.info, { backgroundColor: `${primary}1A`, borderColor: `${primary}33` }]}>
          <Text style={breakdownStyles.infoText}>
            <Text style={{ fontWeight: '700' }}>Como interpretar:</Text> a eficiência de {metrics.sleepEfficiencyPercent}%
            é considerada <Text style={{ fontStyle: 'italic' }}>excelente</Text>. Continue priorizando rotina e
            ambiente escuro.
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const heroStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    position: 'relative',
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
    paddingBottom: 100,
  },
  halo: {
    position: 'absolute',
    top: -30,
    left: -10,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.primary,
    opacity: 0.2,
    pointerEvents: 'none',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 20,
    paddingBottom: 6,
  },
  date: {
    fontSize: 11,
    letterSpacing: 0.16,
    textTransform: 'uppercase',
    color: colors.dim,
    fontWeight: '500',
  },
  greeting: {
    fontFamily: fonts.serif.display,
    fontSize: 28,
    fontWeight: '400',
    letterSpacing: -0.01,
    marginTop: 6,
    lineHeight: 1.05,
    color: colors.ink,
  },
  greetingName: {
    color: colors.inkSoft,
    fontStyle: 'italic',
  },
  subtitle: {
    fontFamily: fonts.serif.display,
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 3,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselWrapper: {
    padding: 18,
    paddingTop: 18,
    position: 'relative',
  },
  carousel: {
    marginHorizontal: -18,
  },
  cardContainer: {
    paddingHorizontal: 18,
  },
  card: {
    padding: 22,
    paddingBottom: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 240,
  },
  efficiencyContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 18,
    marginTop: 6,
  },
  efficiencyRight: {
    flex: 1,
  },
  efficiencyHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 8,
    lineHeight: 1.45,
  },
  latencyNumber: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 6,
  },
  latencyValue: {
    fontFamily: fonts.serif.accent,
    fontSize: 96,
    fontWeight: '300',
    letterSpacing: -0.04,
    lineHeight: 0.82,
    color: colors.ink,
  },
  latencyUnit: {
    fontFamily: fonts.serif.accent,
    fontSize: 32,
    color: colors.primary,
    letterSpacing: -0.02,
    fontWeight: '300',
    fontStyle: 'italic',
  },
  latencyHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 12,
    lineHeight: 1.5,
  },
  pressHint: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 10.5,
    color: colors.dim,
    letterSpacing: 0.08,
    textTransform: 'uppercase',
  },
  pressHintText: {
    fontSize: 10.5,
    color: colors.dim,
    letterSpacing: 0.08,
    textTransform: 'uppercase',
  },
  pressHintDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 2,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.ghost,
  },
  dotActive: {
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  ctaButton: {
    padding: 18,
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 0,
    borderRadius: 18,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 5,
  },
  ctaIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    flex: 1,
    minWidth: 0,
  },
  ctaTitle: {
    fontFamily: fonts.serif.display,
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: -0.01,
    color: '#fff',
  },
  ctaMeta: {
    fontSize: 11,
    opacity: 0.78,
    marginTop: 3,
    fontFamily: fonts.mono.default,
    letterSpacing: 0.06,
    color: '#fff',
  },
  weekTrendSection: {
    padding: 22,
    marginTop: 0,
    marginHorizontal: 24,
  },
  weekTrendHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  weekTrendTitle: {
    fontFamily: fonts.serif.display,
    fontSize: 20,
    letterSpacing: -0.01,
    color: colors.ink,
  },
  weekTrendMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  dayChip: {
    padding: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dayChipText: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: fonts.mono.default,
    letterSpacing: 0.06,
  },
  chartPlaceholder: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightSection: {
    flexDirection: 'row',
    gap: 12,
    padding: 18,
    paddingLeft: 24,
    paddingRight: 24,
    marginTop: 0,
  },
  insightBar: {
    width: 2,
    borderRadius: 1,
    backgroundColor: colors.primary,
    flexGrow: 1,
    shadowColor: colors.primary,
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 2,
    alignSelf: 'stretch',
  },
  insightContent: {
    flex: 1,
    minWidth: 0,
  },
  insightKicker: {
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.14,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  insightText: {
    fontSize: 15,
    color: colors.ink,
    marginTop: 4,
    lineHeight: 1.45,
    fontFamily: fonts.serif.display,
    fontWeight: '400',
  },
  insightHighlight: {
    fontStyle: 'italic',
    color: colors.primary,
  },
  isiButton: {
    flexDirection: 'row',
    padding: 14,
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceStrong,
    alignItems: 'center',
    gap: 14,
  },
  isiRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  isiScore: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
  },
  isiContent: {
    flex: 1,
    minWidth: 0,
  },
  isiLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink,
  },
  isiMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  quickActionBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quickActionIcon: {
    fontSize: 18,
  },
  quickActionTitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: colors.ink,
  },
  quickActionMeta: {
    fontSize: 10.5,
    color: colors.dim,
    marginTop: 1,
  },
  streakSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
    marginBottom: 24,
  },
  streakDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 1,
  },
  streakText: {
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.04,
  },
});

const breakdownStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(5,7,18,0.55)',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    zIndex: 50,
  },
  sheet: {
    width: '100%',
    backgroundColor: colors.backgroundDeep,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 28,
    maxHeight: '78%',
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  kicker: {
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.14,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  title: {
    fontFamily: fonts.serif.display,
    fontSize: 26,
    marginTop: 4,
    letterSpacing: -0.01,
    fontWeight: '400',
    color: colors.ink,
  },
  closeBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  closeBtnText: {
    fontSize: 12,
    color: colors.ink,
    fontWeight: '500',
  },
  content: {
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    padding: 13,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 13,
    color: colors.ink,
    fontWeight: '500',
  },
  rowHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  rowValue: {
    fontFamily: fonts.serif.display,
    fontSize: 20,
    color: colors.ink,
    letterSpacing: -0.01,
    fontWeight: '400',
  },
  info: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 12,
    color: colors.ink,
    lineHeight: 1.55,
  },
  infoText: {
    fontSize: 12,
    color: colors.ink,
    lineHeight: 1.55,
  },
});

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { formatDuration } from '@diario-do-sono/core';
import { AppBackground } from '../components/AppBackground';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, spacing } from '../theme/tokens';
import type { SleepDiaryEntry } from '../types';

// ─── constants (same range as SleepTimeline) ─────────────────────────────────

const RANGE_START_HOUR = 18;
const RANGE_TOTAL_MINUTES = 20 * 60; // 18:00 → 14:00 next day

const SEG = {
  latency: '#8B7FE8',
  sleep: '#3ECFB0',
  waso: '#FF8C42',
  inertia: '#F8C86A',
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function offsetMin(clockTime: string): number {
  const [h, m] = clockTime.split(':').map(Number);
  const abs = (h ?? 0) * 60 + (m ?? 0);
  const start = RANGE_START_HOUR * 60;
  return abs >= start ? abs - start : 1440 - start + abs;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function shortDate(iso: string): string {
  const parts = iso.split('-');
  return `${parts[2]}/${parts[1]}`;
}

// ─── HourAxisRow ─────────────────────────────────────────────────────────────

function HourAxisRow() {
  const ticks: Array<{ label: string; pct: number }> = [];
  for (let h = 20; h <= 30; h += 2) {
    const offsetM = (h - RANGE_START_HOUR) * 60;
    if (offsetM >= 0 && offsetM <= RANGE_TOTAL_MINUTES) {
      ticks.push({ label: `${String(h % 24).padStart(2, '0')}h`, pct: (offsetM / RANGE_TOTAL_MINUTES) * 100 });
    }
  }
  return (
    <View style={axisStyles.row}>
      {ticks.map(({ label, pct }) => (
        <Text key={label} style={[axisStyles.tick, { left: `${pct}%` as unknown as number }]}>
          {label}
        </Text>
      ))}
    </View>
  );
}

const axisStyles = StyleSheet.create({
  row: { flex: 1, height: 14, position: 'relative' },
  tick: {
    position: 'absolute',
    color: colors.textMuted,
    fontSize: 8,
    width: 18,
    marginLeft: -9,
    textAlign: 'center',
  },
});

// ─── SleepBarRow ─────────────────────────────────────────────────────────────
// One compact row per night in the timeline grid.

function SleepBarRow({ entry }: { entry: SleepDiaryEntry }) {
  const { bedTime, sleepLatencyMinutes, nightAwakeningsCount, wasoMinutes, finalWakeTime, outOfBedLatencyMinutes } = entry.input;
  const outOfBedTime = entry.metrics.outOfBedTime;

  const bedOff = clamp(offsetMin(bedTime), 0, RANGE_TOTAL_MINUTES);
  const wakeOff = clamp(offsetMin(finalWakeTime), 0, RANGE_TOTAL_MINUTES);
  const oobOff = clamp(offsetMin(outOfBedTime), 0, RANGE_TOTAL_MINUTES);

  const segs: Array<{ flex: number; color: string }> = [];

  if (bedOff > 0) segs.push({ flex: bedOff, color: 'transparent' });

  const lisC = clamp(sleepLatencyMinutes, 0, RANGE_TOTAL_MINUTES);
  if (lisC > 0) segs.push({ flex: lisC, color: SEG.latency });

  const sleepPeriod = clamp(wakeOff - bedOff - lisC, 0, RANGE_TOTAL_MINUTES);
  if (sleepPeriod > 0) {
    const capWaso = clamp(wasoMinutes, 0, sleepPeriod);
    if (nightAwakeningsCount > 0 && capWaso > 0) {
      const wasoEach = capWaso / nightAwakeningsCount;
      const netSleep = sleepPeriod - capWaso;
      const sp = netSleep / (nightAwakeningsCount + 1);
      for (let i = 0; i < nightAwakeningsCount; i++) {
        if (sp > 0.5) segs.push({ flex: sp, color: SEG.sleep });
        segs.push({ flex: wasoEach, color: SEG.waso });
      }
      if (sp > 0.5) segs.push({ flex: sp, color: SEG.sleep });
    } else {
      segs.push({ flex: sleepPeriod, color: SEG.sleep });
    }
  }

  const inertia = clamp(outOfBedLatencyMinutes, 0, RANGE_TOTAL_MINUTES);
  if (inertia > 0) segs.push({ flex: inertia, color: SEG.inertia });

  const postOff = RANGE_TOTAL_MINUTES - oobOff;
  if (postOff > 0) segs.push({ flex: postOff, color: 'transparent' });

  return (
    <View style={barRowStyles.row}>
      <Text style={barRowStyles.dateLabel}>{shortDate(entry.input.entryDate)}</Text>
      <View style={barRowStyles.bar}>
        {segs.map((s, i) => (
          <View key={i} style={{ flex: s.flex, backgroundColor: s.color }} />
        ))}
      </View>
      <Text style={barRowStyles.effLabel}>{entry.metrics.sleepEfficiencyPercent}%</Text>
    </View>
  );
}

const barRowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateLabel: { color: colors.textMuted, fontSize: 10, width: 36, textAlign: 'right' },
  bar: {
    flex: 1,
    height: 14,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
  },
  effLabel: { color: colors.textMuted, fontSize: 10, width: 34, textAlign: 'right' },
});

// ─── TrendChart ───────────────────────────────────────────────────────────────
// Vertical bar chart for a single metric over time.

interface TrendChartProps {
  entries: SleepDiaryEntry[];
  title: string;
  getValue: (e: SleepDiaryEntry) => number;
  formatValue: (v: number) => string;
  barColor: string;
  referenceValue?: number;
  referenceLabel?: string;
}

const CHART_H = 90;

function TrendChart({ entries, title, getValue, formatValue, barColor, referenceValue, referenceLabel }: TrendChartProps) {
  const values = entries.map(getValue);
  const maxVal = Math.max(...values, referenceValue ?? 0, 1);

  return (
    <View style={chartStyles.wrapper}>
      <Text style={chartStyles.title}>{title}</Text>
      <View style={[chartStyles.chartArea, { height: CHART_H }]}>
        {/* Reference line */}
        {referenceValue != null ? (
          <View style={[chartStyles.refLine, { bottom: (referenceValue / maxVal) * CHART_H }]}>
            {referenceLabel ? (
              <Text style={chartStyles.refLabel}>{referenceLabel}</Text>
            ) : null}
          </View>
        ) : null}

        {/* Bars */}
        <View style={chartStyles.barsRow}>
          {entries.map((entry, i) => {
            const v = values[i] ?? 0;
            const barH = Math.max(3, (v / maxVal) * CHART_H);
            return (
              <View key={entry.id} style={chartStyles.barCol}>
                <Text style={chartStyles.valLabel}>{formatValue(v)}</Text>
                <View style={[chartStyles.bar, { height: barH, backgroundColor: barColor }]} />
                <Text style={chartStyles.dateLabel}>{shortDate(entry.input.entryDate)}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  title: { color: colors.text, fontSize: 14, fontWeight: '800' },
  chartArea: { position: 'relative' },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 3,
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 18,
  },
  barCol: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 2,
  },
  valLabel: { color: colors.textMuted, fontSize: 7, textAlign: 'center' },
  bar: { width: '100%', borderRadius: 2, minHeight: 3 },
  dateLabel: {
    position: 'absolute',
    bottom: -18,
    color: colors.textMuted,
    fontSize: 7,
    textAlign: 'center',
    width: '100%',
  },
  refLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.cyan,
    opacity: 0.55,
    zIndex: 1,
  },
  refLabel: {
    position: 'absolute',
    right: 0,
    top: -11,
    color: colors.cyan,
    fontSize: 8,
    opacity: 0.8,
  },
});

// ─── Legend ───────────────────────────────────────────────────────────────────

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={legendStyles.item}>
      <View style={[legendStyles.dot, { backgroundColor: color }]} />
      <Text style={legendStyles.label}>{label}</Text>
    </View>
  );
}

const legendStyles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  label: { color: colors.textMuted, fontSize: 10 },
});

// ─── GraphicSummaryScreen ────────────────────────────────────────────────────

export function GraphicSummaryScreen({ entries, onBack, onReport }: {
  entries: SleepDiaryEntry[];
  onBack: () => void;
  onReport: () => void;
}) {
  // Last 14 entries, oldest first so charts flow left→right chronologically
  const recent = entries.slice(0, 14).reverse();

  if (entries.length === 0) {
    return (
      <AppBackground>
        <View style={emptyStyles.container}>
          <Text style={emptyStyles.title}>Nenhum registro ainda</Text>
          <Text style={emptyStyles.sub}>Preencha o diário do sono para ver o resumo gráfico.</Text>
          <PrimaryButton label="Voltar" variant="secondary" onPress={onBack} />
        </View>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Resumo Gráfico</Text>
        <Text style={styles.subtitle}>Últimas 2 semanas · {recent.length} noite{recent.length !== 1 ? 's' : ''}</Text>

        {/* ── Timeline section ─────────────────────────── */}
        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Linha do tempo do sono</Text>

          <View style={styles.legend}>
            <LegendItem color={SEG.latency} label="Latência" />
            <LegendItem color={SEG.sleep} label="Sono" />
            <LegendItem color={SEG.waso} label="WASO" />
            <LegendItem color={SEG.inertia} label="Inércia" />
          </View>

          {/* Hour axis header */}
          <View style={styles.axisRow}>
            <View style={{ width: 36 + 6 }} />
            <HourAxisRow />
            <View style={{ width: 34 + 6 }} />
          </View>

          {/* One row per night */}
          <View style={styles.timelineRows}>
            {recent.map((entry) => (
              <SleepBarRow key={entry.id} entry={entry} />
            ))}
          </View>
        </GlassCard>

        {/* ── Eficiência ───────────────────────────────── */}
        <GlassCard style={styles.card}>
          <TrendChart
            entries={recent}
            title="Eficiência do sono (%)"
            getValue={(e) => e.metrics.sleepEfficiencyPercent}
            formatValue={(v) => `${v}%`}
            barColor={colors.primary}
            referenceValue={85}
            referenceLabel="85%"
          />
        </GlassCard>

        {/* ── TTS calculado ────────────────────────────── */}
        <GlassCard style={styles.card}>
          <TrendChart
            entries={recent}
            title="Tempo total de sono — calculado"
            getValue={(e) => e.metrics.ttsCalculatedMinutes}
            formatValue={(v) => formatDuration(v)}
            barColor={SEG.sleep}
            referenceValue={420}
            referenceLabel="7h"
          />
        </GlassCard>

        {/* ── TTS percebido ────────────────────────────── */}
        <GlassCard style={styles.card}>
          <TrendChart
            entries={recent}
            title="Tempo total de sono — percebido"
            getValue={(e) => e.metrics.ttsPerceivedMinutes}
            formatValue={(v) => formatDuration(v)}
            barColor="#7EC8E3"
          />
        </GlassCard>

        {/* ── TTC ─────────────────────────────────────── */}
        <GlassCard style={styles.card}>
          <TrendChart
            entries={recent}
            title="Tempo total na cama (TTC)"
            getValue={(e) => e.metrics.ttcMinutes}
            formatValue={(v) => formatDuration(v)}
            barColor={colors.cyan}
          />
        </GlassCard>

        {/* ── LIS ─────────────────────────────────────── */}
        <GlassCard style={styles.card}>
          <TrendChart
            entries={recent}
            title="Latência de início do sono (LIS)"
            getValue={(e) => e.metrics.lisMinutes}
            formatValue={(v) => `${v}min`}
            barColor={SEG.latency}
            referenceValue={30}
            referenceLabel="30min"
          />
        </GlassCard>

        {/* ── WASO ────────────────────────────────────── */}
        <GlassCard style={styles.card}>
          <TrendChart
            entries={recent}
            title="Tempo acordado durante a noite (WASO)"
            getValue={(e) => e.metrics.wasoMinutes}
            formatValue={(v) => `${v}min`}
            barColor={SEG.waso}
            referenceValue={30}
            referenceLabel="30min"
          />
        </GlassCard>

        {/* ── Despertares ──────────────────────────────── */}
        <GlassCard style={styles.card}>
          <TrendChart
            entries={recent}
            title="Número de despertares"
            getValue={(e) => e.metrics.fragmentationCount}
            formatValue={(v) => `${Math.round(v)}`}
            barColor={SEG.waso}
          />
        </GlassCard>

        {/* ── Inércia ──────────────────────────────────── */}
        <GlassCard style={styles.card}>
          <TrendChart
            entries={recent}
            title="Inércia ao despertar"
            getValue={(e) => e.metrics.wakeInertiaMinutes}
            formatValue={(v) => `${v}min`}
            barColor={SEG.inertia}
          />
        </GlassCard>

        <PrimaryButton label="Enviar ao Médico" onPress={onReport} />
        <PrimaryButton label="Voltar" variant="secondary" onPress={onBack} />
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingBottom: spacing.xl },
  title: { color: colors.text, fontSize: 30, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 14, marginTop: -spacing.sm },
  card: { gap: spacing.md },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  axisRow: { flexDirection: 'row', alignItems: 'center' },
  timelineRows: { gap: 6 },
});

const emptyStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.lg },
  title: { color: colors.text, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  sub: { color: colors.textMuted, textAlign: 'center' },
});

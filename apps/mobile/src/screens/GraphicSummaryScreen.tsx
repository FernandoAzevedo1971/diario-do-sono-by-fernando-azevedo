import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { formatDuration, type AwakeningDetail } from '@diario-do-sono/core';
import { AppBackground } from '../components/AppBackground';
import { BackArrow } from '../components/BackArrow';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, spacing } from '../theme/tokens';
import type { SleepDiaryEntry } from '../types';

// ─── constants ────────────────────────────────────────────────────────────────

const RANGE_START_HOUR = 18;
const RANGE_TOTAL_MINUTES = 20 * 60; // 18:00 → 14:00 next day

const SEG = {
  latency: '#8B7FE8',
  sleep:   '#3ECFB0',
  inertia: '#F8C86A',
  wasoOrange: '#FF8C42', // usado apenas nos gráficos de tendência, não na actigrafia
};

// Chart layout
const CHART_H   = 96;                           // total chartArea height (px)
const VAL_H     = 14;                           // reserved at top for value labels
const DATE_H    = 16;                           // reserved at bottom for date labels
const BAR_H_MAX = CHART_H - VAL_H - DATE_H;    // = 66px usable for bars

// Table layout
const LABEL_W = 80;

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

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

function fmtQuality(q: string | undefined | null): string {
  if (q === 'good') return 'Boa';
  if (q === 'regular') return 'Reg.';
  if (q === 'bad') return 'Ruim';
  return '—';
}

function fmtFeeling(f: string | undefined | null): string {
  if (f === 'rested') return 'Desc.';
  if (f === 'tired') return 'Cansado';
  if (f === 'sleepy') return 'Sonol.';
  return '—';
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

function buildBarSegs(entry: SleepDiaryEntry): Array<{ flex: number; color: string }> {
  const { bedTime, sleepLatencyMinutes, nightAwakeningsCount, wasoMinutes, finalWakeTime, outOfBedLatencyMinutes, awakeningDetails } = entry.input;
  const oobOff = clamp(offsetMin(entry.metrics.outOfBedTime), 0, RANGE_TOTAL_MINUTES);
  const bedOff  = clamp(offsetMin(bedTime), 0, RANGE_TOTAL_MINUTES);
  const wakeOff = clamp(offsetMin(finalWakeTime), 0, RANGE_TOTAL_MINUTES);
  const segs: Array<{ flex: number; color: string }> = [];

  if (bedOff > 0) segs.push({ flex: bedOff, color: 'transparent' });

  const lis = clamp(sleepLatencyMinutes, 0, RANGE_TOTAL_MINUTES);
  if (lis > 0) segs.push({ flex: lis, color: SEG.latency });

  const sleepPeriod = clamp(wakeOff - bedOff - lis, 0, RANGE_TOTAL_MINUTES);
  if (sleepPeriod > 0) {
    const hasExactTimes = awakeningDetails && awakeningDetails.length > 0 && awakeningDetails.every(a => a.time);
    if (hasExactTimes) {
      const sorted = [...awakeningDetails!].sort((a, b) => offsetMin(a.time!) - offsetMin(b.time!));
      const eachWaso = wasoMinutes / sorted.length;
      let cursor = bedOff + lis;
      sorted.forEach((awk, i) => {
        const awkOff = clamp(offsetMin(awk.time!), cursor, wakeOff);
        const dur = clamp(awk.durationMinutes ?? eachWaso, 1, wakeOff - awkOff);
        if (awkOff - cursor > 0.5) segs.push({ flex: awkOff - cursor, color: SEG.sleep });
        segs.push({ flex: dur, color: 'transparent' });
        cursor = awkOff + dur;
      });
      if (wakeOff - cursor > 0.5) segs.push({ flex: wakeOff - cursor, color: SEG.sleep });
    } else {
      const capWaso = clamp(wasoMinutes, 0, sleepPeriod);
      if (nightAwakeningsCount > 0 && capWaso > 0) {
        const wasoEach = capWaso / nightAwakeningsCount;
        const netSleep = sleepPeriod - capWaso;
        const sp = netSleep / (nightAwakeningsCount + 1);
        for (let i = 0; i < nightAwakeningsCount; i++) {
          if (sp > 0.5) segs.push({ flex: sp, color: SEG.sleep });
          segs.push({ flex: wasoEach, color: 'transparent' });
        }
        if (sp > 0.5) segs.push({ flex: sp, color: SEG.sleep });
      } else {
        segs.push({ flex: sleepPeriod, color: SEG.sleep });
      }
    }
  }

  const inertia = clamp(outOfBedLatencyMinutes, 0, RANGE_TOTAL_MINUTES);
  if (inertia > 0) segs.push({ flex: inertia, color: SEG.inertia });

  const postOff = RANGE_TOTAL_MINUTES - oobOff;
  if (postOff > 0) segs.push({ flex: postOff, color: 'transparent' });

  return segs;
}

function SleepBarRow({ entry }: { entry: SleepDiaryEntry }) {
  const segs = buildBarSegs(entry);
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
    height: 11,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
  },
  effLabel: { color: colors.textMuted, fontSize: 10, width: 34, textAlign: 'right' },
});

// ─── TrendChart ───────────────────────────────────────────────────────────────

interface TrendChartProps {
  entries: SleepDiaryEntry[];
  title: string;
  getValue: (e: SleepDiaryEntry) => number;
  formatValue: (v: number) => string;
  barColor: string;
  referenceValue?: number;
  referenceLabel?: string;
}

function TrendChart({ entries, title, getValue, formatValue, barColor, referenceValue, referenceLabel }: TrendChartProps) {
  const values = entries.map(getValue);
  const maxVal = Math.max(...values, referenceValue ?? 0, 1);

  return (
    <View style={chartStyles.wrapper}>
      <Text style={chartStyles.title}>{title}</Text>
      <View style={[chartStyles.chartArea, { height: CHART_H }]}>

        {/* Reference line — positioned relative to the bar zone */}
        {referenceValue != null ? (
          <View style={[chartStyles.refLine, { bottom: DATE_H + (referenceValue / maxVal) * BAR_H_MAX }]}>
            {referenceLabel ? <Text style={chartStyles.refLabel}>{referenceLabel}</Text> : null}
          </View>
        ) : null}

        {/* Bars */}
        <View style={chartStyles.barsRow}>
          {entries.map((entry, i) => {
            const v = values[i] ?? 0;
            const barH = Math.max(2, (v / maxVal) * BAR_H_MAX);
            return (
              <View key={entry.id} style={chartStyles.barCol}>
                {/* Fixed zone at top for value label */}
                <View style={chartStyles.valZone}>
                  <Text style={chartStyles.valLabel} numberOfLines={1}>{formatValue(v)}</Text>
                </View>
                {/* Remaining space — bar grows from the bottom */}
                <View style={chartStyles.barZone}>
                  <View style={[chartStyles.bar, { height: barH, backgroundColor: barColor }]} />
                </View>
              </View>
            );
          })}
        </View>

        {/* Date labels below bars */}
        <View style={chartStyles.dateRow}>
          {entries.map((entry) => (
            <View key={entry.id} style={chartStyles.dateLabelCell}>
              <Text style={chartStyles.dateLabel}>{shortDate(entry.input.entryDate)}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  title: { color: colors.text, fontSize: 14, fontWeight: '800' },
  chartArea: { position: 'relative' },

  refLine: {
    position: 'absolute',
    left: 0, right: 0,
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

  barsRow: {
    position: 'absolute',
    left: 0, right: 0,
    top: 0,
    bottom: DATE_H,
    flexDirection: 'row',
    gap: 3,
  },
  barCol: {
    flex: 1,
    flexDirection: 'column',
  },
  valZone: {
    height: VAL_H,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  valLabel: {
    color: colors.textMuted,
    fontSize: 7,
    textAlign: 'center',
  },
  barZone: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '48%',
    borderRadius: 4,
    minHeight: 2,
  },

  dateRow: {
    position: 'absolute',
    left: 0, right: 0,
    bottom: 0,
    height: DATE_H,
    flexDirection: 'row',
  },
  dateLabelCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateLabel: {
    color: colors.textMuted,
    fontSize: 7,
    textAlign: 'center',
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

// ─── DataTable ────────────────────────────────────────────────────────────────

interface TableRowDef {
  label: string;
  getValue: (e: SleepDiaryEntry) => string;
}

const INPUT_ROWS: TableRowDef[] = [
  { label: 'Hora deitar',     getValue: (e) => e.input.bedTime },
  { label: 'Latência (min)',  getValue: (e) => String(e.input.sleepLatencyMinutes) },
  { label: 'Despertares',     getValue: (e) => String(e.input.nightAwakeningsCount) },
  { label: 'WASO (min)',      getValue: (e) => String(e.input.wasoMinutes) },
  { label: 'Hora acordar',    getValue: (e) => e.input.finalWakeTime },
  { label: 'Inércia (min)',   getValue: (e) => String(e.input.outOfBedLatencyMinutes) },
  { label: 'TTS percebido',   getValue: (e) => formatDuration(e.input.perceivedSleepMinutes) },
  { label: 'Qualidade sono',  getValue: (e) => fmtQuality(e.input.sleepQuality) },
  { label: 'Ao acordar',      getValue: (e) => fmtFeeling(e.input.morningFeeling) },
  { label: 'Durante o dia',   getValue: (e) => fmtFeeling(e.input.daytimeFeeling) },
];

const CALC_ROWS: TableRowDef[] = [
  { label: 'Hora sair cama',  getValue: (e) => e.metrics.outOfBedTime },
  { label: 'TTC',             getValue: (e) => formatDuration(e.metrics.ttcMinutes) },
  { label: 'TTS calculado',   getValue: (e) => formatDuration(e.metrics.ttsCalculatedMinutes) },
  { label: 'Eficiência',      getValue: (e) => `${e.metrics.sleepEfficiencyPercent}%` },
  { label: 'Fragmentação',    getValue: (e) => String(e.metrics.fragmentationCount) },
  { label: 'Dif. TTS',        getValue: (e) => {
    const d = e.metrics.perceivedCalculatedDiffMinutes;
    return d >= 0 ? `+${d}'` : `${d}'`;
  }},
];

function TableSectionRow({ title, dayW, numCols }: { title: string; dayW: number; numCols: number }) {
  return (
    <View style={[tableStyles.sectionRow, { width: LABEL_W + numCols * dayW }]}>
      <Text style={tableStyles.sectionLabel}>{title}</Text>
    </View>
  );
}

function DataTablePage({ entries }: { entries: SleepDiaryEntry[] }) {
  const [availW, setAvailW] = useState(0);
  const n = entries.length;
  const dayW = availW > 0 ? Math.max(28, Math.floor((availW - LABEL_W) / 7)) : 34;

  return (
    <View onLayout={(e) => setAvailW(e.nativeEvent.layout.width)}>
      <View style={{ width: LABEL_W + n * dayW }}>

        {/* Header */}
        <View style={tableStyles.headerRow}>
          <View style={{ width: LABEL_W }} />
          {entries.map((e) => (
            <View key={e.id} style={{ width: dayW, alignItems: 'center' }}>
              <Text style={tableStyles.headerText}>{shortDate(e.input.entryDate)}</Text>
            </View>
          ))}
        </View>

        {/* Input section */}
        <TableSectionRow title="Anotado" dayW={dayW} numCols={n} />
        {INPUT_ROWS.map((row, i) => (
          <View key={row.label} style={[tableStyles.dataRow, i % 2 === 1 && tableStyles.rowAlt]}>
            <View style={{ width: LABEL_W, paddingLeft: 6, justifyContent: 'center' }}>
              <Text style={tableStyles.rowLabel} numberOfLines={1}>{row.label}</Text>
            </View>
            {entries.map((e) => (
              <View key={e.id} style={{ width: dayW, alignItems: 'center' }}>
                <Text style={tableStyles.cellText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{row.getValue(e)}</Text>
              </View>
            ))}
          </View>
        ))}

        {/* Calculated section */}
        <TableSectionRow title="Calculado" dayW={dayW} numCols={n} />
        {CALC_ROWS.map((row, i) => (
          <View key={row.label} style={[tableStyles.dataRow, i % 2 === 1 && tableStyles.rowAlt]}>
            <View style={{ width: LABEL_W, paddingLeft: 6, justifyContent: 'center' }}>
              <Text style={tableStyles.rowLabel} numberOfLines={1}>{row.label}</Text>
            </View>
            {entries.map((e) => (
              <View key={e.id} style={{ width: dayW, alignItems: 'center' }}>
                <Text style={tableStyles.cellText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{row.getValue(e)}</Text>
              </View>
            ))}
          </View>
        ))}

      </View>
    </View>
  );
}

const tableStyles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(109,93,246,0.28)',
    borderRadius: 6,
    paddingVertical: 6,
    marginBottom: 2,
  },
  headerText: {
    color: colors.text,
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionRow: {
    paddingVertical: 3,
    paddingLeft: 6,
    backgroundColor: 'rgba(62,207,176,0.1)',
    borderLeftWidth: 2,
    borderLeftColor: colors.cyan,
    marginTop: 4,
    marginBottom: 1,
  },
  sectionLabel: {
    color: colors.cyan,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  rowAlt: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  rowLabel: {
    color: colors.textMuted,
    fontSize: 9,
  },
  cellText: {
    color: colors.text,
    fontSize: 9,
    textAlign: 'center',
  },
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
          <BackArrow onPress={onBack} />
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
        <BackArrow onPress={onBack} />
        <Text style={styles.title}>Resumo Gráfico</Text>
        <Text style={styles.subtitle}>Últimas 2 semanas · {recent.length} noite{recent.length !== 1 ? 's' : ''}</Text>

        {/* ── Timeline ─────────────────────────────────── */}
        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Linha do tempo do sono</Text>
          <View style={styles.legend}>
            <LegendItem color={SEG.latency} label="Latência" />
            <LegendItem color={SEG.sleep}   label="Sono" />
            <LegendItem color="rgba(255,255,255,0.15)" label="Acordado" />
            <LegendItem color={SEG.inertia} label="Inércia" />
          </View>
          <View style={styles.axisRow}>
            <View style={{ width: 36 + 6 }} />
            <HourAxisRow />
            <View style={{ width: 34 + 6 }} />
          </View>
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
            barColor={SEG.wasoOrange}
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
            barColor={SEG.wasoOrange}
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

        {/* ── Tabela de dados (7 dias por página) ──────── */}
        {chunkArray(recent, 7).map((week, wi) => (
          <GlassCard key={wi} style={styles.card}>
            <Text style={styles.sectionTitle}>
              Tabela de dados · {shortDate(week[0].input.entryDate)} – {shortDate(week[week.length - 1].input.entryDate)}
            </Text>
            <DataTablePage entries={week} />
          </GlassCard>
        ))}

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

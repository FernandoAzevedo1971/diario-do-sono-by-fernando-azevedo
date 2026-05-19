import React, { useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import { minutesBetweenClockTimes } from '@diario-do-sono/core';
import { colors, radius, spacing } from '../theme/tokens';

// ─── constants ───────────────────────────────────────────────────────────────

const RANGE_START_HOUR = 18; // 18:00
const RANGE_TOTAL_MINUTES = 20 * 60; // 18:00 → 14:00 next day

const SEGMENT = {
  latency: '#8B7FE8', // purple — deitar → adormecer
  sleep: '#3ECFB0',   // teal   — sono consolidado
  waso: '#FF8C42',    // orange — WASO (despertares)
  inertia: '#F8C86A', // yellow — inércia ao sair da cama
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function offsetFromRangeStart(clockTime: string): number {
  const rangeStart = `${String(RANGE_START_HOUR).padStart(2, '0')}:00`;
  return minutesBetweenClockTimes(rangeStart, clockTime);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function minutesToHHMM(total: number): string {
  const norm = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(norm / 60)).padStart(2, '0')}:${String(norm % 60).padStart(2, '0')}`;
}

interface SegmentDef {
  key: string;
  flex: number;
  color: string;
}

function buildSegments(
  bedOffset: number,
  lisMinutes: number,
  nightAwakeningsCount: number,
  wasoMinutes: number,
  finalWakeOffset: number,
  outOfBedLatencyMinutes: number,
  outOfBedOffset: number,
): SegmentDef[] {
  const segs: SegmentDef[] = [];

  // void before bed
  const preBed = clamp(bedOffset, 0, RANGE_TOTAL_MINUTES);
  if (preBed > 0) segs.push({ key: 'void-pre', flex: preBed, color: 'transparent' });

  // sleep latency (LIS)
  const lis = clamp(lisMinutes, 0, RANGE_TOTAL_MINUTES);
  if (lis > 0) segs.push({ key: 'lis', flex: lis, color: SEGMENT.latency });

  // sleep period (LIS end → final wake)
  const sleepPeriod = clamp(finalWakeOffset - bedOffset - lis, 0, RANGE_TOTAL_MINUTES);
  if (sleepPeriod > 0) {
    const capWaso = clamp(wasoMinutes, 0, sleepPeriod);
    if (nightAwakeningsCount > 0 && capWaso > 0) {
      const wasoEach = capWaso / nightAwakeningsCount;
      const netSleep = sleepPeriod - capWaso;
      const spacing = netSleep / (nightAwakeningsCount + 1);

      for (let i = 0; i < nightAwakeningsCount; i++) {
        if (spacing > 0.5) segs.push({ key: `sleep-${i}`, flex: spacing, color: SEGMENT.sleep });
        segs.push({ key: `waso-${i}`, flex: wasoEach, color: SEGMENT.waso });
      }
      if (spacing > 0.5) segs.push({ key: 'sleep-last', flex: spacing, color: SEGMENT.sleep });
    } else {
      segs.push({ key: 'sleep', flex: sleepPeriod, color: SEGMENT.sleep });
    }
  }

  // inertia
  const inertia = clamp(outOfBedLatencyMinutes, 0, RANGE_TOTAL_MINUTES);
  if (inertia > 0) segs.push({ key: 'inertia', flex: inertia, color: SEGMENT.inertia });

  // void after outOfBed
  const postBed = RANGE_TOTAL_MINUTES - outOfBedOffset;
  if (postBed > 0) segs.push({ key: 'void-post', flex: postBed, color: 'transparent' });

  return segs;
}

// ─── component ───────────────────────────────────────────────────────────────

export interface SleepTimelineProps {
  bedTime: string;
  sleepLatencyMinutes: number;
  nightAwakeningsCount: number;
  wasoMinutes: number;
  finalWakeTime: string;
  outOfBedLatencyMinutes: number;
  outOfBedTime: string;
  onChangeBedTime?: (v: string) => void;
  onChangeFinalWakeTime?: (v: string) => void;
}

export function SleepTimeline({
  bedTime,
  sleepLatencyMinutes,
  nightAwakeningsCount,
  wasoMinutes,
  finalWakeTime,
  outOfBedLatencyMinutes,
  outOfBedTime,
  onChangeBedTime,
  onChangeFinalWakeTime,
}: SleepTimelineProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);
  const draggingRef = useRef<'bed' | 'wake' | null>(null);

  const bedOffset = clamp(offsetFromRangeStart(bedTime), 0, RANGE_TOTAL_MINUTES);
  const wakeOffset = clamp(offsetFromRangeStart(finalWakeTime), 0, RANGE_TOTAL_MINUTES);
  const outOfBedOffset = clamp(offsetFromRangeStart(outOfBedTime), 0, RANGE_TOTAL_MINUTES);

  const bedRatio = bedOffset / RANGE_TOTAL_MINUTES;
  const wakeRatio = wakeOffset / RANGE_TOTAL_MINUTES;
  const outOfBedRatio = outOfBedOffset / RANGE_TOTAL_MINUTES;

  const segments = buildSegments(
    bedOffset, sleepLatencyMinutes, nightAwakeningsCount,
    wasoMinutes, wakeOffset, outOfBedLatencyMinutes, outOfBedOffset,
  );

  const interactive = !!(onChangeBedTime || onChangeFinalWakeTime);

  const onChangeBedRef = useRef(onChangeBedTime);
  const onChangeWakeRef = useRef(onChangeFinalWakeTime);
  onChangeBedRef.current = onChangeBedTime;
  onChangeWakeRef.current = onChangeFinalWakeTime;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => interactive,
      onMoveShouldSetPanResponder: () => interactive,
      onPanResponderGrant: (evt) => {
        const x = evt.nativeEvent.locationX;
        const w = trackWidthRef.current;
        if (w === 0) return;

        const bedX = bedRatio * w;
        const wakeX = wakeRatio * w;
        const THRESHOLD = 32;

        const dBed = Math.abs(x - bedX);
        const dWake = Math.abs(x - wakeX);

        if (dBed < THRESHOLD && dBed <= dWake && onChangeBedRef.current) {
          draggingRef.current = 'bed';
        } else if (dWake < THRESHOLD && onChangeWakeRef.current) {
          draggingRef.current = 'wake';
        } else {
          draggingRef.current = null;
        }
      },
      onPanResponderMove: (evt) => {
        const d = draggingRef.current;
        if (!d) return;
        const w = trackWidthRef.current;
        if (w === 0) return;
        const x = clamp(evt.nativeEvent.locationX, 0, w);
        const ratio = x / w;
        const offsetMin = Math.round((ratio * RANGE_TOTAL_MINUTES) / 5) * 5;
        const absMin = ((RANGE_START_HOUR * 60 + offsetMin) % 1440 + 1440) % 1440;
        const time = minutesToHHMM(absMin);
        if (d === 'bed') onChangeBedRef.current?.(time);
        else onChangeWakeRef.current?.(time);
      },
      onPanResponderRelease: () => { draggingRef.current = null; },
    }),
  ).current;

  // Hour tick marks: every 2 hours from 20h to 12h (next day)
  const hourTicks: Array<{ label: string; ratio: number }> = [];
  for (let h = 20; h <= 30; h += 2) {
    const offsetMin = (h - RANGE_START_HOUR) * 60;
    if (offsetMin >= 0 && offsetMin <= RANGE_TOTAL_MINUTES) {
      hourTicks.push({ label: `${String(h % 24).padStart(2, '0')}h`, ratio: offsetMin / RANGE_TOTAL_MINUTES });
    }
  }

  return (
    <View style={styles.container}>
      {/* Track */}
      <View
        style={[styles.track, interactive && styles.trackInteractive]}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          trackWidthRef.current = w;
          setTrackWidth(w);
        }}
        {...panResponder.panHandlers}
      >
        {/* Colored segments */}
        <View style={styles.segmentBar}>
          {segments.map((s) => (
            <View key={s.key} style={{ flex: s.flex, backgroundColor: s.color }} />
          ))}
        </View>

        {/* Draggable markers */}
        {trackWidth > 0 ? (
          <>
            {/* bedTime marker */}
            <View style={[styles.marker, styles.markerBed, { left: bedRatio * trackWidth - 10 }]}>
              <Text style={styles.markerLabel}>{bedTime}</Text>
            </View>

            {/* finalWakeTime marker */}
            <View style={[styles.marker, styles.markerWake, { left: wakeRatio * trackWidth - 10 }]}>
              <Text style={[styles.markerLabel, styles.markerLabelBelow]}>{finalWakeTime}</Text>
            </View>

            {/* outOfBedTime tick */}
            <View style={[styles.tick, { left: outOfBedRatio * trackWidth - 2 }]}>
              <Text style={[styles.markerLabel, styles.markerLabelBelow, { color: SEGMENT.inertia }]}>{outOfBedTime}</Text>
            </View>
          </>
        ) : null}
      </View>

      {/* Hour ticks below */}
      <View style={styles.hourRow}>
        {hourTicks.map(({ label, ratio }) => (
          <Text key={label} style={[styles.hourLabel, { left: `${ratio * 100}%` as unknown as number }]}>
            {label}
          </Text>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <LegendItem color={SEGMENT.latency} label="Latência" />
        <LegendItem color={SEGMENT.sleep} label="Sono" />
        <LegendItem color={SEGMENT.waso} label="WASO" />
        <LegendItem color={SEGMENT.inertia} label="Inércia" />
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { gap: spacing.sm, paddingTop: spacing.sm, paddingBottom: spacing.xs },

  track: {
    height: 36,
    borderRadius: radius.md,
    overflow: 'visible',
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: spacing.xs,
  },
  trackInteractive: { marginHorizontal: 12 }, // extra hit area for thumb dragging

  segmentBar: {
    flexDirection: 'row',
    height: 36,
    borderRadius: radius.md,
    overflow: 'hidden',
  },

  marker: {
    position: 'absolute',
    top: -4,
    width: 20,
    height: 44,
    borderRadius: 10,
    borderWidth: 3,
    alignItems: 'center',
  },
  markerBed: {
    backgroundColor: SEGMENT.latency,
    borderColor: colors.text,
  },
  markerWake: {
    backgroundColor: SEGMENT.sleep,
    borderColor: colors.text,
    top: undefined,
    bottom: -4,
  },

  tick: {
    position: 'absolute',
    top: -4,
    bottom: -4,
    width: 4,
    backgroundColor: SEGMENT.inertia,
    borderRadius: 2,
    alignItems: 'center',
  },

  markerLabel: {
    position: 'absolute',
    top: -20,
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
    width: 44,
    textAlign: 'center',
    left: -12,
  },
  markerLabelBelow: {
    top: undefined,
    bottom: -18,
  },

  hourRow: {
    height: 20,
    position: 'relative',
    marginTop: 8,
  },
  hourLabel: {
    position: 'absolute',
    color: colors.textMuted,
    fontSize: 10,
    marginLeft: -10,
  },

  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
});

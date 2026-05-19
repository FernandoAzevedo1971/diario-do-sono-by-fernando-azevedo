import React, { useEffect, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme/tokens';

// ─── helpers ───────────────────────────────────────────────────────────────

function parseHHMM(t: string): number {
  const parts = t.split(':').map(Number);
  return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
}

function minutesToHHMM(total: number): string {
  const norm = ((total % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ─── TimeInput ──────────────────────────────────────────────────────────────
// Clock time picker (HH:MM) with ▲▼ arrows and horizontal seekbar.

interface TimeInputProps {
  value: string;
  onChange: (v: string) => void;
  rangeStart?: string; // default '18:00'
  rangeEnd?: string;   // default '14:00' (wraps overnight)
}

export function TimeInput({ value, onChange, rangeStart = '18:00', rangeEnd = '14:00' }: TimeInputProps) {
  const [hh, mm] = value.split(':').map(Number);
  const [trackWidth, setTrackWidth] = useState(0);

  const trackWidthRef = useRef(0);
  const onChangeRef = useRef(onChange);
  const rangeStartRef = useRef(rangeStart);
  const rangeEndRef = useRef(rangeEnd);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { rangeStartRef.current = rangeStart; }, [rangeStart]);
  useEffect(() => { rangeEndRef.current = rangeEnd; }, [rangeEnd]);

  function adjustTime(deltaMinutes: number) {
    const current = (hh ?? 0) * 60 + (mm ?? 0);
    onChange(minutesToHHMM(current + deltaMinutes));
  }

  const rangeStartMin = parseHHMM(rangeStart);
  const rangeEndMin = parseHHMM(rangeEnd);
  const rangeSpan = rangeEndMin > rangeStartMin
    ? rangeEndMin - rangeStartMin
    : 1440 - rangeStartMin + rangeEndMin;
  const currentMin = (hh ?? 0) * 60 + (mm ?? 0);
  const offsetFromStart = currentMin >= rangeStartMin
    ? currentMin - rangeStartMin
    : 1440 - rangeStartMin + currentMin;
  const thumbRatio = Math.max(0, Math.min(1, offsetFromStart / rangeSpan));

  function handleSlide(x: number) {
    const width = trackWidthRef.current;
    if (width === 0) return;
    const rStart = parseHHMM(rangeStartRef.current);
    const rEnd = parseHHMM(rangeEndRef.current);
    const rSpan = rEnd > rStart ? rEnd - rStart : 1440 - rStart + rEnd;
    const ratio = Math.max(0, Math.min(1, x / width));
    const rawMin = rStart + Math.round((ratio * rSpan) / 5) * 5;
    onChangeRef.current(minutesToHHMM(rawMin));
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => handleSlide(evt.nativeEvent.locationX),
      onPanResponderMove: (evt) => handleSlide(evt.nativeEvent.locationX),
    }),
  ).current;

  return (
    <View style={timeStyles.container}>
      <View style={timeStyles.row}>
        {/* Hours */}
        <View style={timeStyles.unit}>
          <Pressable style={timeStyles.arrow} onPress={() => adjustTime(60)} hitSlop={12}>
            <Text style={timeStyles.arrowText}>▲</Text>
          </Pressable>
          <Text style={timeStyles.digit}>{String(hh ?? 0).padStart(2, '0')}</Text>
          <Pressable style={timeStyles.arrow} onPress={() => adjustTime(-60)} hitSlop={12}>
            <Text style={timeStyles.arrowText}>▼</Text>
          </Pressable>
          <Text style={timeStyles.unitLabel}>h</Text>
        </View>

        <Text style={timeStyles.colon}>:</Text>

        {/* Minutes */}
        <View style={timeStyles.unit}>
          <Pressable style={timeStyles.arrow} onPress={() => adjustTime(5)} hitSlop={12}>
            <Text style={timeStyles.arrowText}>▲</Text>
          </Pressable>
          <Text style={timeStyles.digit}>{String(mm ?? 0).padStart(2, '0')}</Text>
          <Pressable style={timeStyles.arrow} onPress={() => adjustTime(-5)} hitSlop={12}>
            <Text style={timeStyles.arrowText}>▼</Text>
          </Pressable>
          <Text style={timeStyles.unitLabel}>min</Text>
        </View>
      </View>

      {/* Seekbar */}
      <View
        style={timeStyles.track}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          trackWidthRef.current = w;
          setTrackWidth(w);
        }}
        {...panResponder.panHandlers}
      >
        <View style={[timeStyles.fill, { width: thumbRatio * trackWidth }]} />
        {trackWidth > 0 ? (
          <View style={[timeStyles.thumb, { left: thumbRatio * trackWidth - 12 }]} />
        ) : null}
        <View style={timeStyles.trackLabels}>
          <Text style={timeStyles.trackLabel}>{rangeStart}</Text>
          <Text style={timeStyles.trackLabel}>{rangeEnd}</Text>
        </View>
      </View>
    </View>
  );
}

const timeStyles = StyleSheet.create({
  container: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  unit: { alignItems: 'center', gap: 4 },
  digit: { color: colors.text, fontSize: 54, fontWeight: '900', minWidth: 72, textAlign: 'center' },
  colon: { color: colors.text, fontSize: 54, fontWeight: '900', marginBottom: 26 },
  arrow: { paddingHorizontal: spacing.md, paddingVertical: 4 },
  arrowText: { color: colors.cyan, fontSize: 22, fontWeight: '700' },
  unitLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  track: {
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'visible',
    marginTop: spacing.xs,
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
  },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.text,
    top: '50%',
    marginTop: -12,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  trackLabels: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trackLabel: { color: colors.textMuted, fontSize: 11 },
});

// ─── StepperInput ───────────────────────────────────────────────────────────
// Integer/minute picker with − / + buttons and long-press for fast change.

interface StepperInputProps {
  value: number;
  onChange: (v: number) => void;
  suffix: string;
  step?: number;
  min?: number;
  max?: number;
}

export function StepperInput({ value, onChange, suffix, step = 1, min = 0, max = 9999 }: StepperInputProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const valueRef = useRef(value);
  useEffect(() => { valueRef.current = value; }, [value]);

  function clamp(v: number) {
    return Math.max(min, Math.min(max, v));
  }

  function tap(direction: 1 | -1) {
    onChange(clamp(value + direction * step));
  }

  function startRepeat(direction: 1 | -1) {
    clearInterval(intervalRef.current ?? undefined);
    intervalRef.current = setInterval(() => {
      onChange(clamp(valueRef.current + direction * step));
    }, 120);
  }

  function stopRepeat() {
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  return (
    <View style={stepStyles.container}>
      <Pressable
        style={({ pressed }) => [stepStyles.btn, pressed && stepStyles.pressed]}
        onPress={() => tap(-1)}
        onLongPress={() => startRepeat(-1)}
        onPressOut={stopRepeat}
        hitSlop={8}
      >
        <Text style={stepStyles.btnText}>−</Text>
      </Pressable>

      <View style={stepStyles.valueArea}>
        <Text style={stepStyles.value}>{value}</Text>
        <Text style={stepStyles.suffix}>{suffix}</Text>
      </View>

      <Pressable
        style={({ pressed }) => [stepStyles.btn, pressed && stepStyles.pressed]}
        onPress={() => tap(1)}
        onLongPress={() => startRepeat(1)}
        onPressOut={stopRepeat}
        hitSlop={8}
      >
        <Text style={stepStyles.btnText}>+</Text>
      </Pressable>
    </View>
  );
}

const stepStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  btn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(109,93,246,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  pressed: { opacity: 0.7 },
  btnText: { color: colors.primaryLight, fontSize: 32, fontWeight: '700', lineHeight: 36 },
  valueArea: { alignItems: 'center', minWidth: 110 },
  value: { color: colors.text, fontSize: 54, fontWeight: '900', lineHeight: 62 },
  suffix: { color: colors.textMuted, fontSize: 16, fontWeight: '600', marginTop: -4 },
});

// ─── DurationInput ──────────────────────────────────────────────────────────
// Duration picker in H:MM format, stores and returns total minutes.

interface DurationInputProps {
  minutes: number;
  onChange: (minutes: number) => void;
  maxMinutes?: number;
}

export function DurationInput({ minutes, onChange, maxMinutes }: DurationInputProps) {
  const effective = maxMinutes !== undefined ? Math.min(minutes, maxMinutes) : minutes;
  const hours = Math.floor(effective / 60);
  const mins = effective % 60;
  const atMax = maxMinutes !== undefined && effective >= maxMinutes;

  function clampAndEmit(totalMinutes: number) {
    const clamped = maxMinutes !== undefined
      ? Math.max(0, Math.min(maxMinutes, totalMinutes))
      : Math.max(0, totalMinutes);
    onChange(clamped);
  }

  function setHours(h: number) {
    clampAndEmit(Math.max(0, h) * 60 + mins);
  }

  function setMins(m: number) {
    const snapped = Math.max(0, Math.min(55, Math.round(m / 5) * 5));
    clampAndEmit(hours * 60 + snapped);
  }

  const maxLabel = maxMinutes !== undefined
    ? `${Math.floor(maxMinutes / 60)}h${String(maxMinutes % 60).padStart(2, '0')}`
    : null;

  return (
    <View>
      <View style={durStyles.container}>
        <View style={durStyles.unit}>
          <Pressable style={durStyles.arrow} onPress={() => setHours(hours + 1)} hitSlop={12}>
            <Text style={[durStyles.arrowText, atMax && durStyles.arrowDisabled]}>▲</Text>
          </Pressable>
          <Text style={durStyles.digit}>{hours}</Text>
          <Pressable style={durStyles.arrow} onPress={() => setHours(Math.max(0, hours - 1))} hitSlop={12}>
            <Text style={durStyles.arrowText}>▼</Text>
          </Pressable>
          <Text style={durStyles.unitLabel}>horas</Text>
        </View>

        <Text style={durStyles.colon}>h</Text>

        <View style={durStyles.unit}>
          <Pressable style={durStyles.arrow} onPress={() => setMins(mins + 5)} hitSlop={12}>
            <Text style={[durStyles.arrowText, atMax && durStyles.arrowDisabled]}>▲</Text>
          </Pressable>
          <Text style={durStyles.digit}>{String(mins).padStart(2, '0')}</Text>
          <Pressable style={durStyles.arrow} onPress={() => setMins(mins - 5)} hitSlop={12}>
            <Text style={durStyles.arrowText}>▼</Text>
          </Pressable>
          <Text style={durStyles.unitLabel}>minutos</Text>
        </View>
      </View>
      {atMax && maxLabel ? (
        <Text style={durStyles.maxWarning}>Máximo: tempo na cama ({maxLabel})</Text>
      ) : null}
    </View>
  );
}

const durStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  unit: { alignItems: 'center', gap: 4 },
  digit: { color: colors.text, fontSize: 54, fontWeight: '900', minWidth: 72, textAlign: 'center' },
  colon: { color: colors.textMuted, fontSize: 32, fontWeight: '700', marginBottom: 30, marginHorizontal: 4 },
  arrow: { paddingHorizontal: spacing.md, paddingVertical: 4 },
  arrowText: { color: colors.cyan, fontSize: 22, fontWeight: '700' },
  arrowDisabled: { color: colors.border },
  unitLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  maxWarning: { color: colors.sunrise, fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 8 },
});

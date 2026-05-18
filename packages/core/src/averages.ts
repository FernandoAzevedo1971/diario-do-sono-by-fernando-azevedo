import type { CategoricalCount, DailyFeeling, SleepDiaryAverages, SleepDiaryInput, SleepDiaryMetrics, SleepQuality } from './types.js';

export function calculateSleepDiaryAverages(
  entries: Array<{ input: SleepDiaryInput; metrics: SleepDiaryMetrics }>,
): SleepDiaryAverages {
  const daysCount = entries.length;

  const emptySleepQuality = (): CategoricalCount<SleepQuality> => ({
    counts: { good: 0, regular: 0, bad: 0 },
    mode: null,
  });

  const emptyDailyFeeling = (): CategoricalCount<DailyFeeling> => ({
    counts: { rested: 0, tired: 0, sleepy: 0 },
    mode: null,
  });

  if (daysCount === 0) {
    return {
      daysCount: 0,
      lisMinutes: 0,
      ttcMinutes: 0,
      wasoMinutes: 0,
      fragmentationCount: 0,
      wakeInertiaMinutes: 0,
      ttsCalculatedMinutes: 0,
      ttsPerceivedMinutes: 0,
      sleepEfficiencyPercent: 0,
      perceivedCalculatedDiffMinutes: 0,
      sleepQuality: emptySleepQuality(),
      morningFeeling: emptyDailyFeeling(),
      daytimeFeeling: emptyDailyFeeling(),
    };
  }

  const metricsList = entries.map((e) => e.metrics);
  const inputsList = entries.map((e) => e.input);

  return {
    daysCount,
    lisMinutes: average(metricsList.map((m) => m.lisMinutes)),
    ttcMinutes: average(metricsList.map((m) => m.ttcMinutes)),
    wasoMinutes: average(metricsList.map((m) => m.wasoMinutes)),
    fragmentationCount: average(metricsList.map((m) => m.fragmentationCount)),
    wakeInertiaMinutes: average(metricsList.map((m) => m.wakeInertiaMinutes)),
    ttsCalculatedMinutes: average(metricsList.map((m) => m.ttsCalculatedMinutes)),
    ttsPerceivedMinutes: average(metricsList.map((m) => m.ttsPerceivedMinutes)),
    sleepEfficiencyPercent: average(metricsList.map((m) => m.sleepEfficiencyPercent)),
    perceivedCalculatedDiffMinutes: average(metricsList.map((m) => m.perceivedCalculatedDiffMinutes)),
    sleepQuality: categoricalCount<SleepQuality>(
      ['good', 'regular', 'bad'],
      inputsList.map((i) => i.sleepQuality),
    ),
    morningFeeling: categoricalCount<DailyFeeling>(
      ['rested', 'tired', 'sleepy'],
      inputsList.map((i) => i.morningFeeling),
    ),
    daytimeFeeling: categoricalCount<DailyFeeling>(
      ['rested', 'tired', 'sleepy'],
      inputsList.flatMap((i) => (i.daytimeFeeling != null ? [i.daytimeFeeling] : [])),
    ),
  };
}

function categoricalCount<T extends string>(keys: T[], values: T[]): CategoricalCount<T> {
  const counts = Object.fromEntries(keys.map((k) => [k, 0])) as Record<T, number>;

  for (const value of values) {
    counts[value] = (counts[value] ?? 0) + 1;
  }

  let mode: T | null = null;
  let maxCount = 0;

  for (const key of keys) {
    if (counts[key] > maxCount) {
      maxCount = counts[key];
      mode = key;
    }
  }

  return { counts, mode };
}

function average(values: number[]): number {
  return roundToOneDecimal(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

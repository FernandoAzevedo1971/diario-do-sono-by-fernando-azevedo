import type { SleepDiaryAverages, SleepDiaryMetrics } from './types.js';

export function calculateSleepDiaryAverages(metricsList: SleepDiaryMetrics[]): SleepDiaryAverages {
  const daysCount = metricsList.length;

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
    };
  }

  return {
    daysCount,
    lisMinutes: average(metricsList.map((metrics) => metrics.lisMinutes)),
    ttcMinutes: average(metricsList.map((metrics) => metrics.ttcMinutes)),
    wasoMinutes: average(metricsList.map((metrics) => metrics.wasoMinutes)),
    fragmentationCount: average(metricsList.map((metrics) => metrics.fragmentationCount)),
    wakeInertiaMinutes: average(metricsList.map((metrics) => metrics.wakeInertiaMinutes)),
    ttsCalculatedMinutes: average(metricsList.map((metrics) => metrics.ttsCalculatedMinutes)),
    ttsPerceivedMinutes: average(metricsList.map((metrics) => metrics.ttsPerceivedMinutes)),
    sleepEfficiencyPercent: average(metricsList.map((metrics) => metrics.sleepEfficiencyPercent)),
    perceivedCalculatedDiffMinutes: average(metricsList.map((metrics) => metrics.perceivedCalculatedDiffMinutes)),
  };
}

function average(values: number[]): number {
  return roundToOneDecimal(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

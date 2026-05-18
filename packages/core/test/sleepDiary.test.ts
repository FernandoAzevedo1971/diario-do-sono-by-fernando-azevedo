import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateIsiScore, calculateSleepDiary, calculateSleepDiaryAverages, formatDuration } from '../src/index.js';

test('calculates sleep diary metrics with overnight interval', () => {
  const result = calculateSleepDiary({
    entryDate: '2026-05-17',
    bedTime: '22:30',
    sleepLatencyMinutes: 30,
    nightAwakeningsCount: 2,
    wasoMinutes: 40,
    finalWakeTime: '06:30',
    outOfBedLatencyMinutes: 20,
    perceivedSleepMinutes: 420,
    sleepQuality: 'regular',
    morningFeeling: 'tired',
  });

  assert.equal(result.isValid, true);
  assert.equal(result.metrics.outOfBedTime, '06:50');
  assert.equal(result.metrics.ttcMinutes, 500);
  assert.equal(result.metrics.ttsCalculatedMinutes, 410);
  assert.equal(formatDuration(result.metrics.ttsCalculatedMinutes), '6h50');
  assert.equal(result.metrics.sleepEfficiencyPercent, 82);
  assert.equal(result.metrics.perceivedCalculatedDiffMinutes, 10);
});

test('blocks impossible negative calculated sleep time', () => {
  const result = calculateSleepDiary({
    entryDate: '2026-05-17',
    bedTime: '23:00',
    sleepLatencyMinutes: 300,
    nightAwakeningsCount: 3,
    wasoMinutes: 400,
    finalWakeTime: '06:00',
    outOfBedLatencyMinutes: 60,
    perceivedSleepMinutes: 200,
    sleepQuality: 'bad',
    morningFeeling: 'sleepy',
  });

  assert.equal(result.isValid, false);
  assert.ok(result.issues.some((issue) => issue.field === 'ttsCalculatedMinutes'));
});

test('calculates ISI score and interpretation', () => {
  const result = calculateIsiScore([2, 2, 1, 3, 2, 2, 2]);

  assert.equal(result.isValid, true);
  assert.equal(result.score, 14);
  assert.equal(result.severity, 'subclinical');
});

test('calculates sleep diary averages', () => {
  const first = calculateSleepDiary({
    entryDate: '2026-05-17',
    bedTime: '22:30',
    sleepLatencyMinutes: 30,
    nightAwakeningsCount: 2,
    wasoMinutes: 40,
    finalWakeTime: '06:30',
    outOfBedLatencyMinutes: 20,
    perceivedSleepMinutes: 420,
    sleepQuality: 'regular',
    morningFeeling: 'tired',
  });

  const second = calculateSleepDiary({
    entryDate: '2026-05-18',
    bedTime: '23:00',
    sleepLatencyMinutes: 20,
    nightAwakeningsCount: 1,
    wasoMinutes: 30,
    finalWakeTime: '06:00',
    outOfBedLatencyMinutes: 10,
    perceivedSleepMinutes: 390,
    sleepQuality: 'good',
    morningFeeling: 'rested',
  });

  const averages = calculateSleepDiaryAverages([first.metrics, second.metrics]);

  assert.equal(averages.daysCount, 2);
  assert.equal(averages.lisMinutes, 25);
  assert.equal(averages.wasoMinutes, 35);
  assert.equal(averages.fragmentationCount, 1.5);
  assert.equal(averages.sleepEfficiencyPercent, 84);
});

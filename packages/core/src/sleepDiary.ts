import type { SleepDiaryCalculationResult, SleepDiaryInput, SleepDiaryMetrics, ValidationIssue } from './types.js';
import { addMinutesToClockTime, isClockTime, isNonNegativeInteger, minutesBetweenClockTimes } from './time.js';

const REQUIRED_CLOCK_FIELDS: Array<keyof Pick<SleepDiaryInput, 'bedTime' | 'finalWakeTime'>> = [
  'bedTime',
  'finalWakeTime',
];

const REQUIRED_INTEGER_FIELDS: Array<keyof Pick<SleepDiaryInput, 'sleepLatencyMinutes' | 'nightAwakeningsCount' | 'wasoMinutes' | 'outOfBedLatencyMinutes' | 'perceivedSleepMinutes'>> = [
  'sleepLatencyMinutes',
  'nightAwakeningsCount',
  'wasoMinutes',
  'outOfBedLatencyMinutes',
  'perceivedSleepMinutes',
];

export function calculateSleepDiary(input: SleepDiaryInput): SleepDiaryCalculationResult {
  const issues = validateSleepDiaryInput(input);
  const hasBlockingIssue = issues.some((issue) => issue.severity === 'error');

  if (hasBlockingIssue) {
    return {
      metrics: createEmptyMetrics(),
      issues,
      isValid: false,
    };
  }

  const outOfBedTime = addMinutesToClockTime(input.finalWakeTime, input.outOfBedLatencyMinutes);
  const ttcMinutes = minutesBetweenClockTimes(input.bedTime, outOfBedTime);
  const ttsCalculatedMinutes = ttcMinutes - input.sleepLatencyMinutes - input.wasoMinutes - input.outOfBedLatencyMinutes;
  const sleepEfficiencyPercent = ttcMinutes > 0 ? roundToOneDecimal((ttsCalculatedMinutes / ttcMinutes) * 100) : 0;

  const metrics: SleepDiaryMetrics = {
    outOfBedTime,
    lisMinutes: input.sleepLatencyMinutes,
    ttcMinutes,
    wasoMinutes: input.wasoMinutes,
    fragmentationCount: input.nightAwakeningsCount,
    wakeInertiaMinutes: input.outOfBedLatencyMinutes,
    ttsCalculatedMinutes,
    ttsPerceivedMinutes: input.perceivedSleepMinutes,
    sleepEfficiencyPercent,
    perceivedCalculatedDiffMinutes: input.perceivedSleepMinutes - ttsCalculatedMinutes,
  };

  issues.push(...validateCalculatedMetrics(input, metrics));

  return {
    metrics,
    issues,
    isValid: !issues.some((issue) => issue.severity === 'error'),
  };
}

export function validateSleepDiaryInput(input: SleepDiaryInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!input.entryDate) {
    issues.push({ field: 'entryDate', message: 'A data do registro é obrigatória.', severity: 'error' });
  }

  for (const field of REQUIRED_CLOCK_FIELDS) {
    if (!input[field] || !isClockTime(input[field])) {
      issues.push({ field, message: 'Informe um horário válido no formato HH:mm.', severity: 'error' });
    }
  }

  for (const field of REQUIRED_INTEGER_FIELDS) {
    if (!isNonNegativeInteger(input[field])) {
      issues.push({ field, message: 'Informe um número inteiro maior ou igual a zero.', severity: 'error' });
    }
  }

  if (!input.sleepQuality) {
    issues.push({ field: 'sleepQuality', message: 'Informe a qualidade do sono.', severity: 'error' });
  }

  if (!input.morningFeeling) {
    issues.push({ field: 'morningFeeling', message: 'Informe como você se sente nesta manhã.', severity: 'error' });
  }

  return issues;
}

function validateCalculatedMetrics(input: SleepDiaryInput, metrics: SleepDiaryMetrics): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (metrics.ttcMinutes <= 0) {
    issues.push({ field: 'ttcMinutes', message: 'O tempo total de cama deve ser maior que zero.', severity: 'error' });
  }

  if (metrics.ttcMinutes > 1440) {
    issues.push({ field: 'ttcMinutes', message: 'O tempo total de cama não pode ultrapassar 24 horas.', severity: 'error' });
  }

  if (metrics.ttcMinutes > 840) {
    issues.push({ field: 'ttcMinutes', message: 'Tempo total de cama acima de 14 horas. Confirme se os horários estão corretos.', severity: 'warning' });
  }

  if (metrics.ttsCalculatedMinutes < 0) {
    issues.push({ field: 'ttsCalculatedMinutes', message: 'O TTS calculado ficou negativo. Revise latência, WASO e inércia.', severity: 'error' });
  }

  if (input.perceivedSleepMinutes > metrics.ttcMinutes) {
    issues.push({ field: 'perceivedSleepMinutes', message: 'O TTS percebido está maior que o tempo total de cama. Confirme o valor.', severity: 'warning' });
  }

  if (input.wasoMinutes > metrics.ttcMinutes) {
    issues.push({ field: 'wasoMinutes', message: 'O WASO não pode ser maior que o tempo total de cama.', severity: 'error' });
  }

  if (metrics.sleepEfficiencyPercent > 100) {
    issues.push({ field: 'sleepEfficiencyPercent', message: 'A eficiência do sono não pode ser maior que 100%.', severity: 'error' });
  }

  if (metrics.sleepEfficiencyPercent > 95) {
    issues.push({ field: 'sleepEfficiencyPercent', message: 'Eficiência acima de 95%. Confirme os dados informados.', severity: 'warning' });
  }

  if (metrics.sleepEfficiencyPercent < 50) {
    issues.push({ field: 'sleepEfficiencyPercent', message: 'Eficiência abaixo de 50%. Valor aceito, mas merece atenção clínica.', severity: 'warning' });
  }

  return issues;
}

function createEmptyMetrics(): SleepDiaryMetrics {
  return {
    outOfBedTime: '00:00',
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

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

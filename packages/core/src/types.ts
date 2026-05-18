export type Gender = 'male' | 'female' | 'prefer_not_to_say';

export type SleepQuality = 'good' | 'regular' | 'bad';

export type DailyFeeling = 'rested' | 'tired' | 'sleepy';

export interface SleepDiaryInput {
  entryDate: string;
  bedTime: string;
  sleepLatencyMinutes: number;
  nightAwakeningsCount: number;
  wasoMinutes: number;
  finalWakeTime: string;
  outOfBedLatencyMinutes: number;
  perceivedSleepMinutes: number;
  sleepQuality: SleepQuality;
  morningFeeling: DailyFeeling;
  alcoholUse?: {
    used?: boolean | null;
    time?: string | null;
    amount?: string | null;
  } | null;
  physicalActivity?: {
    didActivity?: boolean | null;
    time?: string | null;
    description?: string | null;
  } | null;
  daytimeFeeling?: DailyFeeling | null;
}

export interface SleepDiaryMetrics {
  outOfBedTime: string;
  lisMinutes: number;
  ttcMinutes: number;
  wasoMinutes: number;
  fragmentationCount: number;
  wakeInertiaMinutes: number;
  ttsCalculatedMinutes: number;
  ttsPerceivedMinutes: number;
  sleepEfficiencyPercent: number;
  perceivedCalculatedDiffMinutes: number;
}

export interface SleepDiaryAverages {
  daysCount: number;
  lisMinutes: number;
  ttcMinutes: number;
  wasoMinutes: number;
  fragmentationCount: number;
  wakeInertiaMinutes: number;
  ttsCalculatedMinutes: number;
  ttsPerceivedMinutes: number;
  sleepEfficiencyPercent: number;
  perceivedCalculatedDiffMinutes: number;
}

export interface ValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface SleepDiaryCalculationResult {
  metrics: SleepDiaryMetrics;
  issues: ValidationIssue[];
  isValid: boolean;
}

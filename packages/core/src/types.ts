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
    untilTime?: string | null;
    amount?: string | null;
    beverage?: string | null;
  } | null;
  physicalActivity?: {
    didActivity?: boolean | null;
    intensity?: 'light' | 'intense' | null;
    endTime?: string | null;
    description?: string | null;
  } | null;
  daytimeFeeling?: DailyFeeling | null;
  sleepMedication?: {
    used?: boolean | null;
    name?: string | null;
    dose?: string | null;
    time?: string | null;
  } | null;
  nightObservations?: string | null;
  dayObservations?: string | null;
  awakeningDetails?: AwakeningDetail[] | null;
}

export interface AwakeningDetail {
  time?: string | null;
  durationMinutes?: number | null;
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

export interface CategoricalCount<T extends string> {
  counts: Record<T, number>;
  mode: T | null;
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
  sleepQuality: CategoricalCount<SleepQuality>;
  morningFeeling: CategoricalCount<DailyFeeling>;
  daytimeFeeling: CategoricalCount<DailyFeeling>;
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

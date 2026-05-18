import type { SleepDiaryInput, SleepDiaryMetrics } from '@diario-do-sono/core';

export interface PatientProfile {
  name: string;
  email: string;
  birthDate: string;
  gender: 'male' | 'female' | 'prefer_not_to_say';
  usualOutOfBedTime: string;
  acceptedTermsAt: string;
  lastIsiCompletedAt?: string | null;
  lastIsiPromptedAt?: string | null;
}

export interface AuthenticatedUser {
  uid: string;
  email: string;
  isLocalDevelopment: boolean;
}

export interface SleepDiaryEntry {
  id: string;
  input: SleepDiaryInput;
  metrics: SleepDiaryMetrics;
  createdAt: string;
  updatedAt: string;
  syncStatus: 'local' | 'synced' | 'pending';
  version: number;
}

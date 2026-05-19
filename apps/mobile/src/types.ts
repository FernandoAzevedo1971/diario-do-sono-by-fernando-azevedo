import type { SleepDiaryInput, SleepDiaryMetrics } from '@diario-do-sono/core';

export interface PatientProfile {
  name: string;
  email: string;
  birthDate: string;
  gender: 'male' | 'female' | 'prefer_not_to_say';
  usualOutOfBedTime: string;
  acceptedTermsAt: string;
  initialIsiScore?: number | null;
  initialIsiInterpretation?: string | null;
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

export interface IsiRecord {
  id: string;
  score: number;
  interpretation: string;
  severity: 'none' | 'subclinical' | 'moderate' | 'severe';
  completedAt: string;
  syncStatus: 'local' | 'pending' | 'synced';
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PatientProfile, SleepDiaryEntry } from '../types';

const DEFAULT_ACCOUNT_ID = 'local-dev';

function normalizeAccountId(accountId?: string | null): string {
  return (accountId?.trim() || DEFAULT_ACCOUNT_ID).replace(/[^a-zA-Z0-9._:@-]/g, '_');
}

function profileKey(accountId?: string | null): string {
  return `diario-do-sono/${normalizeAccountId(accountId)}/profile`;
}

function entriesKey(accountId?: string | null): string {
  return `diario-do-sono/${normalizeAccountId(accountId)}/entries`;
}

export async function loadProfile(accountId?: string | null): Promise<PatientProfile | null> {
  const raw = await AsyncStorage.getItem(profileKey(accountId));
  return raw ? (JSON.parse(raw) as PatientProfile) : null;
}

export async function saveProfile(profile: PatientProfile, accountId?: string | null): Promise<void> {
  await AsyncStorage.setItem(profileKey(accountId), JSON.stringify(profile));
}

export async function loadEntries(accountId?: string | null): Promise<SleepDiaryEntry[]> {
  const raw = await AsyncStorage.getItem(entriesKey(accountId));
  return raw ? (JSON.parse(raw) as SleepDiaryEntry[]) : [];
}

export async function saveEntries(entries: SleepDiaryEntry[], accountId?: string | null): Promise<void> {
  const nextEntries = [...entries].sort((left, right) => right.input.entryDate.localeCompare(left.input.entryDate));
  await AsyncStorage.setItem(entriesKey(accountId), JSON.stringify(nextEntries));
}

export async function upsertEntry(entry: SleepDiaryEntry, accountId?: string | null): Promise<SleepDiaryEntry[]> {
  const currentEntries = await loadEntries(accountId);
  const existingIndex = currentEntries.findIndex((item) => item.input.entryDate === entry.input.entryDate);
  const nextEntries = [...currentEntries];

  if (existingIndex >= 0) {
    nextEntries[existingIndex] = {
      ...entry,
      createdAt: currentEntries[existingIndex].createdAt,
      version: currentEntries[existingIndex].version + 1,
    };
  } else {
    nextEntries.push(entry);
  }

  nextEntries.sort((left, right) => right.input.entryDate.localeCompare(left.input.entryDate));
  await AsyncStorage.setItem(entriesKey(accountId), JSON.stringify(nextEntries));
  return nextEntries;
}

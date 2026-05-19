import { collection, doc, getDoc, getDocs, orderBy, query, setDoc } from 'firebase/firestore';
import { isFirebaseConfigured } from '../services/authService';
import { getFirestore } from '../services/firebase';
import type { AuthenticatedUser, IsiRecord, PatientProfile, SleepDiaryEntry } from '../types';
import { loadEntries as loadLocalEntries, loadLocalIsiHistory, loadProfile as loadLocalProfile, saveEntries as saveLocalEntries, saveLocalIsiRecord, saveProfile as saveLocalProfile, upsertEntry as upsertLocalEntry } from './localDiaryRepository';

const PROFILE_DOCUMENT_ID = 'main';

function userDocumentPath(user: AuthenticatedUser) {
  return ['users', user.uid] as const;
}

function shouldUseRemote(user: AuthenticatedUser): boolean {
  return isFirebaseConfigured() && !user.isLocalDevelopment;
}

function stripUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function loadProfile(user: AuthenticatedUser): Promise<PatientProfile | null> {
  if (!shouldUseRemote(user)) {
    return loadLocalProfile(user.uid);
  }

  try {
    const profileRef = doc(getFirestore(), ...userDocumentPath(user), 'profile', PROFILE_DOCUMENT_ID);
    const profileSnapshot = await getDoc(profileRef);

    if (!profileSnapshot.exists()) {
      return loadLocalProfile(user.uid);
    }

    const profile = profileSnapshot.data() as PatientProfile;
    await saveLocalProfile(profile, user.uid);
    return profile;
  } catch {
    return loadLocalProfile(user.uid);
  }
}

export async function saveProfile(profile: PatientProfile, user: AuthenticatedUser): Promise<void> {
  await saveLocalProfile(profile, user.uid);

  if (!shouldUseRemote(user)) {
    return;
  }

  const profileRef = doc(getFirestore(), ...userDocumentPath(user), 'profile', PROFILE_DOCUMENT_ID);
  await setDoc(profileRef, stripUndefined({ ...profile, userId: user.uid, updatedAt: new Date().toISOString() }), { merge: true });
}

export async function loadEntries(user: AuthenticatedUser): Promise<SleepDiaryEntry[]> {
  if (!shouldUseRemote(user)) {
    return loadLocalEntries(user.uid);
  }

  try {
    await syncPendingEntries(user);
    const entriesRef = collection(getFirestore(), ...userDocumentPath(user), 'sleepDiaryEntries');
    const entriesSnapshot = await getDocs(query(entriesRef, orderBy('input.entryDate', 'desc')));
    const entries = entriesSnapshot.docs.map((entryDoc) => entryDoc.data() as SleepDiaryEntry);
    await saveLocalEntries(entries, user.uid);
    return entries;
  } catch {
    return loadLocalEntries(user.uid);
  }
}

export async function upsertEntry(entry: SleepDiaryEntry, user: AuthenticatedUser): Promise<SleepDiaryEntry[]> {
  if (!shouldUseRemote(user)) {
    return upsertLocalEntry(entry, user.uid);
  }

  try {
    const syncedEntry = await saveRemoteEntry(entry, user);
    return upsertLocalEntry(syncedEntry, user.uid);
  } catch {
    return upsertLocalEntry({ ...entry, syncStatus: 'pending' }, user.uid);
  }
}

export async function syncPendingEntries(user: AuthenticatedUser): Promise<SleepDiaryEntry[]> {
  const localEntries = await loadLocalEntries(user.uid);

  if (!shouldUseRemote(user)) {
    return localEntries;
  }

  const syncedEntries = await Promise.all(
    localEntries.map(async (entry) => {
      if (entry.syncStatus === 'synced') {
        return entry;
      }

      try {
        return await saveRemoteEntry(entry, user);
      } catch {
        return { ...entry, syncStatus: 'pending' as const };
      }
    }),
  );

  await saveLocalEntries(syncedEntries, user.uid);
  return syncedEntries;
}

async function saveRemoteEntry(entry: SleepDiaryEntry, user: AuthenticatedUser): Promise<SleepDiaryEntry> {
  const syncedEntry: SleepDiaryEntry = { ...entry, syncStatus: 'synced' };
  const entryRef = doc(getFirestore(), ...userDocumentPath(user), 'sleepDiaryEntries', entry.id);
  await setDoc(entryRef, stripUndefined({ ...syncedEntry, userId: user.uid }), { merge: true });
  return syncedEntry;
}

export async function loadIsiHistory(user: AuthenticatedUser): Promise<IsiRecord[]> {
  if (!shouldUseRemote(user)) {
    return loadLocalIsiHistory(user.uid);
  }

  try {
    const historyRef = collection(getFirestore(), ...userDocumentPath(user), 'isiHistory');
    const snapshot = await getDocs(query(historyRef, orderBy('completedAt', 'desc')));
    const records = snapshot.docs.map((d) => d.data() as IsiRecord);
    await Promise.all(records.map((r) => saveLocalIsiRecord(r, user.uid)));
    return records;
  } catch {
    return loadLocalIsiHistory(user.uid);
  }
}

export async function saveIsiRecord(record: IsiRecord, user: AuthenticatedUser): Promise<void> {
  await saveLocalIsiRecord(record, user.uid);

  if (!shouldUseRemote(user)) {
    return;
  }

  try {
    const recordRef = doc(getFirestore(), ...userDocumentPath(user), 'isiHistory', record.id);
    await setDoc(recordRef, stripUndefined({ ...record, userId: user.uid, syncStatus: 'synced' }), { merge: true });
  } catch {
    await saveLocalIsiRecord({ ...record, syncStatus: 'pending' }, user.uid);
  }
}

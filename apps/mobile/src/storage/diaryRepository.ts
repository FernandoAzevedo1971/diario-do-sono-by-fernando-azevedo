import { collection, doc, getDoc, getDocs, orderBy, query, setDoc } from 'firebase/firestore';
import { isFirebaseConfigured } from '../services/authService';
import { getFirestore } from '../services/firebase';
import type { AuthenticatedUser, PatientProfile, SleepDiaryEntry } from '../types';
import { loadEntries as loadLocalEntries, loadProfile as loadLocalProfile, saveEntries as saveLocalEntries, saveProfile as saveLocalProfile, upsertEntry as upsertLocalEntry } from './localDiaryRepository';

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

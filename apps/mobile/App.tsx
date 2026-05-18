import React, { useEffect, useState, Component, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { loadEntries, loadProfile, saveProfile, upsertEntry } from './src/storage/diaryRepository';
import { cancelDailyDiaryReminder, scheduleDailyDiaryReminder } from './src/services/notificationService';
import { getInitialAuthenticatedUser, subscribeToAuthenticatedUser } from './src/services/authService';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { IsiPromptScreen } from './src/screens/IsiPromptScreen';
import { InstructionsScreen } from './src/screens/InstructionsScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { DiaryWizardScreen } from './src/screens/DiaryWizardScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { GraphicSummaryScreen } from './src/screens/GraphicSummaryScreen';
import type { AuthenticatedUser, PatientProfile, SleepDiaryEntry } from './src/types';

type AppRoute = 'loading' | 'welcome' | 'auth' | 'profile' | 'isiPrompt' | 'instructions' | 'today' | 'diary' | 'result' | 'summary';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: '#080B1F', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: '#FF6B6B', fontSize: 18, fontWeight: '800', marginBottom: 12 }}>Erro ao carregar o app</Text>
          <Text style={{ color: '#aaa', fontSize: 13, textAlign: 'center' }}>{this.state.error.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>('loading');
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [entries, setEntries] = useState<SleepDiaryEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<SleepDiaryEntry | null>(null);
  const [lastSavedEntry, setLastSavedEntry] = useState<SleepDiaryEntry | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      const storedUser = await getInitialAuthenticatedUser();

      if (!isMounted) {
        return;
      }

      setUser(storedUser);

      if (!storedUser) {
        setRoute('welcome');
        return;
      }

      await loadAccountData(storedUser);
    }

    const unsubscribe = subscribeToAuthenticatedUser((nextUser) => {
      setUser(nextUser);

      if (!nextUser) {
        setProfile(null);
        setEntries([]);
        setRoute('welcome');
        return;
      }

      loadAccountData(nextUser);
    });

    hydrate();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  async function loadAccountData(account: AuthenticatedUser) {
    const [storedProfile, storedEntries] = await Promise.all([loadProfile(account), loadEntries(account)]);
    setProfile(storedProfile);
    setEntries(storedEntries);

    if (storedProfile) {
      const today = new Date().toISOString().split('T')[0];
      const hasTodayEntry = storedEntries.some((e) => e.input.entryDate === today);

      if (hasTodayEntry) {
        await cancelDailyDiaryReminder();
      } else {
        await scheduleDailyDiaryReminder(storedProfile.usualOutOfBedTime);
      }
    }

    setRoute(storedProfile ? 'today' : 'profile');
  }

  async function handleAuthenticated(nextUser: AuthenticatedUser) {
    setUser(nextUser);
    const [storedProfile, storedEntries] = await Promise.all([loadProfile(nextUser), loadEntries(nextUser)]);
    setProfile(storedProfile);
    setEntries(storedEntries);
    setRoute(storedProfile ? 'today' : 'profile');
  }

  function needsInitialIsi(currentProfile: PatientProfile | null, currentEntries: SleepDiaryEntry[]): boolean {
    return Boolean(currentProfile && currentEntries.length === 0 && !currentProfile.lastIsiCompletedAt);
  }

  async function handleSaveProfile(nextProfile: PatientProfile) {
    if (!user) {
      return;
    }

    await saveProfile(nextProfile, user);
    setProfile(nextProfile);
    await scheduleDailyDiaryReminder(nextProfile.usualOutOfBedTime);
    setRoute('isiPrompt');
  }

  async function handleCompleteInitialIsi(score: number, interpretation: string) {
    if (!user || !profile) {
      return;
    }

    const nextProfile: PatientProfile = {
      ...profile,
      initialIsiScore: score,
      initialIsiInterpretation: interpretation,
      lastIsiCompletedAt: new Date().toISOString(),
    };

    await saveProfile(nextProfile, user);
    setProfile(nextProfile);
    setRoute('instructions');
  }

  async function handleSaveEntry(entry: SleepDiaryEntry) {
    if (!user) {
      return;
    }

    const nextEntries = await upsertEntry(entry, user);
    setEntries(nextEntries);
    setLastSavedEntry(entry);
    setEditingEntry(null);
    await cancelDailyDiaryReminder();
    setRoute('result');
  }

  return (
    <ErrorBoundary>
      <StatusBar style="light" />
      {route === 'loading' && <WelcomeScreen onStart={() => undefined} />}
      {route === 'welcome' && <WelcomeScreen onStart={() => setRoute(user ? 'profile' : 'auth')} />}
      {route === 'auth' && <AuthScreen onAuthenticated={handleAuthenticated} />}
      {route === 'profile' && <ProfileScreen initialEmail={user?.email ?? ''} onSave={handleSaveProfile} />}
      {route === 'isiPrompt' && <IsiPromptScreen onComplete={handleCompleteInitialIsi} />}
      {route === 'instructions' && <InstructionsScreen onContinue={() => setRoute('today')} />}
      {route === 'today' && profile && (
        <TodayScreen
          profile={profile}
          entries={entries}
          onNewEntry={() => {
            setEditingEntry(null);
            setRoute(needsInitialIsi(profile, entries) ? 'isiPrompt' : 'diary');
          }}
          onEditEntry={(entry) => {
            setEditingEntry(entry);
            setRoute('diary');
          }}
          onSummary={() => setRoute('summary')}
        />
      )}
      {route === 'summary' && (
        <GraphicSummaryScreen entries={entries} onBack={() => setRoute('today')} />
      )}
      {route === 'diary' && (
        <DiaryWizardScreen
          editingEntry={editingEntry}
          previousEntry={entries.length > 0 ? entries[0] : null}
          onCancel={() => setRoute('today')}
          onSave={handleSaveEntry}
        />
      )}
      {route === 'result' && lastSavedEntry && <ResultScreen entry={lastSavedEntry} entries={entries} onFinish={() => setRoute('today')} onAddAnother={() => setRoute('diary')} onSummary={() => setRoute('summary')} />}
    </ErrorBoundary>
  );
}


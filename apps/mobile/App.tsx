import React, { useEffect, useState, Component, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { loadEntries, loadIsiHistory, loadProfile, saveIsiRecord, saveProfile, upsertEntry } from './src/storage/diaryRepository';
import { cancelDailyDiaryReminder, scheduleDailyDiaryReminder } from './src/services/notificationService';
import { getInitialAuthenticatedUser, subscribeToAuthenticatedUser } from './src/services/authService';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { IsiPromptScreen } from './src/screens/IsiPromptScreen';
import { IsiHistoryScreen } from './src/screens/IsiHistoryScreen';
import { InstructionsScreen } from './src/screens/InstructionsScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { DiaryWizardScreen } from './src/screens/DiaryWizardScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { GraphicSummaryScreen } from './src/screens/GraphicSummaryScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { SendToDoctorScreen } from './src/screens/SendToDoctorScreen';
import { PastDiaryCalendarScreen } from './src/screens/PastDiaryCalendarScreen';
import type { AuthenticatedUser, IsiRecord, PatientProfile, SleepDiaryEntry } from './src/types';

type AppRoute = 'loading' | 'welcome' | 'auth' | 'profile' | 'isiPrompt' | 'instructions' | 'today' | 'diary' | 'result' | 'summary' | 'report' | 'past-calendar' | 'isi' | 'isi-history';

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
  const [pastEntryDate, setPastEntryDate] = useState<string | null>(null);
  const [isiHistory, setIsiHistory] = useState<IsiRecord[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      const SPLASH_MIN_MS = 2800; // garante que a animação de abertura seja exibida
      const [storedUser] = await Promise.all([
        getInitialAuthenticatedUser(),
        new Promise<void>((resolve) => setTimeout(resolve, SPLASH_MIN_MS)),
      ]);

      if (!isMounted) {
        return;
      }

      setUser(storedUser);

      if (!storedUser) {
        setRoute('welcome');
        return;
      }

      await loadAccountData(storedUser, true);
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

  async function loadAccountData(account: AuthenticatedUser, goToWelcome = false) {
    const [storedProfile, storedEntries, storedIsiHistory] = await Promise.all([loadProfile(account), loadEntries(account), loadIsiHistory(account)]);
    setProfile(storedProfile);
    setEntries(storedEntries);
    setIsiHistory(storedIsiHistory);

    if (storedProfile) {
      const today = new Date().toISOString().split('T')[0];
      const hasTodayEntry = storedEntries.some((e) => e.input.entryDate === today);

      if (hasTodayEntry) {
        await cancelDailyDiaryReminder();
      } else {
        await scheduleDailyDiaryReminder(storedProfile.usualOutOfBedTime);
      }
    }

    setRoute(storedProfile ? (goToWelcome ? 'welcome' : 'today') : 'profile');
  }

  async function handleAuthenticated(nextUser: AuthenticatedUser) {
    setUser(nextUser);
    const [storedProfile, storedEntries, storedIsiHistory] = await Promise.all([loadProfile(nextUser), loadEntries(nextUser), loadIsiHistory(nextUser)]);
    setProfile(storedProfile);
    setEntries(storedEntries);
    setIsiHistory(storedIsiHistory);
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

  async function handleCompleteIsi(score: number, interpretation: string, severity: IsiRecord['severity']) {
    if (!user || !profile) {
      return;
    }

    const now = new Date().toISOString();
    const record: IsiRecord = { id: `isi-${now}`, score, interpretation, severity, completedAt: now, syncStatus: 'local' };
    await saveIsiRecord(record, user);
    setIsiHistory((prev) => [record, ...prev]);

    const nextProfile: PatientProfile = {
      ...profile,
      initialIsiScore: profile.initialIsiScore ?? score,
      initialIsiInterpretation: profile.initialIsiInterpretation ?? interpretation,
      lastIsiCompletedAt: now,
    };
    await saveProfile(nextProfile, user);
    setProfile(nextProfile);
  }

  async function handleCompleteInitialIsi(score: number, interpretation: string, severity: IsiRecord['severity']) {
    await handleCompleteIsi(score, interpretation, severity);
    setRoute('instructions');
  }

  async function handleCompleteOnDemandIsi(score: number, interpretation: string, severity: IsiRecord['severity']) {
    await handleCompleteIsi(score, interpretation, severity);
    setRoute('today');
  }

  async function handleSaveEntry(entry: SleepDiaryEntry) {
    if (!user) {
      return;
    }

    const nextEntries = await upsertEntry(entry, user);
    setEntries(nextEntries);
    setLastSavedEntry(entry);
    setEditingEntry(null);
    setPastEntryDate(null);
    await cancelDailyDiaryReminder();
    setRoute('result');
  }

  return (
    <ErrorBoundary>
      <StatusBar style="light" />
      {route === 'loading' && <SplashScreen />}
      {route === 'welcome' && (
        <WelcomeScreen
          isReturning={!!profile}
          onStart={() => {
            if (!user) { setRoute('auth'); return; }
            if (!profile) { setRoute('profile'); return; }
            setRoute('today');
          }}
        />
      )}
      {route === 'auth' && <AuthScreen onAuthenticated={handleAuthenticated} onBack={() => setRoute('welcome')} />}
      {route === 'profile' && <ProfileScreen initialEmail={user?.email ?? ''} onSave={handleSaveProfile} onBack={user ? undefined : () => setRoute('auth')} />}
      {route === 'isiPrompt' && <IsiPromptScreen onComplete={handleCompleteInitialIsi} onBack={() => setRoute('profile')} />}
      {route === 'instructions' && <InstructionsScreen onContinue={() => setRoute('today')} onBack={() => setRoute('isiPrompt')} />}
      {route === 'today' && profile && (
        <TodayScreen
          profile={profile}
          entries={entries}
          isiHistory={isiHistory}
          onNewEntry={() => {
            setEditingEntry(null);
            setRoute(needsInitialIsi(profile, entries) ? 'isiPrompt' : 'diary');
          }}
          onEditEntry={(entry) => {
            setEditingEntry(entry);
            setRoute('diary');
          }}
          onSummary={() => setRoute('summary')}
          onPastEntry={() => setRoute('past-calendar')}
          onIsi={() => setRoute('isi')}
          onIsiHistory={() => setRoute('isi-history')}
        />
      )}
      {route === 'past-calendar' && (
        <PastDiaryCalendarScreen
          entries={entries}
          onNewEntry={(date) => {
            setPastEntryDate(date);
            setEditingEntry(null);
            setRoute('diary');
          }}
          onEditEntry={(entry) => {
            setEditingEntry(entry);
            setPastEntryDate(null);
            setRoute('diary');
          }}
          onBack={() => setRoute('today')}
        />
      )}
      {route === 'summary' && (
        <GraphicSummaryScreen entries={entries} onBack={() => setRoute('today')} onReport={() => setRoute('report')} />
      )}
      {route === 'report' && profile && (
        <SendToDoctorScreen profile={profile} entries={entries} onBack={() => setRoute('today')} />
      )}
      {route === 'diary' && (
        <DiaryWizardScreen
          editingEntry={editingEntry}
          previousEntry={entries.length > 0 ? entries[0] : null}
          initialDate={pastEntryDate ?? undefined}
          onCancel={() => setRoute(pastEntryDate ? 'past-calendar' : 'today')}
          onSave={handleSaveEntry}
        />
      )}
      {route === 'result' && lastSavedEntry && <ResultScreen entry={lastSavedEntry} entries={entries} onFinish={() => setRoute('today')} onAddAnother={() => setRoute('diary')} onSummary={() => setRoute('summary')} />}
      {route === 'isi' && <IsiPromptScreen onComplete={handleCompleteOnDemandIsi} onBack={() => setRoute('today')} />}
      {route === 'isi-history' && <IsiHistoryScreen isiHistory={isiHistory} onBack={() => setRoute('today')} />}
    </ErrorBoundary>
  );
}


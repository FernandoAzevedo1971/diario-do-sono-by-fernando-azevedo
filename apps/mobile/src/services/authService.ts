import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import type { AuthenticatedUser } from '../types';
import { getFirebaseAuth, isFirebaseConfigAvailable } from './firebase';

const LOCAL_SESSION_EMAIL_KEY = 'diario-do-sono/local-session-email';

function toAuthenticatedUser(user: User): AuthenticatedUser {
  return {
    uid: user.uid,
    email: user.email ?? '',
    isLocalDevelopment: false,
  };
}

function toLocalDevelopmentUser(email: string): AuthenticatedUser {
  return {
    uid: `local:${email.trim().toLowerCase()}`,
    email: email.trim().toLowerCase(),
    isLocalDevelopment: true,
  };
}

export async function registerWithEmail(email: string, password: string): Promise<AuthenticatedUser> {
  if (!isFirebaseConfigured()) {
    await AsyncStorage.setItem(LOCAL_SESSION_EMAIL_KEY, email.trim().toLowerCase());
    return toLocalDevelopmentUser(email);
  }

  const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
  return toAuthenticatedUser(credential.user);
}

export async function loginWithEmail(email: string, password: string): Promise<AuthenticatedUser> {
  if (!isFirebaseConfigured()) {
    await AsyncStorage.setItem(LOCAL_SESSION_EMAIL_KEY, email.trim().toLowerCase());
    return toLocalDevelopmentUser(email);
  }

  const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
  return toAuthenticatedUser(credential.user);
}

export async function getInitialAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  if (!isFirebaseConfigured()) {
    const email = await AsyncStorage.getItem(LOCAL_SESSION_EMAIL_KEY);
    return email ? toLocalDevelopmentUser(email) : null;
  }

  const currentUser = getFirebaseAuth().currentUser;
  return currentUser ? toAuthenticatedUser(currentUser) : null;
}

export function subscribeToAuthenticatedUser(onChange: (user: AuthenticatedUser | null) => void): () => void {
  if (!isFirebaseConfigured()) {
    return () => undefined;
  }

  return onAuthStateChanged(getFirebaseAuth(), (user) => onChange(user ? toAuthenticatedUser(user) : null));
}

export async function requestPasswordReset(email: string): Promise<void> {
  if (!isFirebaseConfigured()) {
    return;
  }

  await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(LOCAL_SESSION_EMAIL_KEY);

  if (!isFirebaseConfigured()) {
    return;
  }

  await signOut(getFirebaseAuth());
}

export function isFirebaseConfigured(): boolean {
  return isFirebaseConfigAvailable();
}

export async function getFirebaseUserForCompatibility(email: string, password: string): Promise<User> {
  const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
  return credential.user;
}

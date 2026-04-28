import { initializeFirebase, type FirebaseOptions } from '@nebula-docs/firebase';
import { env } from '@/lib/env';

function readConfig(): FirebaseOptions | null {
  const e = import.meta.env;
  const apiKey = e.FIREBASE_API_KEY;
  const authDomain = e.FIREBASE_AUTH_DOMAIN;
  const projectId = e.FIREBASE_PROJECT_ID;
  const appId = e.FIREBASE_APP_ID;

  if (!apiKey || !authDomain || !projectId || !appId) return null;

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket: e.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: e.FIREBASE_MESSAGE_SENDER_ID,
    appId,
    measurementId: e.FIREBASE_MEASUREMENT_ID,
  };
}

let configured = false;

export function bootstrapFirebase(): boolean {
  const config = readConfig();
  if (!config) return false;
  initializeFirebase(config, { firestoreDbId: env.firestoreDbId });
  configured = true;
  return true;
}

export function isFirebaseConfigured(): boolean {
  return configured;
}

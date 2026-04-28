import { initializeFirebase, type FirebaseOptions } from '@nebula-docs/firebase';

function readConfig(): FirebaseOptions | null {
  const env = import.meta.env;
  const apiKey = env.FIREBASE_API_KEY;
  const authDomain = env.FIREBASE_AUTH_DOMAIN;
  const projectId = env.FIREBASE_PROJECT_ID;
  const appId = env.FIREBASE_APP_ID;

  if (!apiKey || !authDomain || !projectId || !appId) return null;

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket: env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.FIREBASE_MESSAGE_SENDER_ID,
    appId,
    measurementId: env.FIREBASE_MEASUREMENT_ID,
  };
}

let configured = false;

export function bootstrapFirebase(): boolean {
  const config = readConfig();
  if (!config) return false;
  initializeFirebase(config);
  configured = true;
  return true;
}

export function isFirebaseConfigured(): boolean {
  return configured;
}

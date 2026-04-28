import { getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

let app: FirebaseApp | undefined;
let dbInstance: Firestore | undefined;
let authInstance: Auth | undefined;
let storageInstance: FirebaseStorage | undefined;

export function initializeFirebase(config: FirebaseOptions): FirebaseApp {
  if (app) return app;
  const existing = getApps();
  app = existing.length > 0 ? existing[0]! : initializeApp(config);
  dbInstance = getFirestore(app);
  authInstance = getAuth(app);
  storageInstance = getStorage(app);
  return app;
}

function ensureInitialized<T>(value: T | undefined, name: string): T {
  if (!value) {
    throw new Error(
      `@nebula-docs/firebase: ${name} accessed before initializeFirebase() was called`
    );
  }
  return value;
}

export const getApp = (): FirebaseApp => ensureInitialized(app, 'app');
export const getDb = (): Firestore => ensureInitialized(dbInstance, 'firestore');
export const getAuthInstance = (): Auth => ensureInitialized(authInstance, 'auth');
export const getStorageInstance = (): FirebaseStorage =>
  ensureInitialized(storageInstance, 'storage');

export type { FirebaseOptions };

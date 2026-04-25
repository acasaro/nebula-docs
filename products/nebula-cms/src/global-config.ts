import type { FirebaseOptions } from 'firebase/app';
import packageJson from '../package.json';

export type ConfigValue = {
  appName: string;
  appVersion: string;
  serverUrl: string;
  assetsDir: string;
  firebase: FirebaseOptions;
};

export const CONFIG: ConfigValue = {
  appName: 'Nebula CMS',
  appVersion: packageJson.version,
  serverUrl: import.meta.env.SERVER_URL ?? '',
  assetsDir: import.meta.env.ASSETS_DIR ?? '',
  firebase: {
    apiKey: import.meta.env.FIREBASE_API_KEY,
    authDomain: import.meta.env.FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.FIREBASE_MESSAGE_SENDER_ID,
    appId: import.meta.env.FIREBASE_APP_ID,
    measurementId: import.meta.env.FIREBASE_MEASUREMENT_ID,
  },
};

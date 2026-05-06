/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly FIREBASE_API_KEY?: string;
  readonly FIREBASE_AUTH_DOMAIN?: string;
  readonly FIREBASE_PROJECT_ID?: string;
  readonly FIREBASE_STORAGE_BUCKET?: string;
  readonly FIREBASE_MESSAGE_SENDER_ID?: string;
  readonly FIREBASE_APP_ID?: string;
  readonly FIREBASE_MEASUREMENT_ID?: string;
  readonly NEBULA_ENV?: 'dev' | 'prod';
  readonly NEBULA_APP_INSTALL_URL_DEV?: string;
  readonly NEBULA_APP_INSTALL_URL_PROD?: string;
  readonly FIRESTORE_DB_ID_DEV?: string;
  readonly FIRESTORE_DB_ID_PROD?: string;
  readonly NEBULA_BACKEND?: 'github' | 'local';
  readonly NEBULA_LOCAL_TENANT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly FIREBASE_API_KEY?: string;
  readonly FIREBASE_AUTH_DOMAIN?: string;
  readonly FIREBASE_PROJECT_ID?: string;
  readonly FIREBASE_STORAGE_BUCKET?: string;
  readonly FIREBASE_MESSAGE_SENDER_ID?: string;
  readonly FIREBASE_APP_ID?: string;
  readonly FIREBASE_MEASUREMENT_ID?: string;
  readonly NEBULA_APP_INSTALL_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

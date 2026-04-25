/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly FIREBASE_API_KEY: string;
  readonly FIREBASE_AUTH_DOMAIN: string;
  readonly FIREBASE_PROJECT_ID: string;
  readonly FIREBASE_STORAGE_BUCKET: string;
  readonly FIREBASE_MESSAGE_SENDER_ID: string;
  readonly FIREBASE_APP_ID: string;
  readonly FIREBASE_MEASUREMENT_ID?: string;
  readonly SERVER_URL?: string;
  readonly ASSETS_DIR?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

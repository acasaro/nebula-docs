type Env = 'dev' | 'prod';
type Backend = 'github' | 'local';

const e = import.meta.env;

const mode: Env = e.NEBULA_ENV === 'dev' ? 'dev' : 'prod';
const backend: Backend = e.NEBULA_BACKEND === 'local' ? 'local' : 'github';

function pickByMode<T>(dev: T, prod: T): T {
  return mode === 'dev' ? dev : prod;
}

export const env = {
  mode,
  isDev: mode === 'dev',
  backend,
  isLocalBackend: backend === 'local',
  localTenant: e.NEBULA_LOCAL_TENANT?.trim() || 'nebula-docs-starter',
  appInstallUrl: pickByMode(e.NEBULA_APP_INSTALL_URL_DEV, e.NEBULA_APP_INSTALL_URL_PROD) ?? '',
  firestoreDbId: pickByMode(e.FIRESTORE_DB_ID_DEV, e.FIRESTORE_DB_ID_PROD) || undefined,
  fn: {
    mintGithubToken: mode === 'dev' ? 'mintGithubTokenDev' : 'mintGithubToken',
    getInstallation: mode === 'dev' ? 'getInstallationDev' : 'getInstallation',
  },
} as const;

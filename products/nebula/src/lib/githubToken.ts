import { getApp } from '@nebula/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';

export interface MintTokenRequest {
  installationId: number;
}

export interface MintTokenResponse {
  token: string;
  expiresAt: string;
}

interface CachedToken {
  installationId: number;
  token: string;
  expiresAt: number;
}

let cached: CachedToken | null = null;

const SKEW_MS = 60_000;

export async function mintGithubInstallationToken(
  installationId: number,
): Promise<MintTokenResponse> {
  const now = Date.now();
  if (
    cached &&
    cached.installationId === installationId &&
    cached.expiresAt - SKEW_MS > now
  ) {
    return { token: cached.token, expiresAt: new Date(cached.expiresAt).toISOString() };
  }

  const fn = httpsCallable<MintTokenRequest, MintTokenResponse>(
    getFunctions(getApp()),
    'mintGithubToken',
  );
  const result = await fn({ installationId });
  cached = {
    installationId,
    token: result.data.token,
    expiresAt: Date.parse(result.data.expiresAt),
  };
  return result.data;
}

export function clearTokenCache() {
  cached = null;
}

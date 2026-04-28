import { createAppAuth } from '@octokit/auth-app';
import { defineSecret } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';

const GITHUB_APP_ID = defineSecret('GITHUB_APP_ID');
const GITHUB_APP_PRIVATE_KEY = defineSecret('GITHUB_APP_PRIVATE_KEY');

const requestSchema = z.object({
  installationId: z.number().int().positive(),
});

export interface MintTokenResponse {
  token: string;
  expiresAt: string;
}

export const mintGithubToken = onCall(
  {
    secrets: [GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY],
    vpcConnector: 'nebula-connector',
    vpcConnectorEgressSettings: 'ALL_TRAFFIC',
  },
  async (request): Promise<MintTokenResponse> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Caller must be signed in.');
    }

    const parsed = requestSchema.safeParse(request.data);
    if (!parsed.success) {
      throw new HttpsError('invalid-argument', parsed.error.message);
    }

    const appId = GITHUB_APP_ID.value();
    const privateKey = GITHUB_APP_PRIVATE_KEY.value().replace(/\\n/g, '\n');
    if (!appId || !privateKey) {
      throw new HttpsError('failed-precondition', 'GitHub App is not configured.');
    }

    const auth = createAppAuth({ appId, privateKey });
    const installationAuth = await auth({
      type: 'installation',
      installationId: parsed.data.installationId,
    });

    return {
      token: installationAuth.token,
      expiresAt: installationAuth.expiresAt,
    };
  },
);

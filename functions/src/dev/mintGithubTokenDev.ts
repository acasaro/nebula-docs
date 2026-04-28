import { createAppAuth } from '@octokit/auth-app';
import { defineSecret } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';

import type { MintTokenResponse } from '../mintGithubToken';

const DEV_APP_ID = defineSecret('DEV_APP_ID');
const DEV_APP_PRIVATE_KEY = defineSecret('DEV_APP_PRIVATE_KEY');

const requestSchema = z.object({
  installationId: z.number().int().positive(),
});

export const mintGithubTokenDev = onCall(
  { secrets: [DEV_APP_ID, DEV_APP_PRIVATE_KEY] },
  async (request): Promise<MintTokenResponse> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Caller must be signed in.');
    }

    const parsed = requestSchema.safeParse(request.data);
    if (!parsed.success) {
      throw new HttpsError('invalid-argument', parsed.error.message);
    }

    const appId = DEV_APP_ID.value();
    const privateKey = DEV_APP_PRIVATE_KEY.value().replace(/\\n/g, '\n');
    if (!appId || !privateKey) {
      throw new HttpsError('failed-precondition', 'Dev GitHub App is not configured.');
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

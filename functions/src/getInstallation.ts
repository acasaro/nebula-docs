import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/rest';
import { defineSecret } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';

const GITHUB_APP_ID = defineSecret('GITHUB_APP_ID');
const GITHUB_APP_PRIVATE_KEY = defineSecret('GITHUB_APP_PRIVATE_KEY');

const requestSchema = z.object({
  installationId: z.number().int().positive(),
});

export interface GetInstallationResponse {
  installationId: number;
  account: {
    login: string;
    type: 'User' | 'Organization';
  };
  repositorySelection: 'all' | 'selected';
}

export const getInstallation = onCall(
  {
    secrets: [GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY],
    vpcConnector: 'nebula-connector',
    vpcConnectorEgressSettings: 'ALL_TRAFFIC',
  },
  async (request): Promise<GetInstallationResponse> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Caller must be signed in.');
    }

    const parsed = requestSchema.safeParse(request.data);
    if (!parsed.success) {
      throw new HttpsError('invalid-argument', parsed.error.message);
    }

    const appId = GITHUB_APP_ID.value();
    const privateKey = GITHUB_APP_PRIVATE_KEY.value().replace(/\\n/g, '\n');

    const appOctokit = new Octokit({
      authStrategy: createAppAuth,
      auth: { appId, privateKey },
    });

    const { data } = await appOctokit.apps.getInstallation({
      installation_id: parsed.data.installationId,
    });

    const account = data.account;
    if (!account || !('login' in account)) {
      throw new HttpsError('not-found', 'Installation has no account.');
    }
    const accountType = account.type;
    if (accountType !== 'User' && accountType !== 'Organization') {
      throw new HttpsError('failed-precondition', `Unsupported account type: ${accountType}`);
    }

    return {
      installationId: parsed.data.installationId,
      account: { login: account.login, type: accountType },
      repositorySelection: data.repository_selection,
    };
  },
);

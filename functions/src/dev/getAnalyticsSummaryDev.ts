import { defineSecret, defineString } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';

import {
  getAnalyticsSummary as runHandler,
  type AnalyticsSummaryWire,
} from '../getAnalyticsSummaryHandler';

/**
 * Dev variant. Same Firebase project so the same GA4 property + service
 * account JSON applies — we reuse the prod secret name rather than
 * splitting into `DEV_GA4_*`. The split is only meaningful for resources
 * that diverge between envs (e.g. the GitHub App pair); the GA4 property
 * doesn't.
 */
const GA4_SERVICE_ACCOUNT_JSON = defineSecret('GA4_SERVICE_ACCOUNT_JSON');
const GA4_PROPERTY_ID = defineString('GA4_PROPERTY_ID', { default: '533814457' });

const requestSchema = z.object({
  rangeKey: z.enum(['7d', '30d', '90d']),
});

function parseCredentials(raw: string): { client_email: string; private_key: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new HttpsError(
      'failed-precondition',
      'GA4_SERVICE_ACCOUNT_JSON is not valid JSON.',
    );
  }
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    typeof (parsed as { client_email?: unknown }).client_email !== 'string' ||
    typeof (parsed as { private_key?: unknown }).private_key !== 'string'
  ) {
    throw new HttpsError(
      'failed-precondition',
      'GA4_SERVICE_ACCOUNT_JSON is missing client_email or private_key.',
    );
  }
  return parsed as { client_email: string; private_key: string };
}

export const getAnalyticsSummaryDev = onCall(
  { secrets: [GA4_SERVICE_ACCOUNT_JSON] },
  async (request): Promise<AnalyticsSummaryWire> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Caller must be signed in.');
    }
    const parsed = requestSchema.safeParse(request.data);
    if (!parsed.success) {
      throw new HttpsError('invalid-argument', parsed.error.message);
    }

    const credentials = parseCredentials(GA4_SERVICE_ACCOUNT_JSON.value());
    const propertyId = GA4_PROPERTY_ID.value();

    return runHandler({
      rangeKey: parsed.data.rangeKey,
      propertyId,
      credentials,
    });
  },
);

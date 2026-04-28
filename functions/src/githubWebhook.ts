import { defineSecret } from 'firebase-functions/params';
import { makeWebhookHandler } from './githubWebhookHandler';

const GITHUB_WEBHOOK_SECRET = defineSecret('GITHUB_WEBHOOK_SECRET');

export const githubWebhook = makeWebhookHandler({
  secret: GITHUB_WEBHOOK_SECRET,
});

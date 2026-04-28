import { defineSecret } from 'firebase-functions/params';
import { makeWebhookHandler } from '../githubWebhookHandler';

const DEV_WEBHOOK_SECRET = defineSecret('DEV_WEBHOOK_SECRET');

export const githubWebhookDev = makeWebhookHandler({
  secret: DEV_WEBHOOK_SECRET,
  databaseId: 'nebula-docs-plat-dev',
});

import { defineSecret } from 'firebase-functions/params';
import { makeWebhookHandler } from '../githubWebhookHandler';

const DEV_WEBHOOK_SECRET = defineSecret('DEV_WEBHOOK_SECRET');
const DEV_APP_ID = defineSecret('DEV_APP_ID');
const DEV_APP_PRIVATE_KEY = defineSecret('DEV_APP_PRIVATE_KEY');

export const githubWebhookDev = makeWebhookHandler({
  secret: DEV_WEBHOOK_SECRET,
  databaseId: 'nebula-docs-plat-dev',
  // Same App identity as mintGithubTokenDev — needed by the handler to read
  // tenant docs.json (for deploy.bucketBaseUrl → previewUrl) on PR-triggered
  // workflow_run events.
  githubApp: {
    appId: DEV_APP_ID,
    privateKey: DEV_APP_PRIVATE_KEY,
  },
});

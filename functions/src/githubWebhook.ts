import { defineSecret } from 'firebase-functions/params';
import { makeWebhookHandler } from './githubWebhookHandler';

const GITHUB_WEBHOOK_SECRET = defineSecret('GITHUB_WEBHOOK_SECRET');
const GITHUB_APP_ID = defineSecret('GITHUB_APP_ID');
const GITHUB_APP_PRIVATE_KEY = defineSecret('GITHUB_APP_PRIVATE_KEY');

export const githubWebhook = makeWebhookHandler({
  secret: GITHUB_WEBHOOK_SECRET,
  // Outbound to GitHub Enterprise (for the docs.json fetch below) must leave
  // through the allowlisted static IP — same VPC binding as mintGithubToken
  // and getInstallation. Dev variant omits this.
  vpcConnector: 'nebula-connector',
  vpcConnectorEgressSettings: 'ALL_TRAFFIC',
  // Same App identity as mintGithubToken — needed by the handler to read
  // tenant docs.json (for deploy.bucketBaseUrl → previewUrl) on PR-triggered
  // workflow_run events.
  githubApp: {
    appId: GITHUB_APP_ID,
    privateKey: GITHUB_APP_PRIVATE_KEY,
  },
});

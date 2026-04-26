import { onRequest } from 'firebase-functions/v2/https';

/**
 * Receive GitHub webhook events from the Nebula GitHub App.
 *
 * TODO (Phase 5):
 *  1. Verify `X-Hub-Signature-256` header (HMAC-SHA256 with the shared
 *     webhook secret stored in env `GITHUB_WEBHOOK_SECRET`).
 *  2. Parse the event body — `X-GitHub-Event` header gives the event type
 *     (push, pull_request, check_run, workflow_run, installation, etc.).
 *  3. Write the event to Firestore (collections: `activity/`, `builds/`)
 *     so the SPA can subscribe via onSnapshot.
 *  4. Respond 204.
 */
export const githubWebhook = onRequest(async (_request, response) => {
  response.status(501).send('githubWebhook not yet implemented.');
});

import { HttpsError, onCall } from 'firebase-functions/v2/https';

/**
 * Mint a short-lived GitHub App installation token for the calling Nebula user.
 *
 * TODO (Phase 1):
 *  1. Verify request.auth (Firebase ID token must be present).
 *  2. Optionally check the caller has a role allowed to mint tokens.
 *  3. Read GitHub App private key from env (`GITHUB_APP_PRIVATE_KEY`) and
 *     app id from env (`GITHUB_APP_ID`).
 *  4. Use `@octokit/auth-app` to create an installation auth, passing
 *     `installationId` from `request.data`.
 *  5. Return `{ token, expiresAt }` to the caller.
 */
export const mintGithubToken = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Caller must be signed in.');
  }
  throw new HttpsError('unimplemented', 'mintGithubToken not yet implemented.');
});

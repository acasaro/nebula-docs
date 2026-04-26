import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router';
import { useCurrentUser } from '@nebula/firebase';
import { fetchInstallation } from '@/lib/githubApi';
import { saveInstallation } from '@/lib/installations';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type Status =
  | { kind: 'idle' }
  | { kind: 'persisting' }
  | { kind: 'done' }
  | { kind: 'error'; message: string };

/**
 * Endpoint GitHub redirects to after the user installs the Nebula App.
 * GitHub appends `installation_id` and `setup_action` query params.
 *
 * We fetch the installation's account info via the `getInstallation` callable,
 * persist a record to Firestore, and bounce to /settings/github-app.
 */
export function InstallCallback() {
  const [params] = useSearchParams();
  const auth = useCurrentUser();
  const installationId = params.get('installation_id');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  useEffect(() => {
    if (auth.status !== 'authenticated') return;
    if (!installationId) {
      setStatus({ kind: 'error', message: 'No installation_id in callback URL.' });
      return;
    }
    const id = Number(installationId);
    if (!Number.isInteger(id) || id <= 0) {
      setStatus({ kind: 'error', message: 'Invalid installation_id.' });
      return;
    }
    let cancelled = false;
    setStatus({ kind: 'persisting' });
    (async () => {
      try {
        const info = await fetchInstallation(id);
        await saveInstallation(
          {
            installationId: info.installationId,
            account: info.account,
            repositorySelection: info.repositorySelection,
          },
          auth.user.uid,
        );
        if (!cancelled) setStatus({ kind: 'done' });
      } catch (err) {
        if (cancelled) return;
        setStatus({
          kind: 'error',
          message: err instanceof Error ? err.message : 'Failed to record installation.',
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [installationId, auth]);

  if (status.kind === 'done') {
    return <Navigate to="/settings/git" replace />;
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {status.kind === 'error' ? 'Install failed' : 'Installing GitHub app…'}
          </CardTitle>
          <CardDescription>
            {status.kind === 'error'
              ? status.message
              : 'Recording the installation. You\'ll be redirected to git settings.'}
          </CardDescription>
        </CardHeader>
        {status.kind === 'persisting' ? (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Looking up account from GitHub…
            </p>
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}

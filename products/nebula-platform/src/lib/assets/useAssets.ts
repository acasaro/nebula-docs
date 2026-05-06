import { useEffect, useState } from 'react';
import { env } from '@/lib/env';
import { useGitSettings } from '@/lib/gitSettings';
import { subscribeAssets } from './firestore';
import { tenantIdFromSettings } from './paths';
import type { Asset } from './types';

export type AssetsState =
  | { status: 'loading' }
  | { status: 'no-repo' }
  | { status: 'error'; error: string }
  | { status: 'ready'; assets: Asset[]; tenantId: string };

export function useAssets(): AssetsState {
  const settings = useGitSettings();
  const [state, setState] = useState<AssetsState>({ status: 'loading' });

  useEffect(() => {
    if (settings.status === 'loading') {
      setState({ status: 'loading' });
      return;
    }
    if (settings.status === 'missing') {
      setState({ status: 'no-repo' });
      return;
    }
    const tenantId = tenantIdFromSettings(settings.settings);
    const unsub = subscribeAssets(
      { env: env.mode, tenantId },
      (assets) => setState({ status: 'ready', assets, tenantId }),
      (err) =>
        setState({
          status: 'error',
          error: err.message || 'Failed to load assets',
        }),
    );
    return unsub;
  }, [settings]);

  return state;
}

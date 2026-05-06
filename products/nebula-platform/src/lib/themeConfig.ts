import { useEffect, useState } from 'react';
import { fetchFileContent } from '@/lib/content';

export interface ThemeConfig {
  extends?: string;
  tokens?: ThemeTokens;
}

export interface ThemeTokens {
  brandPrimary?: string;
  brandPrimaryLight?: string;
  brandPrimaryDark?: string;
  [key: string]: unknown;
}

interface UseThemeConfigArgs {
  installationId: number | null;
  owner: string | null;
  repo: string | null;
  ref: string | null;
}

interface UseThemeConfigState {
  config: ThemeConfig | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches `theme.json` from the connected repo at the given ref. The file is
 * the tenant's frozen-token override layer — `composeTokensCss` deep-merges
 * `tokens` over the base palette at build time. Missing files are treated
 * as "no overrides yet" rather than errors so the form can seed defaults.
 */
export function useThemeConfig({
  installationId,
  owner,
  repo,
  ref,
}: UseThemeConfigArgs): UseThemeConfigState {
  const [state, setState] = useState<UseThemeConfigState>({
    config: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!installationId || !owner || !repo || !ref) {
      setState({ config: null, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    fetchFileContent(installationId, owner, repo, 'theme.json', ref)
      .then(({ content }) => {
        if (cancelled) return;
        try {
          const parsed = JSON.parse(content) as ThemeConfig;
          setState({ config: parsed, loading: false, error: null });
        } catch (err) {
          setState({
            config: null,
            loading: false,
            error: err instanceof Error ? err.message : 'Invalid theme.json',
          });
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Failed to load';
        const missing = /not a file|not found|404/i.test(msg);
        setState({
          config: missing ? { tokens: {} } : null,
          loading: false,
          error: missing ? null : msg,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [installationId, owner, repo, ref]);

  return state;
}

import { useEffect, useState } from 'react';
import { getDb } from '@nebula-docs/firebase';
import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from 'firebase/firestore';
import { z } from 'zod';
import { env } from '@/lib/env';

export const gitSettingsSchema = z.object({
  installationId: z.number().int().positive(),
  owner: z.string().min(1),
  repo: z.string().min(1),
  defaultBranch: z.string().min(1),
  docsSubdirectory: z.string().nullable().default(null),
});

export type GitSettingsInput = z.input<typeof gitSettingsSchema>;
export type GitSettings = z.output<typeof gitSettingsSchema> & {
  updatedAt?: Timestamp;
  updatedBy?: string;
};

const SETTINGS_DOC = doc;

function gitSettingsDoc() {
  return SETTINGS_DOC(getDb(), 'settings', 'git');
}

export async function saveGitSettings(
  input: GitSettingsInput,
  updatedBy: string,
): Promise<void> {
  const parsed = gitSettingsSchema.parse(input);
  await setDoc(
    gitSettingsDoc(),
    { ...parsed, updatedBy, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export type GitSettingsState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'ready'; settings: GitSettings };

/**
 * Synthesizes a "settings configured" state when NEBULA_BACKEND=local so
 * the editor renders against a tenant directory on disk instead of waiting
 * on a Firestore-backed GitHub config. installationId is unused in local
 * mode (the fs provider ignores it) — owner/repo become a label only.
 */
function localSentinel(): GitSettings {
  return {
    installationId: 1,
    owner: 'local',
    repo: env.localTenant,
    defaultBranch: 'local',
    docsSubdirectory: null,
  };
}

export function useGitSettings(): GitSettingsState {
  const [state, setState] = useState<GitSettingsState>(() =>
    env.isLocalBackend
      ? { status: 'ready', settings: localSentinel() }
      : { status: 'loading' },
  );

  useEffect(() => {
    if (env.isLocalBackend) return;
    const unsub = onSnapshot(gitSettingsDoc(), (snap) => {
      if (!snap.exists()) {
        setState({ status: 'missing' });
        return;
      }
      const data = snap.data();
      const parsed = gitSettingsSchema.safeParse(data);
      if (!parsed.success) {
        setState({ status: 'missing' });
        return;
      }
      setState({
        status: 'ready',
        settings: {
          ...parsed.data,
          updatedAt: data.updatedAt as Timestamp | undefined,
          updatedBy: data.updatedBy as string | undefined,
        },
      });
    });
    return unsub;
  }, []);

  return state;
}

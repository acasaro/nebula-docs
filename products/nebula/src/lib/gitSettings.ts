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

export function useGitSettings(): GitSettingsState {
  const [state, setState] = useState<GitSettingsState>({ status: 'loading' });

  useEffect(() => {
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

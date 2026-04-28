import { useEffect, useState } from 'react';
import { getDb } from '@nebula-docs/firebase';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from 'firebase/firestore';
import { z } from 'zod';

export const installationSchema = z.object({
  installationId: z.number().int().positive(),
  account: z.object({
    login: z.string().min(1),
    type: z.enum(['User', 'Organization']),
  }),
  repositorySelection: z.enum(['all', 'selected']),
});

export type InstallationInput = z.input<typeof installationSchema>;
export type InstallationDoc = z.output<typeof installationSchema> & {
  addedAt?: Timestamp;
  addedBy?: string;
};

const COLLECTION = 'installations';

function installationDoc(id: number) {
  return doc(getDb(), COLLECTION, String(id));
}

export async function saveInstallation(
  input: InstallationInput,
  addedBy: string,
): Promise<void> {
  const parsed = installationSchema.parse(input);
  await setDoc(
    installationDoc(parsed.installationId),
    { ...parsed, addedBy, addedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function removeInstallation(installationId: number): Promise<void> {
  await deleteDoc(installationDoc(installationId));
}

export type InstallationsState =
  | { status: 'loading' }
  | { status: 'ready'; installations: InstallationDoc[] };

export function useInstallations(): InstallationsState {
  const [state, setState] = useState<InstallationsState>({ status: 'loading' });

  useEffect(() => {
    const q = query(collection(getDb(), COLLECTION), orderBy('addedAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const installations: InstallationDoc[] = [];
      snap.forEach((d) => {
        const parsed = installationSchema.safeParse(d.data());
        if (parsed.success) {
          installations.push({
            ...parsed.data,
            addedAt: d.data().addedAt as Timestamp | undefined,
            addedBy: d.data().addedBy as string | undefined,
          });
        }
      });
      setState({ status: 'ready', installations });
    });
    return unsub;
  }, []);

  return state;
}

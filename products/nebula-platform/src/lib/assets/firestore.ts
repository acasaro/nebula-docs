import { getDb } from '@nebula-docs/firebase';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from 'firebase/firestore';
import type { Asset, AssetCategory, AssetEnv } from './types';

const COLLECTION = 'assets';

function assetsCollection() {
  return collection(getDb(), COLLECTION);
}

export function assetDoc(id: string) {
  return doc(getDb(), COLLECTION, id);
}

export interface AssetCreateInput {
  id: string;
  env: AssetEnv;
  tenantId: string;
  category: AssetCategory;
  storagePath: string;
  downloadUrl: string;
  filename: string;
  displayName: string;
  alt: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  contentHash: string;
  uploadedBy: string;
  uploadedByName: string | null;
}

export async function createAssetDoc(input: AssetCreateInput): Promise<void> {
  await setDoc(
    assetDoc(input.id),
    { ...input, uploadedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function updateAssetDoc(
  id: string,
  patch: Partial<Pick<Asset, 'displayName' | 'alt'>>,
): Promise<void> {
  await updateDoc(assetDoc(id), patch);
}

export async function deleteAssetDoc(id: string): Promise<void> {
  await deleteDoc(assetDoc(id));
}

function assetFromSnapshot(id: string, data: Record<string, unknown>): Asset | null {
  const env = data.env;
  const tenantId = data.tenantId;
  const category = data.category;
  if (env !== 'dev' && env !== 'prod') return null;
  if (typeof tenantId !== 'string') return null;
  if (category !== 'image' && category !== 'video' && category !== 'file') return null;
  return {
    id,
    env,
    tenantId,
    category,
    storagePath: String(data.storagePath ?? ''),
    downloadUrl: String(data.downloadUrl ?? ''),
    filename: String(data.filename ?? ''),
    displayName: String(data.displayName ?? data.filename ?? ''),
    alt: String(data.alt ?? ''),
    mime: String(data.mime ?? ''),
    size: Number(data.size ?? 0),
    width: typeof data.width === 'number' ? data.width : null,
    height: typeof data.height === 'number' ? data.height : null,
    contentHash: String(data.contentHash ?? ''),
    uploadedBy: String(data.uploadedBy ?? ''),
    uploadedByName:
      typeof data.uploadedByName === 'string' ? data.uploadedByName : null,
    uploadedAt: data.uploadedAt as Timestamp,
  };
}

export interface SubscribeOptions {
  env: AssetEnv;
  tenantId: string;
}

export function subscribeAssets(
  opts: SubscribeOptions,
  onChange: (assets: Asset[]) => void,
  onError: (err: Error) => void,
): () => void {
  // No `orderBy` here — the page sorts client-side via `applySort`. This
  // keeps the query satisfied by the auto-built single-field indexes on
  // `env` and `tenantId`, sparing us a composite-index build wait every
  // time the schema gains a new orderable field.
  const q = query(
    assetsCollection(),
    where('env', '==', opts.env),
    where('tenantId', '==', opts.tenantId),
  );
  return onSnapshot(
    q,
    (snap) => {
      const out: Asset[] = [];
      for (const docSnap of snap.docs) {
        const a = assetFromSnapshot(docSnap.id, docSnap.data());
        if (a) out.push(a);
      }
      onChange(out);
    },
    onError,
  );
}
